import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 登入後 app 殼內容容器：最大寬 1280px、水平置中、未達上限時佔滿可用寬 */
export const APP_MAX_WIDTH = 'mx-auto w-full max-w-[1280px]'
