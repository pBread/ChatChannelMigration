import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const { ACCOUNT_SID, AUTH_TOKEN } = process.env;
const client = twilio(ACCOUNT_SID, AUTH_TOKEN);

const channelParkingLot = [];
const channelConnections = new Set();

const MAX_CONNECTIONS = 20;

let isStarted = false;

let counter = 0;

(async () => {
  client.chat.v2
    .services("ISXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
    .channels.each({ type: "public" }, (channel) => {
      channelParkingLot.push(channel.sid);
      if (!isStarted) startInterval();
    });
})();

async function updateChannel(channelSid: string) {
  // You may need to re-write this. I haven't been able to test it.
  // Docs: https://www.twilio.com/docs/conversations/api/chat-channel-migration-resource

  channelConnections.add(channelSid);
  await client.chat.channels(channelSid).update({ type: "private" });
  channelConnections.delete(channelSid);

  counter++;
}

function print() {
  process.stdout.cursorTo(0);
  process.stdout.write(
    `Updated: ${counter}; Parking Lot: ${channelParkingLot.length}; Connections: ${channelConnections.size}`
  );
}

function startInterval() {
  isStarted = true;
  setInterval(() => {
    print();

    if (channelParkingLot.length === 0) return;
    if (channelConnections.size < MAX_CONNECTIONS) {
      updateChannel(channelParkingLot.pop());
    }
  }, 100);
}
