DO $$
BEGIN
  IF to_regclass('public.form_fields') IS NOT NULL
     AND to_regclass('public.data_controls') IS NULL THEN
    ALTER TABLE "form_fields" RENAME TO "data_controls";
  END IF;

  IF to_regclass('public.form_responses') IS NOT NULL
     AND to_regclass('public.records') IS NULL THEN
    ALTER TABLE "form_responses" RENAME TO "records";
  END IF;

  IF to_regclass('public.form_response_values') IS NOT NULL
     AND to_regclass('public.record_values') IS NULL THEN
    ALTER TABLE "form_response_values" RENAME TO "record_values";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'data_controls'
      AND column_name = 'field_key'
  ) THEN
    ALTER TABLE "data_controls" RENAME COLUMN "field_key" TO "control_key";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'record_values'
      AND column_name = 'response_id'
  ) THEN
    ALTER TABLE "record_values" RENAME COLUMN "response_id" TO "record_id";
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'record_values'
      AND column_name = 'field_id'
  ) THEN
    ALTER TABLE "record_values" RENAME COLUMN "field_id" TO "data_control_id";
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.records') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_name = 'records'
         AND column_name = 'app_id'
     ) THEN
    ALTER TABLE "records" ADD COLUMN "app_id" TEXT;

    UPDATE "records" AS r
    SET "app_id" = f."app_id"
    FROM "forms" AS f
    WHERE r."form_id" = f."id";

    ALTER TABLE "records" ALTER COLUMN "app_id" SET NOT NULL;
  END IF;
END $$;

ALTER TABLE "apps" ADD CONSTRAINT "apps_name_key" UNIQUE ("name");

ALTER TABLE "forms" ADD CONSTRAINT "forms_app_id_name_key" UNIQUE ("app_id", "name");

ALTER TABLE "data_controls" ADD CONSTRAINT "data_controls_form_id_control_key_key" UNIQUE ("form_id", "control_key");

ALTER TABLE "records"
  ADD CONSTRAINT "records_app_id_fkey"
  FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "FIELDTYPE_new" AS ENUM ('TEXT', 'DATE', 'NUMBER', 'CHECKBOX', 'DROPDOWN');

ALTER TABLE "data_controls"
ALTER COLUMN "type" TYPE "FIELDTYPE_new"
USING (
  CASE
    WHEN "type"::text = 'RADIO' THEN 'TEXT'
    WHEN "type"::text = 'TEXTAREA' THEN 'TEXT'
    WHEN "type"::text = 'CONTACT' THEN 'TEXT'
    WHEN "type"::text = 'GROUP' THEN 'DROPDOWN'
    WHEN "type"::text = 'BUTTON' THEN 'TEXT'
    ELSE "type"::text
  END
)::"FIELDTYPE_new";

ALTER TYPE "FIELDTYPE" RENAME TO "FIELDTYPE_old";
ALTER TYPE "FIELDTYPE_new" RENAME TO "FIELDTYPE";
DROP TYPE "FIELDTYPE_old";
