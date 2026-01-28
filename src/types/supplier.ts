export interface Supplier {
    id: string;
    name: string;           // "MTN"
    emailDomain?: string;   // "mtn.co.za" 
    keywords?: string[];    // ["mobile", "airtime"]
    category: string;       // "Telecom"
    selectedMonths?: number[]; // [3, 4, 5] = March, April, May
    createdAt: string;
    isActive: boolean;
}

// Financial year months (March = 3 through February = 2 next year)
export const FINANCIAL_YEAR_MONTHS = [
    { value: 3, label: 'March', shortLabel: 'Mar' },
    { value: 4, label: 'April', shortLabel: 'Apr' },
    { value: 5, label: 'May', shortLabel: 'May' },
    { value: 6, label: 'June', shortLabel: 'Jun' },
    { value: 7, label: 'July', shortLabel: 'Jul' },
    { value: 8, label: 'August', shortLabel: 'Aug' },
    { value: 9, label: 'September', shortLabel: 'Sep' },
    { value: 10, label: 'October', shortLabel: 'Oct' },
    { value: 11, label: 'November', shortLabel: 'Nov' },
    { value: 12, label: 'December', shortLabel: 'Dec' },
    { value: 1, label: 'January', shortLabel: 'Jan' },
    { value: 2, label: 'February', shortLabel: 'Feb' },
] as const;

export interface SavedEmail {
    id: string;
    supplierId: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    date: string;
    snippet: string;
    hasAttachment: boolean;
    attachmentName?: string;
    isProcessed: boolean;
    financialYear: string;  // "2025-2026"
    savedAt: string;
}

export const SUPPLIER_CATEGORIES = [
    'Telecom',
    'Utilities',
    'Banking',
    'Insurance',
    'Retail',
    'Professional Services',
    'Government',
    'Other'
] as const;

export type SupplierCategory = typeof SUPPLIER_CATEGORIES[number];

// Get current financial year (South Africa: March - February)
export function getCurrentFinancialYear(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12

    if (month >= 3) {
        return `${year}-${year + 1}`;
    } else {
        return `${year - 1}-${year}`;
    }
}

// Get date range for a financial year
export function getFinancialYearDates(financialYear: string): { start: Date; end: Date } {
    const [startYear] = financialYear.split('-').map(Number);

    return {
        start: new Date(startYear, 2, 1),      // March 1st
        end: new Date(startYear + 1, 1, 28)    // February 28th (or 29th)
    };
}
