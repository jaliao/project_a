-- CreateTable
CREATE TABLE "learning_study_entries" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "courseCatalogId" INTEGER NOT NULL,
    "lessonKey" TEXT NOT NULL,
    "scriptureKey" TEXT NOT NULL,
    "mainTitle" TEXT NOT NULL,
    "subTitle" TEXT,
    "wordReceived" TEXT,
    "application" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_study_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "learning_study_entries_userId_courseCatalogId_lessonKey_scr_idx" ON "learning_study_entries"("userId", "courseCatalogId", "lessonKey", "scriptureKey");

-- AddForeignKey
ALTER TABLE "learning_study_entries" ADD CONSTRAINT "learning_study_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "learning_study_entries" ADD CONSTRAINT "learning_study_entries_courseCatalogId_fkey" FOREIGN KEY ("courseCatalogId") REFERENCES "course_catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
