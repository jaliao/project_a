/*
 * ----------------------------------------------
 * 簡體中文訊息產生腳本（OpenCC 繁轉簡）
 * 2026-06-29
 * scripts/gen-zh-cn.mjs
 *
 * 由 messages/zh-TW.json（唯一事實來源）以 OpenCC（tw → cn）
 * 自動產生 messages/zh-CN.json。請勿手改 zh-CN.json。
 * 執行：npm run gen:zh-cn（並於 prebuild 自動執行）
 * ----------------------------------------------
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import * as OpenCC from 'opencc-js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const SRC = resolve(root, 'messages/zh-TW.json')
const OUT = resolve(root, 'messages/zh-CN.json')

const convert = OpenCC.Converter({ from: 'tw', to: 'cn' })

function convertValue(value) {
  if (typeof value === 'string') return convert(value)
  if (Array.isArray(value)) return value.map(convertValue)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, convertValue(v)]))
  }
  return value
}

const src = JSON.parse(readFileSync(SRC, 'utf8'))
const out = { __generated: 'AUTO-GENERATED from zh-TW.json via OpenCC — 請勿手改', ...convertValue(src) }
writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n', 'utf8')
console.log(`✅ messages/zh-CN.json 已由 zh-TW.json 產生（OpenCC tw→cn）`)
