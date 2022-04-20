import { channel } from "diagnostics_channel";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const { ACCOUNT_SID, AUTH_TOKEN } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

async function updateChannel(channelSid: string) {
  // You may need to re-write this. I haven't been able to test it.
  // Docs: https://www.twilio.com/docs/conversations/api/chat-channel-migration-resource

  await client.chat
    .channels(channelSid)
    .update({ type: "private" })
    .then(() => console.log(`updated: ${channelSid}`));
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
