import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, Pencil } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { formatDate } from '@/shared/utils/formatDate';
import type { AssetEntry } from '@/modules/portfolio';
import type { useEditEntry } from '../hooks/useEntries';

export function DeleteEntryModal({ entry, onConfirm, onCancel, isDeleting }: {
  entry: AssetEntry; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onCancel}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 360, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(240,71,106,0.1)', border: '1px solid rgba(240,71,106,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Trash2 size={16} strokeWidth={2} style={{ color: 'var(--loss-400)' }} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, margin: 0 }}>{t('assetDetail.deleteEntryTitle')}</h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6, margin: '0 0 8px 0' }}>
          {t('assetDetail.deleteEntryDesc')} <strong style={{ color: 'var(--text-primary)' }}>{t(`entry.${entry.entryType}`)}</strong>{' '}
          {t('assetDetail.deleteEntryOn')}{' '}
          {formatDate(entry.date)}?
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5, margin: '0 0 20px 0' }}>{t('assetDetail.deleteTransactionDesc')}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button type="button" variant="secondary" size="md" onClick={onCancel} style={{ flex: 1 }}>{t('common.cancel')}</Button>
          <Button type="button" variant="danger" size="md" onClick={onConfirm} loading={isDeleting} style={{ flex: 1 }}>{t('common.delete')}</Button>
        </div>
      </div>
    </div>
  );
}

export function EditEntryModal({ entry, onSave, onCancel, isSaving }: {
  entry: AssetEntry;
  onSave: (patch: Parameters<ReturnType<typeof useEditEntry>['mutateAsync']>[0]['patch']) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const { t } = useTranslation();
  const [date, setDate]                 = useState(entry.date.toISOString().slice(0, 10));
  const [pricePerUnit, setPricePerUnit] = useState(entry.pricePerUnit?.toString() ?? '');
  const [units, setUnits]               = useState(entry.units?.toString() ?? '');
  const [amount, setAmount]             = useState(entry.amount?.toString() ?? '');
  const [notes, setNotes]               = useState(entry.notes ?? '');

  const showPrice  = entry.pricePerUnit != null;
  const showUnits  = entry.units != null;
  const showAmount = entry.amount != null;

  const fieldStyle: React.CSSProperties = {
    width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid var(--border-default)',
    background: 'var(--bg-raised)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5, display: 'block',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const patch: Parameters<typeof onSave>[0] = {
      date: new Date(date + 'T12:00:00'),
      notes: notes.trim() || undefined,
    };
    if (showPrice && pricePerUnit) patch.pricePerUnit = parseFloat(pricePerUnit.replace(/,/g, '.'));
    if (showUnits && units)       patch.units        = parseFloat(units.replace(/,/g, '.'));
    if (showAmount && amount)     patch.amount       = parseFloat(amount.replace(/,/g, '.'));
    onSave(patch);
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onCancel}
    >
      <div
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 14, padding: 24, width: '100%', maxWidth: 380, boxShadow: '0 24px 48px rgba(0,0,0,0.4)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(77,124,255,0.1)', border: '1px solid rgba(77,124,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Pencil size={15} strokeWidth={2} style={{ color: 'var(--blue-400)' }} />
          </div>
          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 15, fontWeight: 600, margin: 0 }}>{t('assetDetail.editEntryTitle')}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, margin: 0 }}>{t('assetDetail.editEntryDesc')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>{t('assetDetail.editEntryDate')}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle} required />
          </div>

          {showPrice && (
            <div>
              <label style={labelStyle}>{t('assetDetail.entryFieldPricePerUnit')}</label>
              <input type="number" value={pricePerUnit} onChange={(e) => setPricePerUnit(e.target.value)} style={fieldStyle} step="any" min="0" placeholder="0" />
            </div>
          )}

          {showUnits && (
            <div>
              <label style={labelStyle}>{t('assetDetail.editEntryUnits')}</label>
              <input type="number" value={units} onChange={(e) => setUnits(e.target.value)} style={fieldStyle} step="any" min="0" placeholder="0" />
            </div>
          )}

          {showAmount && (
            <div>
              <label style={labelStyle}>{t('assetDetail.entryFieldNominal')}</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={fieldStyle} step="any" min="0" placeholder="0" />
            </div>
          )}

          <div>
            <label style={labelStyle}>{t('assetDetail.entryFieldNotes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={t('assetDetail.editEntryNotesPlaceholder')}
              style={{ ...fieldStyle, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button type="button" variant="secondary" size="md" onClick={onCancel} style={{ flex: 1 }}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" size="md" loading={isSaving} style={{ flex: 1 }}>{t('common.save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
