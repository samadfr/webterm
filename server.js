require("dotenv").config();
const express    = require("express");
const http       = require("http");
const WebSocket  = require("ws");
const pty        = require("node-pty");
const path       = require("path");
const crypto     = require("crypto");
const rateLimit  = require("express-rate-limit");

const PASSWORD  = process.env.WEBTERM_PASSWORD || "changeme123";
const PORT      = process.env.PORT             || 3000;
const TOKEN_TTL = 24 * 60 * 60 * 1000;

const app    = express();
const server = http.createServer(app);
const wss    = new WebSocket.Server({ server, path: "/terminal" });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const sessions = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [token, s] of sessions) {
    if (now - s.createdAt > TOKEN_TTL) sessions.delete(token);
  }
}, 3_600_000);

const authLimiter = rateLimit({
  windowMs : 15 * 60 * 1000,
  max      : 8,
  message  : { error: "Too many attempts. Wait 15 minutes." }
});

app.post("/auth", authLimiter, (req, res) => {
  const { password } = req.body || {};
  if (!password || password !== PASSWORD) {
    return res.status(401).json({ error: "Wrong password." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { createdAt: Date.now() });
  res.json({ token });
});

wss.on("connection", (ws, req) => {
  const params = new URLSearchParams((req.url || "").split("?")[1] || "");
  const token  = params.get("token");

  if (!token || !sessions.has(token)) {
    ws.send("\r\n\x1b[31m[WebTerm] Unauthorized.\x1b[0m\r\n");
    ws.close(1008, "Unauthorized");
    return;
  }

  const shell = process.platform === "win32" ? "powershell.exe" : "bash";
  let ptyProc;

  try {
    ptyProc = pty.spawn(shell, [], {
      name : "xterm-256color",
      cols : 80,
      rows : 24,
      cwd  : process.env.HOME || "/root",
      env  : { ...process.env, TERM: "xterm-256color" },
    });
  } catch (err) {
    ws.send(`\r\n\x1b[31mShell error: ${err.message}\x1b[0m\r\n`);
    ws.close();
    return;
  }

  ptyProc.onData(data => {
    if (ws.readyState === WebSocket.OPEN) ws.send(data);
  });

  ptyProc.onExit(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("\r\n\x1b[33m[Shell exited]\x1b[0m\r\n");
      ws.close();
    }
  });

  ws.on("message", raw => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === "input")  ptyProc.write(msg.data);
      if (msg.type === "resize") ptyProc.resize(
        Math.max(1, msg.cols),
        Math.max(1, msg.rows)
      );
    } catch { ptyProc.write(raw.toString()); }
  });

  const cleanup = () => { try { ptyProc.kill(); } catch {} };
  ws.on("close", cleanup);
  ws.on("error", cleanup);
});

server.listen(PORT, () => {
  console.log(`✅ WebTerm running → http://localhost:${PORT}`);
});
