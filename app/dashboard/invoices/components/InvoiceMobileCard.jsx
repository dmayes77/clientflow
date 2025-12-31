"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { InvoiceStatusBadge } from "@/components/ui/status-badge";
import { formatCurrency } from "@/lib/formatters";
import {
  User,
  Calendar,
  Send,
  Download,
  Pencil,
  Trash2,
  CreditCard,
  MoreVertical,
  CalendarDays,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Mobile card view for invoices
 * Provides a touch-friendly card layout for invoice items on mobile devices
 */
export function InvoiceMobileCard({
  invoice,
  isSelected,
  onSelect,
  onPreview,
  onEdit,
  onSend,
  onPay,
  onDownload,
  onDelete,
  sendingId,
  className,
}) {
  const canSend = invoice.status === "draft";
  const canPay = ["sent", "viewed", "overdue"].includes(invoice.status);
  const isPaid = invoice.status === "paid";

  return (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-colors active:bg-muted/50",
        isSelected && "ring-2 ring-primary bg-primary/5",
        className
      )}
      onClick={() => onPreview?.(invoice)}
    >
      {/* Top Row: Checkbox, Invoice Number, Status, Menu */}
      <div className="flex items-center gap-3 mb-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => {
            onSelect?.(invoice.id, checked);
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${invoice.invoiceNumber}`}
        />

        <div className="flex-1 min-w-0">
          <span className="font-semibold text-primary">{invoice.invoiceNumber}</span>
        </div>

        <InvoiceStatusBadge status={invoice.status} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canSend && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onSend?.(invoice);
                }}
                disabled={sendingId === invoice.id}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Invoice
              </DropdownMenuItem>
            )}
            {canPay && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onPay?.(invoice);
                }}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Record Payment
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDownload?.(invoice);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(invoice);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(invoice);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Client Info */}
      <div className="flex items-center gap-2 mb-2">
        <User className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{invoice.contactName}</p>
          <p className="text-xs text-muted-foreground truncate">{invoice.contactEmail}</p>
        </div>
      </div>

      {/* Dates Row */}
      <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>Due {format(new Date(invoice.dueDate), "MMM d")}</span>
        </div>
        {invoice.booking && (
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            <span>{format(new Date(invoice.booking.scheduledAt), "MMM d")}</span>
          </div>
        )}
      </div>

      {/* Amount Row */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div>
          <span className="text-xs text-muted-foreground">Total</span>
          <p className="font-bold text-lg">{formatCurrency(invoice.total)}</p>
        </div>

        {/* Balance Due (if not paid) */}
        {!isPaid && invoice.balanceDue > 0 && invoice.balanceDue !== invoice.total && (
          <div className="text-right">
            <span className="text-xs text-muted-foreground">Balance Due</span>
            <p className="font-semibold text-amber-600">{formatCurrency(invoice.balanceDue)}</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          {canSend && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onSend?.(invoice);
              }}
              disabled={sendingId === invoice.id}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
          {canPay && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-green-600"
              onClick={(e) => {
                e.stopPropagation();
                onPay?.(invoice);
              }}
            >
              <CreditCard className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tags (if any, excluding system tags) */}
      {invoice.tags?.filter((t) => !t.isSystem).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t">
          {invoice.tags
            .filter((t) => !t.isSystem)
            .slice(0, 3)
            .map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${tag.color}20` || "#6b728020",
                  color: tag.color || "#6b7280",
                }}
              >
                {tag.name}
              </span>
            ))}
          {invoice.tags.filter((t) => !t.isSystem).length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{invoice.tags.filter((t) => !t.isSystem).length - 3}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Mobile card list for invoices
 */
export function InvoiceMobileCardList({
  invoices,
  selectedIds,
  onSelect,
  onSelectAll,
  onPreview,
  onEdit,
  onSend,
  onPay,
  onDownload,
  onDelete,
  sendingId,
  className,
}) {
  const allSelected = invoices.length > 0 && selectedIds.size === invoices.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < invoices.length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Select All Header */}
      {invoices.length > 0 && (
        <div className="flex items-center gap-2 px-1">
          <Checkbox
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onCheckedChange={(checked) => onSelectAll?.(checked)}
            aria-label="Select all invoices"
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} selected`
              : `${invoices.length} invoice${invoices.length !== 1 ? "s" : ""}`}
          </span>
        </div>
      )}

      {/* Cards */}
      {invoices.map((invoice) => (
        <InvoiceMobileCard
          key={invoice.id}
          invoice={invoice}
          isSelected={selectedIds.has(invoice.id)}
          onSelect={(id, checked) => onSelect?.(id, checked)}
          onPreview={onPreview}
          onEdit={onEdit}
          onSend={onSend}
          onPay={onPay}
          onDownload={onDownload}
          onDelete={onDelete}
          sendingId={sendingId}
        />
      ))}

      {/* Empty State */}
      {invoices.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No invoices found
        </div>
      )}
    </div>
  );
}

export default InvoiceMobileCard;
