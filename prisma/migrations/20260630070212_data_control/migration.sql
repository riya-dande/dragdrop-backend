-- AlterTable
ALTER TABLE "data_controls" RENAME CONSTRAINT "form_fields_pkey" TO "data_controls_pkey";

-- AlterTable
ALTER TABLE "record_values" RENAME CONSTRAINT "form_response_values_pkey" TO "record_values_pkey";

-- AlterTable
ALTER TABLE "records" RENAME CONSTRAINT "form_responses_pkey" TO "records_pkey";

-- RenameForeignKey
ALTER TABLE "data_controls" RENAME CONSTRAINT "form_fields_form_id_fkey" TO "data_controls_form_id_fkey";

-- RenameForeignKey
ALTER TABLE "record_values" RENAME CONSTRAINT "form_response_values_field_id_fkey" TO "record_values_data_control_id_fkey";

-- RenameForeignKey
ALTER TABLE "record_values" RENAME CONSTRAINT "form_response_values_response_id_fkey" TO "record_values_record_id_fkey";

-- RenameForeignKey
ALTER TABLE "records" RENAME CONSTRAINT "form_responses_form_id_fkey" TO "records_form_id_fkey";

-- RenameForeignKey
ALTER TABLE "records" RENAME CONSTRAINT "form_responses_submitted_by_fkey" TO "records_submitted_by_fkey";
