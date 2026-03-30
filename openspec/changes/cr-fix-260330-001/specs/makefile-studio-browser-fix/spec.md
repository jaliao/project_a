## ADDED Requirements

### Requirement: Prisma Studio 不自動開啟瀏覽器
Makefile 中所有 `npx prisma studio` 指令 SHALL 加上 `--browser none` 旗標。

#### Scenario: WSL2 環境執行 make prisma-dev-studio
- **WHEN** 在 WSL2 環境執行 `make prisma-dev-studio`
- **THEN** Prisma Studio 正常啟動並監聽 port，不拋出 `xdg-open ENOENT` 錯誤
