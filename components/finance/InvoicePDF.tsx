'use client'

/**
 * Invoice PDF renderer using @react-pdf/renderer.
 * Renders a professional, branded invoice as a downloadable PDF.
 *
 * Usage:
 *   import { downloadInvoicePDF } from '@/components/finance/InvoicePDF'
 *   await downloadInvoicePDF(invoice, company)
 */

import {
  Document, Page, Text, View, StyleSheet,
  Font, pdf, Image,
} from '@react-pdf/renderer'
import type { InvoiceWithDetails } from '@/types/finance'
import type { Company } from '@/types/company'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { INVOICE_STATUS_LABELS } from '@/types/finance'

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily:      'Helvetica',
    fontSize:        10,
    color:           '#111827',
    backgroundColor: '#ffffff',
    paddingTop:      48,
    paddingBottom:   48,
    paddingLeft:     56,
    paddingRight:    56,
  },
  // Header
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'flex-start',
    marginBottom:    32,
  },
  companyName: {
    fontSize:   18,
    fontFamily: 'Helvetica-Bold',
    color:      '#111827',
  },
  companyMeta: {
    fontSize: 9,
    color:    '#6B7280',
    marginTop: 4,
    lineHeight: 1.5,
  },
  invoiceLabel: {
    fontSize:   22,
    fontFamily: 'Helvetica-Bold',
    color:      '#2563EB',
    textAlign:  'right',
  },
  invoiceNumber: {
    fontSize:  11,
    color:     '#6B7280',
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'Helvetica',
  },
  statusBadge: {
    marginTop:        6,
    alignSelf:        'flex-end',
    paddingHorizontal: 8,
    paddingVertical:  3,
    borderRadius:     12,
    backgroundColor:  '#DBEAFE',
  },
  statusText: {
    fontSize:   8,
    fontFamily: 'Helvetica-Bold',
    color:      '#1D4ED8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Divider
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom:      24,
  },
  // Bill to / dates row
  metaRow: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginBottom:   32,
    gap:            16,
  },
  metaBlock: { flex: 1 },
  metaLabel: {
    fontSize:      8,
    fontFamily:    'Helvetica-Bold',
    color:         '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  6,
  },
  metaValue: {
    fontSize:   10,
    fontFamily: 'Helvetica-Bold',
    color:      '#111827',
    lineHeight: 1.5,
  },
  metaSub: {
    fontSize:  9,
    color:     '#6B7280',
    lineHeight: 1.5,
  },
  // Table
  table: { marginBottom: 24 },
  tableHeader: {
    flexDirection:   'row',
    backgroundColor: '#F9FAFB',
    borderTopWidth:  1,
    borderTopColor:  '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection:    'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical:  9,
    paddingHorizontal: 4,
  },
  colDesc:  { flex: 4, fontSize: 9, color: '#374151' },
  colQty:   { flex: 1, fontSize: 9, color: '#374151', textAlign: 'right' },
  colPrice: { flex: 2, fontSize: 9, color: '#374151', textAlign: 'right' },
  colTax:   { flex: 1, fontSize: 9, color: '#374151', textAlign: 'right' },
  colAmt:   { flex: 2, fontSize: 9, color: '#374151', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  colHeaderText: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6B7280', textTransform: 'uppercase' },
  // Totals
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  totalsLabel: { width: 120, fontSize: 9, color: '#6B7280', textAlign: 'right', paddingRight: 12 },
  totalsValue: { width: 100, fontSize: 9, color: '#374151', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totalFinalLabel: { width: 120, fontSize: 11, color: '#111827', textAlign: 'right', paddingRight: 12, fontFamily: 'Helvetica-Bold' },
  totalFinalValue: { width: 100, fontSize: 11, color: '#2563EB', textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totalFinalRow: {
    flexDirection:  'row',
    justifyContent: 'flex-end',
    marginTop:      8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop:     8,
  },
  // Notes / Terms
  notesSection: { marginTop: 32, flexDirection: 'row', gap: 24 },
  notesBlock:   { flex: 1 },
  notesLabel:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
  notesText:    { fontSize: 9, color: '#6B7280', lineHeight: 1.6 },
  // Footer
  footer: {
    position:   'absolute',
    bottom:     32,
    left:       56,
    right:      56,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#9CA3AF' },
})

// ─────────────────────────────────────────
// PDF Document component
// ─────────────────────────────────────────
function InvoicePDFDocument({
  invoice,
  company,
}: {
  invoice: InvoiceWithDetails
  company: Company
}) {
  const addr = company.address as Record<string, string> | null
  const bank = company.bank_details as Record<string, string> | null

  return (
    <Document
      title={`Invoice ${invoice.number}`}
      author={company.name}
      subject="Invoice"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            {company.logo_url && (
              <Image src={company.logo_url} style={{ width: 48, height: 48, marginBottom: 8, borderRadius: 8 }} />
            )}
            <Text style={s.companyName}>{company.name}</Text>
            {company.tax_id && (
              <Text style={s.companyMeta}>Tax ID: {company.tax_id}</Text>
            )}
            {addr?.street && (
              <Text style={s.companyMeta}>
                {[addr.street, addr.city, addr.state, addr.country].filter(Boolean).join(', ')}
              </Text>
            )}
          </View>
          <View>
            <Text style={s.invoiceLabel}>INVOICE</Text>
            <Text style={s.invoiceNumber}>{invoice.number}</Text>
            <View style={s.statusBadge}>
              <Text style={s.statusText}>{INVOICE_STATUS_LABELS[invoice.status]}</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        {/* Bill to + Dates */}
        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Bill to</Text>
            <Text style={s.metaValue}>{invoice.customer?.name}</Text>
            {invoice.customer?.email && <Text style={s.metaSub}>{invoice.customer.email}</Text>}
            {invoice.customer?.phone && <Text style={s.metaSub}>{invoice.customer.phone}</Text>}
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Issue date</Text>
            <Text style={s.metaValue}>{formatDate(invoice.issue_date)}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Due date</Text>
            <Text style={s.metaValue}>{formatDate(invoice.due_date)}</Text>
          </View>
          {invoice.currency !== company.currency && (
            <View style={s.metaBlock}>
              <Text style={s.metaLabel}>Exchange rate</Text>
              <Text style={s.metaValue}>
                1 {company.currency} = {invoice.exchange_rate} {invoice.currency}
              </Text>
            </View>
          )}
        </View>

        {/* Line items table */}
        <View style={s.table}>
          {/* Table header */}
          <View style={s.tableHeader}>
            <Text style={[s.colDesc,  s.colHeaderText]}>Description</Text>
            <Text style={[s.colQty,   s.colHeaderText]}>Qty</Text>
            <Text style={[s.colPrice, s.colHeaderText]}>Unit price</Text>
            <Text style={[s.colTax,   s.colHeaderText]}>Tax</Text>
            <Text style={[s.colAmt,   s.colHeaderText]}>Amount</Text>
          </View>

          {/* Rows */}
          {invoice.items.map((item, i) => (
            <View key={item.id ?? i} style={s.tableRow}>
              <Text style={s.colDesc}>{item.description}</Text>
              <Text style={s.colQty}>{item.quantity}</Text>
              <Text style={s.colPrice}>{formatCurrency(item.unit_price, invoice.currency)}</Text>
              <Text style={s.colTax}>{item.tax_rate > 0 ? `${item.tax_rate}%` : '—'}</Text>
              <Text style={s.colAmt}>{formatCurrency(item.amount, invoice.currency)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={s.totalsRow}>
          <Text style={s.totalsLabel}>Subtotal</Text>
          <Text style={s.totalsValue}>{formatCurrency(invoice.subtotal, invoice.currency)}</Text>
        </View>
        <View style={s.totalsRow}>
          <Text style={s.totalsLabel}>Tax</Text>
          <Text style={s.totalsValue}>{formatCurrency(invoice.tax_amount, invoice.currency)}</Text>
        </View>
        <View style={s.totalFinalRow}>
          <Text style={s.totalFinalLabel}>Total</Text>
          <Text style={s.totalFinalValue}>{formatCurrency(invoice.total, invoice.currency)}</Text>
        </View>

        {/* Bank details (if present) */}
        {bank?.bank_name && (
          <View style={{ marginTop: 24, padding: 12, backgroundColor: '#F9FAFB', borderRadius: 8 }}>
            <Text style={[s.metaLabel, { marginBottom: 6 }]}>Payment details</Text>
            <Text style={s.metaSub}>Bank: {bank.bank_name}</Text>
            {bank.account_name   && <Text style={s.metaSub}>Account name: {bank.account_name}</Text>}
            {bank.account_number && <Text style={s.metaSub}>Account number: {bank.account_number}</Text>}
            {bank.swift_code     && <Text style={s.metaSub}>SWIFT: {bank.swift_code}</Text>}
            {bank.iban           && <Text style={s.metaSub}>IBAN: {bank.iban}</Text>}
          </View>
        )}

        {/* Notes + Terms */}
        {(invoice.notes || invoice.terms) && (
          <View style={s.notesSection}>
            {invoice.notes && (
              <View style={s.notesBlock}>
                <Text style={s.notesLabel}>Notes</Text>
                <Text style={s.notesText}>{invoice.notes}</Text>
              </View>
            )}
            {invoice.terms && (
              <View style={s.notesBlock}>
                <Text style={s.notesLabel}>Payment terms</Text>
                <Text style={s.notesText}>{invoice.terms}</Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Generated by Kleenah — Built for African business.</Text>
          <Text style={s.footerText}>
            {invoice.number} · {formatDate(new Date().toISOString())}
          </Text>
        </View>
      </Page>
    </Document>
  )
}

// ─────────────────────────────────────────
// Download helper — call from InvoiceDetail
// ─────────────────────────────────────────
export async function downloadInvoicePDF(
  invoice: InvoiceWithDetails,
  company: Company
): Promise<void> {
  const blob = await pdf(
    <InvoicePDFDocument invoice={invoice} company={company} />
  ).toBlob()

  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = `${invoice.number}.pdf`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export { InvoicePDFDocument }
