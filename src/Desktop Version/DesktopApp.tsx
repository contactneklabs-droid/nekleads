import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCandidates, getActivities, Candidate, ActivityItem } from '../lib/db';
import { DesktopSidebar } from './DesktopSidebar';
import { DesktopOverview } from './DesktopOverview';
import { DesktopPeople } from './DesktopPeople';
import { DesktopDrafts } from './DesktopDrafts';
import { DesktopRightPanel } from './DesktopRightPanel';
import { QuickAddLeadModal } from '../components/QuickAddLeadModal';
import { PayoutCalculatorModal } from '../components/PayoutCalculatorModal';
import { WhatsAppDirectModal } from '../components/WhatsAppDirectModal';
import './desktop.css';

export default function DesktopApp() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'people' | 'drafts' | 'calculator' | 'settings'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [whatsAppCandidate, setWhatsAppCandidate] = useState<Candidate | null>(null);

  // Theme
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('nek_theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('nek_theme', next);
      if (next === 'dark') {
        document.documentElement.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark-mode');
      }
      return next;
    });
  }, []);

  const loadData = useCallback(() => {
    setCandidates(getCandidates());
    setActivities(getActivities());
  }, []);

  useEffect(() => {
    loadData();

    // Listen for custom data updates
    const handleUpdate = () => loadData();
    window.addEventListener('nek-data-updated', handleUpdate);
    return () => window.removeEventListener('nek-data-updated', handleUpdate);
  }, [loadData]);

  const handleNavigateTab = (tab: 'people' | 'drafts' | 'calculator' | 'settings', category?: string) => {
    if (tab === 'calculator') {
      setIsCalcOpen(true);
      return;
    }
    if (tab === 'settings') {
      navigate('/settings');
      return;
    }
    setActiveTab(tab);
    if (category) setSelectedCategory(category);
  };

  return (
    <div className={`desktop-viewport-wrapper ${theme === 'dark' ? 'dark-theme-desktop' : ''}`}>
      <div className="desktop-outer-shell">
        {/* 1. Left Sidebar */}
        <DesktopSidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === 'calculator') {
              setIsCalcOpen(true);
            } else if (tab === 'settings') {
              navigate('/settings');
            } else {
              setActiveTab(tab);
            }
          }}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          candidates={candidates}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onSwitchToMobile={() => navigate('/dashboard')}
          theme={theme}
          toggleTheme={toggleTheme}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* 2. Main Stage */}
        {activeTab === 'overview' && (
          <DesktopOverview
            candidates={candidates}
            activities={activities}
            onNavigateTab={handleNavigateTab}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activeTab === 'people' && (
          <DesktopPeople
            candidates={candidates}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            onSelectLeadForWhatsApp={(c) => setWhatsAppCandidate(c)}
            onRefreshData={loadData}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {activeTab === 'drafts' && (
          <DesktopDrafts candidates={candidates} />
        )}

        {/* 3. Right Inspector Panel */}
        <DesktopRightPanel
          candidates={candidates}
          activities={activities}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onRefreshData={loadData}
          onSelectLeadForWhatsApp={(c) => setWhatsAppCandidate(c)}
        />
      </div>

      {/* Quick Add Lead Modal (Includes Apple Alert for duplicates) */}
      <QuickAddLeadModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        defaultType={(selectedCategory as any) || 'Volunteer'}
      />

      {/* Payout Calculator Modal */}
      <PayoutCalculatorModal
        isOpen={isCalcOpen}
        onClose={() => setIsCalcOpen(false)}
        onApplyToClientDraft={() => {
          setIsCalcOpen(false);
          setActiveTab('drafts');
        }}
        onApplyToTeamDraft={() => {
          setIsCalcOpen(false);
          setActiveTab('drafts');
        }}
      />

      {/* Direct WhatsApp Messaging Modal */}
      <WhatsAppDirectModal
        isOpen={!!whatsAppCandidate}
        candidate={whatsAppCandidate}
        onClose={() => setWhatsAppCandidate(null)}
      />
    </div>
  );
}
