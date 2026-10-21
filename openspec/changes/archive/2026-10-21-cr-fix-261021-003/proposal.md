## Why

`/code-review` 指出 `lib/mailer.ts` 的 `MAIL_OVERRIDE_TO`（CR-FIX-261016-001 新增，見 `mail-skip-synthetic` spec「非正式環境收件覆寫」）目前只覆寫 `options.to`，若呼叫端未來在 `sendMailSafe` 傳入 `cc`／`bcc`，即使設定了 `MAIL_OVERRIDE_TO`，該位址仍會在 dev/test 收到真實信件副本，悄悄破壞這個防呆機制原本要保證的「dev/test 不寄真實信件」。

目前程式碼中沒有任何寄信函式會傳入 `cc`/`bcc`，屬於防範未來擴充的補強，不是現有已發生的資料外洩事件。

## What Changes

- `sendMailSafe()` 於 `MAIL_OVERRIDE_TO` 生效時，同步移除 `cc`／`bcc`（不轉寄給覆寫信箱，避免造成收件人誤解或重複），並將原始 `to`／`cc`／`bcc` 完整列在主旨註記中供除錯辨識。

## Capabilities

### Added Capabilities

（無，修正既有 `mail-skip-synthetic` 能力下「非正式環境收件覆寫」的覆寫範圍）

## Impact

- **修改** `lib/mailer.ts`：`sendMailSafe()` 內覆寫邏輯涵蓋 `cc`／`bcc`。
- **不涉及** prod 環境 runtime 防護機制的新增——CR-FIX-261016-001 的 `design.md` 已明確記錄「不新增 `APP_ENV` 之類的環境偵測機制，以變數有無設定值為唯一開關」，本次延續該決策，僅補強覆寫範圍本身，不重啟是否需要額外 runtime 偵測的討論（待確認事項中與此相關的部分到此定案，不在本次範圍內另行處理）。
- **不需要**資料庫 schema 變更、不影響操作手冊（此為內部防呆機制，非使用者可見功能）。
- **版本號**：`config/version.json` patch +1。
