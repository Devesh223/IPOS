/**
 * Authoritative Indian GST Tax Computation Layer.
 * Operates purely in integer paise with zero floating-point drift.
 */

export interface GSTComputationInput {
  taxableAmountInPaise: number;
  taxRateBasisPoints?: number; // e.g. 1800 = 18.00%
  isInterState?: boolean;      // false = Intra-state (CGST+SGST), true = Inter-state (IGST)
}

export interface GSTComputationResult {
  taxableAmountInPaise: number;
  taxRateBasisPoints: number;
  isInterState: boolean;
  cgstRateBasisPoints: number;
  sgstRateBasisPoints: number;
  igstRateBasisPoints: number;
  cgstInPaise: number;
  sgstInPaise: number;
  igstInPaise: number;
  totalTaxInPaise: number;
  grandTotalInPaise: number;
}

/**
 * Calculates authoritative GST breakdown in integer paise.
 */
export function calculateGST(input: GSTComputationInput): GSTComputationResult {
  const taxableAmount = Math.max(0, Math.round(input.taxableAmountInPaise));
  const taxRate = input.taxRateBasisPoints ?? 1800; // Default 18.00%
  const isInterState = input.isInterState ?? false;

  if (taxableAmount === 0 || taxRate === 0) {
    return {
      taxableAmountInPaise: taxableAmount,
      taxRateBasisPoints: taxRate,
      isInterState,
      cgstRateBasisPoints: 0,
      sgstRateBasisPoints: 0,
      igstRateBasisPoints: 0,
      cgstInPaise: 0,
      sgstInPaise: 0,
      igstInPaise: 0,
      totalTaxInPaise: 0,
      grandTotalInPaise: taxableAmount,
    };
  }

  if (isInterState) {
    // Inter-State (IGST)
    const igstInPaise = Math.round((taxableAmount * taxRate) / 10000);
    return {
      taxableAmountInPaise: taxableAmount,
      taxRateBasisPoints: taxRate,
      isInterState: true,
      cgstRateBasisPoints: 0,
      sgstRateBasisPoints: 0,
      igstRateBasisPoints: taxRate,
      cgstInPaise: 0,
      sgstInPaise: 0,
      igstInPaise,
      totalTaxInPaise: igstInPaise,
      grandTotalInPaise: taxableAmount + igstInPaise,
    };
  } else {
    // Intra-State (CGST + SGST split 50/50)
    const halfRate = Math.round(taxRate / 2);
    const cgstInPaise = Math.round((taxableAmount * halfRate) / 10000);
    const sgstInPaise = Math.round((taxableAmount * halfRate) / 10000);
    const totalTax = cgstInPaise + sgstInPaise;

    return {
      taxableAmountInPaise: taxableAmount,
      taxRateBasisPoints: taxRate,
      isInterState: false,
      cgstRateBasisPoints: halfRate,
      sgstRateBasisPoints: halfRate,
      igstRateBasisPoints: 0,
      cgstInPaise,
      sgstInPaise,
      igstInPaise: 0,
      totalTaxInPaise: totalTax,
      grandTotalInPaise: taxableAmount + totalTax,
    };
  }
}
