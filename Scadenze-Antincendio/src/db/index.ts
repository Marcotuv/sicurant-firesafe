import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { Cliente } from '../types';

interface MyDB extends DBSchema {
  clienti: {
    key: number;
    value: Cliente;
    indexes: { 'by-cliente': string, 'by-citta': string, 'by-scadenza': string };
  };
}

const DB_NAME = 'sicurant-scadenze-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<MyDB>>;

export const initDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB<MyDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('clienti')) {
          const store = db.createObjectStore('clienti', {
            keyPath: 'id',
            autoIncrement: true,
          });
          store.createIndex('by-cliente', 'cliente');
          store.createIndex('by-citta', 'citta');
          store.createIndex('by-scadenza', 'semestre1_mesi');
        }
      },
    });
  }
  return dbPromise;
};

// CRUD Operations

export const getAllClienti = async (): Promise<Cliente[]> => {
  const db = await initDB();
  return db.getAll('clienti');
};

export const getClienteById = async (id: number): Promise<Cliente | undefined> => {
  const db = await initDB();
  return db.get('clienti', id);
};

export const addCliente = async (cliente: Omit<Cliente, 'id'>): Promise<number> => {
  const db = await initDB();
  const now = new Date().toISOString();
  // @ts-ignore
  return db.add('clienti', { ...cliente, createdAt: now, updatedAt: now });
};

export const updateCliente = async (cliente: Cliente): Promise<number> => {
  const db = await initDB();
  const now = new Date().toISOString();
  return db.put('clienti', { ...cliente, updatedAt: now });
};

export const deleteCliente = async (id: number): Promise<void> => {
  const db = await initDB();
  return db.delete('clienti', id);
};

export const importData = async (clienti: Cliente[]): Promise<void> => {
  const db = await initDB();
  const tx = db.transaction('clienti', 'readwrite');
  await Promise.all([
    ...clienti.map(cliente => tx.store.put(cliente)),
    tx.done
  ]);
};

export const clearDatabase = async (): Promise<void> => {
  const db = await initDB();
  await db.clear('clienti');
};
