/*
 * ----------------------------------------------
 * DatePicker - 日期選擇器（Calendar + Popover）
 * 2026-03-23
 * components/ui/date-picker.tsx
 * ----------------------------------------------
 */

'use client'

import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { IconCalendar } from '@tabler/icons-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = '選擇日期',
  disabled,
}: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <IconCalendar className="mr-2 h-4 w-4" />
          {value ? format(value, 'yyyy/MM/dd', { locale: zhTW }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
