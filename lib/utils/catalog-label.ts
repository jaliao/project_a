/*
 * ----------------------------------------------
 * 課程目錄名稱顯示語言映射
 * 2026-10-01
 * lib/utils/catalog-label.ts
 *
 * CourseCatalog.label 為資料庫內容字串（非 i18n key），
 * 透過 messages/*.json 的 `catalog` 命名空間查表取得對應語言顯示名稱；
 * 查無對照時 fallback 回傳原始 label，不中斷畫面。
 * ----------------------------------------------
 */

// 呼叫端需傳入已限定在 `catalog` 命名空間的 translator（useTranslations('catalog') 或 getTranslations('catalog')）
type CatalogTranslator = {
  (key: string): string
  has: (key: string) => boolean
}

export function translateCatalogLabel(t: CatalogTranslator, label: string): string {
  return t.has(label) ? t(label) : label
}
