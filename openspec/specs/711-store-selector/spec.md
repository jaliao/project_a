## REMOVED Requirements

### Requirement: 開啟 7-11 門市選擇器
**Reason**: 以 ECPay MapCVS 官方 API 統一取代，7-11 原有的非正式 Map URL 方案廢除。
**Migration**: 改用 `ecpay-store-selector` capability，`EcpayStoreSelector` 元件以 `logisticsSubType="UNIMART"` 提供等效功能。

### Requirement: 接收門市選擇結果
**Reason**: 原方案驗證外部 7-11 網域 origin；新方案改為驗證 `window.location.origin`（同源），由 `ecpay-store-selector` capability 統一處理。
**Migration**: `ecpay-store-selector` 的 `postMessage` 接收邏輯取代此需求。

### Requirement: 重新選取門市
**Reason**: 功能移至 `ecpay-store-selector` capability。
**Migration**: `EcpayStoreSelector` 已內建「重新選取」功能。

### Requirement: 切換取貨方式時清除門市資料
**Reason**: 功能移至 `ecpay-store-selector` capability，並擴展支援全家 ↔ 7-11 之間切換時亦清除。
**Migration**: `ecpay-store-selector` 的切換清除邏輯取代此需求。

### Requirement: 7-11 門市選擇表單驗證
**Reason**: 驗證邏輯移至 `ecpay-store-selector` capability，並擴展至全家取貨。
**Migration**: `ecpay-store-selector` 的超商取貨表單驗證取代此需求。
