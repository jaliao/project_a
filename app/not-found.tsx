/*
 * ----------------------------------------------
 * 根層備援 404（locale 外未匹配網址）
 * 2026-07-01
 * app/not-found.tsx
 *
 * 無 root layout，故自帶最小 <html><body>；用 inline style 避免依賴 CSS/i18n provider。
 * ----------------------------------------------
 */

export default function RootNotFound() {
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
          <p style={{ fontSize: '3rem', fontWeight: 700, color: '#a1a1aa', margin: 0 }}>404</p>
          <h1 style={{ fontSize: '1.125rem', fontWeight: 600, marginTop: '1rem' }}>找不到頁面</h1>
          <p style={{ fontSize: '0.875rem', color: '#71717a', marginTop: '0.5rem' }}>
            您要找的頁面不存在或已被移除。
          </p>
          {/* 根層備援無 i18n provider，刻意用原生 <a>（非頁面導航元件） */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              background: '#18181b',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            返回首頁
          </a>
        </div>
      </body>
    </html>
  )
}
