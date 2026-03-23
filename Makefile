# /*
#  * ----------------------------------------------
#  * Makefile for BC-ERP Project
#  * 2026-01-15
#  * ----------------------------------------------
#  */

# 讀取 .env 檔案（如果存在）
ifneq ("$(wildcard .env)","")
    include .env
    export $(shell sed 's/=.*//' .env)
endif

PROJECT_NAME=bc-erp
DOCKERHUB_USER=jaliao
WEB_IMAGE=$(DOCKERHUB_USER)/$(PROJECT_NAME)-web
DB_IMAGE=$(DOCKERHUB_USER)/$(PROJECT_NAME)-db
# Prisma 命令使用本機資料庫連線
# 定義 Prisma 連線字串（直接引用 .env 內的變數名稱，Make 會自動展開）
# 注意：這裡使用單引號避免 Shell 在傳遞前錯誤解析
PRISMA_DEV_DB = DATABASE_URL="$(DATABASE_URL_DEV)"
PRISMA_VPS3_DB = DATABASE_URL="$(DATABASE_URL_VPS3)"

# SCHEMA_NAME 用於快速更新流程
# 支援 make schema-update name=xxx 或 make schema-update SCHEMA_NAME=xxx
SCHEMA_NAME ?= $(if $(name),$(name),auto_$(shell date +%Y%m%d_%H%M%S))

TAG=latest

UID := $(shell id -u)
GID := $(shell id -g)

DOCKER_COMPOSE=docker compose -p $(PROJECT_NAME) -f docker-compose.yml
DEV_COMPOSE=$(DOCKER_COMPOSE) -f docker-compose.dev.yml
PROD_COMPOSE=$(DOCKER_COMPOSE) -f docker-compose.prod.yml

.PHONY: help dev dev-clean dev-stop dev-logs dev-restart
.PHONY: prisma-generate prisma-push prisma-migrate prisma-migrate-deploy prisma-reset prisma-studio prisma-validate prisma-format prisma-seed
.PHONY: prisma-docker-generate prisma-docker-push prisma-docker-migrate prisma-docker-restart prisma-docker-studio
.PHONY: schema-update schema-quick prisma-status prisma-diff prisma-inspect
.PHONY: db-shell db-backup db-restore db-logs
.PHONY: build tag push prod clean clean-all
.PHONY: install test lint format

# ==================================================
# 🎯 預設目標：顯示幫助
# ==================================================
.DEFAULT_GOAL := help

help: ## 📖 顯示所有可用命令
	@echo ""
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║                  BC-ERP Makefile 命令列表                      ║"
	@echo "╠════════════════════════════════════════════════════════════════╣"
	@echo "║                                                                ║"
	@echo "║  🚀 快速開始                                                   ║"
	@echo "║  ────────────────────────────────────────────────────────────  ║"
	@echo "║  make install              安裝依賴套件                        ║"
	@echo "║  make dev                  啟動開發環境                        ║"
	@echo "║  make schema-update        更新資料庫 Schema（推薦）           ║"
	@echo "║  make prisma-studio        開啟資料庫管理介面                  ║"
	@echo "║                                                                ║"
	@echo "║  📦 開發環境                                                   ║"
	@echo "║  ────────────────────────────────────────────────────────────  ║"
	@echo "║  make dev                  啟動開發環境（Docker + Next.js）   ║"
	@echo "║  make dev-clean            清理並重新啟動                      ║"
	@echo "║  make dev-stop             停止開發環境                        ║"
	@echo "║  make dev-restart          重新啟動開發環境                    ║"
	@echo "║  make dev-logs             查看容器日誌                        ║"
	@echo "║                                                                ║"
	@echo "║  🗄️  Prisma（本機執行）                                       ║"
	@echo "║  ────────────────────────────────────────────────────────────  ║"
	@echo "║  make prisma-generate      生成 Prisma Client                 ║"
	@echo "║  make prisma-push          同步資料庫（快速開發）              ║"
	@echo "║  make prisma-migrate       建立 Migration（保留歷史）         ║"
	@echo "║  make prisma-migrate-deploy 部署 Migration（生產用）          ║"
	@echo "║  make prisma-validate      驗證 Schema 語法                   ║"
	@echo "║  make prisma-format        格式化 Schema 檔案                 ║"
	@echo "║  make prisma-reset         重置資料庫（⚠️ 刪除所有資料）      ║"
	@echo "║  make prisma-studio        開啟 Prisma Studio                 ║"
	@echo "║  make prisma-seed          執行種子資料                        ║"
	@echo "║                                                                ║"
	@echo "║  🚀 快速流程                                                   ║"
	@echo "║  ────────────────────────────────────────────────────────────  ║"
	@echo "║  make schema-update        完整 Schema 更新流程（推薦）       ║"
	@echo "║  make schema-update name=x 指定 migration 名稱               ║"
	@echo "║  make schema-quick         快速更新（不建立 migration）       ║"
	@echo "║                                                                ║"
	@echo "║  🔍 診斷工具                                                   ║"
	@echo "║  ────────────────────────────────────────────────────────────  ║"
	@echo "║  make prisma-status        顯示 Migration 狀態                ║"
	@echo "║  make prisma-diff          查看 Schema 與資料庫的差異         ║"
	@echo "║  make prisma-inspect       檢查目前資料庫結構                  ║"
	@echo "║                                                                ║"
	@echo "║  🐘 資料庫管理                                                 ║"
	@echo "║  ────────────────────────────────────────────────────────────  ║"
	@echo "║  make db-shell             進入資料庫命令列                    ║"
	@echo "║  make db-backup            備份資料庫                          ║"
	@echo "║  make db-restore           還原資料庫                          ║"
	@echo "║  make db-logs              查看資料庫日誌                      ║"
	@echo "║                                                                ║"
	@echo "║  🏗️  建置與部署                                                ║"
	@echo "║  ────────────────────────────────────────────────────────────  ║"
	@echo "║  make build                建立 Docker 映像檔                  ║"
	@echo "║  make tag                  標記映像檔版本                      ║"
	@echo "║  make push                 推送到 Docker Hub                   ║"
	@echo "║  make prod                 啟動正式環境                        ║"
	@echo "║                                                                ║"
	@echo "║  🧹 清理                                                       ║"
	@echo "║  ────────────────────────────────────────────────────────────  ║"
	@echo "║  make clean                清理開發環境                        ║"
	@echo "║  make clean-all            完全清理（包含映像檔）              ║"
	@echo "║                                                                ║"
	@echo "║  🛠️  其他工具                                                  ║"
	@echo "║  ────────────────────────────────────────────────────────────  ║"
	@echo "║  make install              安裝 npm 套件                       ║"
	@echo "║  make test                 執行測試                            ║"
	@echo "║  make lint                 檢查程式碼風格                      ║"
	@echo "║  make format               格式化程式碼                        ║"
	@echo "║                                                                ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "💡 提示："
	@echo "   - Schema 變更請使用 'make schema-update'"
	@echo "   - 快速測試請使用 'make schema-quick'"
	@echo "   - 查看狀態請使用 'make prisma-status'"
	@echo ""

# ==================================================
# 📦 安裝與初始化
# ==================================================

install: ## 📥 安裝依賴套件
	@echo "📦 安裝 npm 套件..."
	@npm install --legacy-peer-deps

# ==================================================
# 🚀 開發環境
# ==================================================

dev: ## 🚀 啟動開發環境
	@echo "📦 檢查並安裝依賴套件..."
	@npm install --legacy-peer-deps || true
	@echo "🐳 啟動 Docker 容器..."
	@echo "⏳ 請稍候，容器啟動需要約 10-15 秒..."
	@UID=$(UID) GID=$(GID) $(DEV_COMPOSE) up --build

dev-clean: ## 🧹 清理並重新啟動開發環境
	@echo "🧹 清理舊容器和 volumes..."
	@$(DEV_COMPOSE) down -v --remove-orphans
	@echo "🗑️  清理完成"
	@echo "🐳 重新啟動..."
	@$(MAKE) dev

dev-stop: ## ⏹️  停止開發環境
	@echo "⏹️  停止容器..."
	@$(DEV_COMPOSE) down
	@echo "✅ 已停止"

dev-restart: ## 🔄 重新啟動開發環境
	@echo "🔄 重新啟動..."
	@$(DEV_COMPOSE) restart
	@echo "✅ 已重新啟動"

dev-logs: ## 📋 查看容器日誌
	@$(DEV_COMPOSE) logs -f

# ==================================================
# 🗄️  Prisma 命令（本機執行）
# ==================================================

prisma-generate: ## 🔨 生成 Prisma Client
	@echo "🔨 生成 Prisma Client..."
	@npx prisma generate  
	@echo "✅ 生成完成"

prisma-push: ## 📤 同步資料庫結構（快速開發）
	@echo "📤 同步資料庫結構..."
	@echo "⚠️  注意：不會建立 migration 檔案"
	@$(PRISMA_DEV_DB) npx prisma db push  
	@echo "✅ 同步完成"

prisma-migrate: ## 📝 建立 Migration（保留歷史）
	@echo "📝 建立 Migration (名稱: $(SCHEMA_NAME))..."
	@$(PRISMA_DEV_DB) npx prisma migrate dev   --name $(SCHEMA_NAME) && \
	echo "✅ Migration 建立完成" || \
	echo "❌ Migration 建立失敗"

prisma-migrate-deploy: ## 🚀 部署 Migration（生產環境用）
	@echo "🚀 部署 Migration 到生產環境..."
	@npx prisma migrate deploy  
	@echo "✅ 部署完成"

prisma-validate: ## ✅ 驗證 Schema 語法
	@echo "✅ 驗證 Prisma Schema..."
	@npx prisma validate  
	@echo "✅ Schema 驗證通過"

prisma-format: ## 🎨 格式化 Schema 檔案
	@echo "🎨 格式化 Prisma Schema..."
	@npx prisma format  
	@echo "✅ 格式化完成"

prisma-reset: ## ⚠️  重置資料庫（會刪除所有資料）
	@echo "⚠️  警告：此操作將刪除所有資料！"
	@read -p "確定要繼續嗎？(y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		$(PRISMA_DEV_DB) npx prisma migrate reset   --force; \
		echo "✅ 資料庫已重置"; \
	else \
		echo "❌ 已取消"; \
	fi

prisma-studio: ## 🎨 開啟 Prisma Studio
	@echo "🎨 開啟 Prisma Studio..."
	@echo "🌐 瀏覽器將開啟 http://localhost:5555"
	@$(PRISMA_DEV_DB) npx prisma studio  

prisma-seed: ## 🌱 執行種子資料
	@echo "🌱 初始化種子資料..."
	@if [ -f prisma/seed.ts ]; then \
		$(PRISMA_DEV_DB) npx tsx prisma/seed.ts; \
		echo "✅ 種子資料已建立"; \
	else \
		echo "❌ 找不到 prisma/seed.ts"; \
	fi

# ==================================================
# 🐳 Prisma 命令（容器內執行）
# ==================================================

# 廢除
# prisma-docker-generate: ## 🔨 在容器內生成 Prisma Client
# 	@echo "🔨 在容器內生成 Prisma Client..."
# 	@$(DEV_COMPOSE) exec web npx prisma generate  
# 	@echo "✅ 生成完成"

## 主要使用這個命令來執行種子資料，在容器內執行種子資料	
# prisma-docker-seed:
# 	@echo "🌱 在容器內初始化種子資料..."	
# 	@$(DEV_COMPOSE) exec web npx tsx prisma/seed.ts	
# 	@echo "✅ 種子資料已建立"

# 廢除
# prisma-docker-push: ## 📤 在容器內同步資料庫
# 	@echo "📤 在容器內同步資料庫..."
# 	@$(DEV_COMPOSE) exec web npx prisma db push  
# 	@echo "✅ 同步完成"

# 廢除
# prisma-docker-migrate: ## 📝 在容器內建立 Migration
# 	@echo "📝 在容器內建立 Migration..."
# 	@read -p "請輸入 Migration 名稱: " name; \
# 	$(DEV_COMPOSE) exec web npx prisma migrate dev   --name $$name
# 	@echo "✅ Migration 建立完成"

# 廢除
# prisma-docker-restart: ## 🔄 重啟 Web 容器（應用 Prisma 變更）
# 	@echo "🔄 重啟 Web 容器..."
# 	@$(DEV_COMPOSE) restart web
# 	@echo "✅ 重啟完成"

# 廢除
# prisma-docker-studio: ## 🎨 在容器內開啟 Prisma Studio
# 	@echo "🎨 開啟 Prisma Studio..."
# 	@echo "🌐 瀏覽器將開啟 http://localhost:5555"
# 	@$(DEV_COMPOSE) exec web npx prisma studio  

# ==================================================
# 🚀 快速流程命令
# ==================================================

schema-update: prisma-format prisma-validate prisma-migrate prisma-generate prisma-docker-restart ## 🚀 完整 Schema 更新流程（推薦）
	@echo "✅ Schema 更新完成！"
	@echo "💡 已執行："
	@echo "   1. 格式化 Schema"
	@echo "   2. 驗證 Schema"
	@echo "   3. 建立 Migration"
	@echo "   4. 生成 Prisma Client"
	@echo "   5. 重啟應用"

schema-quick: prisma-docker-push prisma-docker-generate prisma-docker-restart ## ⚡ 快速更新（開發用，不建立 migration）
	@echo "✅ 快速更新完成！"
	@echo "⚠️  注意：此方法不會建立 migration 檔案"

# ==================================================
# 🔍 診斷命令
# ==================================================

prisma-status: ## 📊 顯示 Migration 狀態
	@echo "📊 檢查 Migration 狀態..."
	@$(DEV_COMPOSE) exec web npx prisma migrate status  

prisma-diff: ## 🔍 查看 Schema 與資料庫的差異
	@echo "🔍 比對 Schema 與資料庫..."
	@$(DEV_COMPOSE) exec web npx prisma migrate diff \
		--from-schema-datamodel prisma/schema \
		--to-schema-datasource prisma/schema \
		--script

prisma-inspect: ## 🔬 檢查目前資料庫結構
	@echo "🔬 檢查資料庫結構..."
	@echo ""
	@echo "📋 所有資料表："
	@$(DEV_COMPOSE) exec db psql -U postgres -d bc-erp-db -c "\dt"
	@echo ""
	@echo "👤 users 表結構："
	@$(DEV_COMPOSE) exec db psql -U postgres -d bc-erp-db -c "\d users"

# ==================================================
# 🐘 資料庫管理
# ==================================================

db-shell: ## 🐘 進入資料庫命令列
	@echo "🐘 進入 PostgreSQL 命令列..."
	@echo "💡 提示：輸入 \q 離開"
	@$(DEV_COMPOSE) exec db psql -U postgres -d bc-erp-db

db-backup: ## 💾 備份資料庫
	@echo "💾 備份資料庫..."
	@mkdir -p ./backups
	@BACKUP_FILE=./backups/backup_$(shell date +%Y%m%d_%H%M%S).sql; \
	$(DEV_COMPOSE) exec -T db pg_dump -U postgres bc-erp-db > $$BACKUP_FILE; \
	echo "✅ 備份完成：$$BACKUP_FILE"

db-restore: ## 📥 還原資料庫
	@echo "📥 還原資料庫..."
	@echo "📁 可用的備份檔案："
	@ls -1 ./backups/*.sql 2>/dev/null || echo "   （無備份檔案）"
	@read -p "請輸入備份檔案路徑: " file; \
	if [ -f "$$file" ]; then \
		cat $$file | $(DEV_COMPOSE) exec -T db psql -U postgres bc-erp-db; \
		echo "✅ 還原完成"; \
	else \
		echo "❌ 檔案不存在"; \
	fi

db-logs: ## 📋 查看資料庫日誌
	@echo "📋 資料庫日誌..."
	@$(DEV_COMPOSE) logs -f db

# ==================================================
# 🏗️  建置與部署
# ==================================================

build: ## 🏗️  建立 Docker 映像檔
	@echo "🏗️  建立 Docker 映像檔..."
	@$(PROD_COMPOSE) build web --no-cache
	@echo "✅ 建立完成"

tag: ## 🏷️  標記映像檔
	@echo "🏷️  標記映像檔..."
	@docker tag $(PROJECT_NAME)-web $(WEB_IMAGE):$(TAG)
	@docker tag $(PROJECT_NAME)-db $(DB_IMAGE):$(TAG)
	@docker tag $(PROJECT_NAME)-web $(WEB_IMAGE):latest
	@docker tag $(PROJECT_NAME)-db $(DB_IMAGE):latest
	@echo "✅ 標記完成"

push: build tag ## 📤 推送到 Docker Hub
	@echo "📤 推送映像檔到 Docker Hub..."
	@docker push $(WEB_IMAGE):$(TAG)
	@docker push $(WEB_IMAGE):latest
	@docker push $(DB_IMAGE):$(TAG)
	@docker push $(DB_IMAGE):latest
	@echo "✅ 推送完成"

prod: ## 🚀 啟動正式環境
	@echo "🚀 啟動正式環境..."
	@UID=$(UID) GID=$(GID) $(PROD_COMPOSE) up --build -d
	@echo "✅ 正式環境已啟動"
	@echo "🌐 服務運行於 http://localhost:3000"

# ==================================================
# 🧹 清理
# ==================================================

clean: ## 🧹 清理開發環境
	@echo "🧹 清理開發環境..."
	@$(DEV_COMPOSE) down -v --remove-orphans
	@docker system prune -f
	@echo "✅ 清理完成"

clean-all: ## 🗑️  完全清理（包含映像檔）
	@echo "🗑️  完全清理..."
	@echo "⚠️  警告：將刪除所有容器、volume 和映像檔"
	@read -p "確定要繼續嗎？(y/N): " confirm; \
	if [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		$(DEV_COMPOSE) down -v --remove-orphans --rmi all; \
		docker system prune -af; \
		docker rmi $(WEB_IMAGE):$(TAG) $(DB_IMAGE):$(TAG) 2>/dev/null || true; \
		echo "✅ 完全清理完成"; \
	else \
		echo "❌ 已取消"; \
	fi

# ==================================================
# 🛠️  其他工具
# ==================================================

test: ## 🧪 執行測試
	@echo "🧪 執行測試..."
	@npm run test

lint: ## 🔍 檢查程式碼風格
	@echo "🔍 檢查程式碼風格..."
	@npm run lint

format: ## ✨ 格式化程式碼
	@echo "✨ 格式化程式碼..."
	@npm run format


# ==================================================
#  Prisma 透過 tunnel deploy remote vps
# ==================================================

.PHONY: tunnel-vps3 prisma-vps3-status prisma-vps3-deploy prisma-vps3-studio

tunnel-vps3: ## 開啟 VPS3 Postgres SSH Tunnel（localhost:15432）
	@/home/psyduck/devops-toolkit/remote-admin/tunnel/pg-tunnel-vps3.sh

tunnel-deploy: ## 開啟 VPS3 Deploy BCERP Docker
	@/home/psyduck/devops-toolkit/remote-admin/tunnel/bcerp-tunnel-deploy.sh

prisma-vps3-status: ## 檢查 VPS3 Migration 狀態（建議先跑）
	@echo "Prisma migrate status (VPS3)..."
	@$(PRISMA_VPS3_DB) npx prisma migrate status

prisma-vps3-deploy: ## 部署 migrations 到 VPS3（正式/遠端 DB 用）
	@echo "Prisma migrate deploy (VPS3)..."
	@$(PRISMA_VPS3_DB) npx prisma migrate deploy

prisma-dev-status: ## 檢查 Dev Migration 狀態（建議先跑）
	@echo "Prisma migrate status (DEV)... $(PRISMA_DEV_DB)"

	@$(PRISMA_DEV_DB) npx prisma migrate status

prisma-dev-deploy: ## 部署 migrations 到 VPS3（正式/遠端 DB 用）
	@echo "Prisma migrate deploy (DEV)..."
	@$(PRISMA_DEV_DB) npx prisma migrate deploy

prisma-vps3-seed: ## 部署 migrations 到 VPS3（正式/遠端 DB 用）
	@echo "初始化 VPS3 種子資料..."
	@if [ -f prisma/seed.ts ]; then \
		$(PRISMA_VPS3_DB) npx tsx prisma/seed.ts; \
		echo "✅ 種子資料已建立"; \
	else \
		echo "❌ 找不到 prisma/seed.ts"; \
	fi

prisma-vps3-studio: ## 連 VPS3 開 Prisma Studio（需先開 tunnel）
	@echo "🌐 Prisma Studio (VPS3) <http://localhost:5555>"
	@$(PRISMA_VPS3_DB) npx prisma studio


