import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Format cents to dollars
const formatCurrency = (cents, currency = "usd") => {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
};

// Format date
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#333",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  companyInfo: {
    maxWidth: 200,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  companyDetails: {
    fontSize: 9,
    color: "#666",
    lineHeight: 1.5,
  },
  invoiceTitle: {
    textAlign: "right",
  },
  invoiceLabel: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 11,
    color: "#666",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-end",
    marginTop: 8,
  },
  statusPaid: {
    backgroundColor: "#dcfce7",
    color: "#166534",
  },
  statusDraft: {
    backgroundColor: "#f3f4f6",
    color: "#4b5563",
  },
  statusSent: {
    backgroundColor: "#dbeafe",
    color: "#1e40af",
  },
  statusOverdue: {
    backgroundColor: "#fee2e2",
    color: "#991b1b",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    marginVertical: 20,
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  infoBlock: {
    maxWidth: 200,
  },
  infoLabel: {
    fontSize: 9,
    color: "#6b7280",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: "#374151",
  },
  table: {
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    padding: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    padding: 10,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  tableRowAlt: {
    backgroundColor: "#fafafa",
  },
  tableCell: {
    fontSize: 10,
    color: "#374151",
  },
  colDescription: {
    flex: 3,
  },
  colQty: {
    flex: 1,
    textAlign: "center",
  },
  colRate: {
    flex: 1,
    textAlign: "right",
  },
  colAmount: {
    flex: 1,
    textAlign: "right",
  },
  totalsSection: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 30,
  },
  totalsBox: {
    width: 200,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  totalLabel: {
    fontSize: 10,
    color: "#6b7280",
  },
  totalValue: {
    fontSize: 10,
    color: "#374151",
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: "#e5e7eb",
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1a1a1a",
  },
  grandTotalValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2563eb",
  },
  notesSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f9fafb",
    borderRadius: 4,
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  notesText: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#9ca3af",
  },
});

// Get status style
const getStatusStyle = (status) => {
  switch (status) {
    case "paid":
      return styles.statusPaid;
    case "sent":
    case "viewed":
      return styles.statusSent;
    case "overdue":
    case "cancelled":
      return styles.statusOverdue;
    default:
      return styles.statusDraft;
  }
};

export function InvoicePDF({ invoice }) {
  const lineItems = invoice.lineItems || [];
  const tenant = invoice.tenant || {};

  // Build company address
  const companyAddress = [
    tenant.businessAddress,
    [tenant.businessCity, tenant.businessState, tenant.businessZip]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>
              {tenant.businessName || tenant.name || "Company Name"}
            </Text>
            <Text style={styles.companyDetails}>
              {companyAddress && `${companyAddress}\n`}
              {tenant.businessPhone && `${tenant.businessPhone}\n`}
              {tenant.email}
            </Text>
          </View>
          <View style={styles.invoiceTitle}>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
            <View style={[styles.statusBadge, getStatusStyle(invoice.status)]}>
              <Text style={styles.statusText}>{invoice.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bill To & Invoice Details */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Bill To</Text>
            <Text style={styles.infoText}>
              {invoice.clientName}
              {"\n"}
              {invoice.clientEmail}
              {invoice.clientAddress && `\n${invoice.clientAddress}`}
            </Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Invoice Details</Text>
            <Text style={styles.infoText}>
              Issue Date: {formatDate(invoice.issueDate)}
              {"\n"}
              Due Date: {formatDate(invoice.dueDate)}
              {invoice.paidAt && `\nPaid: ${formatDate(invoice.paidAt)}`}
            </Text>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDescription]}>
              Description
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colRate]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>

          {/* Table Rows */}
          {lineItems.map((item, index) => (
            <View
              key={index}
              style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
            >
              <Text style={[styles.tableCell, styles.colDescription]}>
                {item.description}
              </Text>
              <Text style={[styles.tableCell, styles.colQty]}>
                {item.quantity}
              </Text>
              <Text style={[styles.tableCell, styles.colRate]}>
                {formatCurrency(item.unitPrice, invoice.currency)}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>
                {formatCurrency(item.amount, invoice.currency)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.subtotal, invoice.currency)}
              </Text>
            </View>
            {invoice.taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%)</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(invoice.taxAmount, invoice.currency)}
                </Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(invoice.total, invoice.currency)}
              </Text>
            </View>
          </View>
        </View>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.terms) && (
          <View style={styles.notesSection}>
            {invoice.notes && (
              <>
                <Text style={styles.notesLabel}>Notes</Text>
                <Text style={styles.notesText}>{invoice.notes}</Text>
              </>
            )}
            {invoice.terms && (
              <>
                <Text style={[styles.notesLabel, { marginTop: invoice.notes ? 10 : 0 }]}>
                  Payment Terms
                </Text>
                <Text style={styles.notesText}>{invoice.terms}</Text>
              </>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Thank you for your business! | Powered by ClientFlow
          </Text>
        </View>
      </Page>
    </Document>
  );
}
