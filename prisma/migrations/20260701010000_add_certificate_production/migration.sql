-- CreateTable
CREATE TABLE "certificate_productions" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "courseCatalogId" INTEGER NOT NULL,
    "producedAt" TIMESTAMP(3),
    "producedById" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificate_productions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "certificate_productions_producedAt_idx" ON "certificate_productions"("producedAt");

-- CreateIndex
CREATE UNIQUE INDEX "certificate_productions_userId_courseCatalogId_key" ON "certificate_productions"("userId", "courseCatalogId");

-- AddForeignKey
ALTER TABLE "certificate_productions" ADD CONSTRAINT "certificate_productions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_productions" ADD CONSTRAINT "certificate_productions_courseCatalogId_fkey" FOREIGN KEY ("courseCatalogId") REFERENCES "course_catalogs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certificate_productions" ADD CONSTRAINT "certificate_productions_producedById_fkey" FOREIGN KEY ("producedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
