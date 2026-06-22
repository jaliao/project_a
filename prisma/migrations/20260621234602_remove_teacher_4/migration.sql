-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('user', 'teacher_1', 'teacher_2', 'teacher_3', 'admin', 'superadmin');
ALTER TABLE "public"."users" ALTER COLUMN "roles" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "roles" TYPE "UserRole_new"[] USING ("roles"::text::"UserRole_new"[]);
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
ALTER TABLE "users" ALTER COLUMN "roles" SET DEFAULT ARRAY['user']::"UserRole"[];
COMMIT;
