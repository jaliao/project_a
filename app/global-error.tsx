/*
 * ----------------------------------------------
 * 根層全站錯誤邊界（global-error）
 * 2026-10-22
 * app/global-error.tsx
 *
 * 取代 root layout（root layout 或其上層發生未攔截例外時渲染），
 * 無 root layout，故自帶最小 <html><body>；用 inline style 避免依賴 CSS/i18n provider。
 * ----------------------------------------------
 */

'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-TW">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafafa',
          fontFamily: 'system-ui, -apple-system, "Noto Sans TC", sans-serif',
          color: '#18181b',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem', maxWidth: 360 }}>
          <p style={{ fontSize: '3rem', fontWeight: 700, color: '#a1a1aa', margin: 0 }}>!</p>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '1rem' }}>發生錯誤</h1>
          <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '0.5rem' }}>
            系統發生未預期的錯誤，請稍後再試。
          </p>
          <div
            style={{
              display: 'flex',
              gap: '0.75rem',
              justifyContent: 'center',
              marginTop: '1.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '0.5rem',
                background: '#18181b',
                color: '#fff',
                border: 'none',
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              重新嘗試
            </button>
            {/* 根層錯誤邊界無 i18n provider，刻意用原生 <a>（非頁面導航元件） */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                display: 'inline-block',
                padding: '0.5rem 1.25rem',
                borderRadius: '0.5rem',
                background: '#fff',
                color: '#18181b',
                border: '1px solid #e4e4e7',
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              回到首頁
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
