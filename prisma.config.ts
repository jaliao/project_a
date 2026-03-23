/*
 * ----------------------------------------------
 * Prisma Configuration - 資料庫連線設定
 * 2026-01-19
 * prisma.config.ts
 * 
 * 功能說明：
 * - Prisma 7 配置文件
 * - 定義資料庫連線 URL
 * - 支援 Prisma CLI 工具
 * ----------------------------------------------
 */
import 'dotenv/config'
import { defineConfig, env } from "prisma/config";

export default defineConfig({

    schema: 'prisma/schema',

    migrations: {
        path: "prisma/migrations",
        seed: 'tsx prisma/seed.ts',
    },

    datasource: {
        url: process.env.DATABASE_URL!
    },

})
