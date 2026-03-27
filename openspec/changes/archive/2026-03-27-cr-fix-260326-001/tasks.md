## 1. 清除 .next 快取

- [x] 1.1 執行 `rm -rf .next` 清除 Turbopack stale chunk 快取（需先停止 dev server）

## 2. 新增 Makefile target

- [x] 2.1 在 `Makefile` 新增 `next-clean` target：執行 `rm -rf .next` 並顯示提示訊息
