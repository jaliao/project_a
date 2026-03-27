## 1. Turbopack

- [x] 1.1 修改 `package.json` — `"dev": "next dev"` 改為 `"dev": "next dev --turbopack"`

## 2. Docker 記憶體上限

- [x] 2.1 修改 `docker-compose.dev.yml` — `NODE_OPTIONS=--max-old-space-size=4096` 改為 `--max-old-space-size=6144`

## 3. revalidatePath 精確化

- [x] 3.1 修改 `app/actions/notification.ts` — `markNotificationRead` 的 `revalidatePath('/', 'layout')` 改為 `revalidatePath('/notifications')`
- [x] 3.2 修改 `app/actions/notification.ts` — `markAllNotificationsRead` 的 `revalidatePath('/', 'layout')` 改為 `revalidatePath('/notifications')`

## 4. 版本與文件

- [x] 4.1 更新 `config/version.json` patch 版本號 +1
- [x] 4.2 更新 `README-AI.md` 反映 Turbopack 與效能優化
