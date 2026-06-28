/*
 * ----------------------------------------------
 * EcpayStoreSelector - ECPay MapCVS 超商門市選擇器元件
 * 2026-04-01
 * components/ecpay-store-selector/store-selector.tsx
 * ----------------------------------------------
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { IconMapPin, IconRefresh } from '@tabler/icons-react'

// 門市資料格式
interface StoreData {
  storeId: string
  storeName: string
  // 實際選取門市所屬通路（UNIMART=7-11、FAMI=全家），用來校正取貨方式
  logisticsSubType?: 'UNIMART' | 'FAMI'
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
  // 本元件開啟選擇器時產生的 token；用來辨識「哪一個選擇器」開啟的回傳，
  // 避免多個地址的選擇器共用 message 監聽時，一次選取覆蓋到其他地址
  const tokenRef = useRef<string>('')

  // 僅接受同源 postMessage（callback 頁面由我們自己的 /api/ecpay/store-callback 回傳）
  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      const data = event.data
      // 僅處理本元件開啟之選擇器的回傳（token 不符則忽略）
      if (!data || data.token !== tokenRef.current || tokenRef.current === '') return

      if (
        typeof data.storeId === 'string' &&
        typeof data.storeName === 'string' &&
        data.storeId.length > 0
      ) {
        // 以 ECPay 回傳的實際通路為準；缺漏時退回此選擇器開啟時請求的通路
        const subType =
          data.logisticsSubType === 'UNIMART' || data.logisticsSubType === 'FAMI'
            ? data.logisticsSubType
            : logisticsSubType
        onChange({ storeId: data.storeId, storeName: data.storeName, logisticsSubType: subType })
        // 用畢即清除，避免重複觸發
        tokenRef.current = ''
      }
    },
    [onChange, logisticsSubType],
  )

  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [handleMessage])

  function openSelector() {
    // 產生唯一 token；callback 會原樣帶回，handleMessage 以此辨識為本元件的回傳
    const token =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    tokenRef.current = token
    window.open(
      `/api/ecpay/store-map?type=${logisticsSubType}&token=${encodeURIComponent(token)}`,
      // 每個 token 用獨立視窗名稱，避免共用同一彈窗互相覆蓋
      `_ecpaymap_${token}`,
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
