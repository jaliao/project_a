-- CreateTable
CREATE TABLE "course_messages" (
    "id" SERIAL NOT NULL,
    "inviteId" INTEGER NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "parentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "course_messages_inviteId_idx" ON "course_messages"("inviteId");

-- AddForeignKey
ALTER TABLE "course_messages" ADD CONSTRAINT "course_messages_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "course_invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_messages" ADD CONSTRAINT "course_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_messages" ADD CONSTRAINT "course_messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "course_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
