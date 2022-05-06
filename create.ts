import axios from "axios";
import dotenv from "dotenv";
import { pRateLimit } from "p-ratelimit";
import twilio from "twilio";

dotenv.config();

const { ACCOUNT_SID, AUTH_TOKEN, CHAT_SVC_SID } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const channelParkingLot = [];

let counter = 0;
let concurrency = 0;
let isSleeping = false;
const start = Date.now();

const limit = pRateLimit({
  concurrency: 10,
});

(async () => {
  for (let i = 0; i < 10000; i++) {
    if (concurrency > 25) await sleep(500);

    try {
      limit(() => makeChannel());
    } catch (error) {
      console.error("\n", error);
      break;
    }
  }
})();

async function makeChannel() {
  counter++;
  print();

  const result = await axios.post(
    `https://chat.twilio.com/v2/Services/${CHAT_SVC_SID}/Channels `,
    {},
    { auth: { username: ACCOUNT_SID, password: AUTH_TOKEN } }
  );

  concurrency = Number(result.headers["twilio-concurrent-requests"]);
  print();

  return result;
}

function print() {
  const seconds = (Date.now() - start) / 1000;
  process.stdout.cursorTo(0);
  process.stdout.write(
    `Concurrency: ${concurrency}; Parking Lot: ${
      channelParkingLot.length
    }; Updated ${counter}; Seconds: ${seconds.toLocaleString()}; Updates/Sec: ${(
      counter / seconds
    ).toFixed(4)}; ${isSleeping ? "Sleeping" : ""}`
  );
}

async function sleep(ms = 1000) {
  isSleeping = true;
  print();
  await new Promise((resolve) => setTimeout(() => resolve(null), ms));
  isSleeping = false;
}
