/*
 * ----------------------------------------------
 * PWA Service Worker 註冊 + beforeinstallprompt 捕獲
 * 2026-08-11
 * components/pwa/pwa-register.tsx
 *
 * 全域掛載一次（app/[locale]/layout.tsx）。捕獲的 beforeinstallprompt
 * 事件存於 module-level 變數，供 InstallBanner 的「安裝」按鈕呼叫。
 * ----------------------------------------------
 */

'use client'

import { useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const INSTALL_PROMPT_READY_EVENT = 'pwa:install-prompt-ready'

let deferredInstallPrompt: BeforeInstallPromptEvent | null = null

/** 供其他 client component 讀取目前捕獲到的安裝提示事件 */
export function getDeferredInstallPrompt() {
  return deferredInstallPrompt
}

/** 觸發安裝提示後，事件僅能使用一次，用畢即清空 */
export function clearDeferredInstallPrompt() {
  deferredInstallPrompt = null
}

/** 訂閱安裝提示就緒事件（用於觸發元件重新渲染） */
export function subscribeInstallPromptReady(callback: () => void) {
  window.addEventListener(INSTALL_PROMPT_READY_EVENT, callback)
  return () => window.removeEventListener(INSTALL_PROMPT_READY_EVENT, callback)
}

export function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // 略過註冊失敗，不影響其餘頁面功能
      })
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      deferredInstallPrompt = event as BeforeInstallPromptEvent
      window.dispatchEvent(new Event(INSTALL_PROMPT_READY_EVENT))
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  return null
}
