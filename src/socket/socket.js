import { io } from "socket.io-client";
const socket = io("https://memora-be.onrender.com", {
  transports: ["websocket"],
  reconnection: true,
});
export default socket;
