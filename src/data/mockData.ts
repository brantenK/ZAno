import { DocType, DocumentRecord, Email, DailyReport } from '../types';
import { Supplier } from '../types/supplier';

export const MOCK_DOCUMENTS: DocumentRecord[] = [
    {
        id: 'mock_1',
        type: DocType.INVOICE,
        sender: 'Acme Corp Solutions',
        processedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
        drivePath: 'Zano/Acme Corp/January 2026',
        amount: '1,250.00',
        currency: 'USD',
        date: new Date().toISOString(),
        emailId: 'mock_email_1'
    },
    {
        id: 'mock_2',
        type: DocType.RECEIPT,
        sender: 'Uber for Business',
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        drivePath: 'Zano/Uber/January 2026',
        amount: '24.50',
        currency: 'USD',
        date: new Date().toISOString(),
        emailId: 'mock_email_2'
    },
    {
        id: 'mock_3',
        type: DocType.BANK_STATEMENT,
        sender: 'Chase Bank',
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        drivePath: 'Zano/Chase Bank/December 2025',
        date: new Date(Date.now() - 86400000).toISOString(),
        emailId: 'mock_email_3'
    },
    {
        id: 'mock_4',
        type: DocType.INVOICE,
        sender: 'Vercel Inc.',
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        drivePath: 'Zano/Vercel/January 2026',
        amount: '20.00',
        currency: 'USD',
        date: new Date(Date.now() - 172800000).toISOString(),
        emailId: 'mock_email_4'
    },
    {
        id: 'mock_5',
        type: DocType.TAX_LETTER,
        sender: 'IRS Notification',
        processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        drivePath: 'Zano/IRS/January 2025',
        date: new Date(Date.now() - 259200000).toISOString(),
        emailId: 'mock_email_5'
    }
];

export const MOCK_SUPPLIERS: Supplier[] = [
    {
        id: 'supplier_demo_1',
        name: 'MTN South Africa',
        emailDomain: 'mtn.co.za',
        keywords: ['airtime', 'mobile', 'data'],
        category: 'Telecom',
        selectedMonths: [3, 4, 5, 6],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        isActive: true
    },
    {
        id: 'supplier_demo_2',
        name: 'Eskom',
        emailDomain: 'eskom.co.za',
        keywords: ['electricity', 'power', 'bill'],
        category: 'Utilities',
        selectedMonths: [3, 4, 5, 6, 7, 8],
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
        isActive: true
    },
    {
        id: 'supplier_demo_3',
        name: 'FNB',
        emailDomain: 'fnb.co.za',
        keywords: ['statement', 'bank', 'transaction'],
        category: 'Banking',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
        isActive: true
    }
];



export const MOCK_EMAILS: Email[] = [
    {
        id: 'email_demo_1',
        senderName: 'MTN Billing',
        senderEmail: 'invoices@mtn.co.za',
        subject: 'Your MTN Invoice for January 2026',
        date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        snippet: 'Please find attached your monthly invoice for airtime and data services...',
        hasAttachment: true,
        attachmentName: 'MTN_Invoice_Jan2026.pdf',
        isProcessed: true
    },
    {
        id: 'email_demo_2',
        senderName: 'First National Bank',
        senderEmail: 'statements@fnb.co.za',
        subject: 'Your Monthly Statement is Ready',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        snippet: 'Your bank statement for the period ending 31 December 2025 is now available...',
        hasAttachment: true,
        attachmentName: 'FNB_Statement_Dec2025.pdf',
        isProcessed: true
    },
    {
        id: 'email_demo_3',
        senderName: 'Eskom Holdings',
        senderEmail: 'billing@eskom.co.za',
        subject: 'Electricity Bill - Account #12345678',
        date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        snippet: 'Your electricity consumption for this month totals R1,250.00...',
        hasAttachment: true,
        attachmentName: 'Eskom_Bill_Jan2026.pdf',
        isProcessed: false
    }
];

export const MOCK_REPORTS: DailyReport[] = [
    {
        date: new Date().toISOString().split('T')[0],
        invoicesCount: 3,
        statementsCount: 1,
        otherCount: 1,
        totalProcessed: 5,
        items: MOCK_DOCUMENTS
    },
    {
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        invoicesCount: 2,
        statementsCount: 2,
        otherCount: 0,
        totalProcessed: 4,
        items: MOCK_DOCUMENTS.slice(0, 4)
    }
];
