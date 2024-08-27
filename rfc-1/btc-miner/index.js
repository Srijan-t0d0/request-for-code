import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import { mineBlock, verifyTrxn, createBlock } from "./helpers.js";

const app = express();

app.use(cors());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let transactionPool = [];
let blockChain = [];
let chainLen = 0;

const connectWebSocket = () => {
  const wsc = new WebSocket("ws://localhost:8080");

  wsc.onopen = function () {
    console.info("Connected to the central server");
    minerLoop();
  };

  wsc.onerror = function (event) {
    console.error("WebSocket Client error", event);
  };

  wsc.onmessage = function (event) {
    let data = JSON.parse(event.data);
    console.log("Message received from central server:", data);
    if (data.status == "failed") {
      console.log("Updating current blockchain");
      blockChain = data.blockChain;
    } else if (data.message == "initial") {
      console.log("Updating current blockchain");
      blockChain = data.blockChain;
      chainLen = blockChain.length;
    }
  };

  wsc.onclose = function () {
    console.log("WebSocket connection closed, attempting to reconnect...");
    setTimeout(() => {
      wsc = connectWebSocket(); // Reconnect after a delay
    }, 1000); // Adjust the delay as needed
  };

  return wsc;
};

let wsc = connectWebSocket();

app.get("/", (req, res) => {
  res.send("Hello World! Miner server is running.");
});

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    ws.send(message.toString());
    try {
      message = JSON.parse(message);
    } catch (error) {
      ws.send("Invalid Data");
    }
    console.log(message.type);

    if (message.type == "trxn") {
      ws.send("Trxn recived");
      let trxn = message.trxn;
      console.log(trxn);
      // verify transactions
      try {
        const valid = verifyTrxn(trxn);
        transactionPool.push(trxn);
      } catch (error) {
        console.log(error);

        console.log("Invalid trxn");

        ws.send("Invalid trxn");
      }
    }
  });
  // send block back to server

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error(`WebSocket error: ${error}`);
  });
});

function sendBlockToServer(minedBlock) {
  if (wsc.readyState === WebSocket.OPEN) {
    wsc.send(JSON.stringify(minedBlock));
    console.log("Block sent to central server:", minedBlock);
  } else {
    console.error("WebSocket connection is not open");
  }
}

// mine the block
function minerLoop() {
  setInterval(() => {
    if (transactionPool.length > 0) {
      const block = createBlock(transactionPool, chainLen, blockChain);
      console.log({ "Current Block": block });
      const minedBlock = mineBlock(block);
      chainLen = minedBlock.index + 1;
      blockChain.push(minedBlock);
      sendBlockToServer(minedBlock);
      console.log({ blockChain });

      // Clear the transaction pool after mining
      transactionPool = [];
    }
  }, 5000); // Check every 5 seconds
}

minerLoop();

//get port from env
server.listen(8081, () => {
  console.log("Miner server is running on http://localhost:8081");
});
