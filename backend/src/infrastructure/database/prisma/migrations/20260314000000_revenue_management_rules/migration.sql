-- CreateEnum
CREATE TYPE "RevenueDayType" AS ENUM ('WEEKDAY', 'FRIDAY', 'WEEKEND', 'HOLIDAY');

-- CreateTable
CREATE TABLE "revenue_time_rules" (
    "id" TEXT NOT NULL,
    "pricing_config_id" TEXT NOT NULL,
    "label" TEXT,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "multiplier" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_time_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_day_rules" (
    "id" TEXT NOT NULL,
    "pricing_config_id" TEXT NOT NULL,
    "day_type" "RevenueDayType" NOT NULL,
    "multiplier" DECIMAL(5,2) NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_day_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_occupancy_rules" (
    "id" TEXT NOT NULL,
    "pricing_config_id" TEXT NOT NULL,
    "min_occupancy" INTEGER NOT NULL,
    "max_occupancy" INTEGER NOT NULL,
    "multiplier" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_occupancy_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revenue_day_rules_pricing_config_id_day_type_key" ON "revenue_day_rules"("pricing_config_id", "day_type");

-- AddForeignKey
ALTER TABLE "revenue_time_rules" ADD CONSTRAINT "revenue_time_rules_pricing_config_id_fkey" FOREIGN KEY ("pricing_config_id") REFERENCES "pricing_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_day_rules" ADD CONSTRAINT "revenue_day_rules_pricing_config_id_fkey" FOREIGN KEY ("pricing_config_id") REFERENCES "pricing_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_occupancy_rules" ADD CONSTRAINT "revenue_occupancy_rules_pricing_config_id_fkey" FOREIGN KEY ("pricing_config_id") REFERENCES "pricing_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
