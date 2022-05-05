import dotenv from "dotenv";
import twilio from "twilio";
import { pRateLimit, Quota } from "p-ratelimit";

dotenv.config();

const { ACCOUNT_SID, AUTH_TOKEN, CHAT_SVC_SID } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const channelParkingLot = [];
const channelConnections = new Set();

const MAX_CONNECTIONS = 20;
const INTERVAL_MS = 10;

let isStarted = false;

let counter = 0;
const start = Date.now();

const limit = pRateLimit({
  concurrency: 10,
  interval: 500,
  maxDelay: 2000,
  rate: 5,
});

(async () => {
  client.chat.v2
    .services(CHAT_SVC_SID)
    .channels.each({ type: "public" }, (channel) => {
      channelParkingLot.push(channel.sid);
    });

  for (let i = 0; i < 2500000; i++) {
    try {
      await Promise.all([
        limit(() => updateChannel()),
        limit(() => updateChannel()),
        limit(() => updateChannel()),
        limit(() => updateChannel()),
        limit(() => updateChannel()),
      ]);
    } catch (error) {
      console.error("\n", error);
      break;
    }
  }
})();

async function makeChannel() {
  counter++;
  print();

  return client.chat.v2.services(CHAT_SVC_SID).channels.create();
}

async function updateChannel() {
  // Docs: https://www.twilio.com/docs/conversations/api/chat-channel-migration-resource

  const channelSid = channelParkingLot.pop();
  if (!channelSid) return;

  console.log(channelSid);

  const result = await client.chat
    // @ts-ignore
    .channels(CHAT_SVC_SID, channelSid)
    .update({ type: "private" });

  console.log(result);

  counter++;
  print();
}

function print() {
  const seconds = (Date.now() - start) / 1000;
  process.stdout.cursorTo(0);
  process.stdout.write(
    `Parking Lot: ${
      channelParkingLot.length
    }; Updated ${counter}; Seconds: ${seconds.toLocaleString()}; Updates/Sec: ${(
      counter / seconds
    ).toFixed(4)}`
  );
}

function sleep(ms = 1000) {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}
