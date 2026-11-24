import React, { useRef, useState } from 'react';
import { 
  Upload, 
  FileSpreadsheet,
  FileJson,
  FileText,
  RefreshCw, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  X,
  Lock,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  User,
  Database
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { useAppLock } from '../contexts/AppLockContext';
import { getCandidates, saveCandidate, syncQueue, Candidate } from '../lib/db';
import { exportLeadsAsJson, exportLeadsAsExcel, exportLeadsAsCsv, downloadInstantBackup } from '../lib/backup';

interface ParsedLead {
  name: string;
  phone: string;
  type: 'Volunteer' | 'Hostess' | 'Manpower' | 'Client';
  location: string;
  gender: 'Male' | 'Female';
}

interface DesktopSettingsProps {
  candidates: Candidate[];
  onRefreshData: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const DesktopSettings: React.FC<DesktopSettingsProps> = ({
  candidates,
  onRefreshData,
  theme,
  toggleTheme
}) => {
  const { addToast } = useToast();
  const { confirm, showAlert } = useDialog();
  const { isEnabled, enableLock, disableLock } = useAppLock();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    fileName: string;
    totalRows: number;
    validLeads: ParsedLead[];
    duplicateCount: number;
    invalidCount: number;
  } | null>(null);

  // Profile info
  const [profile, setProfile] = useState({
    name: localStorage.getItem('nek_profile_name') || 'NEK Operations',
    email: localStorage.getItem('nek_profile_email') || 'operations@nekleads.com'
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfile, setTempProfile] = useState(profile);

  // App Lock Passcode modal state
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePin, setDisablePin] = useState('');
  const [pinForm, setPinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' });
  const [pinError, setPinError] = useState('');

  const handleSaveProfile = () => {
    localStorage.setItem('nek_profile_name', tempProfile.name);
    localStorage.setItem('nek_profile_email', tempProfile.email);
    setProfile(tempProfile);
    setIsEditingProfile(false);
    addToast('success', 'Profile details saved');
  };

  // Import handling
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        let parsedRows: any[] = [];

        if (file.name.endsWith('.json')) {
          const json = JSON.parse(text);
          parsedRows = Array.isArray(json) ? json : (json.leads || json.candidates || []);
        } else if (file.name.endsWith('.csv')) {
          const lines = text.split('\n').filter(l => l.trim().length > 0);
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
            parsedRows = lines.slice(1).map(line => {
              const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
              const obj: any = {};
              headers.forEach((h, i) => { obj[h] = values[i] || ''; });
              return obj;
            });
          }
        }

        const existingPhoneSet = new Set(getCandidates().map(c => c.phone.replace(/\D/g, '').slice(-10)));
        const validLeads: ParsedLead[] = [];
        let duplicateCount = 0;
        let invalidCount = 0;

        for (const row of parsedRows) {
          const rawPhone = String(row.phone || row.mobile || row.contact || row['phone number'] || '');
          const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

          if (!cleanPhone || cleanPhone.length !== 10) {
            invalidCount++;
            continue;
          }

          if (existingPhoneSet.has(cleanPhone)) {
            duplicateCount++;
            continue;
          }

          const rawName = String(row.name || row['full name'] || 'Unknown Lead').trim();
          const rawType = String(row.type || row.role || row.category || 'Volunteer').trim().toLowerCase();
          let type: 'Volunteer' | 'Hostess' | 'Manpower' | 'Client' = 'Volunteer';
          if (rawType.includes('host')) type = 'Hostess';
          else if (rawType.includes('man') || rawType.includes('crew')) type = 'Manpower';
          else if (rawType.includes('client')) type = 'Client';

          const gender: 'Male' | 'Female' = String(row.gender || '').toLowerCase().includes('fem') ? 'Female' : 'Male';
          const location = String(row.location || row.city || row.area || 'Bangalore').trim();

          existingPhoneSet.add(cleanPhone);
          validLeads.push({
            name: rawName,
            phone: cleanPhone,
            type,
            location,
            gender
          });
        }

        setImportPreview({
          fileName: file.name,
          totalRows: parsedRows.length,
          validLeads,
          duplicateCount,
          invalidCount
        });
        setIsImportModalOpen(true);
      } catch (err: any) {
        showAlert({ title: 'Import Error', message: 'Failed to read file: ' + (err.message || 'Invalid format') });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!importPreview || importPreview.validLeads.length === 0) return;

    importPreview.validLeads.forEach(lead => {
      saveCandidate({
        name: lead.name,
        phone: lead.phone,
        type: lead.type,
        location: lead.location,
        gender: lead.gender
      });
    });

    addToast('success', `Imported ${importPreview.validLeads.length} leads successfully`);
    setIsImportModalOpen(false);
    setImportPreview(null);
    onRefreshData();
  };

  const handleSyncWithCloud = async () => {
    try {
      const res = await syncQueue();
      if (res && (res as any).syncedCount && (res as any).syncedCount > 0) {
        addToast('success', `Synced ${(res as any).syncedCount} offline actions with cloud!`);
      } else {
        addToast('info', 'All leads are already in sync');
      }
    } catch {
      addToast('error', 'Sync failed. Check connection.');
    }
  };

  const handleClearAllData = async () => {
    const isConfirmed = await confirm({
      title: 'Clear All Leads & System Data?',
      description: 'This will completely remove all candidates and reset database. Make sure you have downloaded a JSON or Excel backup before proceeding.',
      confirmLabel: 'Yes, Reset Everything',
      cancelLabel: 'Cancel',
      destructive: true
    });

    if (isConfirmed) {
      localStorage.removeItem('nek_leads_candidates');
      localStorage.removeItem('nek_leads_activities');
      localStorage.removeItem('nek_leads_offline_queue');
      addToast('success', 'Database cleared successfully');
      onRefreshData();
    }
  };

  return (
    <main className="desktop-main-pane">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--desktop-border)', paddingBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Settings & System Preferences
          </div>
          <div style={{ fontSize: '13px', color: 'var(--desktop-text-secondary)', marginTop: '2px' }}>
            Manage database backups, import/export, security passcode, and workspace settings.
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* CARD 1: Data Backup & Export */}
        <div style={{
          backgroundColor: 'var(--desktop-card-bg)',
          border: '1px solid var(--desktop-border)',
          borderRadius: '16px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--desktop-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={18} color="var(--desktop-text-primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Backup & Export Data</div>
              <div style={{ fontSize: '12px', color: 'var(--desktop-text-muted)' }}>{candidates.length} total registered records</div>
            </div>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--desktop-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Export your complete directory with full contact metadata in Excel (.xlsx), standard JSON, or universal CSV.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => { exportLeadsAsExcel(); addToast('success', 'Excel file exported'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--desktop-border)',
                background: 'var(--desktop-card-subtle)',
                color: 'var(--desktop-text-primary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <FileSpreadsheet size={15} color="#10B981" />
              Excel (.xlsx)
            </button>

            <button
              onClick={() => { exportLeadsAsJson(); addToast('success', 'JSON backup saved'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--desktop-border)',
                background: 'var(--desktop-card-subtle)',
                color: 'var(--desktop-text-primary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <FileJson size={15} color="#3B82F6" />
              JSON Backup
            </button>

            <button
              onClick={() => { exportLeadsAsCsv(); addToast('success', 'CSV file exported'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--desktop-border)',
                background: 'var(--desktop-card-subtle)',
                color: 'var(--desktop-text-primary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <FileText size={15} color="#F59E0B" />
              CSV Format
            </button>

            <button
              onClick={() => { downloadInstantBackup(); addToast('success', 'Instant Full Snapshot created'); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid var(--desktop-border)',
                background: 'var(--desktop-card-subtle)',
                color: 'var(--desktop-text-primary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <ArrowUpDown size={15} color="#EC4899" />
              Full Snapshot
            </button>
          </div>
        </div>

        {/* CARD 2: Import Leads File */}
        <div style={{
          backgroundColor: 'var(--desktop-card-bg)',
          border: '1px solid var(--desktop-border)',
          borderRadius: '16px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--desktop-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={18} color="var(--desktop-text-primary)" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>Import External Leads</div>
              <div style={{ fontSize: '12px', color: 'var(--desktop-text-muted)' }}>Auto-deduplicates against existing phone numbers</div>
            </div>
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--desktop-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Upload Google Forms export, JSON file, or CSV sheet. Built-in smart deduplication prevents duplicate numbers.
          </p>

          <input 
            type="file" 
            ref={fileInputRef} 
            accept=".json,.csv" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload} 
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '11px',
              borderRadius: '8px',
              border: '1px dashed var(--desktop-border-hover)',
              background: 'var(--desktop-card-subtle)',
              color: 'var(--desktop-text-primary)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              marginTop: 'auto'
            }}
          >
            <Upload size={16} />
            Choose JSON or CSV File to Import
          </button>
        </div>

        {/* CARD 3: App Security & Passcode */}
        <div style={{
          backgroundColor: 'var(--desktop-card-bg)',
          border: '1px solid var(--desktop-border)',
          borderRadius: '16px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--desktop-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Lock size={18} color="var(--desktop-text-primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Security & Passcode</div>
                <div style={{ fontSize: '12px', color: isEnabled ? '#10B981' : 'var(--desktop-text-muted)' }}>
                  {isEnabled ? 'App Lock is Active' : 'Passcode Disabled'}
                </div>
              </div>
            </div>

            {isEnabled ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#10B981', fontWeight: 700 }}>
                <ShieldCheck size={16} /> Protected
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--desktop-text-muted)', fontWeight: 600 }}>
                <ShieldAlert size={16} /> Off
              </span>
            )}
          </div>

          <p style={{ fontSize: '12.5px', color: 'var(--desktop-text-secondary)', margin: 0, lineHeight: 1.5 }}>
            Require a 4-digit security PIN on application launch to safeguard candidate personal contact info.
          </p>

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            {isEnabled ? (
              <button
                onClick={() => { setDisablePin(''); setPinError(''); setIsDisableModalOpen(true); }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '8px',
                  border: '1px solid var(--desktop-border)',
                  background: 'var(--desktop-card-subtle)',
                  color: '#EF4444',
                  fontWeight: 600,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Disable Passcode
              </button>
            ) : (
              <button
                onClick={() => { setIsLockModalOpen(true); setPinError(''); setPinForm({ currentPin: '', newPin: '', confirmPin: '' }); }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '8px',
                  border: '1px solid var(--desktop-border)',
                  background: 'var(--desktop-accent)',
                  color: 'var(--desktop-card-bg)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                Set 4-Digit Passcode
              </button>
            )}
          </div>
        </div>

        {/* CARD 4: Organization Profile & Appearance */}
        <div style={{
          backgroundColor: 'var(--desktop-card-bg)',
          border: '1px solid var(--desktop-border)',
          borderRadius: '16px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: 'var(--desktop-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={18} color="var(--desktop-text-primary)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>Workspace & Profile</div>
                <div style={{ fontSize: '12px', color: 'var(--desktop-text-muted)' }}>{profile.name}</div>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--desktop-border)',
                background: 'var(--desktop-card-subtle)',
                color: 'var(--desktop-text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {theme === 'dark' ? <Sun size={14} color="#F59E0B" /> : <Moon size={14} color="#6366F1" />}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>

          {isEditingProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                type="text"
                placeholder="Organization / Workspace Name"
                value={tempProfile.name}
                onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--desktop-border)',
                  background: 'var(--desktop-card-subtle)',
                  color: 'var(--desktop-text-primary)',
                  fontSize: '13px'
                }}
              />
              <input
                type="email"
                placeholder="Admin Email"
                value={tempProfile.email}
                onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--desktop-border)',
                  background: 'var(--desktop-card-subtle)',
                  color: 'var(--desktop-text-primary)',
                  fontSize: '13px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSaveProfile}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'var(--desktop-accent)',
                    color: 'var(--desktop-card-bg)',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingProfile(false)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'transparent',
                    color: 'var(--desktop-text-muted)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 700 }}>{profile.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--desktop-text-muted)' }}>{profile.email}</div>
              </div>
              <button
                onClick={() => { setTempProfile(profile); setIsEditingProfile(true); }}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--desktop-text-primary)',
                  background: 'transparent',
                  border: '1px solid var(--desktop-border)',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Edit
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
            <button
              onClick={handleSyncWithCloud}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px',
                borderRadius: '8px',
                border: '1px solid var(--desktop-border)',
                background: 'var(--desktop-card-subtle)',
                color: 'var(--desktop-text-primary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              Sync Online Queue
            </button>

            <button
              onClick={handleClearAllData}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                background: 'rgba(239, 68, 68, 0.06)',
                color: '#EF4444',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <Trash2 size={14} />
              Reset DB
            </button>
          </div>
        </div>
      </div>

      {/* MODAL: Import Preview */}
      {isImportModalOpen && importPreview && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--desktop-card-bg)',
            border: '1px solid var(--desktop-border)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            padding: '26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={20} color="#10B981" />
                <div style={{ fontSize: '18px', fontWeight: 800 }}>Import Preview</div>
              </div>
              <button 
                onClick={() => { setIsImportModalOpen(false); setImportPreview(null); }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--desktop-text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: 'var(--desktop-text-secondary)' }}>
              Analyzed <strong>{importPreview.fileName}</strong> containing <strong>{importPreview.totalRows}</strong> rows:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>NEW LEADS</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#10B981' }}>{importPreview.validLeads.length}</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 700 }}>DUPLICATES</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#EF4444' }}>{importPreview.duplicateCount}</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <div style={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700 }}>INVALID</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#F59E0B' }}>{importPreview.invalidCount}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                onClick={() => { setIsImportModalOpen(false); setImportPreview(null); }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid var(--desktop-border)',
                  background: 'var(--desktop-card-subtle)',
                  color: 'var(--desktop-text-primary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={importPreview.validLeads.length === 0}
                onClick={handleConfirmImport}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: importPreview.validLeads.length > 0 ? 'var(--desktop-accent)' : '#999',
                  color: 'var(--desktop-card-bg)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: importPreview.validLeads.length > 0 ? 'pointer' : 'not-allowed'
                }}
              >
                Import {importPreview.validLeads.length} Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Passcode Setup */}
      {isLockModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--desktop-card-bg)',
            border: '1px solid var(--desktop-border)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '420px',
            padding: '26px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Lock size={18} />
                <div style={{ fontSize: '17px', fontWeight: 800 }}>Set 4-Digit Passcode</div>
              </div>
              <button onClick={() => setIsLockModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--desktop-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {pinError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontSize: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '8px 12px', borderRadius: '8px' }}>
                <AlertCircle size={14} />
                {pinError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--desktop-text-secondary)', display: 'block', marginBottom: '4px' }}>NEW 4-DIGIT PIN</label>
                <input 
                  type="password" 
                  maxLength={4}
                  value={pinForm.newPin}
                  onChange={(e) => setPinForm({ ...pinForm, newPin: e.target.value.replace(/\D/g, '') })}
                  placeholder="••••"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--desktop-border)', background: 'var(--desktop-card-subtle)', color: 'var(--desktop-text-primary)', fontSize: '18px', textAlign: 'center', letterSpacing: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--desktop-text-secondary)', display: 'block', marginBottom: '4px' }}>CONFIRM PIN</label>
                <input 
                  type="password" 
                  maxLength={4}
                  value={pinForm.confirmPin}
                  onChange={(e) => setPinForm({ ...pinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                  placeholder="••••"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--desktop-border)', background: 'var(--desktop-card-subtle)', color: 'var(--desktop-text-primary)', fontSize: '18px', textAlign: 'center', letterSpacing: '8px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => setIsLockModalOpen(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--desktop-border)', background: 'var(--desktop-card-subtle)', color: 'var(--desktop-text-primary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pinForm.newPin.length !== 4) {
                    setPinError('Passcode must be exactly 4 digits');
                    return;
                  }
                  if (pinForm.newPin !== pinForm.confirmPin) {
                    setPinError('Passcodes do not match');
                    return;
                  }
                  enableLock(pinForm.newPin);
                  addToast('success', 'Passcode enabled');
                  setIsLockModalOpen(false);
                }}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--desktop-accent)', color: 'var(--desktop-card-bg)', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Disable Passcode */}
      {isDisableModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'var(--desktop-card-bg)',
            border: '1px solid var(--desktop-border)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '380px',
            padding: '24px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 800 }}>Enter Current PIN to Disable</div>
              <button onClick={() => setIsDisableModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--desktop-text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            {pinError && (
              <div style={{ color: '#EF4444', fontSize: '12px', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '8px', borderRadius: '6px' }}>
                {pinError}
              </div>
            )}

            <input 
              type="password" 
              maxLength={4}
              value={disablePin}
              onChange={(e) => setDisablePin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--desktop-border)', background: 'var(--desktop-card-subtle)', color: 'var(--desktop-text-primary)', fontSize: '18px', textAlign: 'center', letterSpacing: '8px' }}
            />

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                onClick={() => setIsDisableModalOpen(false)}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: '1px solid var(--desktop-border)', background: 'var(--desktop-card-subtle)', color: 'var(--desktop-text-primary)', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const success = disableLock(disablePin);
                  if (success) {
                    addToast('info', 'App lock passcode disabled');
                    setIsDisableModalOpen(false);
                  } else {
                    setPinError('Incorrect PIN');
                  }
                }}
                style={{ flex: 1, padding: '9px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
              >
                Disable
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};
