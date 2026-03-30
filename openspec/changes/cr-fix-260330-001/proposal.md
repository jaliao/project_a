## Why

WSL2 環境缺少 `xdg-open`，Prisma Studio 啟動後嘗試自動開啟瀏覽器時拋出 `ENOENT` 錯誤並終止 process，導致 `make prisma-studio`、`make prisma-dev-studio`、`make prisma-vps3-studio` 均無法正常使用。

## What Changes

- Makefile 三個 studio 目標統一加上 `--browser none` 旗標，停用自動開瀏覽器行為

## Capabilities

### New Capabilities
- `makefile-studio-browser-fix`: Makefile 所有 prisma studio 指令加 `--browser none`

### Modified Capabilities

## Impact

- `Makefile`：`prisma-studio`、`prisma-dev-studio`、`prisma-vps3-studio` 三個目標
