
export enum DocType {
  INVOICE = 'INVOICE',
  BANK_STATEMENT = 'BANK_STATEMENT',
  RECEIPT = 'RECEIPT',
  TAX_LETTER = 'TAX_LETTER',
  OTHER = 'OTHER'
}

export interface Email {
  id: string;
  senderName: string;
  senderEmail: string;
  subject: string;
  date: string;
  snippet: string;
  hasAttachment: boolean;
  attachmentName?: string;
  isProcessed: boolean;
}

export interface DocumentRecord {
  id: string;
  type: DocType;
  sender: string;
  processedAt: string;
  drivePath: string;
  date?: string;
  amount?: string;
  currency?: string;
  emailId: string;
}



export interface DailyReport {
  date: string;
  invoicesCount: number;
  statementsCount: number;
  otherCount: number;
  totalProcessed: number;
  items: DocumentRecord[];
}

export interface FailedDocument {
  id: string; // emailId or specific attachment id
  emailId: string;
  reason: string;
  filename?: string;
  sender?: string;
  date: string;
}
