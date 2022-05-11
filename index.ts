import axios from "axios";
import dotenv from "dotenv";
import { pRateLimit } from "p-ratelimit";
import twilio from "twilio";

dotenv.config();

const { ACCOUNT_SID, AUTH_TOKEN, CHAT_SVC_SID } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const CONCURRENCY = 100;
const MAX_CONCURRENCY = 200;

let counter = 0;

let concurrency = 0;
const start = Date.now();
let channelSids = [];

const limit = pRateLimit({
  concurrency: CONCURRENCY,
  interval: 1000,
  rate: 100,
});

let isDone = false;
let almostDone = false;

(async () => {
  while (!isDone) {
    if (channelSids.length < 1000 && !almostDone) {
      const _channelSids = await client.chat.v2
        .services(CHAT_SVC_SID)
        .channels.list({ limit: CONCURRENCY * 2, type: "public" })
        .then((channels) => channels.map(({ sid }) => sid));

      if (_channelSids.length === 0) almostDone = true;
      else channelSids = channelSids.concat(_channelSids);
    }

    if (almostDone && channelSids.length === 0) {
      isDone = true;
      break;
    }

    if (concurrency > MAX_CONCURRENCY) process.exit();
    try {
      await Promise.all(
        channelSids
          .splice(0, CONCURRENCY)
          .map((sid) => limit(() => updateChannel(sid)))
      );
    } catch (error) {
      console.error(error);
      break;
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
    `Concurrency: ${concurrency}; Updated ${counter}; Seconds: ${seconds.toLocaleString()}; Updates/Sec: ${(
      counter / seconds
    ).toFixed(2)};`
  );
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
