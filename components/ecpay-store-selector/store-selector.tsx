/*
 * ----------------------------------------------
 * EcpayStoreSelector - ECPay MapCVS 超商門市選擇器元件
 * 2026-04-01
 * components/ecpay-store-selector/store-selector.tsx
 * ----------------------------------------------
 */

'use client'

import { useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { IconMapPin, IconRefresh } from '@tabler/icons-react'

// 門市資料格式
interface StoreData {
  storeId: string
  storeName: string
}

interface EcpayStoreSelectorProps {
  logisticsSubType: 'UNIMART' | 'FAMI'
  value: StoreData | null
  onChange: (store: StoreData | null) => void
  disabled?: boolean
}

export function EcpayStoreSelector({
  logisticsSubType,
  value,
  onChange,
  disabled = false,
}: EcpayStoreSelectorProps) {
  // 僅接受同源 postMessage（callback 頁面由我們自己的 /api/ecpay/store-callback 回傳）
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      const data = event.data
      if (
        data &&
        typeof data.storeId === 'string' &&
        typeof data.storeName === 'string' &&
        data.storeId.length > 0
      ) {
        onChange({ storeId: data.storeId, storeName: data.storeName })
      }
    },
    [onChange],
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [handleMessage])

  function openSelector() {
    window.open(
      `/api/ecpay/store-map?type=${logisticsSubType}`,
      '_ecpaymap',
      'width=1000,height=680,scrollbars=yes',
    )
  }

  if (value) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">已選取：</span>
          <span className="font-medium">{value.storeName}</span>
          <span className="ml-1 text-muted-foreground">（{value.storeId}）</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openSelector}
          disabled={disabled}
          className="shrink-0"
        >
          <IconRefresh className="h-4 w-4 mr-1" />
          重新選取
        </Button>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={openSelector}
      disabled={disabled}
      className="w-full justify-start text-muted-foreground"
    >
      <IconMapPin className="h-4 w-4 mr-2" />
      選取門市
    </Button>
  )
}
