import React, { useRef, useState, useEffect } from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Upload, 
  RefreshCw, 
  Trash2, 
  Info, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  X,
  Lock
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { useAppLock } from '../contexts/AppLockContext';
import { getCandidates, saveCandidate, syncQueue } from '../lib/db';
import { downloadInstantBackup } from '../lib/backup';

export default function Settings() {
  const { addToast } = useToast();
  const { confirm } = useDialog();
  const { isEnabled, enableLock, disableLock, changePin } = useAppLock();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<any>(null);

  // Profile info
  const [profile, setProfile] = useState({
    name: localStorage.getItem('nek_profile_name') || 'NEK Operations',
    email: localStorage.getItem('nek_profile_email') || 'operations@nekleads.com'
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Appearance state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('nek_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
    localStorage.setItem('nek_theme', theme);
  }, [theme]);

  const toggleAppearance = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

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

  // Backup & Sync
  const handleBackupAndSync = async () => {
    const count = downloadInstantBackup();
    const syncRes = await syncQueue();
    if (syncRes.success) {
      addToast('success', `Backed up ${count} records & synced ${syncRes.syncedCount} changes.`);
    } else {
      addToast('success', `Backed up ${count} records to device!`);
    }
  };

  // Import / Export
  const handleImportExport = () => {
    fileInputRef.current?.click();
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
        } catch {
          addToast('error', 'Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx');
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
      } catch {
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

  // Delete / Reset All Data
  const handleDeleteAllData = async () => {
    const ok = await confirm({
      title: 'Delete All Data?',
      description: 'This will permanently erase all locally stored candidates and drafts from this device. Download a backup first!',
      confirmLabel: 'Erase Everything',
      destructive: true
    });
    if (!ok) return;

    localStorage.removeItem('nek_leads_candidates');
    localStorage.removeItem('nek_leads_events');
    localStorage.removeItem('nek_leads_activities');
    localStorage.removeItem('nek_leads_offline_queue');
    addToast('info', 'All data has been cleared from local storage.');
    setTimeout(() => window.location.reload(), 400);
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '0 4px 60px 4px' }}>
      
      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept=".json,.xlsx,.csv" 
        style={{ display: 'none' }} 
      />

      {/* 1. HEADER */}
      <div style={{ marginBottom: '18px', paddingTop: '4px' }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          letterSpacing: '0.8px', 
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase'
        }}>
          ACCOUNT
        </div>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: 800, 
          letterSpacing: '-0.6px', 
          margin: '2px 0 2px 0',
          color: 'var(--color-text-primary)'
        }}>
          Settings
        </h1>
        <p style={{ 
          fontSize: '13px', 
          color: 'var(--color-text-secondary)', 
          margin: 0 
        }}>
          Manage your account, app preferences and data.
        </p>
      </div>

      {/* 2. USER PROFILE CARD */}
      <div 
        onClick={() => setIsProfileModalOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: '18px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          cursor: 'pointer',
          marginBottom: '22px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-bg-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '17px',
            flexShrink: 0
          }}>
            N
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {profile.name}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {profile.email}
            </div>
          </div>
        </div>
        <ChevronRight size={18} color="var(--color-text-secondary)" />
      </div>

      {/* 3. PREFERENCES SECTION (INSET GROUPED CARD) */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          letterSpacing: '0.8px', 
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          marginBottom: '8px',
          marginLeft: '4px'
        }}>
          PREFERENCES
        </div>

        <div style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          {/* Notifications */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={18} color="var(--color-text-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Notifications</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </div>

          {/* Appearance */}
          <div 
            onClick={toggleAppearance}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Appearance</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>
                {theme}
              </span>
              <ChevronRight size={18} color="var(--color-text-secondary)" />
            </div>
          </div>

          {/* Security & App Lock */}
          <div 
            onClick={() => setActiveModal(isEnabled ? 'change' : 'setup')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isEnabled ? <ShieldCheck size={18} color="#10b981" /> : <ShieldAlert size={18} color="var(--color-text-secondary)" />}
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Security Passcode</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12.5px', color: isEnabled ? '#10b981' : 'var(--color-text-secondary)', fontWeight: 600 }}>
                {isEnabled ? 'Enabled' : 'Off'}
              </span>
              <ChevronRight size={18} color="var(--color-text-secondary)" />
            </div>
          </div>

          {/* Language */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Globe size={18} color="var(--color-text-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Language</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>English</span>
              <ChevronRight size={18} color="var(--color-text-secondary)" />
            </div>
          </div>
        </div>
      </div>

      {/* 4. DATA SECTION (INSET GROUPED CARD) */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          letterSpacing: '0.8px', 
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          marginBottom: '8px',
          marginLeft: '4px'
        }}>
          DATA
        </div>

        <div style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          {/* Import / Export */}
          <div 
            onClick={handleImportExport}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Upload size={18} color="var(--color-text-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Import / Export</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </div>

          {/* Backup & Sync */}
          <div 
            onClick={handleBackupAndSync}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              borderBottom: '1px solid var(--color-border)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RefreshCw size={18} color="var(--color-text-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Backup & Sync</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </div>

          {/* Delete Data */}
          <div 
            onClick={handleDeleteAllData}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Trash2 size={18} color="#ef4444" />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#ef4444' }}>Delete Data</span>
            </div>
            <ChevronRight size={18} color="var(--color-text-secondary)" />
          </div>
        </div>
      </div>

      {/* 5. ABOUT SECTION */}
      <div style={{ marginBottom: '22px' }}>
        <div style={{ 
          fontSize: '11px', 
          fontWeight: 700, 
          letterSpacing: '0.8px', 
          color: 'var(--color-text-secondary)',
          textTransform: 'uppercase',
          marginBottom: '8px',
          marginLeft: '4px'
        }}>
          ABOUT
        </div>

        <div style={{
          backgroundColor: 'var(--color-bg-primary)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden'
        }}>
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info size={18} color="var(--color-text-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>About NEK LEADS</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>v1.0.0</span>
              <ChevronRight size={18} color="var(--color-text-secondary)" />
            </div>
          </div>
        </div>
      </div>

      {/* PROFILE EDIT MODAL */}
      {isProfileModalOpen && (
        <div className="modal-overlay" onClick={() => setIsProfileModalOpen(false)}>
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '400px', width: '90%', padding: '20px', borderRadius: '20px' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>Edit Operator Profile</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile({ ...profile, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile({ ...profile, email: e.target.value })}
                  className="input-field"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  onClick={() => setIsProfileModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem('nek_profile_name', profile.name);
                    localStorage.setItem('nek_profile_email', profile.email);
                    addToast('success', 'Profile updated');
                    setIsProfileModalOpen(false);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IMPORT PREVIEW MODAL */}
      {importStatus && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '440px', width: '90%', padding: '20px', borderRadius: '20px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '10px' }}>Review Import</h2>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
              Found <strong>{importStatus.total}</strong> records ready to import.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={() => setImportStatus(null)} 
                className="btn btn-secondary" 
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                onClick={processImport} 
                className="btn btn-primary" 
                style={{ flex: 1 }}
              >
                Confirm Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APP LOCK MODAL */}
      {activeModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px', width: '90%', padding: '20px', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} />
                <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                  {activeModal === 'setup' ? 'Enable Passcode' : activeModal === 'change' ? 'Change Passcode' : 'Disable Passcode'}
                </h2>
              </div>
              <button onClick={resetPinForm} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {modalError && (
              <div style={{ padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px', fontSize: '12px', marginBottom: '12px' }}>
                {modalError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeModal !== 'setup' && (
                <div>
                  <label className="form-label">Current 4-Digit Passcode</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinForm.currentPin}
                    onChange={e => setPinForm({ ...pinForm, currentPin: e.target.value.replace(/\D/g, '') })}
                    className="input-field"
                    autoFocus
                  />
                </div>
              )}

              {activeModal !== 'disable' && (
                <>
                  <div>
                    <label className="form-label">New 4-Digit Passcode</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinForm.newPin}
                      onChange={e => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="form-label">Confirm New Passcode</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={pinForm.confirmPin}
                      onChange={e => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                      className="input-field"
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                {activeModal === 'change' && (
                  <button
                    onClick={() => setActiveModal('disable')}
                    className="btn btn-danger"
                    style={{ flex: 1, fontSize: '13px' }}
                  >
                    Turn Off
                  </button>
                )}
                <button
                  onClick={activeModal === 'setup' ? handleEnableLock : activeModal === 'change' ? handleChangePin : handleDisableLock}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {activeModal === 'setup' ? 'Enable' : activeModal === 'change' ? 'Update' : 'Disable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
