## Context

`prisma/seed.ts` 目前由名冊（roster.json）+ 兩個保留帳號（管理員、黃國倫）+ 一個測試講師（`teacher@test.com`）組成。所有帳號皆設 `isTempPassword=true`，且名冊學員僅有 `realName`/`nickname`/`spiritId`/`phone` 等基本欄位。

既有 `seed-test-accounts` spec 描述了 `student1~4@test.com` 4 位測試學員，但**目前 seed.ts 並未實際建立這些帳號**（spec 與實作已偏離）。同時，登入後系統會依：
- `onboarding-wizard`：`isTempPassword=true` → 強制走三步驟 Wizard
- `profile-completion-guard`：`realName` 或 `phone` 缺失 → 強制轉導 Profile 頁

兩個機制使測試者每次重置 DB 後都得手動補填。本變更目的是讓 seed 直接產出「已完成補填」的測試帳號。

## Goals / Non-Goals

**Goals:**
- 於 seed.ts 明確建立 4 位測試學員（`student1@test.com`~`student4@test.com`），重置後可直接登入。
- 4 位學員 + 測試講師（`teacher@test.com`）皆為「已完成第一次登入補填」狀態，跳過 onboarding 與 profile guard。
- 維持 seed 冪等（重跑不重置既有帳號資料／密碼）。

**Non-Goals:**
- 不更動 onboarding-wizard / profile-completion-guard 的程式邏輯（行為不變，僅測試資料狀態改變）。
- 不更動名冊學員（roster）的 `isTempPassword` 狀態 — 名冊保留原貌以保有「待補填」測試情境。
- 不為測試學員建立課程報名／結業資料。

## Decisions

### 決策 1：補填完成的判定欄位 = `isTempPassword=false` + `realName` + `phone`
依 `onboarding-wizard`「已完成 onboarding 直接放行」與 `profile-completion-guard`「資料完整正常放行」兩條 spec，補填完成的充分條件即此三項。為使資料更貼近真實已用帳號，額外填妥 `nickname`、`gender`、`displayNameMode`、`spiritId`。
- 替代方案：只設 `isTempPassword=false` 不填 `realName`/`phone` → 仍會被 profile guard 轉導，否決。

### 決策 2：spiritId 採固定高位號段 `PA269001`~`PA269004`
測試學員用 `PA269001`~`PA269004`，與測試講師 `PA269999` 同屬 `PA269xxx` 高位測試區，與真實名冊號段（`PA2600xx`~`PA2601xx`）隔開，避免衝突且一眼可辨為測試資料。
- 替代方案：接續名冊一般序號 → 易與 `spiritIdCounter` 同步邏輯衝突、不易辨識，否決（採用使用者選擇）。
- 注意：固定高位號段不納入 step 8 的 `spiritIdCounter` maxSeq 計算（避免把計數器跳到 9999）。

### 決策 3：以 `upsert`（依 email）建立，達成冪等
比照管理員 / 黃國倫 / 測試講師的寫法，`create` 設定完整補填欄位；`update` 僅同步 `realName`/`nickname`/`spiritId`/`roles`，**不覆寫 `passwordHash` 與 `isTempPassword`**，符合 spec「重複執行不重置密碼／資料」。
- 密碼沿用既有 `STUDENT_PASSWORD`（`SEED_STUDENT_PASSWORD` 可覆寫），4 位學員共用同一 hash。

### 決策 4：以迴圈產生 4 位學員
用 index（1~4）組出 email / spiritId / nickname，避免重複貼四段近似程式碼。

## Risks / Trade-offs

- [既有 spec 要求 `isTempPassword=true`，本變更改為 `false`] → 以 MODIFIED Requirement 明確更新 `seed-test-accounts`，使 spec 與實作重新一致。
- [測試學員 spiritId 寫死，未來真實號段若擴張到 `PA269xxx`] → 該區段為刻意保留測試區，且年份前綴隨年遞增（`PA27xxxx`），衝突風險低。
- [`teacher@test.com` 既有資料已含 realName/phone，僅缺 `isTempPassword=false`] → 將其 create/update 一併設為 `false`，使其同樣跳過補填。

## Migration Plan

純 seed 腳本變更，無 DB schema migration。部署即重新執行 `make prisma-seed`；既有環境重跑因 upsert 冪等而安全。回滾＝還原 seed.ts。

## Open Questions

無。
