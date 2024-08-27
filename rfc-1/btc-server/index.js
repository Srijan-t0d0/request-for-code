import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import { verifyBlock } from "./helpers.js";

const app = express();

app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let blockChain = [];
let chainLen = 0;
const clients = new Set();

app.get("/", (req, res) => {
  res.send("Hello World! BitCoin server is running.");
});

wss.on("connection", (ws) => {
  clients.add(ws);
  console.log("Client connected");
  ws.send(JSON.stringify({ message: "initial", blockChain }));

  ws.on("message", (message) => {
    let recivedBlock = JSON.parse(message.toString());

    if (recivedBlock.index == chainLen) {
      let varified = verifyBlock(recivedBlock);

      if (varified) {
        blockChain.push(recivedBlock);
        chainLen++;
        console.log(blockChain);

        broadcastToClients(
          JSON.stringify({ msg: "new", blockChain: blockChain }),
          ws
        );
        console.log("Broadcasting...");

        ws.send(
          JSON.stringify({
            status: "success",
          })
        );
      }
    } else {
      ws.send(
        JSON.stringify({
          status: "failed",
          message: "A longer chain exists",
          blockChain,
        })
      );
      console.log("sending the chain to miner");
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    clients.delete(ws);
    console.error(`WebSocket error: ${error}`);
  });
});

const broadcastToClients = (message, excludeClientId) => {
  console.log(JSON.parse(message));

  for (const [clientId, client] of clients.entries()) {
    if (client.readyState === WebSocket.OPEN && clientId !== excludeClientId) {
      client.send(message);
    }
  }
};

server.listen(8080, () => {
  console.log("BitCoin-Server is running on http://localhost:8080");
});
