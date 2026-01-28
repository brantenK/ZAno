/**
 * Storage Service - IndexedDB wrapper for scalable data storage
 * Replaces localStorage which has 5MB limit
 */

const DB_NAME = 'zano_finance_db';
const DB_VERSION = 1;

interface StoreConfig {
    name: string;
    keyPath: string;
    indexes?: { name: string; keyPath: string; unique: boolean }[];
}

const STORES: StoreConfig[] = [
    {
        name: 'suppliers',
        keyPath: 'id',
        indexes: [
            { name: 'by_category', keyPath: 'category', unique: false },
            { name: 'by_name', keyPath: 'name', unique: false }
        ]
    },
    {
        name: 'emails',
        keyPath: 'id',
        indexes: [
            { name: 'by_supplier', keyPath: 'supplierId', unique: false },
            { name: 'by_year', keyPath: 'financialYear', unique: false }
        ]
    },
    {
        name: 'settings',
        keyPath: 'key'
    }
];

class StorageService {
    private db: IDBDatabase | null = null;
    private initPromise: Promise<void> | null = null;

    /**
     * Initialize the database
     */
    async init(): Promise<void> {
        if (this.db) return;

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                if (import.meta.env.DEV) console.log('IndexedDB initialized successfully');
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                for (const store of STORES) {
                    if (!db.objectStoreNames.contains(store.name)) {
                        const objectStore = db.createObjectStore(store.name, {
                            keyPath: store.keyPath
                        });

                        if (store.indexes) {
                            for (const index of store.indexes) {
                                objectStore.createIndex(index.name, index.keyPath, {
                                    unique: index.unique
                                });
                            }
                        }
                    }
                }
            };
        });

        return this.initPromise;
    }

    /**
     * Ensure DB is ready before operations
     */
    private async ensureDB(): Promise<IDBDatabase> {
        await this.init();
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db;
    }

    /**
     * Get all items from a store
     */
    async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    /**
     * Get item by key
     */
    async get<T>(storeName: string, key: string): Promise<T | undefined> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    /**
     * Put (insert or update) an item
     */
    async put<T>(storeName: string, item: T): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Put multiple items
     */
    async putMany<T>(storeName: string, items: T[]): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);

            transaction.onerror = () => reject(transaction.error);
            transaction.oncomplete = () => resolve();

            for (const item of items) {
                store.put(item);
            }
        });
    }

    /**
     * Delete an item by key
     */
    async delete(storeName: string, key: string): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Delete items by index value
     */
    async deleteByIndex(storeName: string, indexName: string, value: string): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.openCursor(IDBKeyRange.only(value));

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const cursor = request.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
        });
    }

    /**
     * Get items by index value
     */
    async getByIndex<T>(storeName: string, indexName: string, value: string): Promise<T[]> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(IDBKeyRange.only(value));

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || []);
        });
    }

    /**
     * Clear all items from a store
     */
    async clear(storeName: string): Promise<void> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const transaction = db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    /**
     * Migrate data from localStorage to IndexedDB (copies without deleting)
     * Keep localStorage intact for sync methods that still read from it
     */
    async migrateFromLocalStorage(): Promise<void> {
        // Copy suppliers to IndexedDB (don't delete from localStorage - sync methods need it)
        const suppliersData = localStorage.getItem('zano_suppliers');
        if (suppliersData) {
            try {
                const suppliers = JSON.parse(suppliersData);
                await this.putMany('suppliers', suppliers);
                // DON'T delete from localStorage - sync methods still read from there
                if (import.meta.env.DEV) console.log(`Synced ${suppliers.length} suppliers to IndexedDB`);
            } catch (e) {
                console.error('Error syncing suppliers:', e);
            }
        }

        // Copy emails to IndexedDB (don't delete from localStorage)
        const emailsData = localStorage.getItem('zano_saved_emails');
        if (emailsData) {
            try {
                const emails = JSON.parse(emailsData);
                await this.putMany('emails', emails);
                // DON'T delete from localStorage
                if (import.meta.env.DEV) console.log(`Synced ${emails.length} emails to IndexedDB`);
            } catch (e) {
                console.error('Error syncing emails:', e);
            }
        }
    }
}

export const storageService = new StorageService();
