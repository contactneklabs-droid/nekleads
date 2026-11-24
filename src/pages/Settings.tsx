import React, { useRef, useState, useEffect } from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  Globe, 
  Upload, 
  FileSpreadsheet,
  FileJson,
  FileText,
  RefreshCw, 
  Trash2, 
  Info, 
  ChevronRight, 
  ShieldCheck, 
  ShieldAlert, 
  X,
  Lock,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { useAppLock } from '../contexts/AppLockContext';
import { getCandidates, saveCandidate, syncQueue } from '../lib/db';
import { exportLeadsAsJson, exportLeadsAsExcel, exportLeadsAsCsv, downloadInstantBackup } from '../lib/backup';

interface ParsedLead {
  name: string;
  phone: string;
  type: 'Volunteer' | 'Hostess' | 'Manpower' | 'Client';
  location: string;
  gender: 'Male' | 'Female';
}

export default function Settings() {
  const { addToast } = useToast();
  const { confirm, showAlert } = useDialog();
  const { isEnabled, enableLock, disableLock, changePin } = useAppLock();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [leadCount, setLeadCount] = useState(0);
  const [importPreview, setImportPreview] = useState<{
    fileName: string;
    totalRows: number;
    validLeads: ParsedLead[];
    duplicateCount: number;
    invalidCount: number;
  } | null>(null);

  useEffect(() => {
    setLeadCount(getCandidates().length);
  }, [isImportExportModalOpen, importPreview]);

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

  // Robust field extraction helper for JSON, Excel, CSV
  const parseRawLead = (row: any): ParsedLead | null => {
    if (!row || typeof row !== 'object') return null;

    const getVal = (...keys: string[]): string => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
          return String(row[k]).trim();
        }
      }
      const lowerRow: Record<string, any> = {};
      for (const [rk, rv] of Object.entries(row)) {
        lowerRow[rk.trim().toLowerCase()] = rv;
      }
      for (const k of keys) {
        const lk = k.trim().toLowerCase();
        if (lowerRow[lk] !== undefined && lowerRow[lk] !== null && String(lowerRow[lk]).trim() !== '') {
          return String(lowerRow[lk]).trim();
        }
      }
      return '';
    };

    const rawName = getVal('name', 'fullname', 'full name', 'candidate name', 'candidate', 'student name', 'person name', 'lead name', 'user', 'first name');
    const rawPhone = getVal('phone', 'phonenumber', 'phone number', 'mobile', 'mobilenumber', 'mobile number', 'contact', 'contact number', 'whatsapp', 'cell', 'phone no', 'contact no', 'mobile no', 'number');
    const rawType = getVal('type', 'role', 'category', 'work type', 'designation', 'position', 'crew');
    const rawLocation = getVal('location', 'area', 'city', 'address', 'landmark', 'place');
    const rawGender = getVal('gender', 'sex');

    if (!rawName || !rawPhone) return null;

    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }
    if (cleanPhone.length > 10) {
      cleanPhone = cleanPhone.slice(-10);
    }

    if (cleanPhone.length !== 10) return null;

    let role: 'Volunteer' | 'Hostess' | 'Manpower' | 'Client' = 'Volunteer';
    const roleLower = rawType.toLowerCase();
    if (roleLower.includes('hostess')) role = 'Hostess';
    else if (roleLower.includes('manpower') || roleLower.includes('crew') || roleLower.includes('staff')) role = 'Manpower';
    else if (roleLower.includes('client')) role = 'Client';

    return {
      name: rawName,
      phone: cleanPhone,
      type: role,
      location: rawLocation || 'Bangalore',
      gender: rawGender.toLowerCase().startsWith('f') ? 'Female' : 'Male'
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const content = evt.target?.result as string;
          const parsed = JSON.parse(content);
          
          let rows: any[] = [];
          if (Array.isArray(parsed)) {
            rows = parsed;
          } else if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.candidates)) rows = parsed.candidates;
            else if (Array.isArray(parsed.leads)) rows = parsed.leads;
            else if (Array.isArray(parsed.data)) rows = parsed.data;
            else if (Array.isArray(parsed.responses)) rows = parsed.responses;
            else if (Array.isArray(parsed.items)) rows = parsed.items;
            else if (Array.isArray(parsed.results)) rows = parsed.results;
            else {
              const vals = Object.values(parsed);
              if (vals.length > 0 && typeof vals[0] === 'object') {
                rows = vals;
              }
            }
          }

          analyzeAndSetImport(rows, file.name);
        } catch {
          showAlert({
            title: 'Invalid JSON File',
            message: 'Could not parse the selected file. Please ensure it contains valid JSON formatted data.',
            buttonText: 'OK'
          });
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

        analyzeAndSetImport(data, file.name);
      } catch {
        showAlert({
          title: 'File Read Error',
          message: 'Could not read the spreadsheet. Please make sure the Excel or CSV file is not corrupted.',
          buttonText: 'OK'
        });
      }
    };
    reader.readAsBinaryString(file);
  };

  const analyzeAndSetImport = (rawRows: any[], fileName: string) => {
    if (!rawRows || rawRows.length === 0) {
      showAlert({
        title: 'No Data Found',
        message: 'The selected file does not contain any readable records or array data.',
        buttonText: 'OK'
      });
      return;
    }

    const current = getCandidates();
    const existingPhones = new Set(current.map(c => c.phone));
    const seenInFile = new Set<string>();

    const validLeads: ParsedLead[] = [];
    let duplicateCount = 0;
    let invalidCount = 0;

    for (const row of rawRows) {
      const parsed = parseRawLead(row);
      if (!parsed) {
        invalidCount++;
        continue;
      }

      if (existingPhones.has(parsed.phone) || seenInFile.has(parsed.phone)) {
        duplicateCount++;
        continue;
      }

      seenInFile.add(parsed.phone);
      validLeads.push(parsed);
    }

    setIsImportExportModalOpen(false);
    setImportPreview({
      fileName,
      totalRows: rawRows.length,
      validLeads,
      duplicateCount,
      invalidCount
    });
  };

  const commitImport = () => {
    if (!importPreview || importPreview.validLeads.length === 0) {
      setImportPreview(null);
      return;
    }

    let saved = 0;
    for (const lead of importPreview.validLeads) {
      saveCandidate({
        name: lead.name,
        phone: lead.phone,
        type: lead.type,
        location: lead.location,
        gender: lead.gender
      });
      saved++;
    }

    // Notify other components & update count
    window.dispatchEvent(new CustomEvent('nek-data-updated'));
    setLeadCount(getCandidates().length);

    showAlert({
      title: 'Import Successful',
      message: `Successfully added ${saved} lead${saved === 1 ? '' : 's'} to your directory.${importPreview.duplicateCount > 0 ? ` (${importPreview.duplicateCount} duplicate${importPreview.duplicateCount === 1 ? '' : 's'} skipped)` : ''}`,
      buttonText: 'Done'
    });

    setImportPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportJson = () => {
    const count = exportLeadsAsJson();
    if (count === 0) {
      showAlert({
        title: 'No Leads to Export',
        message: 'Your directory has no leads yet. Add or import leads first.',
        buttonText: 'OK'
      });
      return;
    }
    addToast('success', `Exported ${count} leads as JSON!`);
  };

  const handleExportExcel = () => {
    const count = exportLeadsAsExcel();
    if (count === 0) {
      showAlert({
        title: 'No Leads to Export',
        message: 'Your directory has no leads yet. Add or import leads first.',
        buttonText: 'OK'
      });
      return;
    }
    addToast('success', `Exported ${count} leads as Excel (.xlsx)!`);
  };

  const handleExportCsv = () => {
    const count = exportLeadsAsCsv();
    if (count === 0) {
      showAlert({
        title: 'No Leads to Export',
        message: 'Your directory has no leads yet. Add or import leads first.',
        buttonText: 'OK'
      });
      return;
    }
    addToast('success', `Exported ${count} leads as CSV!`);
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
          fontFamily: "var(--font-tech, 'Space Grotesk', sans-serif)",
          fontSize: '11px', 
          letterSpacing: '1.8px', 
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
          marginBottom: '4px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '2px' }}>ACCOUNT</span>
          <span style={{ opacity: 0.35 }}>/</span>
          <span style={{ fontWeight: 300, letterSpacing: '1.6px' }}>SETTINGS</span>
        </div>
        <h1 style={{ 
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
          fontSize: '36px', 
          fontWeight: 800, 
          letterSpacing: '-1.4px', 
          lineHeight: 1.05,
          margin: '2px 0 4px 0',
          color: 'var(--color-text-primary)'
        }}>
          Settings
        </h1>
        <p style={{ 
          fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
          fontSize: '14px', 
          color: 'var(--color-text-secondary)', 
          margin: 0,
          lineHeight: 1.4
        }}>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Manage</span>{' '}
          <span style={{ fontWeight: 300 }}>your account, app preferences and data.</span>
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
            onClick={() => setIsImportExportModalOpen(true)}
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
              <ArrowUpDown size={18} color="var(--color-text-primary)" />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>Import & Export Leads</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                {leadCount} leads
              </span>
              <ChevronRight size={18} color="var(--color-text-secondary)" />
            </div>
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

      {/* IMPORT / EXPORT MAIN MODAL */}
      {isImportExportModalOpen && (
        <div 
          className="modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) setIsImportExportModalOpen(false); }}
          style={{ zIndex: 4000 }}
        >
          <div 
            className="modal-content" 
            style={{ maxWidth: '480px', width: '92%', padding: '22px', borderRadius: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <ArrowUpDown size={18} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                    Import & Export
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
                    {leadCount} leads in your local database
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsImportExportModalOpen(false)}
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* EXPORT SECTION */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                letterSpacing: '0.8px', 
                color: 'var(--color-text-secondary)', 
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '10px'
              }}>
                Export Database ({leadCount} Leads)
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleExportJson}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '14px 8px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <FileJson size={22} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>JSON</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Full Backup</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '14px 8px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <FileSpreadsheet size={22} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Excel</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Spreadsheet</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '14px 8px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    color: 'var(--color-text-primary)'
                  }}
                >
                  <FileText size={22} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>CSV</span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Plain Table</span>
                </button>
              </div>
            </div>

            {/* IMPORT SECTION */}
            <div>
              <label style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                letterSpacing: '0.8px', 
                color: 'var(--color-text-secondary)', 
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '10px'
              }}>
                Import Leads
              </label>

              <div 
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '1.5px dashed var(--color-border-hover)',
                  borderRadius: '16px',
                  padding: '24px 16px',
                  textAlign: 'center',
                  backgroundColor: 'var(--color-bg-secondary)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-input-bg)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px auto'
                }}>
                  <Upload size={20} color="var(--color-text-primary)" />
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                  Select File to Import
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  Supports <strong>JSON</strong>, <strong>Excel (.xlsx)</strong>, or <strong>CSV</strong>
                </div>
                <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>Google Forms JSON</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>NEK Backups</span>
                  <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', background: 'var(--color-input-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>Auto-deduplication</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW IMPORT MODAL */}
      {importPreview && (
        <div className="modal-overlay" style={{ zIndex: 5000 }}>
          <div className="modal-content" style={{ maxWidth: '440px', width: '92%', padding: '22px', borderRadius: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={18} color="var(--color-success)" />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Review Import</h2>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, wordBreak: 'break-all' }}>
                  {importPreview.fileName}
                </p>
              </div>
            </div>

            {/* Metrics cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '18px' }}>
              <div style={{
                padding: '12px',
                borderRadius: '14px',
                backgroundColor: 'rgba(56, 142, 60, 0.08)',
                border: '1px solid rgba(56, 142, 60, 0.25)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-success)' }}>
                  {importPreview.validLeads.length}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-success)' }}>
                  Ready to Import
                </div>
              </div>

              <div style={{
                padding: '12px',
                borderRadius: '14px',
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--color-text-secondary)' }}>
                  {importPreview.duplicateCount}
                </div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  Duplicates Skipped
                </div>
              </div>
            </div>

            {importPreview.invalidCount > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                padding: '10px 12px', 
                borderRadius: '12px', 
                backgroundColor: 'var(--color-bg-secondary)', 
                border: '1px solid var(--color-border)', 
                fontSize: '12px', 
                color: 'var(--color-text-secondary)',
                marginBottom: '18px' 
              }}>
                <AlertCircle size={16} />
                <span>{importPreview.invalidCount} incomplete row(s) missing name or valid 10-digit phone skipped.</span>
              </div>
            )}

            {importPreview.validLeads.length === 0 ? (
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
                  No new leads found to import. All rows in this file are either already in your database or invalid.
                </p>
                <button
                  onClick={() => setImportPreview(null)}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  Close
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => setImportPreview(null)} 
                  className="btn btn-secondary" 
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={commitImport} 
                  className="btn btn-primary" 
                  style={{ flex: 1.5 }}
                >
                  Import {importPreview.validLeads.length} Leads
                </button>
              </div>
            )}
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
