import dotenv from "dotenv";
import twilio from "twilio";
import { pRateLimit } from "p-ratelimit";

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
  interval: 1000,
  maxDelay: 2000,
  rate: 5,
});

(async () => {
  // client.chat.v2
  //   .services("ISXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
  //   .channels.each({ type: "public" }, (channel) => {
  //     channelParkingLot.push(channel.sid);
  //     if (!isStarted) startInterval();
  //   });

  for (let i = 0; i < 1; i++) {
    await limit(() => makeChannel());
  }
})();

async function makeChannel() {
  return client.chat.v2.services(CHAT_SVC_SID).channels.create();
}

async function updateChannel() {
  // You may need to re-write this. I haven't been able to test it.
  // Docs: https://www.twilio.com/docs/conversations/api/chat-channel-migration-resource

  const channelSid = channelParkingLot.pop();

  channelConnections.add(channelSid);
  await client.chat.channels(channelSid).update({ type: "private" });
  channelConnections.delete(channelSid);

  counter++;
}

function print() {
  process.stdout.cursorTo(0);
  process.stdout.write(
    `Updated: ${counter}; Parking Lot: ${
      channelParkingLot.length
    }; Connections: ${channelConnections.size}; Seconds: ${
      (Date.now() - start) / 1000
    }`
  );
}
