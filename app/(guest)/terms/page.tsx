/*
 * ----------------------------------------------
 * 服務條款頁面
 * 2026-04-02
 * app/terms/page.tsx
 * ----------------------------------------------
 */

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '服務條款 — 啟動事工',
}

export default function TermsPage() {
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

        <h1 className="mb-2 text-3xl font-bold">服務條款</h1>
        <p className="mb-10 text-sm text-muted-foreground">最後更新日期：2026 年 4 月 2 日</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground">

          <section>
            <h2 className="mb-3 text-lg font-semibold">一、接受條款</h2>
            <p>
              歡迎使用啟動事工（以下簡稱「本系統」）。當您存取或使用本系統，即表示您同意受本服務條款之約束。若您不同意本條款，請勿使用本系統。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">二、服務說明</h2>
            <p>
              本系統提供課程管理、會員管理、時程追蹤及相關功能，供經授權之使用者存取。本系統保留隨時修改、暫停或終止服務之權利，恕不另行通知。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">三、帳號與安全</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>您須對帳號內發生的所有活動負責。</li>
              <li>請勿將帳號資訊分享給他人。</li>
              <li>如發現帳號遭未授權存取，請立即通知管理員。</li>
              <li>本系統僅開放經管理員核准之 Email 帳號註冊及登入。</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">四、使用規範</h2>
            <p className="mb-2">您同意不得從事以下行為：</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>以任何非法目的使用本系統。</li>
              <li>嘗試未授權存取本系統或其他使用者之資料。</li>
              <li>干擾或破壞本系統之正常運作。</li>
              <li>上傳或傳輸惡意程式碼。</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">五、智慧財產權</h2>
            <p>
              本系統之所有內容，包括但不限於文字、圖形、程式碼、介面設計，均屬本系統所有或其授權方所有，受著作權法及相關法律保護，未經授權不得複製或使用。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">六、免責聲明</h2>
            <p>
              本系統以「現況」提供服務，不對服務之不中斷、無誤或適合特定目的作任何明示或暗示之保證。對於因使用本系統所造成之任何直接或間接損失，本系統不負任何責任。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">七、條款變更</h2>
            <p>
              本系統保留隨時修改本條款之權利。修改後之條款將公告於本頁面，繼續使用本系統即視為接受修改後之條款。
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">八、聯絡我們</h2>
            <p>
              如有任何疑問，請聯繫系統管理員。
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
