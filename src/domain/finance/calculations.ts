import { calculateGST } from "./tax";

export interface RawLineItemInput {
  description: string;
  quantity: number;
  unitAmountInPaise: number;
  taxRateBasisPoints?: number;
}

export interface ComputedLineItem {
  description: string;
  quantity: number;
  unitAmountInPaise: number;
  taxableAmountInPaise: number;
  taxRateBasisPoints: number;
  taxAmountInPaise: number;
  totalAmountInPaise: number;
}

export interface InvoiceTotalsResult {
  lineItems: ComputedLineItem[];
  subtotalInPaise: number;
  taxAmountInPaise: number;
  grandTotalInPaise: number;
  isInterState: boolean;
}

/**
 * Computes authoritative invoice totals and itemized line-item breakdowns.
 */
export function computeInvoiceTotals(
  items: RawLineItemInput[],
  isInterState: boolean = false
): InvoiceTotalsResult {
  if (!items || items.length === 0) {
    return {
      lineItems: [],
      subtotalInPaise: 0,
      taxAmountInPaise: 0,
      grandTotalInPaise: 0,
      isInterState,
    };
  }

  let subtotal = 0;
  let totalTax = 0;

  const computedItems: ComputedLineItem[] = items.map((item) => {
    const qty = Math.max(1, Math.round(item.quantity));
    const unitPrice = Math.max(0, Math.round(item.unitAmountInPaise));
    const taxableAmount = qty * unitPrice;
    const itemTaxRate = item.taxRateBasisPoints ?? 1800;

    const gst = calculateGST({
      taxableAmountInPaise: taxableAmount,
      taxRateBasisPoints: itemTaxRate,
      isInterState,
    });

    subtotal += taxableAmount;
    totalTax += gst.totalTaxInPaise;

    return {
      description: item.description.trim(),
      quantity: qty,
      unitAmountInPaise: unitPrice,
      taxableAmountInPaise: taxableAmount,
      taxRateBasisPoints: itemTaxRate,
      taxAmountInPaise: gst.totalTaxInPaise,
      totalAmountInPaise: gst.grandTotalInPaise,
    };
  });

  return {
    lineItems: computedItems,
    subtotalInPaise: subtotal,
    taxAmountInPaise: totalTax,
    grandTotalInPaise: subtotal + totalTax,
    isInterState,
  };
}
