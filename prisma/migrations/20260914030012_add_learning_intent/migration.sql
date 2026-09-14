-- CreateEnum
CREATE TYPE "LearningTimePreference" AS ENUM ('weekday_day', 'weekday_night', 'weekend', 'anytime', 'other');

-- CreateTable
CREATE TABLE "learning_intents" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "courseCatalogIds" INTEGER[],
    "timePreferences" "LearningTimePreference"[],
    "otherNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_intents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "learning_intents_userId_key" ON "learning_intents"("userId");

-- AddForeignKey
ALTER TABLE "learning_intents" ADD CONSTRAINT "learning_intents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
