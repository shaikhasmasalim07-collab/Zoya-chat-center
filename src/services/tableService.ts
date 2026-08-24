import { TableItem } from '../types';
import { db, USE_FIREBASE } from './firebaseConfig';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';

const TABLE_STORAGE_KEY = 'zoya_tables_v2';
const TABLE_CHANNEL = 'zoya_table_sync_channel';

export const INITIAL_DEFAULT_TABLES: TableItem[] = Array.from({ length: 10 }, (_, i) => {
  const num = i + 1;
  let label = 'Main Dining Hall';
  if (num >= 7 && num <= 8) label = 'Family AC Section';
  else if (num >= 9) label = 'Outdoor Garden Patio';

  return {
    id: `table_${num}`,
    tableNumber: num,
    label,
    capacity: num % 2 === 0 ? 4 : 2,
    isActive: true,
    isReserved: false,
  };
});

class TableService {
  private tables: TableItem[] = [];
  private listeners: Set<(tables: TableItem[]) => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    this.loadInitialData();
    this.initBroadcast();
    if (USE_FIREBASE) {
      this.initFirestoreSync();
    }
  }

  private initBroadcast() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel(TABLE_CHANNEL);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data?.type === 'TABLES_UPDATED') {
            this.tables = event.data.payload;
            this.notify();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel table sync error:', e);
      }
    }
  }

  private initFirestoreSync() {
    try {
      const tableRef = collection(db, 'tables');
      this.unsubscribeFirestore = onSnapshot(
        tableRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteTables: TableItem[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              remoteTables.push({
                id: docSnap.id,
                tableNumber: Number(data.tableNumber) || 1,
                label: data.label || `Table ${data.tableNumber}`,
                capacity: Number(data.capacity) || 4,
                isActive: data.isActive !== false,
                isReserved: !!data.isReserved,
              });
            });

            // Sort ascending by tableNumber
            remoteTables.sort((a, b) => a.tableNumber - b.tableNumber);
            this.tables = remoteTables;
            this.persistLocalOnly();
            this.notify();
          }
        },
        (error) => {
          console.warn('Firestore tables sync notice:', error.message);
        }
      );
    } catch (err) {
      console.warn('Failed to setup Firestore table sync:', err);
    }
  }

  private loadInitialData() {
    if (typeof window === 'undefined') {
      this.tables = [...INITIAL_DEFAULT_TABLES];
      return;
    }

    try {
      const stored = localStorage.getItem(TABLE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.tables = parsed.sort((a: TableItem, b: TableItem) => a.tableNumber - b.tableNumber);
          return;
        }
      }
      this.tables = [...INITIAL_DEFAULT_TABLES];
      this.persistLocalOnly();
    } catch (e) {
      console.error('Error reading tables from localStorage:', e);
      this.tables = [...INITIAL_DEFAULT_TABLES];
    }
  }

  private persistLocalOnly() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(TABLE_STORAGE_KEY, JSON.stringify(this.tables));
      } catch (e) {
        console.error('Error saving tables to localStorage:', e);
      }
    }
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.tables]);
      } catch (err) {
        console.error('Error notifying table listener:', err);
      }
    });
  }

  private broadcast() {
    this.persistLocalOnly();
    this.notify();
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'TABLES_UPDATED',
          payload: this.tables,
        });
      } catch (e) {
        console.warn('BroadcastChannel error on table update:', e);
      }
    }
  }

  public getTables(): TableItem[] {
    return [...this.tables].sort((a, b) => a.tableNumber - b.tableNumber);
  }

  public getActiveTables(): TableItem[] {
    return this.getTables().filter((t) => t.isActive);
  }

  public getTableByNumber(tableNumber: number): TableItem | undefined {
    return this.tables.find((t) => t.tableNumber === tableNumber);
  }

  public async addTable(tableData: {
    tableNumber: number;
    label?: string;
    capacity?: number;
    isActive?: boolean;
    isReserved?: boolean;
  }): Promise<{ success: boolean; message?: string; table?: TableItem }> {
    const num = Math.floor(Number(tableData.tableNumber));
    if (!num || num < 1 || num > 999) {
      return { success: false, message: 'Invalid table number. Please enter a valid number (1-999).' };
    }

    // Check if table number already exists
    const exists = this.tables.some((t) => t.tableNumber === num);
    if (exists) {
      return { success: false, message: `Table #${num} already exists! Please enter a unique table number.` };
    }

    const newTable: TableItem = {
      id: `table_${num}_${Date.now()}`,
      tableNumber: num,
      label: tableData.label?.trim() || `Table ${num}`,
      capacity: Number(tableData.capacity) || 4,
      isActive: tableData.isActive !== false,
      isReserved: !!tableData.isReserved,
    };

    this.tables = [...this.tables, newTable].sort((a, b) => a.tableNumber - b.tableNumber);
    this.broadcast();

    if (USE_FIREBASE) {
      try {
        const docRef = doc(db, 'tables', newTable.id);
        await setDoc(docRef, {
          tableNumber: newTable.tableNumber,
          label: newTable.label,
          capacity: newTable.capacity,
          isActive: newTable.isActive,
          isReserved: newTable.isReserved,
          updatedAt: new Date().toISOString(),
        });
      } catch (e: any) {
        console.warn('Firestore write table error:', e.message);
      }
    }

    return { success: true, table: newTable };
  }

  public async updateTable(table: TableItem): Promise<{ success: boolean; message?: string }> {
    const num = Math.floor(Number(table.tableNumber));
    if (!num || num < 1 || num > 999) {
      return { success: false, message: 'Invalid table number.' };
    }

    // Ensure no other table has the same number
    const duplicate = this.tables.some((t) => t.id !== table.id && t.tableNumber === num);
    if (duplicate) {
      return { success: false, message: `Table #${num} already exists elsewhere.` };
    }

    this.tables = this.tables.map((t) => (t.id === table.id ? { ...table, tableNumber: num } : t))
      .sort((a, b) => a.tableNumber - b.tableNumber);
    
    this.broadcast();

    if (USE_FIREBASE) {
      try {
        const docRef = doc(db, 'tables', table.id);
        await setDoc(docRef, {
          tableNumber: num,
          label: table.label || `Table ${num}`,
          capacity: table.capacity || 4,
          isActive: table.isActive !== false,
          isReserved: !!table.isReserved,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e: any) {
        console.warn('Firestore update table error:', e.message);
      }
    }

    return { success: true };
  }

  public async deleteTable(idOrNumber: string | number): Promise<{ success: boolean; message?: string }> {
    const target = this.tables.find(
      (t) => t.id === String(idOrNumber) || t.tableNumber === Number(idOrNumber)
    );

    if (!target) {
      return { success: false, message: 'Table not found.' };
    }

    this.tables = this.tables.filter((t) => t.id !== target.id);
    this.broadcast();

    if (USE_FIREBASE) {
      try {
        const docRef = doc(db, 'tables', target.id);
        await deleteDoc(docRef);
      } catch (e: any) {
        console.warn('Firestore delete table error:', e.message);
      }
    }

    return { success: true };
  }

  public async toggleTableStatus(idOrNumber: string | number): Promise<void> {
    const target = this.tables.find(
      (t) => t.id === String(idOrNumber) || t.tableNumber === Number(idOrNumber)
    );
    if (!target) return;

    const updated: TableItem = {
      ...target,
      isActive: !target.isActive,
    };
    await this.updateTable(updated);
  }

  public resetToDefault(): void {
    this.tables = [...INITIAL_DEFAULT_TABLES];
    this.broadcast();

    if (USE_FIREBASE) {
      INITIAL_DEFAULT_TABLES.forEach(async (t) => {
        try {
          const docRef = doc(db, 'tables', t.id);
          await setDoc(docRef, {
            tableNumber: t.tableNumber,
            label: t.label,
            capacity: t.capacity,
            isActive: t.isActive,
            isReserved: t.isReserved,
            updatedAt: new Date().toISOString(),
          });
        } catch (e) {
          // ignore
        }
      });
    }
  }

  public subscribe(listener: (tables: TableItem[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getTables());
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const tableService = new TableService();
