import React, { useRef, useState } from 'react';
import { Upload, FileJson, Lock, KeyRound, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { useAppLock } from '../contexts/AppLockContext';
import { getCandidates, saveCandidate } from '../lib/db';
import * as XLSX from 'xlsx';

export default function Settings() {
  const { addToast } = useToast();
  const { confirm } = useDialog();
  const { isEnabled, enableLock, disableLock, changePin, lockNow } = useAppLock();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<any>(null);

  // App Lock Modal States
  const [activeModal, setActiveModal] = useState<'setup' | 'change' | 'disable' | null>(null);
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: ''
  });
  const [modalError, setModalError] = useState('');

  const resetPinForm = () => {
    setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
    setModalError('');
    setActiveModal(null);
  };

  const handleEnableLock = () => {
    if (pinForm.newPin.length !== 4 || !/^\d{4}$/.test(pinForm.newPin)) {
      setModalError('Passcode must be exactly 4 digits');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setModalError('Passcodes do not match');
      return;
    }
    const success = enableLock(pinForm.newPin);
    if (success) {
      addToast('success', 'App Lock enabled with 4-digit passcode');
      resetPinForm();
    } else {
      setModalError('Failed to enable App Lock');
    }
  };

  const handleChangePin = () => {
    if (pinForm.currentPin.length !== 4) {
      setModalError('Please enter your 4-digit current passcode');
      return;
    }
    if (pinForm.newPin.length !== 4 || !/^\d{4}$/.test(pinForm.newPin)) {
      setModalError('New passcode must be exactly 4 digits');
      return;
    }
    if (pinForm.newPin !== pinForm.confirmPin) {
      setModalError('New passcodes do not match');
      return;
    }
    const success = changePin(pinForm.currentPin, pinForm.newPin);
    if (success) {
      addToast('success', 'Passcode updated successfully');
      resetPinForm();
    } else {
      setModalError('Current passcode is incorrect');
    }
  };

  const handleDisableLock = () => {
    if (pinForm.currentPin.length !== 4) {
      setModalError('Enter your 4-digit passcode to confirm');
      return;
    }
    const success = disableLock(pinForm.currentPin);
    if (success) {
      addToast('info', 'App Lock has been disabled');
      resetPinForm();
    } else {
      setModalError('Incorrect passcode');
    }
  };

  const handleExportJSON = () => {
    const data = getCandidates();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nek-leads-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('success', 'Data exported successfully');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const json = JSON.parse(evt.target?.result as string);
          setImportStatus({
            total: Array.isArray(json) ? json.length : 0,
            valid: 0,
            duplicates: 0,
            data: Array.isArray(json) ? json : []
          });
        } catch (err) {
          addToast('error', 'Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        setImportStatus({
          total: data.length,
          valid: 0,
          duplicates: 0,
          data
        });

      } catch (err) {
        addToast('error', 'Failed to parse file');
      }
    };
    reader.readAsBinaryString(file);
  };

  const processImport = async () => {
    if (!importStatus?.data) return;

    const ok = await confirm({
      title: 'Confirm Import',
      description: `You are about to import ${importStatus.data.length} records. Proceed?`,
      confirmLabel: 'Import'
    });

    if (ok) {
      let imported = 0;
      let duplicates = 0;
      const current = getCandidates();
      
      for (const row of importStatus.data) {
        const phone = row.Phone || row.phone || row['Phone Number'];
        const name = row.Name || row.name;
        const type = row.Type || row.type || row.Category || 'Volunteer';
        const location = row.Location || row.location || row.Landmark || 'Unknown';
        
        if (!name || !phone) continue;

        const isDuplicate = current.some(c => c.phone === String(phone)) || 
                            importStatus.data.some((d: any) => d !== row && String(d.Phone) === String(phone));
        
        if (isDuplicate) {
          duplicates++;
          continue;
        }

        saveCandidate({
          name: String(name),
          phone: String(phone),
          type: String(type),
          location: String(location)
        });
        imported++;
      }

      addToast('success', `Import completed. ${imported} imported, ${duplicates} duplicates skipped.`);
      setImportStatus(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: 4 }}>System Settings</h1>
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
          Security passcode, data backups, and team imports
        </div>
      </div>
      
      <div className="responsive-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* COLUMN 1: APP LOCK & SECURITY */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section style={{ 
            backgroundColor: 'var(--color-bg-primary)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '20px', 
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '10px', 
                  backgroundColor: 'var(--color-bg-secondary)', 
                  border: '1px solid var(--color-border)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  <Lock size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '17px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>App Lock</h2>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Security & PIN Protection</div>
                </div>
              </div>

              <span style={{ 
                padding: '4px 10px', 
                borderRadius: '14px', 
                fontSize: '11px', 
                fontWeight: 700, 
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                backgroundColor: isEnabled ? 'var(--color-bg-secondary)' : 'var(--color-bg-secondary)',
                border: `1px solid ${isEnabled ? 'var(--color-primary)' : 'var(--color-border)'}`,
                color: isEnabled ? 'var(--color-text-primary)' : 'var(--color-text-secondary)'
              }}>
                {isEnabled ? '● Active' : '○ Off'}
              </span>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
              {isEnabled
                ? 'App Lock is enabled. Your candidate database and payment drafts are protected by a 4-digit passcode.'
                : 'Require a 4-digit numeric passcode to open the app and protect confidential talent and billing records.'}
            </p>

            {isEnabled ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  className="btn btn-primary" 
                  onClick={lockNow}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                >
                  <ShieldAlert size={16} /> Lock App Now
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { resetPinForm(); setActiveModal('change'); }}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Change PIN
                  </button>
                  <button 
                    className="btn btn-secondary text-danger" 
                    onClick={() => { resetPinForm(); setActiveModal('disable'); }}
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Turn Off
                  </button>
                </div>
              </div>
            ) : (
              <button 
                className="btn btn-primary" 
                onClick={() => { resetPinForm(); setActiveModal('setup'); }}
                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              >
                <KeyRound size={16} /> Set 4-Digit Passcode
              </button>
            )}
          </section>

          {/* DATA EXPORT CARD */}
          <section style={{ 
            backgroundColor: 'var(--color-bg-primary)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '20px', 
            padding: '24px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '10px', 
                backgroundColor: 'var(--color-bg-secondary)', 
                border: '1px solid var(--color-border)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <FileJson size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Data Export</h2>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Portable JSON Backup</div>
              </div>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
              Export your full contact roster, categories, and locations to an offline backup JSON file.
            </p>
            <button className="btn btn-secondary" onClick={handleExportJSON} style={{ width: '100%', justifyContent: 'center' }}>
              <FileJson size={16} /> Export JSON Backup
            </button>
          </section>
        </div>

        {/* COLUMN 2: DATA IMPORT */}
        <div>
          <section style={{ 
            backgroundColor: 'var(--color-bg-primary)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '20px', 
            padding: '24px',
            boxShadow: 'var(--shadow-sm)',
            height: '100%',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '10px', 
                backgroundColor: 'var(--color-bg-secondary)', 
                border: '1px solid var(--color-border)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <Upload size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Data Import</h2>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Excel / CSV / JSON Spreadsheet</div>
              </div>
            </div>

            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
              Bulk upload candidates and manpower lists from event organizers. Automatically skips duplicate phone numbers.
            </p>

            <div style={{ 
              padding: '28px 20px', 
              border: '2px dashed var(--color-border)', 
              borderRadius: '16px', 
              textAlign: 'center',
              backgroundColor: 'var(--color-bg-secondary)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <Upload size={32} style={{ marginBottom: '12px', color: 'var(--color-text-secondary)' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                Select Excel or CSV Spreadsheet
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                Formats supported: .xlsx, .csv, .json
              </div>
              <input 
                type="file" 
                accept=".xlsx,.xls,.csv,.json" 
                style={{ display: 'none' }} 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
                Browse File
              </button>
            </div>

            {importStatus && (
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>Import Preview</div>
                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  Total rows detected: <strong>{importStatus.total}</strong>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }} onClick={processImport}>
                  Proceed with Import
                </button>
              </div>
            )}
          </section>
        </div>

      </div>

      {/* SETUP PASSCODE MODAL */}
      {activeModal === 'setup' && (
        <div 
          className="modal-overlay" 
          onClick={(e) => { if (e.target === e.currentTarget) resetPinForm(); }}
        >
          <div className="modal-content" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} />
                <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Set Passcode</h2>
              </div>
              <button onClick={resetPinForm} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Choose a 4-digit numeric passcode to secure your app.
            </p>

            <div className="form-group">
              <label className="form-label">4-Digit Passcode</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                className="input-field"
                placeholder="••••"
                value={pinForm.newPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinForm({ ...pinForm, newPin: val });
                }}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '12px', fontFamily: 'monospace' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Confirm Passcode</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                className="input-field"
                placeholder="••••"
                value={pinForm.confirmPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinForm({ ...pinForm, confirmPin: val });
                }}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '12px', fontFamily: 'monospace' }}
              />
            </div>

            {modalError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
                {modalError}
              </div>
            )}

            <div className="flex gap-3">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetPinForm}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleEnableLock}>
                Save & Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHANGE PASSCODE MODAL */}
      {activeModal === 'change' && (
        <div 
          className="modal-overlay" 
          onClick={(e) => { if (e.target === e.currentTarget) resetPinForm(); }}
        >
          <div className="modal-content" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} />
                <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Change Passcode</h2>
              </div>
              <button onClick={resetPinForm} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Current Passcode</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                className="input-field"
                placeholder="••••"
                value={pinForm.currentPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinForm({ ...pinForm, currentPin: val });
                }}
                style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '10px', fontFamily: 'monospace' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New 4-Digit Passcode</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                className="input-field"
                placeholder="••••"
                value={pinForm.newPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinForm({ ...pinForm, newPin: val });
                }}
                style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '10px', fontFamily: 'monospace' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Confirm New Passcode</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                className="input-field"
                placeholder="••••"
                value={pinForm.confirmPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinForm({ ...pinForm, confirmPin: val });
                }}
                style={{ textAlign: 'center', fontSize: '22px', letterSpacing: '10px', fontFamily: 'monospace' }}
              />
            </div>

            {modalError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
                {modalError}
              </div>
            )}

            <div className="flex gap-3">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetPinForm}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleChangePin}>
                Update Passcode
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISABLE PASSCODE MODAL */}
      {activeModal === 'disable' && (
        <div 
          className="modal-overlay" 
          onClick={(e) => { if (e.target === e.currentTarget) resetPinForm(); }}
        >
          <div className="modal-content" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={20} />
                <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>Turn Off App Lock</h2>
              </div>
              <button onClick={resetPinForm} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Enter your current 4-digit passcode to disable App Lock.
            </p>

            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Current Passcode</label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                autoFocus
                className="input-field"
                placeholder="••••"
                value={pinForm.currentPin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPinForm({ ...pinForm, currentPin: val });
                }}
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '12px', fontFamily: 'monospace' }}
              />
            </div>

            {modalError && (
              <div style={{ color: 'var(--color-danger)', fontSize: '12px', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
                {modalError}
              </div>
            )}

            <div className="flex gap-3">
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={resetPinForm}>
                Cancel
              </button>
              <button className="btn btn-danger" style={{ flex: 1 }} onClick={handleDisableLock}>
                Turn Off Lock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

