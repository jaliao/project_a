/*
 * ----------------------------------------------
 * InstallBanner - 個人首頁「安裝到手機桌面」提醒
 * 2026-08-11
 * components/pwa/install-banner.tsx
 * ----------------------------------------------
 */

'use client'

import { useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { IconDeviceMobile, IconX } from '@tabler/icons-react'
import { useIsStandalone } from '@/hooks/use-is-standalone'
import {
  clearDeferredInstallPrompt,
  getDeferredInstallPrompt,
  subscribeInstallPromptReady,
} from '@/components/pwa/pwa-register'

const DISMISS_KEY = 'pwa-install-dismissed-at'
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000

const dismissListeners = new Set<() => void>()

function subscribeDismiss(callback: () => void): () => void {
  dismissListeners.add(callback)
  return () => dismissListeners.delete(callback)
}

function getDismissedSnapshot(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY)
  if (!raw) return false
  const dismissedAt = Number(raw)
  if (Number.isNaN(dismissedAt)) return false
  return Date.now() - dismissedAt < DISMISS_DURATION_MS
}

function getDismissedServerSnapshot(): boolean {
  return false
}

function markDismissed() {
  localStorage.setItem(DISMISS_KEY, String(Date.now()))
  dismissListeners.forEach((callback) => callback())
}

function getCanPromptServerSnapshot(): boolean {
  return false
}

export function InstallBanner() {
  const t = useTranslations('pwa')
  const isStandalone = useIsStandalone()
  const isDismissed = useSyncExternalStore(subscribeDismiss, getDismissedSnapshot, getDismissedServerSnapshot)
  const canPrompt = useSyncExternalStore(
    subscribeInstallPromptReady,
    () => Boolean(getDeferredInstallPrompt()),
    getCanPromptServerSnapshot
  )

  const visible = !isStandalone && !isDismissed

  async function handleInstall() {
    const promptEvent = getDeferredInstallPrompt()
    if (!promptEvent) return
    await promptEvent.prompt()
    await promptEvent.userChoice
    clearDeferredInstallPrompt()
    markDismissed()
  }

  if (!visible) return null

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-sm text-primary">
      <div className="flex items-center gap-2">
        <IconDeviceMobile className="h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">{t('installBanner.title')}</p>
          <p className="text-xs text-primary/80">{t('installBanner.description')}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {canPrompt ? (
          <button
            type="button"
            onClick={handleInstall}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('installBanner.install')}
          </button>
        ) : (
          <Link
            href="/pwa-install"
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t('installBanner.viewInstructions')}
          </Link>
        )}
        <button
          type="button"
          onClick={markDismissed}
          aria-label={t('installBanner.dismiss')}
          className="text-primary/60 hover:text-primary"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
