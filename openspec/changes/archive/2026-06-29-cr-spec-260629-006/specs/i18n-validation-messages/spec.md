## ADDED Requirements

### Requirement: 驗證訊息以 i18n key 表示
前台 Zod schema 的驗證訊息 SHALL 以 `validation.*` 命名空間的 i18n key 表示，不寫死語言字串；呈現端 SHALL 以 next-intl 解析該 key（client `useTranslations`、server action 回傳 key 由 client 呈現端翻譯）。本批適用範圍為純前台 schema（`auth`、`profile`）；與後台共用的 schema 不在此批，以免後台顯示原始 key。

#### Scenario: client 表單顯示在地化驗證訊息
- **WHEN** 前台表單（如 profile/登入）欄位驗證失敗
- **THEN** 顯示的訊息為對應 `validation.*` key 經當前語言翻譯後的文字

#### Scenario: server action 回傳 key 由呈現端翻譯
- **WHEN** server action 因驗證失敗回傳欄位錯誤（內容為 key）
- **THEN** 前端呈現處以 i18n 翻譯該 key 後顯示

#### Scenario: 缺翻譯回退繁體
- **WHEN** 某 `validation.*` key 在 en/zh-CN 尚未翻譯
- **THEN** 回退顯示繁體（不顯示原始 key）

#### Scenario: 共用 schema 不在本批
- **WHEN** 檢視與後台共用的 schema（course-session/order 等）
- **THEN** 其驗證訊息維持原狀（留待對應前台批），後台表單不受影響
