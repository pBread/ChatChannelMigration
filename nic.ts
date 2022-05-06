import axios from "axios";
import dotenv from "dotenv";
import { pRateLimit } from "p-ratelimit";
import twilio from "twilio";

dotenv.config();

let counter = 0;
const start = Date.now();

const { ACCOUNT_SID, AUTH_TOKEN, CHAT_SVC_SID } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const limit = pRateLimit({
  concurrency: 80,
});

async function call(sid: string) {
  print();
  let result;

  try {
    result = await client.chat.channels.get(CHAT_SVC_SID, sid).update({
      type: "private",
    });
  } catch (error) {
    console.error(error);
  }

  counter++;
  print();

  return result;
}

function print() {
  const seconds = (Date.now() - start) / 1000;

  process.stdout.cursorTo(0);
  process.stdout.write(
    `Counter ${counter}; Seconds: ${seconds}; update/sec: ${counter / seconds}`
  );
}

async function main() {
  const channelSids = await client.chat.v2
    .services(CHAT_SVC_SID)
    .channels.list({ limit: 500, type: "public" })
    .then((channels) => channels.map((channel) => channel.sid));

  const promises = channelSids.map(
    async (sid) => await limit(async () => call(sid))
  );
  await Promise.all(promises);
}
main();
