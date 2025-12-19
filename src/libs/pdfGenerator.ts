// PDF Generation Utility for Incline Gym Management System
// Generates branded PDFs for receipts, invoices, and payslips

interface PDFGenerationOptions {
  tenantId: string
  branchId?: string
  logo?: string
  companyName: string
  companyAddress?: string
  companyPhone?: string
  companyEmail?: string
  gstNumber?: string
}

interface ReceiptData {
  receiptNumber: string
  date: Date
  customerName?: string
  items: Array<{
    name: string
    quantity: number
    price: number
    discount?: number
    total: number
  }>
  subtotal: number
  tax: number
  grandTotal: number
  paymentMethod: string
}

interface InvoiceData {
  invoiceNumber: string
  invoiceDate: Date
  dueDate: Date
  customerName: string
  customerEmail?: string
  customerPhone?: string
  customerAddress?: string
  customerGstin?: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    taxRate: number
    total: number
  }>
  subtotal: number
  cgst: number
  sgst: number
  igst: number
  total: number
  notes?: string
}

interface PayslipData {
  payslipNumber: string
  employeeName: string
  employeeId: string
  designation?: string
  month: string
  year: number
  earnings: Array<{ description: string; amount: number }>
  deductions: Array<{ description: string; amount: number }>
  grossSalary: number
  totalDeductions: number
  netSalary: number
  bankAccount?: string
}

/**
 * PDF Generator Service
 * Generates professional PDFs with tenant branding for receipts, invoices, and payslips
 * 
 * NOTE: This is a simplified HTML-to-PDF implementation
 * For production, consider using libraries like puppeteer, pdfkit, or jspdf
 */
export class PDFGenerator {
  constructor(private options: PDFGenerationOptions) {}

  /**
   * Generate receipt PDF HTML
   * Returns HTML string that can be converted to PDF
   */
  async generateReceiptHTML(data: ReceiptData): Promise<string> {
    const { companyName, companyAddress, companyPhone, companyEmail, gstNumber, logo } = this.options

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .logo { max-width: 150px; margin-bottom: 10px; }
    .company-info { font-size: 12px; color: #666; }
    .receipt-title { font-size: 24px; font-weight: bold; margin: 20px 0; }
    .receipt-meta { margin-bottom: 20px; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th { background: #f0f0f0; padding: 10px; text-align: left; border: 1px solid #ddd; }
    .items-table td { padding: 10px; border: 1px solid #ddd; }
    .totals { margin-top: 20px; text-align: right; }
    .totals-row { padding: 5px 0; }
    .grand-total { font-size: 18px; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    ${logo ? `<img src="${logo}" class="logo" alt="Logo">` : ''}
    <h1>${companyName}</h1>
    <div class="company-info">
      ${companyAddress ? `<div>${companyAddress}</div>` : ''}
      ${companyPhone ? `<div>Phone: ${companyPhone}</div>` : ''}
      ${companyEmail ? `<div>Email: ${companyEmail}</div>` : ''}
      ${gstNumber ? `<div>GSTIN: ${gstNumber}</div>` : ''}
    </div>
  </div>

  <div class="receipt-title">RECEIPT</div>

  <div class="receipt-meta">
    <div><strong>Receipt No:</strong> ${data.receiptNumber}</div>
    <div><strong>Date:</strong> ${data.date.toLocaleDateString()}</div>
    ${data.customerName ? `<div><strong>Customer:</strong> ${data.customerName}</div>` : ''}
    <div><strong>Payment Method:</strong> ${data.paymentMethod}</div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Discount</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>₹${item.price.toFixed(2)}</td>
          <td>${item.discount ? item.discount + '%' : '-'}</td>
          <td>₹${item.total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><strong>Subtotal:</strong> ₹${data.subtotal.toFixed(2)}</div>
    <div class="totals-row"><strong>Tax (GST):</strong> ₹${data.tax.toFixed(2)}</div>
    <div class="totals-row grand-total"><strong>Grand Total:</strong> ₹${data.grandTotal.toFixed(2)}</div>
  </div>

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>This is a computer-generated receipt and does not require a signature.</p>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate invoice PDF HTML
   */
  async generateInvoiceHTML(data: InvoiceData): Promise<string> {
    const { companyName, companyAddress, companyPhone, companyEmail, gstNumber, logo } = this.options

    const totalTax = data.cgst + data.sgst + data.igst

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .logo { max-width: 120px; }
    .company-info { text-align: right; font-size: 12px; }
    .invoice-title { font-size: 28px; font-weight: bold; text-align: center; margin: 20px 0; }
    .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 30px; }
    .bill-to { flex: 1; }
    .invoice-details { flex: 1; text-align: right; }
    .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .items-table th { background: #f0f0f0; padding: 12px; text-align: left; border: 1px solid #ddd; }
    .items-table td { padding: 12px; border: 1px solid #ddd; }
    .tax-breakdown { margin-top: 20px; text-align: right; }
    .totals { margin-top: 20px; text-align: right; font-size: 14px; }
    .totals-row { padding: 5px 0; }
    .grand-total { font-size: 20px; font-weight: bold; margin-top: 10px; padding-top: 10px; border-top: 2px solid #333; }
    .notes { margin-top: 30px; font-size: 12px; color: #666; }
    .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      ${logo ? `<img src="${logo}" class="logo" alt="Logo">` : ''}
      <h2>${companyName}</h2>
    </div>
    <div class="company-info">
      ${companyAddress ? `<div>${companyAddress}</div>` : ''}
      ${companyPhone ? `<div>Phone: ${companyPhone}</div>` : ''}
      ${companyEmail ? `<div>Email: ${companyEmail}</div>` : ''}
      ${gstNumber ? `<div><strong>GSTIN:</strong> ${gstNumber}</div>` : ''}
    </div>
  </div>

  <div class="invoice-title">TAX INVOICE</div>

  <div class="invoice-meta">
    <div class="bill-to">
      <h3>Bill To:</h3>
      <div><strong>${data.customerName}</strong></div>
      ${data.customerAddress ? `<div>${data.customerAddress}</div>` : ''}
      ${data.customerPhone ? `<div>Phone: ${data.customerPhone}</div>` : ''}
      ${data.customerEmail ? `<div>Email: ${data.customerEmail}</div>` : ''}
      ${data.customerGstin ? `<div>GSTIN: ${data.customerGstin}</div>` : ''}
    </div>
    <div class="invoice-details">
      <div><strong>Invoice No:</strong> ${data.invoiceNumber}</div>
      <div><strong>Invoice Date:</strong> ${data.invoiceDate.toLocaleDateString()}</div>
      <div><strong>Due Date:</strong> ${data.dueDate.toLocaleDateString()}</div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Unit Price</th>
        <th>Tax Rate</th>
        <th>Amount</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(item => `
        <tr>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>₹${item.unitPrice.toFixed(2)}</td>
          <td>${item.taxRate}%</td>
          <td>₹${item.total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row"><strong>Subtotal:</strong> ₹${data.subtotal.toFixed(2)}</div>
    ${data.cgst > 0 ? `<div class="totals-row"><strong>CGST:</strong> ₹${data.cgst.toFixed(2)}</div>` : ''}
    ${data.sgst > 0 ? `<div class="totals-row"><strong>SGST:</strong> ₹${data.sgst.toFixed(2)}</div>` : ''}
    ${data.igst > 0 ? `<div class="totals-row"><strong>IGST:</strong> ₹${data.igst.toFixed(2)}</div>` : ''}
    <div class="totals-row"><strong>Total Tax:</strong> ₹${totalTax.toFixed(2)}</div>
    <div class="totals-row grand-total"><strong>Grand Total:</strong> ₹${data.total.toFixed(2)}</div>
  </div>

  ${data.notes ? `<div class="notes"><strong>Notes:</strong><br>${data.notes}</div>` : ''}

  <div class="footer">
    <p>Thank you for your business!</p>
    <p><strong>Payment Terms:</strong> Payment is due by ${data.dueDate.toLocaleDateString()}</p>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Generate payslip PDF HTML
   */
  async generatePayslipHTML(data: PayslipData): Promise<string> {
    const { companyName, companyAddress, logo } = this.options

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
    .logo { max-width: 150px; margin-bottom: 10px; }
    .payslip-title { font-size: 24px; font-weight: bold; margin: 20px 0; text-align: center; }
    .employee-info { display: flex; justify-content: space-between; margin-bottom: 30px; padding: 15px; background: #f9f9f9; border: 1px solid #ddd; }
    .salary-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .salary-table th { background: #333; color: white; padding: 12px; text-align: left; }
    .salary-table td { padding: 10px; border-bottom: 1px solid #ddd; }
    .totals-section { display: flex; justify-content: space-between; margin-top: 20px; }
    .total-box { flex: 1; padding: 15px; margin: 0 10px; background: #f0f0f0; text-align: center; border-radius: 5px; }
    .net-salary { background: #4CAF50; color: white; font-size: 20px; font-weight: bold; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    ${logo ? `<img src="${logo}" class="logo" alt="Logo">` : ''}
    <h1>${companyName}</h1>
    ${companyAddress ? `<div style="font-size: 12px; color: #666;">${companyAddress}</div>` : ''}
  </div>

  <div class="payslip-title">SALARY SLIP</div>

  <div class="employee-info">
    <div>
      <div><strong>Employee Name:</strong> ${data.employeeName}</div>
      <div><strong>Employee ID:</strong> ${data.employeeId}</div>
      ${data.designation ? `<div><strong>Designation:</strong> ${data.designation}</div>` : ''}
    </div>
    <div style="text-align: right;">
      <div><strong>Month/Year:</strong> ${data.month} ${data.year}</div>
      <div><strong>Payslip No:</strong> ${data.payslipNumber}</div>
      ${data.bankAccount ? `<div><strong>Bank A/C:</strong> ${data.bankAccount}</div>` : ''}
    </div>
  </div>

  <table class="salary-table">
    <thead>
      <tr>
        <th colspan="2">EARNINGS</th>
        <th colspan="2">DEDUCTIONS</th>
      </tr>
    </thead>
    <tbody>
      ${Math.max(data.earnings.length, data.deductions.length) > 0 
        ? Array.from({ length: Math.max(data.earnings.length, data.deductions.length) }).map((_, idx) => `
          <tr>
            <td>${data.earnings[idx]?.description || ''}</td>
            <td style="text-align: right;">${data.earnings[idx] ? '₹' + data.earnings[idx].amount.toFixed(2) : ''}</td>
            <td>${data.deductions[idx]?.description || ''}</td>
            <td style="text-align: right;">${data.deductions[idx] ? '₹' + data.deductions[idx].amount.toFixed(2) : ''}</td>
          </tr>
        `).join('')
        : '<tr><td colspan="4">No data</td></tr>'}
      <tr style="font-weight: bold; background: #f0f0f0;">
        <td>GROSS SALARY</td>
        <td style="text-align: right;">₹${data.grossSalary.toFixed(2)}</td>
        <td>TOTAL DEDUCTIONS</td>
        <td style="text-align: right;">₹${data.totalDeductions.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  <div class="totals-section">
    <div class="total-box">
      <div style="font-size: 14px; margin-bottom: 5px;">Gross Salary</div>
      <div style="font-size: 18px; font-weight: bold;">₹${data.grossSalary.toFixed(2)}</div>
    </div>
    <div class="total-box">
      <div style="font-size: 14px; margin-bottom: 5px;">Total Deductions</div>
      <div style="font-size: 18px; font-weight: bold;">₹${data.totalDeductions.toFixed(2)}</div>
    </div>
    <div class="total-box net-salary">
      <div style="font-size: 14px; margin-bottom: 5px;">NET SALARY</div>
      <div style="font-size: 24px; font-weight: bold;">₹${data.netSalary.toFixed(2)}</div>
    </div>
  </div>

  <div class="footer">
    <p>This is a computer-generated payslip and does not require a signature.</p>
    <p><em>Confidential Document - For Official Use Only</em></p>
  </div>
</body>
</html>
    `.trim()
  }
}
