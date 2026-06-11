# 🖥️ WebTerm

Self-hosted web terminal — access your server from any browser, any device.



![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)




![WebSocket](https://img.shields.io/badge/WebSocket-010101?style=flat&logo=socket.io&logoColor=white)




![xterm.js](https://img.shields.io/badge/xterm.js-black?style=flat)




![License](https://img.shields.io/badge/license-MIT-blue?style=flat)



## ✨ Features
- 🔐 Password protected login
- 📱 Mobile friendly with toolbar
- ⚡ Real-time WebSocket terminal
- 🔄 Auto-reconnect on disconnect
- 🎨 Clean minimal UI (xterm.js)
- 🐳 Docker ready

## 🚀 Deploy on Railway
1. Fork this repo
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add environment variable: `WEBTERM_PASSWORD=yourpassword`
4. Deploy!

## 💻 Run Locally
```bash
npm install
cp .env.example .env
# Edit .env and set your password
node server.js
