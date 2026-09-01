/*
 * ----------------------------------------------
 * AddFriendDrawer - 加好友（我的行動條碼 / 相機掃碼 / 手動輸入啟動編號）
 * 2026-09-01
 * components/community/add-friend-drawer.tsx
 *
 * cr-spec-260901-003：單向即時加好友。QR payload = `spiritfriend:{spiritId}`，
 * 掃描端亦接受純 spiritId 字串。qrcode.react 與 @zxing/browser 皆 client-only、
 * 經 next/dynamic ssr:false 動態載入，不進首屏 bundle。
 * ----------------------------------------------
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { IconScan, IconQrcode } from '@tabler/icons-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { addFriendBySpiritId } from '@/app/actions/friendship'

const QRCodeCanvas = dynamic(() => import('qrcode.react').then((m) => m.QRCodeCanvas), {
  ssr: false,
})

type ScannerControls = { stop: () => void }

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mySpiritId: string | null
  onFriendAdded: () => void
}

const QR_PREFIX = 'spiritfriend:'

function parseSpiritId(text: string): string {
  const raw = text.startsWith(QR_PREFIX) ? text.slice(QR_PREFIX.length) : text
  return raw.trim().toUpperCase()
}

export function AddFriendDrawer({ open, onOpenChange, mySpiritId, onFriendAdded }: Props) {
  const t = useTranslations('community')
  const [view, setView] = useState<'qr' | 'scan'>('qr')
  const [manual, setManual] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<ScannerControls | null>(null)

  const stopCamera = useCallback(() => {
    controlsRef.current?.stop()
    controlsRef.current = null
    const stream = videoRef.current?.srcObject as MediaStream | null
    stream?.getTracks().forEach((track) => track.stop())
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const handleAdd = useCallback(
    async (raw: string) => {
      const spiritId = parseSpiritId(raw)
      if (!spiritId) return
      setSubmitting(true)
      const result = await addFriendBySpiritId(spiritId)
      setSubmitting(false)
      if (result.success) {
        toast.success(result.alreadyFriend ? t('alreadyFriend') : t('added'))
        setManual('')
        onFriendAdded()
        if (view === 'scan') {
          stopCamera()
          setView('qr')
        }
      } else {
        toast.error(result.message ?? t('notFoundError'))
      }
    },
    [t, onFriendAdded, view, stopCamera]
  )

  // 掃描檢視：掛載相機（僅在使用者切到 scan 且 Drawer 開啟時）
  useEffect(() => {
    if (!open || view !== 'scan') return
    let cancelled = false
    setCameraError(null)

    import('@zxing/browser')
      .then(async ({ BrowserQRCodeReader }) => {
        if (cancelled || !videoRef.current) return
        const reader = new BrowserQRCodeReader()
        const controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (result) handleAdd(result.getText())
          }
        )
        if (cancelled) {
          controls.stop()
          return
        }
        controlsRef.current = controls
      })
      .catch((err: unknown) => {
        if (cancelled) return
        const name = err instanceof Error ? err.name : ''
        setCameraError(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? t('cameraDenied')
            : t('cameraUnsupported')
        )
      })

    return () => {
      cancelled = true
      stopCamera()
    }
  }, [open, view, handleAdd, stopCamera, t])

  // Drawer 關閉：釋放相機並回到 QR 檢視
  useEffect(() => {
    if (open) return
    stopCamera()
    setView('qr')
    setCameraError(null)
    setManual('')
  }, [open, stopCamera])

  const manualBlock = (
    <div className="space-y-2">
      <label className="text-sm font-medium">{t('manualLabel')}</label>
      <div className="flex gap-2">
        <Input
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder={t('manualPlaceholder')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && manual.trim()) handleAdd(manual)
          }}
        />
        <Button disabled={!manual.trim() || submitting} onClick={() => handleAdd(manual)}>
          {t('add')}
        </Button>
      </div>
    </div>
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-md">
        <SheetHeader>
          <SheetTitle>{view === 'qr' ? t('myQrTitle') : t('scanToggle')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-6">
          {view === 'qr' ? (
            <>
              <div className="flex flex-col items-center gap-2">
                {mySpiritId ? (
                  <>
                    <div className="rounded-lg bg-white p-3">
                      <QRCodeCanvas value={`${QR_PREFIX}${mySpiritId}`} size={200} />
                    </div>
                    <p className="font-mono text-sm text-muted-foreground">{mySpiritId}</p>
                    <p className="text-xs text-muted-foreground">{t('myQrHint')}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('myQrHint')}</p>
                )}
              </div>

              <div className="border-t pt-4">{manualBlock}</div>

              <Button variant="outline" className="w-full" onClick={() => setView('scan')}>
                <IconScan className="mr-2 h-4 w-4" />
                {t('scanToggle')}
              </Button>
            </>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border bg-black">
                <video ref={videoRef} className="aspect-square w-full object-cover" muted playsInline />
              </div>

              {cameraError && (
                <div className="space-y-3 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                  <p>{cameraError}</p>
                  {manualBlock}
                </div>
              )}

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  stopCamera()
                  setView('qr')
                }}
              >
                <IconQrcode className="mr-2 h-4 w-4" />
                {t('scanBackToQr')}
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
