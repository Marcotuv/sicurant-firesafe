import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { Search, Plus, Trash2, Edit, FolderOpen, Upload, AlertTriangle, X } from 'lucide-react';
import { getAllClienti, addCliente, updateCliente, deleteCliente } from '../db';
import type { Cliente, ClienteConStato } from '../types';
import { arricchisciClientiConStato } from '../utils/semaforo';
import { parseClienteCSV } from '../utils/csvImport';
import { ClienteFormModal } from '../components/ClienteFormModal';
import './ClientiArchive.css';

// ── Confirm Delete Dialog ──────────────────────────────────────────────────────
const ConfirmDeleteModal: React.FC<{
  name: string;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ name, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="confirm-box">
      <AlertTriangle size={32} style={{ color: 'var(--status-red)', margin: '0 auto 0.75rem' }} />
      <h3>Elimina Cliente</h3>
      <p>Sei sicuro di voler eliminare <strong>{name}</strong>? L'operazione non è reversibile.</p>
      <div className="confirm-actions">
        <button className="btn-ghost" onClick={onCancel}>Annulla</button>
        <button className="btn-danger" onClick={onConfirm}>
          <Trash2 size={15} /> Elimina
        </button>
      </div>
    </div>
  </div>
);

// ── CSV Import Result Toast ────────────────────────────────────────────────────
const ImportToast: React.FC<{
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}> = ({ message, type, onClose }) => (
  <div className={`import-result ${type}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
    <span>{message}</span>
    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
      <X size={16} />
    </button>
  </div>
);

// ── Main Archive Component ─────────────────────────────────────────────────────
export const ClientiArchive: React.FC = () => {
  const [clienti, setClienti] = useState<ClienteConStato[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Cliente | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<ClienteConStato | null>(null);

  // CSV import toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // ── Data fetching ──
  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await getAllClienti();
      setClienti(arricchisciClientiConStato(raw));
    } catch (err) {
      console.error('Errore nel caricamento clienti:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // ── Filtered list ──
  const filtered = useMemo(() => {
    if (!search.trim()) return clienti;
    const q = search.toLowerCase();
    return clienti.filter(c =>
      c.cliente?.toLowerCase().includes(q) ||
      c.commessa?.toLowerCase().includes(q) ||
      c.citta?.toLowerCase().includes(q) ||
      c.struttura?.toLowerCase().includes(q)
    );
  }, [clienti, search]);

  // ── Semaforo counts ──
  const countRosso  = clienti.filter(c => c.statoSemaforo === 'rosso').length;
  const countGiallo = clienti.filter(c => c.statoSemaforo === 'giallo').length;
  const countVerde  = clienti.filter(c => c.statoSemaforo === 'verde').length;

  // ── CRUD handlers ──
  const handleSave = async (data: Omit<Cliente, 'id'>, id?: number) => {
    if (id !== undefined) {
      await updateCliente({ ...data, id });
    } else {
      await addCliente(data);
    }
    await reload();
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    await deleteCliente(deleteTarget.id);
    setDeleteTarget(null);
    await reload();
  };

  // ── CSV Import ──
  const handleCsvFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ''; // reset so same file can be re-selected

    const text = await file.text();
    const { imported, skipped, errors } = parseClienteCSV(text);

    if (imported.length === 0) {
      setToast({ type: 'error', message: `Nessun record valido trovato. ${errors[0] ?? ''}` });
      return;
    }

    // Bulk insert
    for (const c of imported) {
      await addCliente(c);
    }

    await reload();
    const msg = `✅ Importati ${imported.length} clienti${skipped > 0 ? `, ${skipped} righe saltate` : ''}.`;
    setToast({ type: 'success', message: msg });
  };

  return (
    <div className="animate-fade-in">
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Archivio Clienti</h2>

      {/* Stats chips */}
      <div className="archive-stats">
        <div className="archive-stat-chip red">
          <span className="semaforo-dot rosso" /> {countRosso} Scaduti
        </div>
        <div className="archive-stat-chip yellow">
          <span className="semaforo-dot giallo" /> {countGiallo} In Scadenza
        </div>
        <div className="archive-stat-chip green">
          <span className="semaforo-dot verde" /> {countVerde} Regolari
        </div>
      </div>

      {/* CSV import toast */}
      {toast && (
        <ImportToast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Toolbar */}
      <div className="archive-toolbar">
        <div style={{ position: 'relative', flex: '1 1 220px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input
            type="text"
            className="archive-search"
            placeholder="Cerca per cliente, commessa, città..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '2.25rem' }}
          />
        </div>

        {/* Hidden CSV file input */}
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,.txt"
          style={{ display: 'none' }}
          onChange={handleCsvFile}
        />

        <button
          className="btn-ghost"
          onClick={() => csvInputRef.current?.click()}
          title="Importa da CSV (formato Excel)"
        >
          <Upload size={16} /> Importa CSV
        </button>

        <button
          className="btn-primary"
          onClick={() => { setEditTarget(null); setFormOpen(true); }}
        >
          <Plus size={16} /> Nuovo Cliente
        </button>
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="empty-state">
            <p style={{ color: 'var(--text-secondary)' }}>Caricamento...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <FolderOpen size={32} style={{ color: 'var(--text-secondary)' }} />
            </div>
            <h3>Nessun cliente trovato</h3>
            <p>
              {search
                ? 'Prova a modificare i termini di ricerca.'
                : 'Aggiungi un nuovo cliente o importa un file CSV.'}
            </p>
          </div>
        ) : (
          <div className="clients-table-wrapper">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Stato</th>
                  <th>Cliente</th>
                  <th>Commessa</th>
                  <th>Struttura</th>
                  <th>Città</th>
                  <th>Semestre 1</th>
                  <th>Semestre 2</th>
                  <th>Pezzi</th>
                  <th style={{ textAlign: 'right' }}>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id}>
                    <td><span className={`semaforo-dot ${c.statoSemaforo}`} /></td>
                    <td style={{ fontWeight: 600 }}>{c.cliente}</td>
                    <td>{c.commessa}</td>
                    <td>{c.struttura}</td>
                    <td>{c.citta}{c.provincia ? ` (${c.provincia})` : ''}</td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>{c.semestre1_mesi || '—'}</span>
                      {c.semestre1_data && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.semestre1_data}</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem' }}>{c.semestre2_mesi || '—'}</span>
                      {c.semestre2_data && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.semestre2_data}</span>
                      )}
                    </td>
                    <td>{c.totalePezzi ?? 0}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <button
                          className="action-btn"
                          title="Modifica"
                          onClick={() => { setEditTarget(c); setFormOpen(true); }}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn delete"
                          title="Elimina"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <ClienteFormModal
        isOpen={formOpen}
        initialData={editTarget}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />

      {deleteTarget && (
        <ConfirmDeleteModal
          name={deleteTarget.cliente}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
};
