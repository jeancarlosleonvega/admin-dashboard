-- DropForeignKey
ALTER TABLE "schedule_rules" DROP CONSTRAINT "schedule_rules_schedule_id_fkey";

-- CreateTable: venue_operating_hours
CREATE TABLE "venue_operating_hours" (
    "id" TEXT NOT NULL,
    "venue_id" TEXT NOT NULL,
    "days_of_week" INTEGER[],
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,

    CONSTRAINT "venue_operating_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable: membership_plan_sport_prices
CREATE TABLE "membership_plan_sport_prices" (
    "id" TEXT NOT NULL,
    "membership_plan_id" TEXT NOT NULL,
    "sport_type_id" TEXT NOT NULL,
    "base_booking_price" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "membership_plan_sport_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable: schedule_time_ranges
CREATE TABLE "schedule_time_ranges" (
    "id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "days_of_week" INTEGER[],
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "interval_minutes" INTEGER NOT NULL,
    "players_per_slot" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "schedule_time_ranges_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey para tablas nuevas
ALTER TABLE "venue_operating_hours" ADD CONSTRAINT "venue_operating_hours_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "membership_plan_sport_prices" ADD CONSTRAINT "membership_plan_sport_prices_membership_plan_id_fkey" FOREIGN KEY ("membership_plan_id") REFERENCES "membership_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "membership_plan_sport_prices" ADD CONSTRAINT "membership_plan_sport_prices_sport_type_id_fkey" FOREIGN KEY ("sport_type_id") REFERENCES "sport_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "schedule_time_ranges" ADD CONSTRAINT "schedule_time_ranges_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "venue_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "membership_plan_sport_prices_membership_plan_id_sport_type__key" ON "membership_plan_sport_prices"("membership_plan_id", "sport_type_id");

-- Migración de datos: venue_operating_hours desde venues existentes
INSERT INTO venue_operating_hours (id, venue_id, days_of_week, open_time, close_time)
SELECT gen_random_uuid(), v.id,
  CASE WHEN array_length(v.enabled_days, 1) > 0 THEN v.enabled_days ELSE ARRAY[1,2,3,4,5,6,7] END,
  COALESCE(v.open_time, '08:00'),
  COALESCE(v.close_time, '18:00')
FROM venues v
WHERE v.open_time IS NOT NULL OR v.close_time IS NOT NULL OR array_length(v.enabled_days, 1) > 0;

-- Migración de datos: schedule_time_ranges desde venue_schedules existentes
INSERT INTO schedule_time_ranges (id, schedule_id, days_of_week, start_time, end_time, interval_minutes, players_per_slot, active, created_at)
SELECT gen_random_uuid(), vs.id, vs.days_of_week,
  COALESCE(vs.open_time, '08:00'),
  COALESCE(vs.close_time, '18:00'),
  COALESCE(vs.interval_minutes, 60),
  COALESCE(vs.players_per_slot, 4),
  true, now()
FROM venue_schedules vs
WHERE array_length(vs.days_of_week, 1) > 0;

-- Migración de datos: membership_plan_sport_prices desde membership_plans existentes (con base_booking_price > 0)
INSERT INTO membership_plan_sport_prices (id, membership_plan_id, sport_type_id, base_booking_price)
SELECT gen_random_uuid(), mp.id, mp.sport_type_id, mp.base_booking_price
FROM membership_plans mp
WHERE mp.sport_type_id IS NOT NULL AND mp.base_booking_price > 0;

-- Agregar columna time_range_id a schedule_rules temporalmente nullable para poder hacer UPDATE
ALTER TABLE "schedule_rules" ADD COLUMN "time_range_id" TEXT;

-- Migración de datos: actualizar schedule_rules para apuntar al time_range_id correspondiente
UPDATE schedule_rules sr
SET time_range_id = str.id
FROM schedule_time_ranges str
WHERE str.schedule_id = sr.schedule_id;

-- Agregar columna time_range_id a slots
ALTER TABLE "slots" ADD COLUMN "time_range_id" TEXT;

-- Migración de datos: actualizar slots para apuntar al time_range correspondiente
UPDATE slots s
SET time_range_id = str.id
FROM schedule_time_ranges str
WHERE str.schedule_id = s.schedule_id;

-- Ahora que ya migramos, eliminar columnas antiguas de schedule_rules
ALTER TABLE "schedule_rules" DROP COLUMN "base_price",
DROP COLUMN "schedule_id";

-- Hacer time_range_id NOT NULL en schedule_rules (los que no tengan valor quedan con NULL — son rules huérfanas, eliminarlas)
DELETE FROM schedule_rules WHERE time_range_id IS NULL;
ALTER TABLE "schedule_rules" ALTER COLUMN "time_range_id" SET NOT NULL;

-- Agregar price_override en schedule_rules
ALTER TABLE "schedule_rules" ADD COLUMN "price_override" DECIMAL(10,2);

-- AlterTable: venues — eliminar columnas de config
ALTER TABLE "venues" DROP COLUMN "close_time",
DROP COLUMN "enabled_days",
DROP COLUMN "interval_minutes",
DROP COLUMN "open_time",
DROP COLUMN "players_per_slot";

-- AlterTable: venue_schedules — eliminar columnas de slot único
ALTER TABLE "venue_schedules" DROP COLUMN "close_time",
DROP COLUMN "days_of_week",
DROP COLUMN "interval_minutes",
DROP COLUMN "open_time",
DROP COLUMN "players_per_slot",
ALTER COLUMN "start_date" DROP NOT NULL;

-- AlterTable: sport_types — eliminar columnas default
ALTER TABLE "sport_types" DROP COLUMN "default_close_time",
DROP COLUMN "default_enabled_days",
DROP COLUMN "default_interval_minutes",
DROP COLUMN "default_member_price",
DROP COLUMN "default_non_member_price",
DROP COLUMN "default_open_time",
DROP COLUMN "default_players_per_slot";

-- AlterTable: membership_plans — eliminar base_booking_price
ALTER TABLE "membership_plans" DROP COLUMN "base_booking_price";

-- AddForeignKey para schedule_rules -> schedule_time_ranges
ALTER TABLE "schedule_rules" ADD CONSTRAINT "schedule_rules_time_range_id_fkey" FOREIGN KEY ("time_range_id") REFERENCES "schedule_time_ranges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey para slots -> schedule_time_ranges
ALTER TABLE "slots" ADD CONSTRAINT "slots_time_range_id_fkey" FOREIGN KEY ("time_range_id") REFERENCES "schedule_time_ranges"("id") ON DELETE SET NULL ON UPDATE CASCADE;
