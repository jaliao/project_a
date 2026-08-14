/*
 * ----------------------------------------------
 * GenderIcon - 性別圖示共用顯示元件
 * 2026-08-04
 * components/shared/gender-icon.tsx
 *
 * 移植自 certificates/page.tsx 既有的本地實作，樣式不變
 * （藍色♂／粉色♀／淡色中性 icon），供會員標籤重用（cr-spec-260804-005）
 * ----------------------------------------------
 */

import { IconGenderAgender, IconGenderFemale, IconGenderMale } from '@tabler/icons-react'

export type Gender = 'male' | 'female' | 'unspecified'

export function GenderIcon({ gender }: { gender: Gender }) {
  if (gender === 'male') {
    return <IconGenderMale className="size-4 shrink-0 text-blue-500" aria-label="男" />
  }
  if (gender === 'female') {
    return <IconGenderFemale className="size-4 shrink-0 text-rose-500" aria-label="女" />
  }
  return <IconGenderAgender className="size-4 shrink-0 text-muted-foreground/50" aria-label="未指定" />
}
