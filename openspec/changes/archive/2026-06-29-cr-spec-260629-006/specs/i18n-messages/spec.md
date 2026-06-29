## MODIFIED Requirements

### Requirement: 訊息目錄與唯一事實來源
系統 SHALL 以 `messages/<locale>.json` 管理 UI 文案，`messages/zh-TW.json`（繁體）為**唯一事實來源**，`messages/en.json` 為英文翻譯，`messages/zh-CN.json` 為產生物。訊息 SHALL 以命名空間組織，至少包含 `common`、`nav`、`auth`、`language`、`validation`、`status`、`role`、`catalog`。

#### Scenario: 以 key 取用文案
- **WHEN** 元件需要顯示文案
- **THEN** 透過翻譯 key（如 `auth.loginButton`、`validation.realNameRequired`、`status.recruiting`）取用，不寫死語言字串

#### Scenario: zh-TW 為新增字串落點
- **WHEN** 新增一段 UI 文案
- **THEN** 先加入 `messages/zh-TW.json`（再補 en），不直接寫死於元件

#### Scenario: 命名空間涵蓋共用類別
- **WHEN** 需要通用動作詞、導覽、驗證訊息、狀態/身分/書別標籤
- **THEN** 分別取用 `common`/`nav`/`validation`/`status`/`role`/`catalog` 命名空間
