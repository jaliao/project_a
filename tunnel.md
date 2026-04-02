# Cloudflare Tunnel 開發環境設定

本文件說明如何透過 Cloudflare Tunnel 將 `project-a-dev.blockcode.com.tw` 對應到本機開發伺服器。

---

## 架構說明

```
瀏覽器
  ↓ HTTPS
Cloudflare Edge（自動處理 SSL）
  ↓ Cloudflare Tunnel（http2，加密通道）
cloudflared 容器（docker-compose 內部網路）
  ↓ HTTP（Docker 內部 DNS）
web 容器（http://web:3000，Next.js dev server）
```

> cloudflared 與 web 服務在同一個 docker-compose 網路，透過服務名稱 `web` 直接通訊。Cloudflare 負責 HTTPS，本機不需要 SSL 設定。

---

## 一次性設定（僅需做一次）

### 1. 設定 Cloudflare Dashboard

登入 [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → Networks → Tunnels → 選擇 tunnel → Edit → Public Hostnames

將 service URL 設為：
```
http://web:3000
```

### 2. 設定 `.env`

```bash
# Cloudflare Tunnel Token
CF_TUNNEL_TOKEN=<從 Cloudflare dashboard 取得>
```

> Token 如果失效（`Unauthorized: Invalid tunnel secret`），到 Cloudflare dashboard 重新產生即可。

---

## 日常開發

```bash
make dev
```

一個指令啟動全部（db + web + cloudflared）。啟動後開啟 `https://project-a-dev.blockcode.com.tw` 即可使用。

---

## 常用指令

| 指令 | 說明 |
|------|------|
| `make dev` | 啟動全部服務（含 cloudflared） |
| `make dev-stop` | 停止全部服務 |
| `make dev-logs` | 查看所有容器日誌（含 cloudflared） |
| `make dev-restart` | 重新啟動所有服務 |

---

## 常見問題

### Token 失效（`Unauthorized: Invalid tunnel secret`）

到 Cloudflare Zero Trust → Networks → Tunnels → 選擇 tunnel → 重新產生 token，更新 `.env` 後 `make dev-restart`。

### Service URL 設錯（`no such host: web` 或 `connection refused`）

Cloudflare dashboard 的 service URL 必須是 `http://web:3000`（不是 `http://localhost:3000`）。

---

## HTTPS 本機憑證（選用）

`ssl/` 目錄已有 `localhost.pem` 和 `localhost-key.pem`，已掛載至 `web` 容器的 `/app/ssl/`。

如需在不使用 Cloudflare 的情況下直接跑本機 HTTPS，在 `next.config.ts` 加入：

```ts
experimental: {
  https: {
    key: './ssl/localhost-key.pem',
    cert: './ssl/localhost.pem',
  }
}
```
