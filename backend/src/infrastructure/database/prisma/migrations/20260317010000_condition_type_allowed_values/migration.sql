-- AlterTable: condition_types — agregar allowed_values e is_system
ALTER TABLE "condition_types" ADD COLUMN "allowed_values" JSONB;
ALTER TABLE "condition_types" ADD COLUMN "is_system" BOOLEAN NOT NULL DEFAULT false;

-- Marcar tipos de sistema y setear sus valores
UPDATE "condition_types"
SET "is_system" = true,
    "allowed_values" = '[{"value":"MALE","label":"Masculino"},{"value":"FEMALE","label":"Femenino"}]'::jsonb
WHERE "key" = 'sex';

UPDATE "condition_types"
SET "is_system" = true
WHERE "key" = 'membership_plan';
