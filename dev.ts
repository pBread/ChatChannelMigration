import axios from "axios";
import dotenv from "dotenv";
import { pRateLimit } from "p-ratelimit";
import twilio from "twilio";

dotenv.config();

const { ACCOUNT_SID, AUTH_TOKEN, CHAT_SVC_SID } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

let counter = 0;
let limitor = 0;

let concurrency = 0;
const start = Date.now();

const limit = pRateLimit({
  concurrency: 10,
});

(async () => {
  for (let i = 0; i < 10000; i++) {
    const channelSids = await client.chat.v2
      .services(CHAT_SVC_SID)
      .channels.list({ limit: 100, type: "public" })
      .then((channels) => channels.map(({ sid }) => sid));

    for (const sid of channelSids) {
      //   if (concurrency > 25) await sleep(500);
      try {
        await limit(async () => await updateChannel(sid)); // loop is blocked until a response is received
      } catch (error) {
        console.error(error);
        break;
      }
    }

    await sleep(5000);
  }
})();

function print() {
  const seconds = (Date.now() - start) / 1000;

  process.stdout.cursorTo(0);
  process.stdout.write(
    `Concurrency: ${concurrency}; Updated ${counter}; limitor ${limitor}; Seconds: ${seconds.toLocaleString()}; Updates/Sec: ${(
      counter / seconds
    ).toFixed(4)};`
  );
}

async function sleep(ms = 1000) {
  await new Promise((resolve) => setTimeout(() => resolve(null), ms));
}

async function updateChannel(channelSid: string) {
  // Docs: https://www.twilio.com/docs/conversations/api/chat-channel-migration-resource
  print();

  const result = await axios.post(
    `https://chat.twilio.com/v3/Services/${CHAT_SVC_SID}/Channels/${channelSid}`,
    "Type=private",
    { auth: { username: ACCOUNT_SID, password: AUTH_TOKEN } }
  );

  counter++;
  concurrency = Number(result.headers["twilio-concurrent-requests"]);
  print();

  return result;
}
