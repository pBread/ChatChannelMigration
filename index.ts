import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const { ACCOUNT_SID, AUTH_TOKEN } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

async function updateChannel(channelSid: string) {
  // update your channel to private here
}

(async () => {
  const publicChannelSids = await client.chat.v2
    .services("ISXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    .channels.list({ type: "public" })
    .then((channels) => channels.map((channel) => channel.sid));

  for (const channelSid of publicChannelSids) {
    updateChannel(channelSid);
    await wait();
  }
})();

async function wait(ms = 1000) {
  return new Promise((resolve) => setTimeout(() => resolve(null), ms));
}
