# i18n-messages Specification

## Purpose
TBD - created by archiving change cr-spec-260629-004. Update Purpose after archive.
## Requirements
### Requirement: 訊息目錄與唯一事實來源
系統 SHALL 以 `messages/<locale>.json` 管理 UI 文案，`messages/zh-TW.json`（繁體）為**唯一事實來源**，`messages/en.json` 為英文翻譯，`messages/zh-CN.json` 為產生物。訊息 SHALL 以命名空間組織，至少包含 `common`、`nav`、`auth`、`language`、`validation`、`status`、`role`、`catalog`，以及 feature 命名空間（如 `account`、`onboarding`、`recover`、`notifications`、`invites`、`learning`、`matchBoard`、`course`）。

#### Scenario: 以 key 取用文案
- **WHEN** 元件需要顯示文案
- **THEN** 透過翻譯 key（如 `auth.loginButton`、`validation.realNameRequired`、`status.recruiting`、`course.detail.title`）取用，不寫死語言字串

#### Scenario: zh-TW 為新增字串落點
- **WHEN** 新增一段 UI 文案
- **THEN** 先加入 `messages/zh-TW.json`（再補 en），不直接寫死於元件

#### Scenario: 命名空間涵蓋共用與 feature 類別
- **WHEN** 需要共用詞或 feature 頁文案（含課程網域）
- **THEN** 分別取用共用命名空間或對應 feature 命名空間（含 `course`）

### Requirement: 翻譯使用慣例
系統 SHALL 提供 server 與 client 元件的翻譯取用方式：server 元件用 `getTranslations`、client 元件用 `useTranslations`，並由範例切片示範。

#### Scenario: client 元件取用翻譯
- **WHEN** client 元件呼叫 `useTranslations('auth')`
- **THEN** 可取得該命名空間文案並隨當前語言呈現

#### Scenario: server 元件取用翻譯
- **WHEN** server 元件呼叫 `getTranslations`
- **THEN** 可於伺服端取得當前語言文案（含 metadata）

### Requirement: 簡體中文由 OpenCC 自動產生
`messages/zh-CN.json` SHALL 由 `messages/zh-TW.json` 經 OpenCC（繁轉簡）自動產生，SHALL NOT 手工維護；提供產生腳本並於建置流程執行。

#### Scenario: 產生簡體訊息
- **WHEN** 執行簡體產生腳本
- **THEN** 依 zh-TW.json 內容產生對應 zh-CN.json（值繁轉簡、key 不變）

#### Scenario: 簡體不手改
- **WHEN** 需修改簡體文案
- **THEN** 應改 zh-TW 來源並重新產生，而非直接編輯 zh-CN.json

### Requirement: 缺字串回退預設語言
非預設語言缺少某 key 時，系統 SHALL 回退顯示預設語言（zh-TW）文案，不得因缺 key 中斷或顯示原始 key，以支援漸進遷移。

#### Scenario: en 缺 key 回退繁體
- **WHEN** 當前語言為 en 但某 key 尚未翻譯
- **THEN** 顯示該 key 的 zh-TW 文案（不報錯、不顯示 key 名）

