-- CreateTable
CREATE TABLE "course_invites" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "maxCount" INTEGER NOT NULL,
    "courseOrderId" INTEGER,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_enrollments" (
    "id" SERIAL NOT NULL,
    "inviteId" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "course_invites_token_key" ON "course_invites"("token");

-- CreateIndex
CREATE UNIQUE INDEX "invite_enrollments_inviteId_userId_key" ON "invite_enrollments"("inviteId", "userId");

-- AddForeignKey
ALTER TABLE "course_invites" ADD CONSTRAINT "course_invites_courseOrderId_fkey" FOREIGN KEY ("courseOrderId") REFERENCES "course_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_invites" ADD CONSTRAINT "course_invites_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_enrollments" ADD CONSTRAINT "invite_enrollments_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "course_invites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_enrollments" ADD CONSTRAINT "invite_enrollments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
