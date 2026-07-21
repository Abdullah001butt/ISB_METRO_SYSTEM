const http = require("http");
const { WebSocketServer } = require("ws");
const fetch = require("node-fetch");

const BACKEND_URL = (process.env.BACKEND_URL || "http://localhost:3000").replace(/\/$/, "");
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS || 3000);
const PORT = process.env.PORT || 8080;

let lastLiveBuses = null;
let lastAlerts = [];
let seenAlertIds = new Set();

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", clients: wss.clients.size }));
    return;
  }
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Metro Bus WebSocket server. Connect via WebSocket, not HTTP GET.");
});

const wss = new WebSocketServer({ server });

function broadcast(type, data) {
  const payload = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(payload);
  }
}

async function pollLiveBuses() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/live-buses`);
    if (!res.ok) {
      console.error(`Poll got non-OK status: ${res.status}`);
      return;
    }

    const { buses } = await res.json();
    const serialized = JSON.stringify(buses);
    if (serialized !== lastLiveBuses) {
      lastLiveBuses = serialized;
      broadcast("live-buses", buses);
      console.log(`Poll succeeded: ${buses.length} buses, broadcast to ${wss.clients.size} client(s)`);
    } else {
      console.log(`Poll succeeded: ${buses.length} buses, no change`);
    }
  } catch (err) {
    console.error("Failed to poll /api/live-buses:", err.message);
  }
}

async function pollAlerts() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/alerts/public?status=OPEN`);
    if (!res.ok) {
      console.error(`Alerts poll got non-OK status: ${res.status}`);
      return;
    }

    const { alerts } = await res.json();
    lastAlerts = alerts;

    const newAlerts = alerts.filter((a) => !seenAlertIds.has(a.id));
    if (newAlerts.length > 0) {
      for (const a of newAlerts) seenAlertIds.add(a.id);
      broadcast("new-alerts", newAlerts);
      console.log(`Alerts poll: ${newAlerts.length} new alert(s) broadcast`);
    }

    // Keep the seen-set from growing forever — drop ids no longer open.
    seenAlertIds = new Set(alerts.map((a) => a.id));
  } catch (err) {
    console.error("Failed to poll /api/alerts/public:", err.message);
  }
}

wss.on("connection", (socket) => {
  console.log(`Client connected. Total: ${wss.clients.size}`);

  if (lastLiveBuses) {
    socket.send(
      JSON.stringify({ type: "live-buses", data: JSON.parse(lastLiveBuses), timestamp: new Date().toISOString() })
    );
  }
  socket.send(JSON.stringify({ type: "alerts-snapshot", data: lastAlerts, timestamp: new Date().toISOString() }));

  socket.on("close", () => {
    console.log(`Client disconnected. Total: ${wss.clients.size}`);
  });
});

setInterval(pollLiveBuses, POLL_INTERVAL_MS);
setInterval(pollAlerts, POLL_INTERVAL_MS);
pollLiveBuses();
pollAlerts();

server.listen(PORT, () => {
  console.log(`WebSocket server listening on port ${PORT}, polling ${BACKEND_URL} every ${POLL_INTERVAL_MS}ms`);
});
