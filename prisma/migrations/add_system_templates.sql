-- Add system template support to EmailTemplate model
-- Allows marking templates as system-managed (can't be deleted, can be edited)

-- Add isSystem field (defaults to false for existing templates)
ALTER TABLE "EmailTemplate" ADD COLUMN "isSystem" BOOLEAN NOT NULL DEFAULT false;

-- Add systemKey field for identifying system templates
ALTER TABLE "EmailTemplate" ADD COLUMN "systemKey" TEXT;

-- Create unique index on systemKey (allows NULL values, enforces uniqueness for non-NULL)
CREATE UNIQUE INDEX "EmailTemplate_systemKey_key" ON "EmailTemplate"("systemKey") WHERE "systemKey" IS NOT NULL;

-- Create index for fast lookups
CREATE INDEX "EmailTemplate_systemKey_idx" ON "EmailTemplate"("systemKey");

-- Add comments for documentation
COMMENT ON COLUMN "EmailTemplate"."isSystem" IS 'System templates cannot be deleted but can be edited by tenant';
COMMENT ON COLUMN "EmailTemplate"."systemKey" IS 'Unique identifier for system templates (e.g., payment_reminder_gentle)';
