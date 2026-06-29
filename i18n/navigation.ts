/*
 * ----------------------------------------------
 * i18n 在地化導航 API（next-intl）
 * 2026-06-29
 * i18n/navigation.ts
 *
 * 導出 locale 感知的 Link / useRouter / usePathname / redirect，
 * 供語言切換器與在地化連結使用。
 * ----------------------------------------------
 */

import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)
