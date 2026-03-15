-- DropForeignKey
ALTER TABLE "revenue_time_rules" DROP CONSTRAINT IF EXISTS "revenue_time_rules_pricing_config_id_fkey";

-- DropForeignKey
ALTER TABLE "revenue_day_rules" DROP CONSTRAINT IF EXISTS "revenue_day_rules_pricing_config_id_fkey";

-- DropForeignKey
ALTER TABLE "revenue_occupancy_rules" DROP CONSTRAINT IF EXISTS "revenue_occupancy_rules_pricing_config_id_fkey";

-- DropTable
DROP TABLE IF EXISTS "revenue_time_rules";

-- DropTable
DROP TABLE IF EXISTS "revenue_day_rules";

-- DropTable
DROP TABLE IF EXISTS "revenue_occupancy_rules";

-- DropEnum
DROP TYPE IF EXISTS "RevenueDayType";

-- CreateEnum
CREATE TYPE "RevenueValueType" AS ENUM ('NUMBER_RANGE', 'TIME_RANGE', 'ENUM');

-- CreateTable
CREATE TABLE "revenue_factor_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value_type" "RevenueValueType" NOT NULL,
    "enum_values" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "enum_labels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "revenue_factor_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_factors" (
    "id" TEXT NOT NULL,
    "pricing_config_id" TEXT NOT NULL,
    "factor_type_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_factors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "revenue_factor_rules" (
    "id" TEXT NOT NULL,
    "factor_id" TEXT NOT NULL,
    "min_value" TEXT,
    "max_value" TEXT,
    "enum_value" TEXT,
    "multiplier" DECIMAL(5,2) NOT NULL,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revenue_factor_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "revenue_factor_types_key_key" ON "revenue_factor_types"("key");

-- CreateIndex
CREATE UNIQUE INDEX "revenue_factors_pricing_config_id_factor_type_id_key" ON "revenue_factors"("pricing_config_id", "factor_type_id");

-- AddForeignKey
ALTER TABLE "revenue_factors" ADD CONSTRAINT "revenue_factors_pricing_config_id_fkey" FOREIGN KEY ("pricing_config_id") REFERENCES "pricing_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_factors" ADD CONSTRAINT "revenue_factors_factor_type_id_fkey" FOREIGN KEY ("factor_type_id") REFERENCES "revenue_factor_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revenue_factor_rules" ADD CONSTRAINT "revenue_factor_rules_factor_id_fkey" FOREIGN KEY ("factor_id") REFERENCES "revenue_factors"("id") ON DELETE CASCADE ON UPDATE CASCADE;
