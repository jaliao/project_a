## 1. Seed 補充課程與結業資料

- [x] 1.1 更新 `prisma/seed.ts`：在教會/課程目錄初始化之後，新增「示範課程與結業資料」區塊；以 `courseInvite.count({ where: { createdById: admin.id } }) === 0` 作冪等 guard，建立兩筆 CourseInvite（啟動靈人 catalogId=1、啟動豐盛 catalogId=2，maxCount=1，courseDate='2026/06/01'，startedAt/completedAt=2026-04-02），再為黃國倫建立兩筆 InviteEnrollment（status=approved，graduatedAt=2026-04-02）

## 2. 版本與文件

- [ ] 2.1 `config/version.json` patch 版本號 +1
- [x] 2.2 依 `.ai-rules.md` 更新 `README-AI.md`
