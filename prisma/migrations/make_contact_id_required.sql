-- Make contactId required on Invoice and Payment models
-- Enforces Contact as the nucleus of all business relationships

-- First, check for any invoices without a contact
-- If any exist, this migration will fail and must be fixed manually
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Invoice" WHERE "contactId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot make contactId required: Found invoices without a contact. Please assign contacts to all invoices first.';
  END IF;
END $$;

-- Check for any payments without a contact
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Payment" WHERE "contactId" IS NULL) THEN
    RAISE EXCEPTION 'Cannot make contactId required: Found payments without a contact. Please assign contacts to all payments first.';
  END IF;
END $$;

-- Make contactId NOT NULL on Invoice
ALTER TABLE "Invoice" ALTER COLUMN "contactId" SET NOT NULL;

-- Make contactId NOT NULL on Payment
ALTER TABLE "Payment" ALTER COLUMN "contactId" SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN "Invoice"."contactId" IS 'Required: Contact is the nucleus of all business relationships';
COMMENT ON COLUMN "Payment"."contactId" IS 'Required: Contact is the nucleus of all business relationships';
