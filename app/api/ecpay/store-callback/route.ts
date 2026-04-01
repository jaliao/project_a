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
    if (window.opener) {
      try {
        window.opener.postMessage(
          { storeId: storeId, storeName: storeName },
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
