/*
 * ----------------------------------------------
 * PWA/favicon 共用品牌圖示標記（藍底白色字母 A）
 * 2026-08-11
 * lib/pwa/brand-icon.tsx
 *
 * 供 app/icon.tsx、app/apple-icon.tsx、app/icon-192、app/icon-512
 * 這四個以 next/og ImageResponse 動態產生圖示的路由共用，避免重複。
 * ----------------------------------------------
 */

// 對應 app/globals.css 的 --primary（light），需與 app/manifest.ts 的 THEME_COLOR 保持一致
export const BRAND_COLOR = '#2563eb'

export function BrandIconMark({ size, rounded = true }: { size: number; rounded?: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: BRAND_COLOR,
        borderRadius: rounded ? size * 0.2 : 0,
      }}
    >
      <span
        style={{
          // 字級刻意保守（safe zone 內），供 maskable purpose 使用時不被裁切
          fontSize: size * 0.5,
          fontWeight: 700,
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        A
      </span>
    </div>
  )
}
