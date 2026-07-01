# material-order-cancel Specification

## Purpose
TBD - created by archiving change cr-spec-260630-005. Update Purpose after archive.
## Requirements
### Requirement: 匯款前可取消教材訂單
老師 SHALL 能於教材訂單「尚未回填匯款」（`paymentReportedAt` 為 null，即狀態為待批價或待付款）時取消該訂單。取消 SHALL 驗證操作者為該課程（訂單所屬 `courseInvite`）之建立者，並 SHALL 刪除該 `CourseOrder`（連帶刪除其寄送批次 `MaterialShipment` 與書本項目 `MaterialShipmentItem`），使該批書本回到「未指派」以供重新申請。已回填匯款（`paymentReportedAt` 非 null）之訂單 SHALL NOT 可由老師取消。取消為破壞性操作，前端 SHALL 於執行前要求確認。

#### Scenario: 待付款訂單取消後可重新申請
- **WHEN** 老師對狀態為待批價/待付款的教材訂單點「取消申請」並確認
- **THEN** 該訂單被刪除、其書本回到未指派，老師可重新申請教材

#### Scenario: 已回填匯款不可取消
- **WHEN** 訂單已回填匯款後五碼（`paymentReportedAt` 非 null）
- **THEN** 不提供「取消申請」，且取消操作被拒絕

#### Scenario: 僅擁有者可取消
- **WHEN** 非該課程建立者嘗試取消訂單
- **THEN** 操作被拒絕

