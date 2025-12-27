-- Add Invoice-Payment relationship (many-to-many)
-- Tracks which payments were applied to which invoices and how much

CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "amountApplied" INTEGER NOT NULL, -- Amount of this payment applied to this invoice (in cents)
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "InvoicePayment_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add Payment tags (many-to-many)
-- Allows tagging payments for organization and workflow automation

CREATE TABLE "PaymentTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "paymentId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTag_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PaymentTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique constraints
CREATE UNIQUE INDEX "InvoicePayment_invoiceId_paymentId_key" ON "InvoicePayment"("invoiceId", "paymentId");
CREATE UNIQUE INDEX "PaymentTag_paymentId_tagId_key" ON "PaymentTag"("paymentId", "tagId");

-- Create indexes for better query performance
CREATE INDEX "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");
CREATE INDEX "InvoicePayment_paymentId_idx" ON "InvoicePayment"("paymentId");
CREATE INDEX "PaymentTag_paymentId_idx" ON "PaymentTag"("paymentId");
CREATE INDEX "PaymentTag_tagId_idx" ON "PaymentTag"("tagId");
