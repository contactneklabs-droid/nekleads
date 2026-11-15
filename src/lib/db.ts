import { v4 as uuidv4 } from 'uuid';

export interface Candidate {
  id: string;
  name: string;
  phone: string;
  type: string;
  location: string;
  gender?: string;
  createdAt: string;
  syncStatus?: 'synced' | 'pending';
}

export interface EventItem {
  id: string;
  name: string;
  date: string; // "2026-11-27"
  location: string;
  staffRequired?: string;
  status: 'Confirmed' | 'Pending' | 'Planning';
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: 'lead' | 'event' | 'area' | 'backup';
  title: string;
  description: string;
  timestamp: string;
}

const STORAGE_KEY = 'nek_leads_candidates';
const QUEUE_KEY = 'nek_leads_offline_queue';
const EVENTS_KEY = 'nek_leads_events';
const ACTIVITIES_KEY = 'nek_leads_activities';

export const logActivity = (type: ActivityItem['type'], title: string, description: string) => {
  try {
    const list = getActivities();
    const item: ActivityItem = {
      id: uuidv4(),
      type,
      title,
      description,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(ACTIVITIES_KEY, JSON.stringify([item, ...list].slice(0, 20)));
  } catch (e) {}
};

export const getActivities = (): ActivityItem[] => {
  const data = localStorage.getItem(ACTIVITIES_KEY);
  if (data) return JSON.parse(data);
  const initial: ActivityItem[] = [
    { id: '1', type: 'lead', title: 'New client lead added', description: 'Photography · Bangalore', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: '2', type: 'event', title: 'Volunteer assigned', description: 'Event · Whitefield', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { id: '3', type: 'area', title: 'Area created', description: 'Indiranagar', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
    { id: '4', type: 'event', title: 'Event updated', description: '27 Nov · 2 Hostess · Guest Welcome', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString() }
  ];
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(initial));
  return initial;
};

export const getEvents = (): EventItem[] => {
  const data = localStorage.getItem(EVENTS_KEY);
  if (data) return JSON.parse(data);
  const initial: EventItem[] = [
    { id: 'ev-1', name: 'Corporate Event', date: '2026-11-27', location: 'Bangalore', staffRequired: '2 Hostess', status: 'Confirmed', createdAt: new Date().toISOString() },
    { id: 'ev-2', name: 'Product Launch', date: '2026-11-30', location: 'Whitefield', staffRequired: '4 Volunteers', status: 'Pending', createdAt: new Date().toISOString() },
    { id: 'ev-3', name: 'Private Event', date: '2026-12-05', location: 'Indiranagar', staffRequired: '3 Hostess', status: 'Planning', createdAt: new Date().toISOString() }
  ];
  localStorage.setItem(EVENTS_KEY, JSON.stringify(initial));
  return initial;
};

export const saveEvent = (event: Omit<EventItem, 'id' | 'createdAt'>): EventItem => {
  const newEv: EventItem = {
    ...event,
    id: uuidv4(),
    createdAt: new Date().toISOString()
  };
  const list = getEvents();
  localStorage.setItem(EVENTS_KEY, JSON.stringify([newEv, ...list]));
  logActivity('event', `Event created: ${newEv.name}`, `${newEv.location} · ${newEv.staffRequired || 'General'}`);
  return newEv;
};

export const deleteEvent = (id: string) => {
  const list = getEvents();
  localStorage.setItem(EVENTS_KEY, JSON.stringify(list.filter(e => e.id !== id)));
};

// Basic wrapper around local storage
export const getCandidates = (): Candidate[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

// Queue operations for offline support
const getQueue = (): any[] => {
  const q = localStorage.getItem(QUEUE_KEY);
  return q ? JSON.parse(q) : [];
};

const pushToQueue = (operation: any) => {
  const q = getQueue();
  q.push({ ...operation, timestamp: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
};

export const saveCandidate = (candidate: Omit<Candidate, 'id' | 'createdAt' | 'syncStatus'>): Candidate => {
  const newCandidate: Candidate = {
    ...candidate,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    syncStatus: navigator.onLine ? 'synced' : 'pending' // Simplified for prototype
  };
  
  const current = getCandidates();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...current, newCandidate]));
  
  // Push to offline queue
  pushToQueue({ type: 'CREATE', payload: newCandidate });
  logActivity('lead', 'New lead added', `${newCandidate.name} · ${newCandidate.location || newCandidate.type}`);
  
  return newCandidate;
};

export const updateCandidate = (id: string, updates: Partial<Candidate>): Candidate => {
  const current = getCandidates();
  const index = current.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Not found');
  
  const updated: Candidate = { 
    ...current[index], 
    ...updates, 
    syncStatus: navigator.onLine ? 'synced' : 'pending' 
  };
  current[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  
  pushToQueue({ type: 'UPDATE', payload: { id, updates } });
  
  return updated;
};

export const deleteCandidate = (id: string) => {
  const current = getCandidates();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current.filter(c => c.id !== id)));
  
  pushToQueue({ type: 'DELETE', payload: { id } });
};

// Mock sync function to simulate pushing queue to Cloudflare Worker
export const syncQueue = async () => {
  if (!navigator.onLine) return { success: false, reason: 'offline' };
  
  const q = getQueue();
  if (q.length === 0) return { success: true, syncedCount: 0 };
  
  // Here we would fetch('https://worker.nekleads.com/api/sync', { body: JSON.stringify(q) })
  console.log('Syncing queue to Cloudflare Worker:', q);
  
  // Clear queue after successful sync
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
  
  // Mark all pending as synced
  const current = getCandidates();
  const synced = current.map(c => ({ ...c, syncStatus: 'synced' as const }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(synced));
  
  return { success: true, syncedCount: q.length };
};
