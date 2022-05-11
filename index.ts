import axios from "axios";
import dotenv from "dotenv";
import { pRateLimit } from "p-ratelimit";
import twilio from "twilio";

dotenv.config();

const { ACCOUNT_SID, AUTH_TOKEN, CHAT_SVC_SID } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const MAX_CONCURRENCY = 50;

let counter = 0;
let limitor = 0;

let concurrency = 0;
const start = Date.now();

const limit = pRateLimit({
  concurrency: MAX_CONCURRENCY,
  interval: 1000,
  rate: 100,
});

(async () => {
  for (let i = 0; i < 10000; i++) {
    const channelSids = await client.chat.v2
      .services(CHAT_SVC_SID)
      .channels.list({ limit: MAX_CONCURRENCY, type: "public" })
      .then((channels) => channels.map(({ sid }) => sid));

    for (const sid of channelSids) {
      if (concurrency > MAX_CONCURRENCY) process.exit();
      try {
        await Promise.all(
          channelSids.map((sid) => limit(() => updateChannel(sid)))
        );
      } catch (error) {
        console.error(error);
        break;
      }
    }
  }
})();

setInterval(() => {
  print();
}, 500);

function print() {
  const seconds = (Date.now() - start) / 1000;

  process.stdout.cursorTo(0);
  process.stdout.write(
    `Concurrency: ${concurrency}; Updated ${counter}; limitor ${limitor}; Seconds: ${seconds.toLocaleString()}; Updates/Sec: ${(
      counter / seconds
    ).toFixed(2)};`
  );
}

async function sleep(ms = 1000) {
  await new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

async function updateChannel(channelSid: string) {
  // Docs: https://www.twilio.com/docs/conversations/api/chat-channel-migration-resource

  const result = await axios.post(
    `https://chat.twilio.com/v3/Services/${CHAT_SVC_SID}/Channels/${channelSid}`,
    "Type=private",
    { auth: { username: ACCOUNT_SID, password: AUTH_TOKEN } }
  );

  counter++;
  concurrency = Number(result.headers["twilio-concurrent-requests"]);

  return result;
}
