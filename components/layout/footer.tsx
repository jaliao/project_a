/*
 * ----------------------------------------------
 * Footer - 版本資訊（版本號＋系統更新日期）
 * 2026-07-08
 * components/layout/footer.tsx
 * ----------------------------------------------
 */

import versionInfo from '@/config/version.json'

// 純符號＋數字顯示（v0.1.129 · 2026-07-08），語言中立、免 i18n
export function Footer() {
  return (
    <footer className="py-4 text-center text-xs text-muted-foreground">
      v{versionInfo.version} · {versionInfo.updatedAt}
    </footer>
  )
}
