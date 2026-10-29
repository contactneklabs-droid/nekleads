import React, { useState } from 'react';
import { 
  Calculator, 
  X, 
  ArrowRight, 
  Copy, 
  MessageCircle, 
  Check 
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { openWhatsAppDirect } from '../lib/whatsapp';

export interface PayoutCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyToClientDraft?: (data: { clientName: string; eventName: string; totalAmount: string; note: string }) => void;
  onApplyToTeamDraft?: (data: { eventName: string; amountPaid: string; remarks: string }) => void;
}

export const PayoutCalculatorModal: React.FC<PayoutCalculatorModalProps> = ({
  isOpen,
  onClose,
  onApplyToClientDraft,
  onApplyToTeamDraft
}) => {
  const { addToast } = useToast();

  const [eventName, setEventName] = useState('');
  const [clientName, setClientName] = useState('');
  const [crewCount, setCrewCount] = useState<number | ''>(8);
  const [daysCount, setDaysCount] = useState<number | ''>(2);
  const [crewRatePerDay, setCrewRatePerDay] = useState<number | ''>(1200);
  const [clientRatePerDay, setClientRatePerDay] = useState<number | ''>(1800);
  const [extraClientCharges, setExtraClientCharges] = useState<number | ''>('');
  const [extraCrewExpenses, setExtraCrewExpenses] = useState<number | ''>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Safe numeric values
  const count = Number(crewCount) || 0;
  const days = Number(daysCount) || 0;
  const crewRate = Number(crewRatePerDay) || 0;
  const clientRate = Number(clientRatePerDay) || 0;
  const extraClient = Number(extraClientCharges) || 0;
  const extraCrew = Number(extraCrewExpenses) || 0;

  // Calculations
  const baseCrewPayout = count * days * crewRate;
  const totalCrewPayout = baseCrewPayout + extraCrew;

  const baseClientBilling = count * days * clientRate;
  const totalClientBilling = baseClientBilling + extraClient;

  const grossProfit = totalClientBilling - totalCrewPayout;
  const profitMarginPercent = totalClientBilling > 0 
    ? ((grossProfit / totalClientBilling) * 100).toFixed(1) 
    : '0';
  const profitPerPerson = count > 0 ? Math.round(grossProfit / count) : 0;
  const perPersonTotalPayout = days * crewRate + (count > 0 ? Math.round(extraCrew / count) : 0);

  const formatCurrency = (val: number) => {
    return '₹' + val.toLocaleString('en-IN');
  };

  const generateSummaryText = () => {
    const title = eventName.trim() ? eventName : 'Event Payout Breakdown';
    return `📊 *${title.toUpperCase()} - FINANCIAL SUMMARY*
${clientName ? `🏢 *Client:* ${clientName}\n` : ''}---------------------------------
👥 *Crew Count:* ${count}
📅 *Duration:* ${days} ${days === 1 ? 'day/shift' : 'days/shifts'}
💰 *Client Billing Rate:* ${formatCurrency(clientRate)} / person / day
💸 *Crew Payout Rate:* ${formatCurrency(crewRate)} / person / day
${extraClient > 0 ? `➕ *Extra Client Charges:* ${formatCurrency(extraClient)}\n` : ''}${extraCrew > 0 ? `➕ *Extra Crew Expenses:* ${formatCurrency(extraCrew)}\n` : ''}---------------------------------
📈 *TOTAL CLIENT BILLING:* ${formatCurrency(totalClientBilling)}
💳 *TOTAL CREW PAYOUT:* ${formatCurrency(totalCrewPayout)}
⭐ *GROSS AGENCY PROFIT:* ${formatCurrency(grossProfit)} (${profitMarginPercent}%)
👤 *Profit / Member:* ${formatCurrency(profitPerPerson)}
---------------------------------
*Per Member Total Payout:* ${formatCurrency(perPersonTotalPayout)}
Generated via NEK LEADS`;
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(generateSummaryText());
      setCopied(true);
      addToast('success', 'Summary copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('error', 'Failed to copy summary');
    }
  };

  const handleShareWhatsApp = () => {
    openWhatsAppDirect('', generateSummaryText());
  };

  const handleApplyClient = () => {
    if (!onApplyToClientDraft) return;
    onApplyToClientDraft({
      clientName: clientName || 'Valued Client',
      eventName: eventName || 'Event Manpower Service',
      totalAmount: totalClientBilling.toString(),
      note: `${count} Crew Members × ${days} Days @ ${formatCurrency(clientRate)}/day${extraClient > 0 ? ` + ${formatCurrency(extraClient)} additional charges` : ''}`
    });
    addToast('success', 'Populated Client Payment Draft');
    onClose();
  };

  const handleApplyTeam = () => {
    if (!onApplyToTeamDraft) return;
    onApplyToTeamDraft({
      eventName: eventName || 'Event',
      amountPaid: perPersonTotalPayout.toString(),
      remarks: `Payout for ${days} days shift (${count} crew team)`
    });
    addToast('success', 'Populated Team Payment Draft');
    onClose();
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="modal-content"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: 'var(--color-bg-primary)',
          border: '1px solid var(--color-border)',
          borderRadius: '20px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-md)'
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--color-bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-bg-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calculator size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: "'Outfit', sans-serif", margin: 0 }}>
                Payout & Margin Calculator
              </h2>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                Calculate client billing, team payouts, and agency margins instantly
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-secondary" 
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Row 1: Event & Client Name */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label className="form-label">Event / Project Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Bangalore Auto Expo 2026"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Client / Agency Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Acme Experiential"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Headcount & Days */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
            <div>
              <label className="form-label">👥 Crew Count</label>
              <input 
                type="number" 
                min="1"
                className="input-field" 
                placeholder="10"
                value={crewCount}
                onChange={(e) => setCrewCount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="form-label">📅 Days / Shifts</label>
              <input 
                type="number" 
                min="1"
                className="input-field" 
                placeholder="2"
                value={daysCount}
                onChange={(e) => setDaysCount(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="form-label">💸 Crew Rate (₹/day)</label>
              <input 
                type="number" 
                min="0"
                className="input-field" 
                placeholder="1200"
                value={crewRatePerDay}
                onChange={(e) => setCrewRatePerDay(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="form-label">💰 Client Rate (₹/day)</label>
              <input 
                type="number" 
                min="0"
                className="input-field" 
                placeholder="1800"
                value={clientRatePerDay}
                onChange={(e) => setClientRatePerDay(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
          </div>

          {/* Row 3: Extra charges / expenses */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label className="form-label">➕ Extra Client Charges (₹)</label>
              <input 
                type="number" 
                min="0"
                className="input-field" 
                placeholder="e.g. 3000 (Transport/Coordination)"
                value={extraClientCharges}
                onChange={(e) => setExtraClientCharges(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
            <div>
              <label className="form-label">➖ Extra Crew Expenses (₹)</label>
              <input 
                type="number" 
                min="0"
                className="input-field" 
                placeholder="e.g. 1000 (Food/Travel stipend)"
                value={extraCrewExpenses}
                onChange={(e) => setExtraCrewExpenses(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
              />
            </div>
          </div>

          {/* Results Bento Summary Cards */}
          <div style={{ 
            backgroundColor: 'var(--color-bg-secondary)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '16px', 
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Financial Summary
              </span>
              <span style={{ 
                fontSize: '11px', 
                fontWeight: 700, 
                padding: '3px 8px', 
                borderRadius: '12px',
                backgroundColor: grossProfit >= 0 ? 'rgba(56, 142, 60, 0.15)' : 'rgba(211, 47, 47, 0.15)',
                color: grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
              }}>
                Margin: {profitMarginPercent}%
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Client Bill</div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginTop: '4px' }}>
                  {formatCurrency(totalClientBilling)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {count} crew × {days} days
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Crew Payout</div>
                <div style={{ fontSize: '20px', fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginTop: '4px' }}>
                  {formatCurrency(totalCrewPayout)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {formatCurrency(perPersonTotalPayout)} / member
                </div>
              </div>

              <div style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                padding: '14px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Agency Gross Profit</div>
                <div style={{ 
                  fontSize: '20px', 
                  fontWeight: 800, 
                  fontFamily: "'Outfit', sans-serif", 
                  marginTop: '4px',
                  color: grossProfit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'
                }}>
                  {formatCurrency(grossProfit)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                  {formatCurrency(profitPerPerson)} profit/crew
                </div>
              </div>
            </div>
          </div>

          {/* Quick Transfer to WhatsApp Drafts Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
              One-Click Draft Actions
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
              {onApplyToClientDraft && (
                <button 
                  onClick={handleApplyClient}
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                >
                  <ArrowRight size={16} /> Export to Client Notice Draft
                </button>
              )}

              {onApplyToTeamDraft && (
                <button 
                  onClick={handleApplyTeam}
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                >
                  <ArrowRight size={16} /> Export to Team Payment Draft
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          backgroundColor: 'var(--color-bg-secondary)'
        }}>
          <button 
            onClick={handleCopySummary}
            className="btn btn-secondary"
            style={{ gap: '6px' }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied Breakdown' : 'Copy Breakdown'}
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={handleShareWhatsApp}
              className="btn btn-primary"
              style={{ gap: '8px' }}
            >
              <MessageCircle size={16} /> Send via WhatsApp
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
