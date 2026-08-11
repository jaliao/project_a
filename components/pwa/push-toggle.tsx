/*
 * ----------------------------------------------
 * PushToggle - 通知 Drawer 內的「啟用推播通知」開關
 * 2026-08-11
 * components/pwa/push-toggle.tsx
 * ----------------------------------------------
 */

'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Switch } from '@/components/ui/switch'
import { useIsStandalone } from '@/hooks/use-is-standalone'
import { subscribeToPush, unsubscribeFromPush } from '@/app/actions/push-subscription'

/** VAPID 公鑰（base64url）轉換為 pushManager.subscribe 所需的 Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function PushToggle() {
  const t = useTranslations('pwa')
  const isStandalone = useIsStandalone()
  const [supported, setSupported] = useState(false)
  const [subscribed, setSubscribed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    setSupported(true)

    // 用 getRegistration() 而非 ready：ready 需等到「已有 SW 實際控制此頁」才 resolve，
    // 若 SW 註冊失敗（如 sw.js 404）會永遠卡在 pending；getRegistration() 一定會即時回傳
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => reg?.pushManager.getSubscription())
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {})
  }, [])

  async function handleSubscribe() {
    if (isIosDevice() && !isStandalone) {
      toast.error(t('pushToggle.iosRequiresInstall'))
      return
    }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      if (permission === 'denied') toast.error(t('pushToggle.permissionDenied'))
      return
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey) return

    setBusy(true)
    try {
      // 同上，避免依賴可能永遠不 resolve 的 ready；沒有註冊就在此當場註冊一次
      // （register() 失敗時會正常 reject，不會卡住）
      const reg = (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register('/sw.js'))
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      })
      await subscribeToPush(subscription.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }, navigator.userAgent)
      setSubscribed(true)
    } catch (error) {
      console.error('[push] 訂閱失敗', error)
      toast.error(t('pushToggle.subscribeFailed'))
    } finally {
      setBusy(false)
    }
  }

  async function handleUnsubscribe() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const subscription = await reg?.pushManager.getSubscription()
      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setSubscribed(false)
    } catch (error) {
      console.error('[push] 取消訂閱失敗', error)
      toast.error(t('pushToggle.subscribeFailed'))
    } finally {
      setBusy(false)
    }
  }

  if (!supported) return null

  return (
    <div className="flex items-center justify-between gap-2 px-4 py-2 text-xs text-muted-foreground border-b">
      <span>{t('pushToggle.label')}</span>
      <Switch
        checked={subscribed}
        disabled={busy}
        onCheckedChange={(checked) => (checked ? handleSubscribe() : handleUnsubscribe())}
      />
    </div>
  )
}
