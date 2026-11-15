import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileText, 
  Layers, 
  Send, 
  Search, 
  SlidersHorizontal, 
  Sparkles, 
  Wrench, 
  Briefcase, 
  Clock, 
  MoreHorizontal, 
  Edit3, 
  Copy, 
  MessageCircle, 
  Plus, 
  X, 
  Check, 
  ChevronDown, 
  Trash2, 
  Share2, 
  UserCheck
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useDialog } from '../contexts/DialogContext';
import { getCandidates, Candidate } from '../lib/db';
import { openWhatsAppDirect } from '../lib/whatsapp';
import { CandidatePickerModal } from '../components/CandidatePickerModal';

export interface WhatsAppDraftItem {
  id: string;
  title: string;
  category: 'Volunteer' | 'Hostess' | 'Manpower' | 'Client' | 'General';
  message: string;
  updatedAt: string;
}

interface SentHistoryRecord {
  id: string;
  draftTitle: string;
  recipientName: string;
  recipientPhone: string;
  message: string;
  sentAt: string;
}

const DEFAULT_DRAFTS: WhatsAppDraftItem[] = [
  {
    id: 'draft-1',
    title: 'Event Call - Crew Requirements',
    category: 'Manpower',
    message: 'Hi Team, We are looking for manpower support for the upcoming event on 27th Nov at Whitefield. Reporting: 08:30 AM. Dress code: Black Formals. Please confirm your availability and reporting details.',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'draft-2',
    title: 'Volunteer Confirmation',
    category: 'Volunteer',
    message: 'Your selection is confirmed for the upcoming corporate summit. Please find the venue location, contact person and event briefing details attached below.',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString()
  },
  {
    id: 'draft-3',
    title: 'Hostess Requirement',
    category: 'Hostess',
    message: 'Looking for 2 hostesses for guest welcoming, registration and badge distribution. Date: 27th Nov. Timings: 10 AM to 6 PM. Premium daily payout.',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString()
  },
  {
    id: 'draft-4',
    title: 'Manpower Deployment',
    category: 'Manpower',
    message: 'Crew reporting details and assigned responsibilities for the event. Please arrive 30 mins prior in black formal attire and report directly to Entry Gate 3.',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString()
  },
  {
    id: 'draft-5',
    title: 'Client Advance Payment',
    category: 'Client',
    message: 'Dear Client, Greetings from NEK Leads. Kindly find the staffing invoice for the weekend event. Please process the 50% advance to confirm crew booking.',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
  }
];

const READY_TEMPLATES = [
  {
    id: 'tpl-1',
    title: 'Volunteer Selection & Confirmation',
    category: 'Volunteer' as const,
    description: 'Congratulate candidate and provide venue, reporting time & briefing.',
    content: 'Hi {Name},\n\nYour selection is *CONFIRMED* as a Volunteer for our upcoming event!\n\n📅 *Date:* 27th Nov 2026\n⏰ *Reporting Time:* 08:30 AM\n📍 *Venue:* {Location}\n👔 *Dress Code:* Black formal shirt & trousers\n\nPlease acknowledge this message with "CONFIRMED".'
  },
  {
    id: 'tpl-2',
    title: 'Hostess Briefing & Registration Desk',
    category: 'Hostess' as const,
    description: 'VIP guest reception, registration desk duties & grooming standards.',
    content: 'Hi {Name},\n\nYou have been booked as a *Hostess* for the corporate summit.\n\n📅 *Date:* 27th Nov 2026\n⏰ *Call Time:* 09:00 AM sharp\n📍 *Venue:* {Location}\n💄 *Grooming:* Neat bun, natural makeup, formal western attire\n💰 *Payout:* Daily payout upon event completion\n\nSee you there!'
  },
  {
    id: 'tpl-3',
    title: 'Manpower Deployment & Logistics',
    category: 'Manpower' as const,
    description: 'Stage setup, stall management, logistics and reporting instructions.',
    content: 'Hi {Name},\n\nReporting instructions for *Manpower Support*:\n\n📅 *Date:* 27th Nov 2026\n⏰ *Reporting Time:* 08:00 AM\n📍 *Location:* {Location}\n👷 *Role:* Logistics & Stall Assistance\n👤 *Supervisor on Ground:* Ravi (+91 98765 43210)\n\nPlease arrive on time. Food & refreshments provided.'
  },
  {
    id: 'tpl-4',
    title: 'Client Staffing Invoice & Advance',
    category: 'Client' as const,
    description: 'Professional advance payment request with bank / UPI details.',
    content: 'Dear {Name},\n\nThank you for choosing NEK Leads for your event staffing requirement.\n\nAttached is the crew deployment schedule and proforma invoice. Kindly process the *50% booking advance* via UPI to `payments@neklabs` to lock in the crew.\n\nBest regards,\nNEK Leads Operations Team'
  },
  {
    id: 'tpl-5',
    title: 'Post-Event Payout Confirmation',
    category: 'Volunteer' as const,
    description: 'Payment completion receipt with reference ID and thank you note.',
    content: 'Hi {Name},\n\nYour payout of *₹{Amount}* for the event has been successfully processed via UPI!\n\n✅ *Status:* Completed\n🔗 *Ref ID:* NEK-PAY-9821\n\nThank you for your fantastic work! Looking forward to working with you on future events.'
  }
];

export default function WhatsAppDrafts() {
  const { addToast } = useToast();
  const { confirm } = useDialog();

  // Top View Switcher: Drafts | Templates | Sent
  const [activeTab, setActiveTab] = useState<'drafts' | 'templates' | 'sent'>('drafts');

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Volunteer' | 'Hostess' | 'Manpower' | 'Client'>('All');
  const [sortBy, setSortBy] = useState<'lastEdited' | 'newest' | 'title'>('lastEdited');
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Drafts State
  const [drafts, setDrafts] = useState<WhatsAppDraftItem[]>([]);
  const [sentHistory, setSentHistory] = useState<SentHistoryRecord[]>([]);

  // Modals & Action States
  const [editingDraft, setEditingDraft] = useState<WhatsAppDraftItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeMenuDraft, setActiveMenuDraft] = useState<WhatsAppDraftItem | null>(null);
  const [targetDraftForSend, setTargetDraftForSend] = useState<WhatsAppDraftItem | null>(null);

  // Candidate Direct Sending
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isCandidatePickerOpen, setIsCandidatePickerOpen] = useState(false);
  const [manualPhoneInput, setManualPhoneInput] = useState('');
  const [isManualPhoneModalOpen, setIsManualPhoneModalOpen] = useState(false);

  // Editor Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<WhatsAppDraftItem['category']>('Volunteer');
  const [formMessage, setFormMessage] = useState('');
  const messageTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedDrafts = localStorage.getItem('nek_whatsapp_drafts');
      if (storedDrafts) {
        setDrafts(JSON.parse(storedDrafts));
      } else {
        setDrafts(DEFAULT_DRAFTS);
        localStorage.setItem('nek_whatsapp_drafts', JSON.stringify(DEFAULT_DRAFTS));
      }

      const storedHistory = localStorage.getItem('nek_draft_history');
      if (storedHistory) {
        setSentHistory(JSON.parse(storedHistory));
      }

      setCandidates(getCandidates());
    } catch {
      console.warn('Could not read cached drafts');
      setDrafts(DEFAULT_DRAFTS);
    }
  }, []);

  // Save drafts to localStorage
  const saveDraftsToStorage = (updated: WhatsAppDraftItem[]) => {
    setDrafts(updated);
    localStorage.setItem('nek_whatsapp_drafts', JSON.stringify(updated));
  };

  // Helper for date formatting matching reference: "14 Nov 2026 · 10:24 AM"
  const formatDraftDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      const day = String(d.getDate()).padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short' });
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${day} ${month} ${year} · ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    } catch {
      return 'Recently';
    }
  };

  // Filtered & Sorted Drafts
  const filteredDrafts = useMemo(() => {
    return drafts
      .filter(d => {
        const matchesCategory = activeCategory === 'All' || d.category === activeCategory;
        if (!matchesCategory) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          d.title.toLowerCase().includes(q) ||
          d.message.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (sortBy === 'title') return a.title.localeCompare(b.title);
        if (sortBy === 'newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [drafts, activeCategory, searchQuery, sortBy]);

  // Filtered Templates
  const filteredTemplates = useMemo(() => {
    return READY_TEMPLATES.filter(t => {
      const matchesCategory = activeCategory === 'All' || t.category === activeCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q)
      );
    });
  }, [activeCategory, searchQuery]);

  // Open Draft Editor
  const handleOpenEditor = (draft?: WhatsAppDraftItem) => {
    if (draft) {
      setEditingDraft(draft);
      setFormTitle(draft.title);
      setFormCategory(draft.category);
      setFormMessage(draft.message);
    } else {
      setEditingDraft(null);
      setFormTitle('');
      setFormCategory(activeCategory === 'All' ? 'Volunteer' : activeCategory);
      setFormMessage('');
    }
    setIsEditorOpen(true);
  };

  // Save Draft (Create or Update)
  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formMessage.trim()) {
      addToast('error', 'Please enter a title and message');
      return;
    }

    if (editingDraft) {
      const updated = drafts.map(d => 
        d.id === editingDraft.id 
          ? { ...d, title: formTitle.trim(), category: formCategory, message: formMessage.trim(), updatedAt: new Date().toISOString() }
          : d
      );
      saveDraftsToStorage(updated);
      addToast('success', `Draft "${formTitle.trim()}" updated!`);
    } else {
      const newDraft: WhatsAppDraftItem = {
        id: `draft-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        message: formMessage.trim(),
        updatedAt: new Date().toISOString()
      };
      saveDraftsToStorage([newDraft, ...drafts]);
      addToast('success', `New draft "${formTitle.trim()}" created!`);
    }

    setIsEditorOpen(false);
  };

  // Duplicate Draft
  const handleDuplicateDraft = (draft: WhatsAppDraftItem) => {
    const duplicated: WhatsAppDraftItem = {
      id: `draft-${Date.now()}`,
      title: `${draft.title} (Copy)`,
      category: draft.category,
      message: draft.message,
      updatedAt: new Date().toISOString()
    };
    saveDraftsToStorage([duplicated, ...drafts]);
    addToast('success', `Duplicated "${draft.title}"`);
    setActiveMenuDraft(null);
  };

  // Delete Draft
  const handleDeleteDraft = async (draft: WhatsAppDraftItem) => {
    const confirmed = await confirm({
      title: 'Delete Draft?',
      description: `Are you sure you want to delete "${draft.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      destructive: true
    });
    if (confirmed) {
      const updated = drafts.filter(d => d.id !== draft.id);
      saveDraftsToStorage(updated);
      addToast('success', `Deleted "${draft.title}"`);
      setActiveMenuDraft(null);
    }
  };

  // Copy Draft to Clipboard
  const handleCopyDraft = (draft: WhatsAppDraftItem) => {
    navigator.clipboard.writeText(draft.message);
    addToast('success', 'Message copied to clipboard!');
  };

  // Use Template as New Draft
  const handleUseTemplate = (tpl: typeof READY_TEMPLATES[0]) => {
    setEditingDraft(null);
    setFormTitle(tpl.title);
    setFormCategory(tpl.category);
    setFormMessage(tpl.content);
    setIsEditorOpen(true);
    setActiveTab('drafts');
    addToast('success', `Template "${tpl.title}" loaded!`);
  };

  // Insert Variable Tag into Textarea
  const handleInsertTag = (tag: string) => {
    if (!messageTextareaRef.current) {
      setFormMessage(prev => prev + tag);
      return;
    }
    const textarea = messageTextareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formMessage;
    const updated = text.substring(0, start) + tag + text.substring(end);
    setFormMessage(updated);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length, start + tag.length);
    }, 50);
  };

  // Send on WhatsApp Action
  const handleSendPrompt = (draft: WhatsAppDraftItem) => {
    setTargetDraftForSend(draft);
    if (candidates.length > 0) {
      setIsCandidatePickerOpen(true);
    } else {
      setIsManualPhoneModalOpen(true);
    }
  };

  // Execute Send to Candidate
  const handleSendToCandidate = (candidate: Candidate) => {
    if (!targetDraftForSend) return;
    setIsCandidatePickerOpen(false);

    // Replace dynamic tags with candidate details
    const personalizedMessage = targetDraftForSend.message
      .replace(/{Name}/g, candidate.name)
      .replace(/{Location}/g, candidate.location || 'Bangalore')
      .replace(/{Role}/g, candidate.type || 'Crew')
      .replace(/{Amount}/g, '1,200')
      .replace(/{Date}/g, 'Upcoming Event');

    openWhatsAppDirect(candidate.phone, personalizedMessage);

    // Record into sent history
    const sentRecord: SentHistoryRecord = {
      id: `sent-${Date.now()}`,
      draftTitle: targetDraftForSend.title,
      recipientName: candidate.name,
      recipientPhone: candidate.phone,
      message: personalizedMessage,
      sentAt: new Date().toISOString()
    };
    const updatedHistory = [sentRecord, ...sentHistory];
    setSentHistory(updatedHistory);
    localStorage.setItem('nek_draft_history', JSON.stringify(updatedHistory));

    addToast('success', `Opening WhatsApp for ${candidate.name}...`);
  };

  // Execute Direct Phone Send
  const handleSendToManualPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDraftForSend) return;

    const cleanPhone = manualPhoneInput.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      addToast('error', 'Please enter a valid 10-digit phone number');
      return;
    }

    const message = targetDraftForSend.message
      .replace(/{Name}/g, 'Team')
      .replace(/{Location}/g, 'Bangalore');

    openWhatsAppDirect(cleanPhone, message);

    const sentRecord: SentHistoryRecord = {
      id: `sent-${Date.now()}`,
      draftTitle: targetDraftForSend.title,
      recipientName: 'Direct Contact',
      recipientPhone: cleanPhone,
      message,
      sentAt: new Date().toISOString()
    };
    const updatedHistory = [sentRecord, ...sentHistory];
    setSentHistory(updatedHistory);
    localStorage.setItem('nek_draft_history', JSON.stringify(updatedHistory));

    setIsManualPhoneModalOpen(false);
    setManualPhoneInput('');
    addToast('success', 'Opening WhatsApp...');
  };

  // Category Icon Resolver
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Volunteer':
        return <UserCheck size={20} />;
      case 'Hostess':
        return <Sparkles size={20} />;
      case 'Manpower':
        return <Wrench size={20} />;
      case 'Client':
        return <Briefcase size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }}>
      
      {/* 1. SECTION TITLE & KICKER (MATCHING REFERENCE) */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', marginTop: '6px' }}>
        <div>
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
            <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '2px' }}>OPERATIONS</span>
            <span style={{ opacity: 0.35 }}>/</span>
            <span style={{ fontWeight: 300, letterSpacing: '1.6px' }}>COMMUNICATION</span>
          </div>
          <h1 style={{ 
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontSize: '34px', 
            letterSpacing: '-1.4px', 
            lineHeight: 1.05,
            margin: '2px 0 4px 0',
            color: 'var(--color-text-primary)'
          }}>
            <span style={{ fontWeight: 900 }}>WhatsApp</span> <span style={{ fontWeight: 300, opacity: 0.88 }}>Drafts</span>
          </h1>
          <p style={{ 
            fontFamily: "var(--font-display, 'Urbanist', sans-serif)",
            fontSize: '14px', 
            color: 'var(--color-text-secondary)', 
            margin: 0,
            lineHeight: 1.4
          }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Create, manage</span>{' '}
            <span style={{ fontWeight: 300 }}>and send team messages.</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleOpenEditor()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 15px',
            borderRadius: '20px',
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-bg-primary)',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
            flexShrink: 0
          }}
        >
          <Plus size={15} strokeWidth={2.5} />
          <span>New Draft</span>
        </button>
      </div>

      {/* 2. TOP VIEW SWITCHER: DRAFTS | TEMPLATES | SENT (MATCHING REFERENCE) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: '8px', 
        marginBottom: '16px' 
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('drafts')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: activeTab === 'drafts' ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: activeTab === 'drafts' ? 'var(--color-primary)' : 'var(--color-bg-primary)',
            color: activeTab === 'drafts' ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <FileText size={16} />
          <span>Drafts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: activeTab === 'templates' ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: activeTab === 'templates' ? 'var(--color-primary)' : 'var(--color-bg-primary)',
            color: activeTab === 'templates' ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Layers size={16} />
          <span>Templates</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sent')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: '24px',
            border: '1px solid',
            borderColor: activeTab === 'sent' ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: activeTab === 'sent' ? 'var(--color-primary)' : 'var(--color-bg-primary)',
            color: activeTab === 'sent' ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
            fontWeight: 700,
            fontSize: '13.5px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Send size={16} />
          <span>Sent</span>
        </button>
      </div>

      {/* 3. SEARCH BAR & FILTER BUTTON (MATCHING REFERENCE) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        <div style={{ 
          position: 'relative', 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center' 
        }}>
          <Search 
            size={17} 
            style={{ 
              position: 'absolute', 
              left: '14px', 
              color: 'var(--color-text-secondary)',
              pointerEvents: 'none'
            }} 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drafts, templates or messages..."
            className="input-field"
            style={{
              paddingLeft: '40px',
              height: '44px',
              borderRadius: '22px',
              backgroundColor: 'var(--color-bg-primary)',
              fontSize: '13px'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          onClick={() => setShowSortDropdown(!showSortDropdown)}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0
          }}
          title="Filter & Sort"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* 4. CATEGORY HORIZONTAL PILL CHIPS (MATCHING REFERENCE) */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto', 
        paddingBottom: '6px', 
        marginBottom: '16px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      }}>
        {([
          { key: 'All', label: 'All', icon: <Layers size={14} /> },
          { key: 'Volunteer', label: 'Volunteers', icon: <UserCheck size={14} /> },
          { key: 'Hostess', label: 'Hostess', icon: <Sparkles size={14} /> },
          { key: 'Manpower', label: 'Manpower', icon: <Wrench size={14} /> },
          { key: 'Client', label: 'Clients', icon: <Briefcase size={14} /> }
        ] as const).map(tab => {
          const isActive = activeCategory === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveCategory(tab.key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '20px',
                border: '1px solid',
                borderColor: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-bg-primary)',
                color: isActive ? 'var(--color-bg-primary)' : 'var(--color-text-primary)',
                fontSize: '12px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 5. TAB 1 CONTENT: DRAFTS LIST (MATCHING REFERENCE) */}
      {activeTab === 'drafts' && (
        <div>
          {/* Header row: Saved Drafts (count) and Sort Selector */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '12px',
            position: 'relative'
          }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Saved Drafts ({filteredDrafts.length})
            </h2>

            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <span>Sort: {sortBy === 'lastEdited' ? 'Last Edited' : sortBy === 'newest' ? 'Newest' : 'Title'}</span>
              <ChevronDown size={14} />
            </button>

            {/* Sort Dropdown */}
            {showSortDropdown && (
              <div 
                className="dropdown-menu"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '28px',
                  backgroundColor: 'var(--color-bg-primary)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '14px',
                  padding: '6px',
                  boxShadow: 'var(--shadow-md)',
                  zIndex: 100,
                  minWidth: '150px'
                }}
              >
                {(['lastEdited', 'newest', 'title'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setSortBy(s);
                      setShowSortDropdown(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 10px',
                      background: 'none',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: sortBy === s ? 700 : 500,
                      color: 'var(--color-text-primary)',
                      textAlign: 'left',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{s === 'lastEdited' ? 'Last Edited' : s === 'newest' ? 'Newest' : 'Title (A-Z)'}</span>
                    {sortBy === s && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cards List */}
          {filteredDrafts.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 16px',
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: '20px',
              border: '1px dashed var(--color-border)'
            }}>
              <FileText size={36} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: '8px' }} />
              <p style={{ fontWeight: 700, fontSize: '15px' }}>No drafts found</p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                Tap the + button to create a new WhatsApp draft.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredDrafts.map(draft => (
                <div
                  key={draft.id}
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    borderRadius: '18px',
                    border: '1px solid var(--color-border)',
                    boxShadow: 'var(--shadow-sm)',
                    padding: '14px 14px 10px 14px',
                    transition: 'border-color 0.15s ease'
                  }}
                >
                  {/* Top: Icon Box, Title, Category Badge, Snippet, Timestamp, ••• */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {/* Left Icon Square */}
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      backgroundColor: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-text-primary)',
                      flexShrink: 0
                    }}>
                      {getCategoryIcon(draft.category)}
                    </div>

                    {/* Middle Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontSize: '14.5px', 
                          fontWeight: 800, 
                          color: 'var(--color-text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {draft.title}
                        </span>
                        <span style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-secondary)',
                          border: '1px solid var(--color-border)'
                        }}>
                          {draft.category}
                        </span>
                      </div>

                      {/* Preview Snippet */}
                      <p style={{
                        fontSize: '12.5px',
                        color: 'var(--color-text-secondary)',
                        margin: '4px 0 6px 0',
                        lineHeight: 1.4,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {draft.message}
                      </p>

                      {/* Timestamp */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--color-text-secondary)', fontSize: '11px' }}>
                        <Clock size={12} />
                        <span>{formatDraftDate(draft.updatedAt)}</span>
                      </div>
                    </div>

                    {/* Right ••• More Actions Button */}
                    <button
                      onClick={() => setActiveMenuDraft(activeMenuDraft?.id === draft.id ? null : draft)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-text-secondary)',
                        padding: '4px',
                        cursor: 'pointer'
                      }}
                      title="More Options"
                    >
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  {/* Context Actions Dropdown (If ••• tapped) */}
                  {activeMenuDraft?.id === draft.id && (
                    <div style={{
                      margin: '10px 0 6px 0',
                      padding: '8px',
                      backgroundColor: 'var(--color-bg-secondary)',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => {
                            handleOpenEditor(draft);
                            setActiveMenuDraft(null);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11.5px', gap: '4px' }}
                        >
                          <Edit3 size={12} /> Edit Full
                        </button>
                        <button
                          onClick={() => handleDuplicateDraft(draft)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11.5px', gap: '4px' }}
                        >
                          <Copy size={12} /> Duplicate
                        </button>
                      </div>
                      <button
                        onClick={() => handleDeleteDraft(draft)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  )}

                  {/* Bottom Action Bar: Edit · Duplicate · Copy | WhatsApp (Clean Responsive Spacing) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--color-border)',
                    marginTop: '10px',
                    paddingTop: '8px',
                    minWidth: 0,
                    gap: '6px'
                  }}>
                    {/* Left Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditor(draft)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-primary)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          padding: 0,
                          flexShrink: 0
                        }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDuplicateDraft(draft)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-primary)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          padding: 0,
                          flexShrink: 0
                        }}
                      >
                        <Copy size={13} />
                        <span>Duplicate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyDraft(draft)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-primary)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          padding: 0,
                          flexShrink: 0
                        }}
                      >
                        <Share2 size={13} />
                        <span>Copy</span>
                      </button>
                    </div>

                    {/* Divider & Send on WhatsApp */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--color-border)', flexShrink: 0 }} />
                      
                      <button
                        type="button"
                        onClick={() => handleSendPrompt(draft)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--color-text-primary)',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          cursor: 'pointer',
                          padding: 0,
                          flexShrink: 0,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <MessageCircle size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span>WhatsApp</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. TAB 2 CONTENT: READY TEMPLATES */}
      {activeTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ marginBottom: '4px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Staffing & Client Templates ({filteredTemplates.length})
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
              One-click templates ready to customize and dispatch.
            </p>
          </div>

          {filteredTemplates.map(tpl => (
            <div
              key={tpl.id}
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: '18px',
                border: '1px solid var(--color-border)',
                padding: '16px',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-primary)'
                  }}>
                    {getCategoryIcon(tpl.category)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '14.5px', fontWeight: 800, margin: 0 }}>{tpl.title}</h3>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{tpl.description}</span>
                  </div>
                </div>
                <span style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)'
                }}>
                  {tpl.category}
                </span>
              </div>

              {/* Template Preview Box */}
              <div style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderRadius: '12px',
                padding: '12px',
                fontSize: '12px',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                lineHeight: 1.45,
                marginBottom: '12px'
              }}>
                {tpl.content}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(tpl.content);
                    addToast('success', 'Template text copied!');
                  }}
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '8px 12px' }}
                >
                  <Copy size={13} /> Copy Text
                </button>
                <button
                  onClick={() => handleUseTemplate(tpl)}
                  className="btn btn-primary"
                  style={{ fontSize: '12px', padding: '8px 14px' }}
                >
                  Use This Template
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7. TAB 3 CONTENT: SENT HISTORY */}
      {activeTab === 'sent' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
              Sent WhatsApp Messages ({sentHistory.length})
            </h2>
            {sentHistory.length > 0 && (
              <button
                onClick={() => {
                  setSentHistory([]);
                  localStorage.removeItem('nek_draft_history');
                  addToast('info', 'Sent history cleared');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Clear History
              </button>
            )}
          </div>

          {sentHistory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 16px',
              backgroundColor: 'var(--color-bg-primary)',
              borderRadius: '20px',
              border: '1px dashed var(--color-border)'
            }}>
              <Send size={36} style={{ color: 'var(--color-text-secondary)', opacity: 0.5, marginBottom: '8px' }} />
              <p style={{ fontWeight: 700, fontSize: '15px' }}>No sent messages recorded</p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '12px', marginTop: '2px' }}>
                Messages dispatched via "Send on WhatsApp" will appear here.
              </p>
            </div>
          ) : (
            sentHistory.map(record => (
              <div
                key={record.id}
                style={{
                  backgroundColor: 'var(--color-bg-primary)',
                  borderRadius: '16px',
                  border: '1px solid var(--color-border)',
                  padding: '14px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontSize: '14px', fontWeight: 800 }}>{record.recipientName}</span>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '8px' }}>
                      {record.recipientPhone}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    {formatDraftDate(record.sentAt)}
                  </span>
                </div>

                <div style={{
                  fontSize: '12.5px',
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  margin: '6px 0',
                  lineHeight: 1.4
                }}>
                  {record.message}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(record.message);
                      addToast('success', 'Message copied!');
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '11.5px', padding: '6px 10px' }}
                  >
                    <Copy size={12} /> Copy
                  </button>
                  <button
                    onClick={() => {
                      openWhatsAppDirect(record.recipientPhone, record.message);
                      addToast('success', 'Opening WhatsApp...');
                    }}
                    className="btn btn-primary"
                    style={{ fontSize: '11.5px', padding: '6px 12px' }}
                  >
                    <MessageCircle size={13} /> Resend
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 8. CREATE / EDIT DRAFT MODAL */}
      {isEditorOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsEditorOpen(false)}
          style={{ zIndex: 3200 }}
        >
          <div 
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '480px', width: '92%', borderRadius: '24px', padding: '22px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                  {editingDraft ? 'Edit WhatsApp Draft' : 'Create New Draft'}
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  Compose & format your crew/client message
                </span>
              </div>
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="btn btn-secondary"
                style={{ width: '32px', height: '32px', padding: 0, borderRadius: '50%' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveDraft} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Draft Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Volunteer Call - Nov 27"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="input-field"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="form-label">Target Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="input-field"
                >
                  <option value="Volunteer">Volunteer</option>
                  <option value="Hostess">Hostess</option>
                  <option value="Manpower">Manpower</option>
                  <option value="Client">Client</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Message Body *</label>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    {formMessage.length} characters
                  </span>
                </div>

                {/* Variable Quick-Insert Tags */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  {['{Name}', '{Location}', '{Role}', '{Date}', '{Amount}'].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleInsertTag(tag)}
                      style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--color-border)',
                        backgroundColor: 'var(--color-bg-secondary)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        cursor: 'pointer'
                      }}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={messageTextareaRef}
                  rows={6}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Type your message here... Use *bold* or _italic_ for WhatsApp formatting."
                  className="input-field"
                  style={{ resize: 'vertical', lineHeight: 1.45 }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(formMessage);
                      addToast('success', 'Draft copied to clipboard!');
                    }}
                    className="btn btn-secondary"
                  >
                    Copy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Save Draft
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. CANDIDATE PICKER MODAL (When sending to an existing lead) */}
      <CandidatePickerModal
        isOpen={isCandidatePickerOpen}
        onClose={() => setIsCandidatePickerOpen(false)}
        candidates={candidates}
        selectedId=""
        onSelect={handleSendToCandidate}
      />

      {/* 11. MANUAL PHONE SEND MODAL (Fallback when no candidate chosen) */}
      {isManualPhoneModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => setIsManualPhoneModalOpen(false)}
          style={{ zIndex: 3300 }}
        >
          <div 
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '380px', width: '90%', borderRadius: '22px', padding: '20px' }}
          >
            <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 12px 0' }}>
              Send on WhatsApp
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 14px 0' }}>
              Enter the recipient's phone number with or without country code.
            </p>

            <form onSubmit={handleSendToManualPhone} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Phone Number *</label>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: 700,
                    color: manualPhoneInput.length === 10 ? '#10b981' : manualPhoneInput.length > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)' 
                  }}>
                    {manualPhoneInput.length}/10 digits
                  </span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={manualPhoneInput}
                  onChange={(e) => setManualPhoneInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="input-field"
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsManualPhoneModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  Open WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
