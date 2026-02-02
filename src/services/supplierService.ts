import { Supplier, SavedEmail, getCurrentFinancialYear } from '../types/supplier';
import { storageService } from './storageService';

// Fallback to localStorage for sync operations during migration
const SUPPLIERS_KEY = 'zano_suppliers';
const EMAILS_KEY = 'zano_saved_emails';

class SupplierService {
    private initialized = false;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize the storage service and migrate from localStorage if needed
     */
    async init(): Promise<void> {
        if (this.initialized) return;

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = (async () => {
            await storageService.init();
            await storageService.migrateFromLocalStorage();
            this.initialized = true;
        })();

        return this.initPromise;
    }

    // ========== SUPPLIERS (Async - Preferred) ==========

    async getSuppliersAsync(): Promise<Supplier[]> {
        await this.init();
        return storageService.getAll<Supplier>('suppliers');
    }

    async addSupplierAsync(supplier: Omit<Supplier, 'id' | 'createdAt' | 'isActive'>): Promise<Supplier> {
        await this.init();
        const newSupplier: Supplier = {
            ...supplier,
            id: `supplier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        await storageService.put('suppliers', newSupplier);
        return newSupplier;
    }

    async updateSupplierAsync(id: string, updates: Partial<Supplier>): Promise<Supplier | null> {
        await this.init();
        const existing = await storageService.get<Supplier>('suppliers', id);
        if (!existing) return null;

        const updated = { ...existing, ...updates };
        await storageService.put('suppliers', updated);
        return updated;
    }

    async deleteSupplierAsync(id: string): Promise<boolean> {
        await this.init();
        const existing = await storageService.get<Supplier>('suppliers', id);
        if (!existing) return false;

        await storageService.delete('suppliers', id);
        await this.deleteEmailsBySupplierAsync(id);
        return true;
    }

    async getSupplierByIdAsync(id: string): Promise<Supplier | undefined> {
        await this.init();
        return storageService.get<Supplier>('suppliers', id);
    }

    // ========== SAVED EMAILS (Async - Preferred) ==========

    async getSavedEmailsAsync(financialYear?: string): Promise<SavedEmail[]> {
        await this.init();

        if (financialYear) {
            return storageService.getByIndex<SavedEmail>('emails', 'by_year', financialYear);
        }
        return storageService.getAll<SavedEmail>('emails');
    }

    async getEmailsBySupplierAsync(supplierId: string): Promise<SavedEmail[]> {
        await this.init();
        return storageService.getByIndex<SavedEmail>('emails', 'by_supplier', supplierId);
    }

    async saveEmailsAsync(emails: SavedEmail[]): Promise<void> {
        await this.init();

        // Get existing IDs to avoid duplicates
        const existingEmails = await this.getSavedEmailsAsync();
        const existingIds = new Set(existingEmails.map(e => e.id));

        // Only add new emails
        const newEmails = emails.filter(e => !existingIds.has(e.id));
        if (newEmails.length > 0) {
            await storageService.putMany('emails', newEmails);
        }
    }

    async deleteEmailsBySupplierAsync(supplierId: string): Promise<void> {
        await this.init();
        await storageService.deleteByIndex('emails', 'by_supplier', supplierId);
    }

    async markEmailAsProcessedAsync(emailId: string): Promise<void> {
        await this.init();
        const email = await storageService.get<SavedEmail>('emails', emailId);
        if (email) {
            email.isProcessed = true;
            await storageService.put('emails', email);
        }
    }

    // ========== SYNC METHODS (Backwards Compatibility) ==========
    // These use localStorage as fallback for sync operations

    /** @deprecated Use getSuppliersAsync instead */
    getSuppliers(): Supplier[] {
        const data = localStorage.getItem(SUPPLIERS_KEY);
        return data ? JSON.parse(data) : [];
    }

    /** @deprecated Use saveSuppliersAsync instead */
    saveSuppliers(suppliers: Supplier[]): void {
        localStorage.setItem(SUPPLIERS_KEY, JSON.stringify(suppliers));
    }

    /** @deprecated Use addSupplierAsync instead */
    addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'isActive'>): Supplier {
        const suppliers = this.getSuppliers();
        const newSupplier: Supplier = {
            ...supplier,
            id: `supplier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            isActive: true
        };
        suppliers.push(newSupplier);
        this.saveSuppliers(suppliers);

        // Also save to IndexedDB async
        this.init().then(() => storageService.put('suppliers', newSupplier));

        return newSupplier;
    }

    /** @deprecated Use updateSupplierAsync instead */
    updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
        const suppliers = this.getSuppliers();
        const index = suppliers.findIndex(s => s.id === id);
        if (index === -1) return null;

        suppliers[index] = { ...suppliers[index], ...updates };
        this.saveSuppliers(suppliers);

        // Also update IndexedDB async
        this.init().then(() => storageService.put('suppliers', suppliers[index]));

        return suppliers[index];
    }

    /** @deprecated Use deleteSupplierAsync instead */
    deleteSupplier(id: string): boolean {
        const suppliers = this.getSuppliers();
        const filtered = suppliers.filter(s => s.id !== id);
        if (filtered.length === suppliers.length) return false;

        this.saveSuppliers(filtered);
        this.deleteEmailsBySupplier(id);

        // Also delete from IndexedDB async
        this.init().then(() => {
            storageService.delete('suppliers', id);
            storageService.deleteByIndex('emails', 'by_supplier', id);
        });

        return true;
    }

    /** @deprecated Use getSupplierByIdAsync instead */
    getSupplierById(id: string): Supplier | undefined {
        return this.getSuppliers().find(s => s.id === id);
    }

    /** @deprecated Use getSavedEmailsAsync instead */
    getSavedEmails(financialYear?: string): SavedEmail[] {
        const data = localStorage.getItem(EMAILS_KEY);
        const emails: SavedEmail[] = data ? JSON.parse(data) : [];

        if (financialYear) {
            return emails.filter(e => e.financialYear === financialYear);
        }
        return emails;
    }

    /** @deprecated Use getEmailsBySupplierAsync instead */
    getEmailsBySupplier(supplierId: string, financialYear?: string): SavedEmail[] {
        return this.getSavedEmails(financialYear).filter(e => e.supplierId === supplierId);
    }

    /** @deprecated Use saveEmailsAsync instead. This method blocks the main thread. */
    saveEmails(emails: SavedEmail[]): void {
        const existing = this.getSavedEmails();
        const existingIds = new Set(existing.map(e => e.id));

        // Only add new emails (avoid duplicates)
        const newEmails = emails.filter(e => !existingIds.has(e.id));
        const combined = [...existing, ...newEmails];

        localStorage.setItem(EMAILS_KEY, JSON.stringify(combined));

        // Also save to IndexedDB async
        if (newEmails.length > 0) {
            this.init().then(() => storageService.putMany('emails', newEmails));
        }
    }

    /** @deprecated Use deleteEmailsBySupplierAsync instead */
    deleteEmailsBySupplier(supplierId: string): void {
        const emails = this.getSavedEmails();
        const filtered = emails.filter(e => e.supplierId !== supplierId);
        localStorage.setItem(EMAILS_KEY, JSON.stringify(filtered));
    }

    /** @deprecated Use markEmailAsProcessedAsync instead */
    markEmailAsProcessed(emailId: string): void {
        const emails = this.getSavedEmails();
        const index = emails.findIndex(e => e.id === emailId);
        if (index !== -1) {
            emails[index].isProcessed = true;
            localStorage.setItem(EMAILS_KEY, JSON.stringify(emails));

            // Also update IndexedDB async
            this.init().then(() => storageService.put('emails', emails[index]));
        }
    }

    // ========== GMAIL QUERY BUILDER ==========

    buildGmailQuery(supplier: Supplier, _financialYear?: string): string {
        // Simple query: search by email domain with attachments
        if (supplier.emailDomain) {
            const domain = supplier.emailDomain.startsWith('@')
                ? supplier.emailDomain.substring(1)
                : supplier.emailDomain;
            return `category:primary has:attachment from:${domain}`;
        }

        // Fallback: search by supplier name
        if (supplier.name) {
            return `category:primary has:attachment "${supplier.name}"`;
        }

        return 'category:primary has:attachment';
    }

    buildCombinedQuery(suppliers: Supplier[], financialYear?: string): string {
        const fy = financialYear || getCurrentFinancialYear();
        const activeSuppliers = suppliers.filter(s => s.isActive);

        if (activeSuppliers.length === 0) {
            // Fallback to generic financial search
            const [startYear] = fy.split('-').map(Number);
            return `category:primary has:attachment (invoice OR statement OR receipt) after:${startYear}/03/01 before:${startYear + 1}/03/01`;
        }

        const supplierQueries = activeSuppliers.map(s => {
            const parts: string[] = [];
            if (s.emailDomain) parts.push(`from:${s.emailDomain}`);
            parts.push(`"${s.name}"`);
            return `(${parts.join(' OR ')})`;
        });

        const [startYear] = fy.split('-').map(Number);
        return `category:primary (${supplierQueries.join(' OR ')}) after:${startYear}/03/01 before:${startYear + 1}/03/01`;
    }
}

export const supplierService = new SupplierService();
