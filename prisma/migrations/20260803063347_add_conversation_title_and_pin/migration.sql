-- AlterTable
ALTER TABLE "conversation_participants" ADD COLUMN     "pinnedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "title" TEXT;
