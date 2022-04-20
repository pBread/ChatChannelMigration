import dotenv from "dotenv";
import twilio from "twilio";
import { ChannelInstance } from "twilio/lib/rest/chat/v2/service/channel";

dotenv.config();

const { ACCOUNT_SID, AUTH_TOKEN } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

(async () => {
  const publicChannels = await client.chat.v2
    .services("ISXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    .channels.list({ type: "public" });

  for (const channel of publicChannels) {
    updateChannel(channel);
    await wait();
  }
})();

async function updateChannel(channel: ChannelInstance) {
  // update your channel to private here
}

async function wait(ms = 1000) {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}
