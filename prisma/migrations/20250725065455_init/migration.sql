-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('PROSPECT', 'ONGOING', 'CARRIED_OVER', 'COMPLETED', 'HOLD');

-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('TEST', 'LECTURE', 'CONSULTING', 'ACTIVITY', 'ETC', 'REPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "manager_name" TEXT,
    "contact_info" JSONB,
    "status" "DealStatus" NOT NULL DEFAULT 'PROSPECT',
    "memo" TEXT,
    "checklists" JSONB,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "type" "ServiceType" NOT NULL,
    "details" JSONB,
    "cost" BIGINT,
    "deal_id" TEXT NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_schedules" (
    "id" TEXT NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "amount" BIGINT NOT NULL,
    "description" TEXT,
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "deal_id" TEXT NOT NULL,

    CONSTRAINT "payment_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_schedules" ADD CONSTRAINT "payment_schedules_deal_id_fkey" FOREIGN KEY ("deal_id") REFERENCES "deals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
