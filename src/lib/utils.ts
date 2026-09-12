import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely with clsx and twMerge.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Currency formatter supporting default Indian Rupee and USD.
 */
export function formatCurrency(amountInCentsOrPence: number, currency: string = "INR"): string {
  const amount = amountInCentsOrPence / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Date formatter according to Workspace timezone requirement (Rule G-9).
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

/**
 * Format relative time (e.g. "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = new Date();
  const d = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return formatDate(d);
}

/**
 * Converts Indian Rupee amounts in paise to words (e.g. "One Lakh Fifty Thousand").
 */
export function amountToWordsINR(amountInPaise: number): string {
  const amount = Math.floor(amountInPaise / 100);
  if (amount === 0) return "Zero";

  const single = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const double = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function convertChunk(n: number): string {
    let str = "";
    if (n > 99) {
      str += single[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 19) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 9 && n < 20) {
      str += double[n - 10] + " ";
    } else if (n > 0) {
      str += single[n] + " ";
    }
    return str;
  }

  let word = "";
  const crore = Math.floor(amount / 10000000);
  let remainder = amount % 10000000;
  const lakh = Math.floor(remainder / 100000);
  remainder %= 100000;
  const thousand = Math.floor(remainder / 1000);
  remainder %= 1000;

  if (crore > 0) word += convertChunk(crore) + "Crore ";
  if (lakh > 0) word += convertChunk(lakh) + "Lakh ";
  if (thousand > 0) word += convertChunk(thousand) + "Thousand ";
  if (remainder > 0) word += convertChunk(remainder);

  return word.trim();
}

/**
 * Extracts initials from a user's name for Avatar fallback.
 */
export function getInitials(name: string): string {
  if (!name) return "IP";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1 && parts[0]) return parts[0].substring(0, 2).toUpperCase();
  return ((parts[0]?.[0] || "") + (parts[parts.length - 1]?.[0] || "")).toUpperCase();
}
