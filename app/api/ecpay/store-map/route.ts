/*
 * ----------------------------------------------
 * API Route - ECPay MapCVS 門市選擇器頁面產生
 * 2026-04-01
 * app/api/ecpay/store-map/route.ts
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'
import { calcLogisticsCheckMacValue } from '@/lib/ecpay/logistics'

const VALID_TYPES = ['UNIMART', 'FAMI'] as const
type LogisticsSubType = (typeof VALID_TYPES)[number]

// ECPay 物流端點（預設正式環境，可用環境變數覆蓋為測試環境）
const ECPAY_MAP_URL =
  process.env.ECPAY_LOGISTICS_MAP_URL ??
  'https://logistics.ecpay.com.tw/Express/map'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')

  // 驗證 type 參數
  if (!VALID_TYPES.includes(type as LogisticsSubType)) {
    return new NextResponse('無效的 type 參數，請使用 UNIMART 或 FAMI', {
      status: 400,
    })
  }

  const serverUrl = process.env.ECPAY_LOGISTICS_SERVER_URL

  // Mock 模式：ECPAY_LOGISTICS_SERVER_URL 未設定
  if (!serverUrl) {
    const mockStoreName =
      type === 'UNIMART' ? '（測試-7-11 門市）' : '（測試-全家門市）'
    const mockStoreId = type === 'UNIMART' ? 'MOCK711' : 'MOCKFAMI'

    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>門市選擇器（Mock 模式）</title></head>
<body>
<script>
  try {
    window.opener?.postMessage(
      { storeId: ${JSON.stringify(mockStoreId)}, storeName: ${JSON.stringify(mockStoreName)} },
      window.location.origin
    );
  } catch(e) {}
  window.close();
</script>
<p style="font-family:sans-serif;padding:20px;">
  Mock 模式：已選取測試門市，視窗即將關閉…<br>
  如未自動關閉，請手動關閉此視窗。
</p>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // 正式模式：產生自動 submit 至 ECPay 的 HTML form
  const merchantId = process.env.ECPAY_LOGISTICS_MERCHANT_ID!
  const hashKey = process.env.ECPAY_LOGISTICS_HASH_KEY!
  const hashIV = process.env.ECPAY_LOGISTICS_HASH_IV!

  // MerchantTradeNo 最長 20 碼，使用時間戳確保唯一
  const merchantTradeNo = `MAP${Date.now().toString().slice(-17)}`
  const serverReplyURL = `${serverUrl}/api/ecpay/store-callback`

  const params: Record<string, string> = {
    MerchantID: merchantId,
    MerchantTradeNo: merchantTradeNo,
    LogisticsType: 'CVS',
    LogisticsSubType: type as string,
    IsCollection: 'N',
    ServerReplyURL: serverReplyURL,
  }

  const checkMacValue = calcLogisticsCheckMacValue(params, hashKey, hashIV)

  // 產生隱藏欄位 HTML
  const hiddenFields = [
    ...Object.entries(params),
    ['CheckMacValue', checkMacValue],
  ]
    .map(
      ([k, v]) =>
        `<input type="hidden" name="${k}" value="${v.replace(/"/g, '&quot;')}" />`,
    )
    .join('\n    ')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>門市選擇器</title></head>
<body>
<form id="ecpayForm" method="POST" action="${ECPAY_MAP_URL}">
    ${hiddenFields}
</form>
<script>document.getElementById('ecpayForm').submit();</script>
<p style="font-family:sans-serif;padding:20px;">正在開啟門市選擇器，請稍候…</p>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
