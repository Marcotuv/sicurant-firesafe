import React, { useState, useEffect } from 'react';
import { X, Save, User } from 'lucide-react';
import type { Cliente } from '../types';
import './ClienteFormModal.css';

const SEMESTRI_OPTIONS = [
  'gennaio-luglio',
  'febbraio-agosto',
  'marzo-settembre',
  'aprile-ottobre',
  'maggio-novembre',
  'giugno-dicembre',
];

const SEMESTRI_INVERSI: Record<string, string> = {
  'gennaio-luglio': 'luglio-gennaio',
  'febbraio-agosto': 'agosto-febbraio',
  'marzo-settembre': 'settembre-marzo',
  'aprile-ottobre': 'ottobre-aprile',
  'maggio-novembre': 'novembre-maggio',
  'giugno-dicembre': 'dicembre-giugno',
};

const emptyCliente = (): Omit<Cliente, 'id'> => ({
  cliente: '',
  commessa: '',
  struttura: '',
  idCommessa: '',
  citta: '',
  provincia: '',
  indirizzo: '',
  semestre1_mesi: '',
  semestre1_data: '',
  semestre1_numeroSac: '',
  semestre1_tecnico: '',
  semestre2_mesi: '',
  semestre2_data: '',
  semestre2_numeroSac: '',
  semestre2_tecnico: '',
  pagamento: '',
  note: '',
  estintori: 0,
  porteUS: 0,
  idranti: 0,
  attaccoVVF: 0,
  efc: 0,
  impiantoSprinkler: 0,
  stazionePompaggio: 0,
  impiantoRilevazioneFumi: 0,
  dataFumi: '',
  sorveglianza: '',
  dataSorveglianza: '',
  totalePezzi: 0,
});

interface Props {
  isOpen: boolean;
  initialData?: Cliente | null;
  onClose: () => void;
  onSave: (data: Omit<Cliente, 'id'>, id?: number) => Promise<void>;
}

export const ClienteFormModal: React.FC<Props> = ({ isOpen, initialData, onClose, onSave }) => {
  const [form, setForm] = useState<Omit<Cliente, 'id'>>(emptyCliente());
  const [saving, setSaving] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (initialData) {
      const { id, ...rest } = initialData;
      setForm(rest);
    } else {
      setForm(emptyCliente());
    }
  }, [initialData, isOpen]);

  // Auto-derive semestre2 from semestre1
  const handleSemestre1Change = (value: string) => {
    setForm(f => ({
      ...f,
      semestre1_mesi: value,
      semestre2_mesi: SEMESTRI_INVERSI[value] ?? '',
    }));
  };

  const set = (field: keyof Omit<Cliente, 'id'>, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }));

  // Recalculate totalePezzi automatically
  const recalcTotal = (updated: Omit<Cliente, 'id'>) => {
    const sum =
      (Number(updated.estintori) || 0) +
      (Number(updated.porteUS) || 0) +
      (Number(updated.idranti) || 0) +
      (Number(updated.attaccoVVF) || 0) +
      (Number(updated.efc) || 0) +
      (Number(updated.impiantoSprinkler) || 0) +
      (Number(updated.stazionePompaggio) || 0) +
      (Number(updated.impiantoRilevazioneFumi) || 0);
    return sum;
  };

  const setNum = (field: keyof Omit<Cliente, 'id'>, value: string) => {
    const num = parseInt(value, 10) || 0;
    setForm(f => {
      const updated = { ...f, [field]: num };
      updated.totalePezzi = recalcTotal(updated);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form, initialData?.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <User size={18} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            {initialData ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </h2>
          <button className="modal-close-btn" onClick={onClose} title="Chiudi">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* ── Anagrafica ── */}
            <div className="form-section-title">Anagrafica</div>
            <div className="form-grid cols-4">
              <div className="form-field span-2">
                <label>Ragione Sociale / Cliente *</label>
                <input required className="form-input" value={form.cliente} onChange={e => set('cliente', e.target.value)} placeholder="Es. Rossi S.r.l." />
              </div>
              <div className="form-field">
                <label>Commessa</label>
                <input className="form-input" value={form.commessa} onChange={e => set('commessa', e.target.value)} placeholder="Es. 2024-001" />
              </div>
              <div className="form-field">
                <label>ID Commessa</label>
                <input className="form-input" value={form.idCommessa} onChange={e => set('idCommessa', e.target.value)} />
              </div>

              <div className="form-field span-2">
                <label>Struttura / Sede</label>
                <input className="form-input" value={form.struttura} onChange={e => set('struttura', e.target.value)} placeholder="Es. Capannone Nord" />
              </div>
              <div className="form-field span-2">
                <label>Indirizzo</label>
                <input className="form-input" value={form.indirizzo} onChange={e => set('indirizzo', e.target.value)} placeholder="Via, n° civico" />
              </div>
              
              <div className="form-field span-2">
                <label>Città</label>
                <input className="form-input" value={form.citta} onChange={e => set('citta', e.target.value)} />
              </div>
              <div className="form-field span-2">
                <label>Provincia</label>
                <input className="form-input" value={form.provincia} onChange={e => set('provincia', e.target.value)} maxLength={2} placeholder="Es. MI" />
              </div>
            </div>

            {/* ── Semestri ── */}
            <div className="form-section-title">Scadenze Semestrali</div>
            <div className="form-grid cols-4">
              <div className="form-field span-2">
                <label>Periodo I Semestre</label>
                <select className="form-select" value={form.semestre1_mesi} onChange={e => handleSemestre1Change(e.target.value)}>
                  <option value="">-- Seleziona --</option>
                  {SEMESTRI_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-field span-2">
                <label>Periodo II Semestre (auto)</label>
                <input className="form-input" value={form.semestre2_mesi} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>

              <div className="form-field">
                <label>Data Int. I Sem.</label>
                <input className="form-input" type="date" value={form.semestre1_data} onChange={e => set('semestre1_data', e.target.value)} />
              </div>
              <div className="form-field">
                <label>N° SAC I Sem.</label>
                <input className="form-input" value={form.semestre1_numeroSac} onChange={e => set('semestre1_numeroSac', e.target.value)} />
              </div>
              <div className="form-field span-2">
                <label>Tecnico I Sem.</label>
                <input className="form-input" value={form.semestre1_tecnico} onChange={e => set('semestre1_tecnico', e.target.value)} />
              </div>

              <div className="form-field">
                <label>Data Int. II Sem.</label>
                <input className="form-input" type="date" value={form.semestre2_data} onChange={e => set('semestre2_data', e.target.value)} />
              </div>
              <div className="form-field">
                <label>N° SAC II Sem.</label>
                <input className="form-input" value={form.semestre2_numeroSac} onChange={e => set('semestre2_numeroSac', e.target.value)} />
              </div>
              <div className="form-field span-2">
                <label>Tecnico II Sem.</label>
                <input className="form-input" value={form.semestre2_tecnico} onChange={e => set('semestre2_tecnico', e.target.value)} />
              </div>
            </div>

            {/* ── Consistenze ── */}
            <div className="form-section-title">Consistenze Impianti</div>
            <div className="form-grid cols-4">
              <div className="form-field">
                <label>Estintori</label>
                <input className="form-input" type="number" min="0" value={form.estintori} onChange={e => setNum('estintori', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Porte + US</label>
                <input className="form-input" type="number" min="0" value={form.porteUS} onChange={e => setNum('porteUS', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Idranti</label>
                <input className="form-input" type="number" min="0" value={form.idranti} onChange={e => setNum('idranti', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Attacco VVF</label>
                <input className="form-input" type="number" min="0" value={form.attaccoVVF} onChange={e => setNum('attaccoVVF', e.target.value)} />
              </div>
              <div className="form-field">
                <label>EFC</label>
                <input className="form-input" type="number" min="0" value={form.efc} onChange={e => setNum('efc', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Impianto Sprinkler</label>
                <input className="form-input" type="number" min="0" value={form.impiantoSprinkler} onChange={e => setNum('impiantoSprinkler', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Stazione Pompaggio</label>
                <input className="form-input" type="number" min="0" value={form.stazionePompaggio} onChange={e => setNum('stazionePompaggio', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Imp. Rilevazione Fumi</label>
                <input className="form-input" type="number" min="0" value={form.impiantoRilevazioneFumi} onChange={e => setNum('impiantoRilevazioneFumi', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Totale Pezzi (auto)</label>
                <input className="form-input" type="number" value={form.totalePezzi} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
            </div>

            {/* ── Sorveglianza, Fumi & Note ── */}
            <div className="form-section-title">Dati Aggiuntivi</div>
            <div className="form-grid cols-4">
              <div className="form-field">
                <label>Sorveglianza</label>
                <input className="form-input" value={form.sorveglianza} onChange={e => set('sorveglianza', e.target.value)} placeholder="Tipo" />
              </div>
              <div className="form-field">
                <label>Data Sorveg.</label>
                <input className="form-input" type="date" value={form.dataSorveglianza} onChange={e => set('dataSorveglianza', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Data Fumi</label>
                <input className="form-input" type="date" value={form.dataFumi} onChange={e => set('dataFumi', e.target.value)} />
              </div>
              <div className="form-field">
                <label>Pagamento</label>
                <input className="form-input" value={form.pagamento} onChange={e => set('pagamento', e.target.value)} placeholder="Es. 30gg, Bonifico..." />
              </div>
              <div className="form-field span-4" style={{ gridColumn: '1 / -1' }}>
                <label>Note aggiuntive</label>
                <textarea className="form-textarea" value={form.note} onChange={e => set('note', e.target.value)} placeholder="Dettagli sulle scadenze speciali, avvertenze..." />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Annulla</button>
            <button type="submit" className="btn-success" disabled={saving}>
              <Save size={16} />
              {saving ? 'Salvataggio...' : 'Salva Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
