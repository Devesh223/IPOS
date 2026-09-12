"use client";

import React from "react";
import { formatCurrency, formatDate, amountToWordsINR } from "@/lib/utils";

export interface InvoiceDocumentProps {
  invoice: {
    id: string;
    invoiceNumber: string;
    issuedAt?: string | Date | null;
    dueDate?: string | null;
    status: string;
    subtotal: number; // in paise
    taxAmount: number; // in paise
    amount: number; // total in paise
    paidAmount?: number; // in paise
    remainingBalance: number; // in paise
    isInterState?: boolean;
    discountAmount?: number;
    project?: {
      name: string;
    } | null;
    client?: {
      name: string;
      companyName?: string | null;
      email?: string | null;
      phone?: string | null;
      address?: string | null;
      city?: string | null;
      state?: string | null;
      pincode?: string | null;
      gstin?: string | null;
    } | null;
    lineItems?: Array<{
      id: string;
      description: string;
      quantity: number;
      unitAmount: number; // in paise
      taxableAmount: number;
      taxAmount: number;
      totalAmount: number;
    }>;
    paymentSchedule?: Array<{
      phase: string;
      milestone: string;
      percentage: number;
      amount: number;
      status: string;
    }>;
    bankDetails?: {
      bankName: string;
      accountName: string;
      accountNumber: string;
      ifscCode: string;
      upiId: string;
    };
  };
}

export function IndianPixelInvoiceDocument({ invoice }: InvoiceDocumentProps) {
  const lineItems = invoice.lineItems && invoice.lineItems.length > 0 ? invoice.lineItems : [
    {
      id: "li-1",
      description: "UI/UX Design & Studio Brand Identity System",
      quantity: 1,
      unitAmount: Math.round(invoice.subtotal * 0.6),
      taxableAmount: Math.round(invoice.subtotal * 0.6),
      taxAmount: Math.round(invoice.taxAmount * 0.6),
      totalAmount: Math.round(invoice.amount * 0.6),
    },
    {
      id: "li-2",
      description: "Web Application Frontend Component Architecture",
      quantity: 1,
      unitAmount: Math.round(invoice.subtotal * 0.4),
      taxableAmount: Math.round(invoice.subtotal * 0.4),
      taxAmount: Math.round(invoice.taxAmount * 0.4),
      totalAmount: Math.round(invoice.amount * 0.4),
    },
  ];

  const subtotalPaise = invoice.subtotal || lineItems.reduce((acc, item) => acc + item.taxableAmount, 0);
  const totalAmountPaise = invoice.amount || subtotalPaise + (invoice.taxAmount || 0);
  const discountPaise = invoice.discountAmount || 0;
  const taxablePaise = Math.max(0, subtotalPaise - discountPaise);

  const isInterState = invoice.isInterState ?? false;
  const cgstPaise = isInterState ? 0 : Math.round(invoice.taxAmount ? invoice.taxAmount / 2 : taxablePaise * 0.09);
  const sgstPaise = isInterState ? 0 : Math.round(invoice.taxAmount ? invoice.taxAmount / 2 : taxablePaise * 0.09);
  const igstPaise = isInterState ? Math.round(invoice.taxAmount || taxablePaise * 0.18) : 0;

  const amountInWords = amountToWordsINR(totalAmountPaise);

  const paymentSchedule = invoice.paymentSchedule || [
    {
      phase: "Phase 1",
      milestone: "Advance to commence work",
      percentage: 40,
      amount: Math.round(totalAmountPaise * 0.4),
      status: invoice.status === "PAID" ? "Paid" : "Due",
    },
    {
      phase: "Phase 2",
      milestone: "On completion of work",
      percentage: 40,
      amount: Math.round(totalAmountPaise * 0.4),
      status: invoice.status === "PAID" ? "Paid" : "Due",
    },
    {
      phase: "Phase 3",
      milestone: "Before final deliverables are handed over",
      percentage: 20,
      amount: Math.round(totalAmountPaise * 0.2),
      status: invoice.status === "PAID" ? "Paid" : "Due",
    },
  ];

  const bank = invoice.bankDetails || {
    bankName: "HDFC Bank Ltd",
    accountName: "Indian Pixel Design and Tech",
    accountNumber: "50200088992211",
    ifscCode: "HDFC0001234",
    upiId: "indianpixel@hdfcbank",
  };

  const clientName = invoice.client?.companyName || invoice.client?.name || "[Client / Company Name]";
  const clientAddr = invoice.client?.address || "[Client Address Line1]";
  const clientCityState = `${invoice.client?.city || "Chennai"}, ${invoice.client?.state || "Tamil Nadu"} ${invoice.client?.pincode || "600001"}`;
  const clientPhone = invoice.client?.phone || "+91 9876543210";
  const clientEmail = invoice.client?.email || "client@company.com";
  const projectName = invoice.project?.name || "Digital Brand Experience Package";

  return (
    <div className="invoice-print-container bg-white text-slate-900 font-sans p-6 sm:p-10 max-w-4xl mx-auto shadow-2xl rounded-sm print:p-0 print:shadow-none print:max-w-none">
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body * {
            visibility: hidden !important;
          }
          .invoice-print-container,
          .invoice-print-container * {
            visibility: visible !important;
          }
          .invoice-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 24px !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .invoice-page-break {
            page-break-before: always !important;
            break-before: page !important;
          }
        }
      `}</style>

      {/* PAGE 1 */}
      <div className="min-h-[1050px] flex flex-col justify-between pb-8">
        <div className="space-y-6">
          {/* Top Logo & Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <svg width="36" height="36" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0L25.88 14.12L40 20L25.88 25.88L20 40L14.12 25.88L0 20L14.12 14.12L20 0Z" fill="#0D1C18"/>
                <path d="M20 8L23.5 16.5L32 20L23.5 23.5L20 32L16.5 23.5L8 20L16.5 16.5L20 8Z" fill="#F59E0B"/>
              </svg>
              <span className="text-2xl font-bold font-heading text-slate-900 tracking-tight">
                Indian Pixel
              </span>
            </div>
            <div className="text-right">
              <h1 className="text-3xl font-extrabold tracking-widest text-slate-900 font-heading">
                INVOICE
              </h1>
            </div>
          </div>

          {/* FROM & BILL TO Section */}
          <div className="grid grid-cols-2 gap-8 text-xs pt-2">
            <div className="space-y-0.5 text-slate-700">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">FROM</div>
              <div className="font-bold text-slate-900">Indian Pixel Design and Tech</div>
              <div>Chennai, Tamil Nadu</div>
              <div>India</div>
              <div>+91 7585999426</div>
              <div>theindianpixel@gmail.com</div>
              <div>website-indianpixel.vercel.app</div>
              <div className="font-mono text-slate-800">GSTIN: {invoice.client?.gstin || "33AAACI1122K1Z9"}</div>
            </div>

            <div className="space-y-0.5 text-slate-700">
              <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-1">BILL TO</div>
              <div className="font-bold text-slate-900">{clientName}</div>
              <div>{clientAddr}</div>
              <div>{clientCityState}</div>
              <div>{clientPhone}</div>
              <div>{clientEmail}</div>
            </div>
          </div>

          {/* Sage Green Banner Bar */}
          <div className="bg-[#A4B494] rounded-sm p-3.5 text-slate-900 grid grid-cols-4 gap-4 text-xs font-sans">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-800">INVOICE NO.</span>
              <span className="font-bold font-mono text-sm">{invoice.invoiceNumber}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-800">DATE</span>
              <span className="font-bold font-mono text-xs">{invoice.issuedAt ? formatDate(invoice.issuedAt) : "13/09/2026"}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-800">DUE DATE</span>
              <span className="font-bold font-mono text-xs">{invoice.dueDate ? formatDate(invoice.dueDate) : "27/09/2026"}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-800">PROJECT</span>
              <span className="font-bold text-xs truncate block">{projectName}</span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-hidden rounded-sm border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0D1C18] text-white font-mono uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">DESCRIPTION</th>
                  <th className="py-2.5 px-3 text-center">QTY</th>
                  <th className="py-2.5 px-3 text-center">UNIT</th>
                  <th className="py-2.5 px-3 text-right">RATE</th>
                  <th className="py-2.5 px-3 text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {lineItems.map((item, idx) => (
                  <tr key={item.id || idx} className={idx % 2 === 1 ? "bg-[#F9F9F6]" : "bg-white"}>
                    <td className="py-3 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-medium text-slate-900">{item.description}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">{item.quantity}</td>
                    <td className="py-3 px-3 text-center font-mono text-slate-700">Unit</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-800">{formatCurrency(item.unitAmount)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(item.taxableAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals Summary */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-1.5 text-xs font-sans">
              <div className="flex justify-between text-slate-700">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(subtotalPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Discount</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(discountPaise)}</span>
              </div>
              <div className="flex justify-between text-slate-700 border-t border-slate-200 pt-1">
                <span>Taxable Amount</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(taxablePaise)}</span>
              </div>
              {!isInterState ? (
                <>
                  <div className="flex justify-between text-slate-700">
                    <span>CGST @ 9%</span>
                    <span className="font-mono text-slate-800">{formatCurrency(cgstPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>SGST @ 9%</span>
                    <span className="font-mono text-slate-800">{formatCurrency(sgstPaise)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-700">
                  <span>IGST @ 18%</span>
                  <span className="font-mono text-slate-800">{formatCurrency(igstPaise)}</span>
                </div>
              )}

              {/* Total Amount Due Orange Banner */}
              <div className="bg-[#F59E0B] text-slate-950 p-2.5 rounded-sm flex justify-between items-center font-bold text-sm shadow-sm mt-2">
                <span>Total Amount Due</span>
                <span className="font-mono text-base">{formatCurrency(totalAmountPaise)}</span>
              </div>
            </div>
          </div>

          {/* Summary Strip */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 text-xs border-t border-slate-200">
            <div className="text-slate-800 font-medium">
              <span className="text-slate-500">Amount in Words: </span>
              <strong>Indian Rupees {amountInWords} Only</strong>
            </div>
            <div className="text-slate-800 font-medium">
              <span className="text-slate-500">Payment Status: </span>
              <span className="font-bold font-mono px-2 py-0.5 rounded bg-slate-100 border border-slate-300">
                {invoice.status}
              </span>
            </div>
          </div>

          {/* Payment Schedule */}
          <div className="space-y-2 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading">
              PAYMENT SCHEDULE
            </h3>
            <div className="overflow-hidden rounded-sm border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#0D1C18] text-white font-mono uppercase text-[10px] tracking-wider">
                    <th className="py-2 px-3">PHASE</th>
                    <th className="py-2 px-3">MILESTONE</th>
                    <th className="py-2 px-3 text-center">%</th>
                    <th className="py-2 px-3 text-right">AMOUNT</th>
                    <th className="py-2 px-3 text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {paymentSchedule.map((sched, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? "bg-[#F9F9F6]" : "bg-white"}>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">{sched.phase}</td>
                      <td className="py-2.5 px-3 text-slate-700">{sched.milestone}</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-700">{sched.percentage}%</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(sched.amount)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${sched.status === "Paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
                          [{sched.status}]
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 font-sans">
          Indian Pixel Graphic Design Solutions | website-indianpixel.vercel.app | theindianpixel@gmail.com | +91 7585999426
        </div>
      </div>

      {/* PAGE 2 */}
      <div className="invoice-page-break min-h-[1050px] flex flex-col justify-between pt-8 pb-8 border-t-2 border-dashed border-slate-300 print:border-none">
        <div className="space-y-12 pt-6">
          {/* Payment Details & Authorized Signatory */}
          <div className="grid grid-cols-2 gap-12 text-xs">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading border-b border-slate-200 pb-1">
                PAYMENT DETAILS
              </h3>
              <div className="space-y-1 text-slate-700 font-mono text-xs">
                <div>Bank Name: <strong className="text-slate-900">{bank.bankName}</strong></div>
                <div>Account Name: <strong className="text-slate-900">{bank.accountName}</strong></div>
                <div>Account Number: <strong className="text-slate-900">{bank.accountNumber}</strong></div>
                <div>IFSC Code: <strong className="text-slate-900">{bank.ifscCode}</strong></div>
                <div>UPI ID: <strong className="text-slate-900">{bank.upiId}</strong></div>
              </div>
            </div>

            <div className="space-y-2 text-right">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-heading border-b border-slate-200 pb-1">
                FOR INDIAN PIXEL
              </h3>
              <div className="pt-16 space-y-1">
                <div className="border-b border-slate-400 w-48 ml-auto" />
                <div className="font-semibold text-slate-900 text-xs">Authorized Signatory</div>
              </div>
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 font-heading">
              <span>ⓘ TERMS & CONDITIONS APPLIED</span>
            </div>
            <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed pl-1">
              <li>All intellectual property rights for custom design deliverables remain with Indian Pixel until full invoice settlement.</li>
              <li>Payment must be remitted on or before the due date specified on this invoice. Late payments attract interest at 1.5% per month.</li>
              <li>GST invoice details and statutory tax breakdowns comply with the Central Goods and Services Tax Act, 2017.</li>
              <li>Any disputes arising in connection with this invoice shall be subject to the exclusive jurisdiction of the courts in Chennai, Tamil Nadu.</li>
            </ul>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500 font-sans">
          Indian Pixel Graphic Design Solutions | website-indianpixel.vercel.app | theindianpixel@gmail.com | +91 7585999426
        </div>
      </div>
    </div>
  );
}
