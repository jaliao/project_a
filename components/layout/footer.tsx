/*
 * ----------------------------------------------
 * Footer - 版本資訊（版本號＋系統更新日期）
 * 2026-07-08 (Updated: 2026-08-29)
 * components/layout/footer.tsx
 * ----------------------------------------------
 */

import versionInfo from '@/config/version.json'
import { cn, APP_MAX_WIDTH } from '@/lib/utils'

// 純符號＋數字顯示（v0.1.129 · 2026-07-08），語言中立、免 i18n
export function Footer() {
  return (
    <footer className="py-4">
      <div className={cn(APP_MAX_WIDTH, 'px-4 text-center text-xs text-muted-foreground sm:px-6')}>
        v{versionInfo.version} · {versionInfo.updatedAt}
      </div>
    </footer>
  )
}
