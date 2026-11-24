import { getCandidates } from './db';
import * as XLSX from 'xlsx';

/**
 * Export Leads as formatted JSON
 */
export const exportLeadsAsJson = (): number => {
  const data = getCandidates();
  if (data.length === 0) return 0;

  const dateStr = new Date().toISOString().slice(0, 10);
  const timeStr = new Date().toTimeString().slice(0, 5).replace(':', '-');
  const filename = `nek-leads-backup-${dateStr}_${timeStr}.json`;

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return data.length;
};

/**
 * Export Leads as formatted Excel (.xlsx) spreadsheet
 */
export const exportLeadsAsExcel = (): number => {
  const data = getCandidates();
  if (data.length === 0) return 0;

  const rows = data.map((c, i) => ({
    '#': i + 1,
    'Name': c.name,
    'Phone': c.phone,
    'Role': c.type,
    'Location': c.location || 'Bangalore',
    'Gender': c.gender || 'Male',
    'Added On': c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'NEK Leads');
  
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `nek-leads-export-${dateStr}.xlsx`);
  return data.length;
};

/**
 * Export Leads as standard CSV
 */
export const exportLeadsAsCsv = (): number => {
  const data = getCandidates();
  if (data.length === 0) return 0;

  const rows = data.map(c => ({
    'Name': c.name,
    'Phone': c.phone,
    'Role': c.type,
    'Location': c.location || 'Bangalore',
    'Gender': c.gender || 'Male'
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  a.download = `nek-leads-export-${dateStr}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return data.length;
};

export const downloadInstantBackup = exportLeadsAsJson;
