/*
 * ----------------------------------------------
 * MemberTextTag - 後台專用會員文字元件
 * 2026-08-04
 * components/admin/member-text-tag.tsx
 *
 * 底線文字（顯示名稱（真實名稱））＋點擊展開完整會員標籤（Popover），
 * 與 MemberTag 共用同一份 MemberTagInfo 資料契約
 * （cr-spec-260804-004，文字樣式調整 cr-spec-260804-005）
 * ----------------------------------------------
 */

'use client'

import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { MemberTag, type MemberTagInfo } from '@/components/admin/member-tag'
import { withRealName } from '@/lib/utils/member-display'

type MemberTextTagProps = MemberTagInfo

export function MemberTextTag(info: MemberTextTagProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button type="button" className="underline underline-offset-2 text-left">
          {withRealName(info.displayName, info.realName)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-none bg-transparent p-0 shadow-none">
        <MemberTag {...info} />
      </PopoverContent>
    </Popover>
  )
}
