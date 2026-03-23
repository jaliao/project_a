-- CreateEnum
CREATE TYPE "MaterialVersion" AS ENUM ('traditional', 'simplified', 'both');

-- CreateEnum
CREATE TYPE "PurchaseType" AS ENUM ('selfOnly', 'selfAndProxy', 'proxyOnly');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('sevenEleven', 'familyMart', 'delivery');

-- CreateTable
CREATE TABLE "course_orders" (
    "id" SERIAL NOT NULL,
    "buyerNameZh" TEXT NOT NULL,
    "buyerNameEn" TEXT NOT NULL,
    "teacherName" TEXT NOT NULL,
    "churchOrg" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "materialVersion" "MaterialVersion" NOT NULL,
    "purchaseType" "PurchaseType" NOT NULL,
    "studentNames" TEXT,
    "quantity" INTEGER NOT NULL,
    "quantityNote" TEXT,
    "courseDate" TEXT NOT NULL,
    "taxId" TEXT,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "submittedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_orders_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "course_orders" ADD CONSTRAINT "course_orders_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
