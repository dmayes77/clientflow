"use client";

import { cn } from "@/lib/utils";
import { formatDollars, getStatusInfo } from "@/lib/hooks/use-invoice-data";
import { Badge } from "@/components/ui/badge";
import { Ticket, CalendarDays } from "lucide-react";
import { format } from "date-fns";

/**
 * InvoiceTemplate - Unified invoice rendering component
 *
 * Use this component for consistent invoice display across:
 * - Form preview (InvoiceForm.jsx)
 * - Preview sheet (InvoicesList.jsx)
 * - Public invoice page
 * - Email templates (via server-side rendering)
 *
 * @param {Object} props
 * @param {Object} props.data - Normalized invoice data from useInvoiceData/normalizeInvoiceData
 * @param {string} props.variant - Display variant: "full" (default), "compact", "preview"
 * @param {boolean} props.showStatus - Show status badge (default: true)
 * @param {boolean} props.showHeader - Show invoice header with business info (default: true)
 * @param {boolean} props.showBooking - Show linked booking info (default: true)
 * @param {string} props.className - Additional CSS classes
 */
export function InvoiceTemplate({
  data,
  variant = "full",
  showStatus = true,
  showHeader = true,
  showBooking = true,
  className = "",
}) {
  if (!data) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No invoice data available
      </div>
    );
  }

  const isCompact = variant === "compact";
  const isPreview = variant === "preview";
  const statusInfo = getStatusInfo(data.status);

  return (
    <div className={cn("bg-white", className)}>
      {/* Full/Preview variant */}
      {!isCompact && (
        <div className="p-8 space-y-6">
          {/* Invoice Header */}
          {showHeader && (
            <div className="flex justify-between items-start pb-6 border-b">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">INVOICE</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {data.invoiceNumber}
                </p>
              </div>
              <div className="text-right">
                {showStatus && (
                  <Badge className={cn("mb-2", statusInfo.bgClass)}>
                    {statusInfo.label}
                  </Badge>
                )}
                <p className="font-semibold text-gray-900">{data.businessName || "Your Business"}</p>
                {data.businessEmail && (
                  <p className="text-sm text-muted-foreground mt-1">{data.businessEmail}</p>
                )}
                {data.businessPhone && (
                  <p className="text-sm text-muted-foreground">{data.businessPhone}</p>
                )}
                {data.businessAddress && (
                  <p className="text-sm text-muted-foreground">{data.businessAddress}</p>
                )}
              </div>
            </div>
          )}

          {/* Bill To & Invoice Details */}
          <div className="grid grid-cols-2 gap-6 pb-6 border-b">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Bill To</p>
              <p className="font-semibold text-gray-900">{data.contactName || "Select a contact"}</p>
              {data.contactEmail && <p className="text-sm text-muted-foreground mt-1">{data.contactEmail}</p>}
              {data.contactAddress && <p className="text-sm text-muted-foreground mt-1">{data.contactAddress}</p>}
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-medium">{data.issueDate || "—"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">{data.dueDate || "—"}</span>
                </div>
                {data.sentAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sent:</span>
                    <span className="font-medium">{data.sentAt}</span>
                  </div>
                )}
                {data.paidAt && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Paid:</span>
                    <span className="font-medium">{data.paidAt}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Linked Booking */}
          {showBooking && data.booking && (
            <div className="flex items-center gap-3 pb-6 border-b">
              <div className="size-10 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                <CalendarDays className="size-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Linked Booking</p>
                <p className="text-sm font-medium">
                  {format(new Date(data.booking.scheduledAt), "EEEE, MMM d, yyyy")}
                </p>
                {(data.booking.service?.name || data.booking.package?.name) && (
                  <p className="text-xs text-muted-foreground">
                    {data.booking.service?.name || data.booking.package?.name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div>
            <table className="w-full">
              <thead className="border-b-2">
                <tr className="text-left">
                  <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase">Description</th>
                  <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase text-center">Qty</th>
                  <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase text-right">Rate</th>
                  <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.lineItems.map((item, index) => (
                  <tr key={index} className={item.isDiscount ? "text-red-600" : ""}>
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{item.description || "—"}</p>
                      {item.memo && <p className="text-xs text-gray-500">{item.memo}</p>}
                    </td>
                    <td className="py-3 text-center text-gray-700">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-700">
                      {item.isDiscount ? "-" : ""}{formatDollars(item.unitPrice)}
                    </td>
                    <td className="py-3 text-right font-medium text-gray-900">
                      {item.isDiscount ? "-" : ""}{formatDollars(Math.abs(item.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <InvoiceTotals data={data} />

          {/* Notes & Terms */}
          {(data.notes || data.terms) && (
            <div className="pt-6 border-t space-y-4">
              {data.notes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Notes</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.notes}</p>
                </div>
              )}
              {data.terms && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Terms & Conditions</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{data.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Compact variant (for preview sheet) */}
      {isCompact && (
        <div className="space-y-4">
          {/* Line Items */}
          <div>
            <h4 className="text-sm font-semibold mb-2">Line Items</h4>
            <div className="space-y-2">
              {data.lineItems
                .filter((item) => !item.description?.toLowerCase().includes("deposit"))
                .map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex justify-between items-start text-sm",
                      item.isDiscount && "text-red-600"
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.description || "Item"}</p>
                      {item.memo && <p className="text-xs text-muted-foreground">{item.memo}</p>}
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatDollars(item.unitPrice)}
                        </p>
                      )}
                    </div>
                    <span className="font-medium ml-2">
                      {item.isDiscount ? "-" : ""}{formatDollars(Math.abs(item.amount))}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Totals */}
          <InvoiceTotals data={data} compact />
        </div>
      )}
    </div>
  );
}

/**
 * InvoiceTotals - Reusable totals section
 */
export function InvoiceTotals({ data, compact = false }) {
  if (!data) return null;

  const containerClass = compact
    ? "space-y-2"
    : "flex justify-end pt-6 border-t";

  const wrapperClass = compact ? "" : "w-64 space-y-2";

  return (
    <div className={containerClass}>
      <div className={wrapperClass}>
        {/* Subtotal */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span className="font-medium">{formatDollars(data.subtotal)}</span>
        </div>

        {/* Line Discounts */}
        {data.lineDiscounts > 0 && (
          <div className="flex justify-between text-sm text-red-600">
            <span>Discounts:</span>
            <span>-{formatDollars(data.lineDiscounts)}</span>
          </div>
        )}

        {/* Coupons */}
        {data.coupons?.map((coupon) => (
          <div key={coupon.id} className="flex justify-between text-sm text-green-600">
            <span className="flex items-center gap-1">
              <Ticket className="h-3 w-3" />
              Coupon ({coupon.code})
            </span>
            <span>-{formatDollars(coupon.discountAmount)}</span>
          </div>
        ))}

        {/* Tax */}
        {data.taxRate > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax ({data.taxRate}%):</span>
            <span className="font-medium">{formatDollars(data.taxAmount)}</span>
          </div>
        )}

        {/* Total */}
        <div className={cn(
          "flex justify-between font-bold",
          compact ? "pt-2 border-t" : "pt-3 border-t text-lg"
        )}>
          <span>Total:</span>
          <span>{formatDollars(data.total)}</span>
        </div>

        {/* Deposit */}
        {data.depositPercent > 0 && (
          <div className={cn(
            "flex justify-between text-sm",
            compact ? "pt-2 border-t" : ""
          )}>
            <span className={data.depositPaid ? "text-green-600" : "text-blue-600"}>
              {data.depositPaid ? "✓ Deposit Paid" : `Deposit Due (${data.depositPercent}%)`}:
            </span>
            <span className={data.depositPaid ? "text-green-600" : "text-blue-600"}>
              {data.depositPaid ? `-${formatDollars(data.depositAmount)}` : formatDollars(data.depositAmount)}
            </span>
          </div>
        )}

        {/* Amount Paid (if partial payment) */}
        {data.amountPaid > 0 && data.status !== "paid" && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Amount Paid:</span>
            <span>-{formatDollars(data.amountPaid)}</span>
          </div>
        )}

        {/* Balance Due */}
        {data.balanceDue > 0 && data.status !== "paid" && (
          <div className={cn(
            "flex justify-between font-medium",
            compact ? "pt-2 border-t" : "pt-2 border-t text-lg"
          )}>
            <span>Balance Due:</span>
            <span>{formatDollars(data.balanceDue)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * InvoiceHeader - Standalone header component
 */
export function InvoiceHeader({ data, showStatus = true }) {
  if (!data) return null;
  const statusInfo = getStatusInfo(data.status);

  return (
    <div className="flex justify-between items-start">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
        <p className="text-sm text-muted-foreground">{data.invoiceNumber}</p>
      </div>
      {showStatus && (
        <Badge className={statusInfo.bgClass}>{statusInfo.label}</Badge>
      )}
    </div>
  );
}

/**
 * InvoiceLineItems - Standalone line items table
 */
export function InvoiceLineItems({ items = [], compact = false }) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">No line items</p>
    );
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              "flex justify-between items-start text-sm",
              item.isDiscount && "text-red-600"
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.description || "Item"}</p>
              {item.memo && <p className="text-xs text-muted-foreground">{item.memo}</p>}
              {item.quantity > 1 && (
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatDollars(item.unitPrice)}
                </p>
              )}
            </div>
            <span className="font-medium ml-2">
              {item.isDiscount ? "-" : ""}{formatDollars(Math.abs(item.amount))}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead className="border-b-2">
        <tr className="text-left">
          <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase">Description</th>
          <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase text-center">Qty</th>
          <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase text-right">Rate</th>
          <th className="pb-3 text-xs font-semibold text-muted-foreground uppercase text-right">Amount</th>
        </tr>
      </thead>
      <tbody className="divide-y">
        {items.map((item, index) => (
          <tr key={index} className={item.isDiscount ? "text-red-600" : ""}>
            <td className="py-3">
              <p className="font-medium text-gray-900">{item.description || "—"}</p>
              {item.memo && <p className="text-xs text-gray-500">{item.memo}</p>}
            </td>
            <td className="py-3 text-center text-gray-700">{item.quantity}</td>
            <td className="py-3 text-right text-gray-700">
              {item.isDiscount ? "-" : ""}{formatDollars(item.unitPrice)}
            </td>
            <td className="py-3 text-right font-medium text-gray-900">
              {item.isDiscount ? "-" : ""}{formatDollars(Math.abs(item.amount))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default InvoiceTemplate;
