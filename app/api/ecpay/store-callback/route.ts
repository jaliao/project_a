/*
 * ----------------------------------------------
 * API Route - ECPay MapCVS 門市選擇回傳 Callback
 * 2026-04-01
 * app/api/ecpay/store-callback/route.ts
 * ----------------------------------------------
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // 解析 ECPay form POST
  const formData = await request.formData()
  const storeId = formData.get('CVSStoreID')?.toString() ?? ''
  const storeName = formData.get('CVSStoreName')?.toString() ?? ''
  // ECPay 回傳實際選取門市所屬通路（UNIMART=7-11、FAMI=全家）；用來校正取貨方式，避免方式與門市不一致
  const logisticsSubType = formData.get('LogisticsSubType')?.toString() ?? ''
  // 呼叫端 token（自 ServerReplyURL query 帶入）：原樣回傳前端，辨識是哪一個門市選擇器的回傳
  const token = new URL(request.url).searchParams.get('token') ?? ''

  // 安全：避免 XSS，對 HTML 特殊字元做轉義
  const safeStoreName = storeName
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>門市選擇完成</title></head>
<body>
<script>
  (function() {
    var storeId = ${JSON.stringify(storeId)};
    var storeName = ${JSON.stringify(storeName)};
    var logisticsSubType = ${JSON.stringify(logisticsSubType)};
    var token = ${JSON.stringify(token)};
    if (window.opener) {
      try {
        window.opener.postMessage(
          { storeId: storeId, storeName: storeName, logisticsSubType: logisticsSubType, token: token },
          window.location.origin
        );
        window.close();
      } catch(e) {
        // postMessage 失敗時顯示降級訊息
        document.getElementById('msg').textContent =
          '已選取：' + storeName + '，請關閉此視窗並重新操作。';
      }
    } else {
      // 父視窗已關閉
      document.getElementById('msg').textContent =
        '已選取：' + storeName + '，請關閉此視窗並重新操作。';
    }
  })();
</script>
<p id="msg" style="font-family:sans-serif;padding:20px;">
  已選取：<strong>${safeStoreName}</strong>，視窗即將關閉…
</p>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
