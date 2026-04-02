-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'unspecified');

-- CreateEnum
CREATE TYPE "DisplayNameMode" AS ENUM ('chinese', 'english');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "displayNameMode" "DisplayNameMode" NOT NULL DEFAULT 'chinese',
ADD COLUMN     "englishName" TEXT,
ADD COLUMN     "gender" "Gender" NOT NULL DEFAULT 'unspecified';
