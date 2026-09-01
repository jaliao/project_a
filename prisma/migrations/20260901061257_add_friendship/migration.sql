-- CreateTable
CREATE TABLE "friendships" (
    "id" SERIAL NOT NULL,
    "ownerId" UUID NOT NULL,
    "friendId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "friendships_ownerId_idx" ON "friendships"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_ownerId_friendId_key" ON "friendships"("ownerId", "friendId");

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
