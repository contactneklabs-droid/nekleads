import { getCandidates } from './db';

/**
 * 1-Tap Instant Backup to Device
 * Generates and triggers download of the full database as timestamped JSON
 */
export const downloadInstantBackup = (): number => {
  const data = getCandidates();
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

