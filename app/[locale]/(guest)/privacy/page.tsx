/*
 * ----------------------------------------------
 * 隱私政策頁面
 * 2026-04-02
 * app/privacy/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '隱私政策 — 啟動事工',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* 返回連結 */}
        <Link
          href="/login"
          className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          ← 返回登入
        </Link>

        <h1 className="mb-2 text-3xl font-bold">隱私政策</h1>
        <p className="mb-10 text-sm text-muted-foreground">最後更新日期：2026 年 4 月 2 日</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="mb-3 text-lg font-semibold">一、資料蒐集</h2>
            <p className="mb-2">本系統蒐集以下資訊以提供服務：</p>
            <ul className="list-disc space-y-2 pl-5">
              <li><strong>帳號資訊</strong>：Email、姓名、大頭貼（透過 Google OAuth 取得）。</li>
              <li><strong>使用資料</strong>：登入記錄、課程報名與完成紀錄、時程操作紀錄。</li>
              <li><strong>裝置資訊</strong>：瀏覽器類型、IP 位址（用於安全稽核）。</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">二、資料使用目的</h2>
            <p className="mb-2">蒐集之資料用於：</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>驗證使用者身份並維護帳號安全。</li>
              <li>提供課程管理、學習追蹤等系統核心功能。</li>
              <li>發送系統通知與重要公告。</li>
              <li>改善系統功能與使用體驗。</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">三、資料儲存與安全</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>所有資料儲存於受保護之伺服器，並採用加密傳輸（HTTPS）。</li>
              <li>密碼採用業界標準雜湊演算法儲存，不以明文保存。</li>
              <li>僅授權人員可存取資料庫。</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">四、資料共享</h2>
            <p>
              本系統不會將您的個人資料出售或出租給任何第三方。以下情況除外：
            </p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>法律要求或政府機關依法請求時。</li>
              <li>為保護本系統或使用者安全所必要時。</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">五、Google OAuth</h2>
            <p>
              本系統使用 Google OAuth 進行身份驗證。當您選擇使用 Google 帳號登入，我們僅取得您的基本個人資料（Email、姓名、大頭貼）。Google 的隱私政策另行規範 Google 服務之資料處理方式。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">六、Cookie 與本地儲存</h2>
            <p>
              本系統使用 Cookie 儲存登入 Session，以及 localStorage 保存部分操作狀態（例如計時器）。這些資料僅存於您的裝置，不會上傳至伺服器。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">七、您的權利</h2>
            <p className="mb-2">您有權：</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>查詢本系統持有您的個人資料。</li>
              <li>要求更正不正確之資料。</li>
              <li>要求刪除您的帳號及相關資料（請聯繫管理員）。</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">八、政策變更</h2>
            <p>
              本隱私政策如有重大變更，將於本頁面公告，並更新頂部之「最後更新日期」。建議您定期查閱。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">九、聯絡我們</h2>
            <p>
              如有隱私相關疑問或請求，請聯繫系統管理員。
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
