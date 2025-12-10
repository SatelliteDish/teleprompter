import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // Init Socket
  const io = new Server(httpServer);
  io.on("connection", (socket) => {
    console.log("Client Connected:", socket.id);

    // Listen for Butts
    socket.on("butts_spoken", () => {
      // Broadcast to EVERYONE to trigger animation
      io.emit("trigger_party");
    });
  });

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
