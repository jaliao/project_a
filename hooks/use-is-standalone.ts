/*
 * ----------------------------------------------
 * 偵測目前頁面是否以 PWA（standalone）方式啟動
 * 2026-08-11
 * hooks/use-is-standalone.ts
 * ----------------------------------------------
 */

'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia('(display-mode: standalone)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getSnapshot(): boolean {
  const isDisplayModeStandalone = window.matchMedia('(display-mode: standalone)').matches
  // iOS Safari 專屬屬性，不支援 display-mode media query 判斷
  const isIosStandalone = (window.navigator as { standalone?: boolean }).standalone === true
  return isDisplayModeStandalone || isIosStandalone
}

function getServerSnapshot(): boolean {
  return false
}

/** 是否以已安裝的 PWA（standalone）方式啟動；SSR 階段固定回傳 false */
export function useIsStandalone(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
