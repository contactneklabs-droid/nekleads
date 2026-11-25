import { Candidate, saveCandidate, getCandidates } from './db';

const SYNC_TIMESTAMP_KEY = 'nek_leads_last_sync_time';
const GOOGLE_WORKER_URL_KEY = 'nek_google_worker_api_url';

export interface SyncStatus {
  lastSyncTime: string | null;
  isLoading: boolean;
  error: string | null;
  recordCount: number;
}

/**
 * Configure or get the Cloudflare Worker API URL
 */
export const getWorkerApiUrl = (): string => {
  return localStorage.getItem(GOOGLE_WORKER_URL_KEY) || (import.meta as any).env?.VITE_WORKER_API_URL || '';
};

export const setWorkerApiUrl = (url: string) => {
  localStorage.setItem(GOOGLE_WORKER_URL_KEY, url.trim().replace(/\/+$/, ''));
};

export const getLastSyncTime = (): string | null => {
  return localStorage.getItem(SYNC_TIMESTAMP_KEY);
};

/**
 * Fetch latest responses from Google Sheets via Cloudflare Worker
 * Reads response columns, parses duplicates, and caches in local database
 */
export const fetchGoogleSheetsLeads = async (): Promise<{ newCount: number; total: number }> => {
  const workerUrl = getWorkerApiUrl();
  if (!workerUrl) {
    // Return existing data if Worker URL hasn't been configured yet
    return { newCount: 0, total: getCandidates().length };
  }

  const response = await fetch(`${workerUrl}/api/leads`, {
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Google Sheets fetch failed with status: ${response.status}`);
  }

  const result = await response.json();
  const leads: any[] = result.data || result.leads || (Array.isArray(result) ? result : []);

  const existingMap = new Map<string, Candidate>();
  getCandidates().forEach(c => {
    const clean = c.phone.replace(/\D/g, '').slice(-10);
    existingMap.set(clean, c);
  });

  let newCount = 0;
  for (const row of leads) {
    const rawPhone = String(row.phone || row.mobile || row.contact || row['Phone Number'] || '');
    const cleanPhone = rawPhone.replace(/\D/g, '').slice(-10);

    if (!cleanPhone || cleanPhone.length !== 10) continue;

    if (!existingMap.has(cleanPhone)) {
      const rawType = String(row.type || row.role || row.category || row['Category'] || 'Volunteer').toLowerCase();
      let type: string = 'Volunteer';
      if (rawType.includes('host')) type = 'Hostess';
      else if (rawType.includes('man') || rawType.includes('crew')) type = 'Manpower';
      else if (rawType.includes('client')) type = 'Client';

      const rawGender = String(row.gender || row['Gender'] || '').toLowerCase();
      const gender = rawGender.includes('fem') ? 'Female' : 'Male';

      saveCandidate({
        name: String(row.name || row['Name'] || row['Full Name'] || 'Candidate').trim(),
        phone: cleanPhone,
        type,
        location: String(row.location || row.area || row['Location'] || row['Area'] || 'Bangalore').trim(),
        gender
      });
      existingMap.set(cleanPhone, {} as any);
      newCount++;
    }
  }

  localStorage.setItem(SYNC_TIMESTAMP_KEY, new Date().toISOString());
  window.dispatchEvent(new CustomEvent('nek-data-updated'));
  return { newCount, total: getCandidates().length };
};
