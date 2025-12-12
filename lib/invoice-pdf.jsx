import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";

// PDF Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  logo: {
    width: 120,
    maxHeight: 60,
    objectFit: "contain",
  },
  businessInfo: {
    textAlign: "right",
  },
  businessName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  businessText: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 2,
  },
  invoiceTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    marginBottom: 20,
    color: "#1a1a1a",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  infoColumn: {
    width: "45%",
  },
  label: {
    fontSize: 9,
    color: "#666666",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  value: {
    fontSize: 10,
    marginBottom: 2,
    color: "#1a1a1a",
  },
  valueBold: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
    color: "#1a1a1a",
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  tableColDescription: {
    width: "50%",
  },
  tableColQty: {
    width: "15%",
    textAlign: "center",
  },
  tableColPrice: {
    width: "17.5%",
    textAlign: "right",
  },
  tableColTotal: {
    width: "17.5%",
    textAlign: "right",
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableText: {
    fontSize: 10,
    color: "#1a1a1a",
  },
  totalsSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 4,
    width: "40%",
  },
  totalLabel: {
    width: "60%",
    fontSize: 10,
    color: "#666666",
    textAlign: "right",
    paddingRight: 15,
  },
  totalValue: {
    width: "40%",
    fontSize: 10,
    textAlign: "right",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: "#1a1a1a",
    marginTop: 4,
    width: "40%",
  },
  grandTotalLabel: {
    width: "60%",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
    paddingRight: 15,
  },
  grandTotalValue: {
    width: "40%",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    textAlign: "right",
  },
  notes: {
    marginTop: 30,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: "#1a1a1a",
  },
  notesText: {
    fontSize: 9,
    color: "#666666",
    lineHeight: 1.5,
  },
  terms: {
    marginTop: 20,
  },
  termsTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    color: "#1a1a1a",
  },
  termsText: {
    fontSize: 9,
    color: "#666666",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 10,
  },
  badge: {
    position: "absolute",
    top: 40,
    right: 40,
    padding: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  badgePaid: {
    backgroundColor: "#d1fae5",
    color: "#059669",
  },
  badgeOverdue: {
    backgroundColor: "#fee2e2",
    color: "#dc2626",
  },
  badgeDraft: {
    backgroundColor: "#f3f4f6",
    color: "#6b7280",
  },
  badgeSent: {
    backgroundColor: "#dbeafe",
    color: "#2563eb",
  },
});

// Format currency
const formatCurrency = (amount, currency = "usd") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
};

// Get badge style based on status
const getBadgeStyle = (status) => {
  switch (status) {
    case "paid":
      return styles.badgePaid;
    case "overdue":
      return styles.badgeOverdue;
    case "sent":
      return styles.badgeSent;
    default:
      return styles.badgeDraft;
  }
};

// Invoice PDF Document Component
export function InvoiceDocument({ invoice, tenant }) {
  const lineItems = typeof invoice.lineItems === "string"
    ? JSON.parse(invoice.lineItems)
    : invoice.lineItems || [];

  const businessAddress = [
    tenant.businessAddress,
    tenant.businessCity,
    tenant.businessState,
    tenant.businessZip,
    tenant.businessCountry,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Status Badge */}
        <View style={[styles.badge, getBadgeStyle(invoice.status)]}>
          <Text>{invoice.status.toUpperCase()}</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            {tenant.logoUrl ? (
              <Image src={tenant.logoUrl} style={styles.logo} />
            ) : (
              <Text style={styles.businessName}>{tenant.businessName}</Text>
            )}
          </View>
          <View style={styles.businessInfo}>
            {tenant.logoUrl && (
              <Text style={styles.businessName}>{tenant.businessName}</Text>
            )}
            {businessAddress && (
              <Text style={styles.businessText}>{businessAddress}</Text>
            )}
            {tenant.businessPhone && (
              <Text style={styles.businessText}>{tenant.businessPhone}</Text>
            )}
            {tenant.email && (
              <Text style={styles.businessText}>{tenant.email}</Text>
            )}
          </View>
        </View>

        {/* Invoice Title */}
        <Text style={styles.invoiceTitle}>INVOICE</Text>

        {/* Invoice Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoColumn}>
            <Text style={styles.label}>Bill To</Text>
            <Text style={styles.valueBold}>{invoice.contactName}</Text>
            <Text style={styles.value}>{invoice.contactEmail}</Text>
            {invoice.contactAddress && (
              <Text style={styles.value}>{invoice.contactAddress}</Text>
            )}
          </View>
          <View style={styles.infoColumn}>
            <Text style={styles.label}>Invoice Number</Text>
            <Text style={styles.valueBold}>{invoice.invoiceNumber}</Text>

            <Text style={[styles.label, { marginTop: 8 }]}>Issue Date</Text>
            <Text style={styles.value}>
              {format(new Date(invoice.issueDate), "MMMM d, yyyy")}
            </Text>

            <Text style={[styles.label, { marginTop: 8 }]}>Due Date</Text>
            <Text style={styles.valueBold}>
              {format(new Date(invoice.dueDate), "MMMM d, yyyy")}
            </Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.tableColDescription}>
              <Text style={styles.tableHeaderText}>Description</Text>
            </View>
            <View style={styles.tableColQty}>
              <Text style={styles.tableHeaderText}>Qty</Text>
            </View>
            <View style={styles.tableColPrice}>
              <Text style={styles.tableHeaderText}>Price</Text>
            </View>
            <View style={styles.tableColTotal}>
              <Text style={styles.tableHeaderText}>Total</Text>
            </View>
          </View>

          {lineItems.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.tableColDescription}>
                <Text style={styles.tableText}>{item.description}</Text>
              </View>
              <View style={styles.tableColQty}>
                <Text style={styles.tableText}>{item.quantity}</Text>
              </View>
              <View style={styles.tableColPrice}>
                <Text style={styles.tableText}>
                  {formatCurrency(item.unitPrice, invoice.currency)}
                </Text>
              </View>
              <View style={styles.tableColTotal}>
                <Text style={styles.tableText}>
                  {formatCurrency(item.quantity * item.unitPrice, invoice.currency)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoice.subtotal, invoice.currency)}
            </Text>
          </View>

          {invoice.taxAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>
                Tax ({invoice.taxRate}%)
              </Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.taxAmount, invoice.currency)}
              </Text>
            </View>
          )}

          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>
              {formatCurrency(invoice.total, invoice.currency)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Terms */}
        {invoice.terms && (
          <View style={styles.terms}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{invoice.terms}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>
            Thank you for your business! • {tenant.businessName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
