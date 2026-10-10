import React, { useRef, useState } from 'react';
import { Upload, Download, FileJson } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { getCandidates, saveCandidate } from '../lib/db';
import * as XLSX from 'xlsx';

export default function Settings() {
  const { addToast } = useToast();
  const { confirm } = useDialog();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<any>(null);

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
        const type = row.Type || row.type || row.Category || 'Hostess';
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
    <div>
      <h1 className="page-title">Settings</h1>
      
      <div style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Data Export</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Export your complete contact database to a portable JSON format for backup.
          </p>
          <button className="btn btn-secondary" onClick={handleExportJSON}>
            <FileJson size={16} /> Export JSON Backup
          </button>
        </section>

        <section>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '16px' }}>Data Import</h2>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
            Import candidate and manpower records from Excel (.xlsx), CSV, or JSON.
          </p>
          <div style={{ padding: '24px', border: '1px dashed var(--color-border)', borderRadius: '8px', textAlign: 'center' }}>
            <Upload size={32} style={{ margin: '0 auto 16px', color: 'var(--color-text-secondary)' }} />
            <div style={{ marginBottom: '16px' }}>
              Select a file to import records. Supported formats: .xlsx, .csv, .json.
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
            <div style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--color-bg-secondary)', borderRadius: '4px' }}>
              <div style={{ fontWeight: 600, marginBottom: '8px' }}>Import Preview</div>
              <div>Total rows detected: {importStatus.total}</div>
              <button className="btn btn-primary mt-4" onClick={processImport}>
                Proceed with Import
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
