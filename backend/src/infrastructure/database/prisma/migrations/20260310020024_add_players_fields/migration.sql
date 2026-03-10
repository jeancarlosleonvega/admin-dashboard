-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "num_players" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "venue_schedules" ADD COLUMN     "players_per_slot" INTEGER;
