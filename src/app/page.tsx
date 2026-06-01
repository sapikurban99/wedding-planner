'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaHeart, FaWallet, FaPlusCircle, FaReceipt, FaSyncAlt,
  FaCheckCircle, FaLock, FaEye, FaEyeSlash, FaEdit, FaTrash,
  FaChevronDown, FaChevronRight, FaRing, FaGift,
  FaPiggyBank, FaClipboardList, FaArrowUp,
  FaCalendarAlt, FaChartBar, FaChevronLeft, FaChevronRight as FaChevronRightIcon,
  FaEnvelopeOpenText, FaUsers
} from 'react-icons/fa';
import confetti from 'canvas-confetti';
import * as sb from '../lib/supabaseService';
import type {
  AppData, EngagementItem, SeserahanItem, Invitation
} from '../type';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const formatDateShort = (s: string) => {
  if (!s || s.length < 10) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const QUICK_SELECT = [100000, 250000, 500000, 1000000];

type MainTab = 'dashboard' | 'checklist' | 'engagement' | 'seserahan' | 'savings' | 'budget' | 'timeline' | 'invitations';
type TimelineView = 'calendar' | 'gantt';

type PartyChoice = 'pria' | 'wanita' | 'joint';
type PartyFilter = PartyChoice | 'all';
type StatusLabel = 'planned' | 'ordered' | 'done' | 'cancelled';

const MOTIVATIONS = [
  { min: 0, text: 'Ayo mulai!', emoji: '💪' },
  { min: 10, text: 'Pelan tapi jalan', emoji: '🐢' },
  { min: 25, text: 'Lumayan!', emoji: '👍' },
  { min: 50, text: 'Setengah jalan!', emoji: '🔥' },
  { min: 75, text: 'Dikit lagi!', emoji: '🚀' },
  { min: 100, text: 'Mantap!', emoji: '🎉' },
];

function getMotivation(pct: number) {
  return [...MOTIVATIONS].reverse().find(m => pct >= m.min) || MOTIVATIONS[0];
}

const STATUS_COLORS: Record<string, string> = {
  planned: '#FEFF00', // Yellow
  ordered: '#00F0FF', // Cyan
  done: '#00FF00',    // Green
  cancelled: '#FF0000', // Red
};

const TAB_CONFIG: { key: MainTab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dash', icon: <FaHeart /> },
  { key: 'budget', label: 'Budget', icon: <FaWallet /> },
  { key: 'checklist', label: 'Tasks', icon: <FaClipboardList /> },
  { key: 'engagement', label: 'Ring', icon: <FaRing /> },
  { key: 'seserahan', label: 'Gifts', icon: <FaGift /> },
  { key: 'invitations', label: 'Tamu', icon: <FaEnvelopeOpenText /> },
  { key: 'savings', label: 'Bank', icon: <FaPiggyBank /> },
  { key: 'timeline', label: 'Plan', icon: <FaCalendarAlt /> },
];

// ===================== PASSWORD GATE =====================
function PasswordGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [checking, setChecking] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw.trim()) return;
    setChecking(true);
    setErr('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem('wedding_auth', 'true');
        onAuth();
      } else {
        setErr('WRONG PASSWORD!');
        setPw('');
      }
    } catch {
      setErr('CONNECTION ERROR');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-brut-black">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-brut-pink border-4 border-brut-white shadow-brutalist-lg mb-6">
            <FaHeart className="text-5xl text-brut-white" />
          </div>
          <h1 className="text-4xl font-black text-brut-white uppercase tracking-tighter">Wedding Dream</h1>
          <p className="font-bold text-brut-yellow bg-brut-black border-2 border-brut-yellow inline-block px-2 mt-2">QISTI & ALDI</p>
        </div>
        <form onSubmit={handleSubmit} className="brutalist-card p-8 bg-brut-white">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 border-3 border-brut-black bg-brut-yellow shadow-brutalist-sm mb-4">
              <FaLock className="text-2xl" />
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Access Denied</h2>
            <p className="text-sm font-bold uppercase mt-1">Enter code to proceed</p>
          </div>
          <div className="relative mb-6">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="SECRET CODE"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full brutalist-input text-center text-xl uppercase tracking-[0.5em]"
              autoFocus
              autoComplete="off"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 border-2 border-brut-black bg-brut-white">
              {showPw ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {err && <p className="text-xs text-center mb-4 font-black text-red-600 bg-red-100 border-2 border-red-600 p-2 uppercase">{err}</p>}
          <button type="submit" disabled={checking}
            className="w-full brutalist-button brutalist-button-cyan !py-5 text-xl">
            {checking ? <FaSyncAlt className="animate-spin mr-2" /> : null}
            {checking ? 'VERIFYING...' : 'UNLOCK ACCESS'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===================== BOTTOM SHEET =====================
function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center px-4 modal-overlay" style={{ zIndex: 100 }} onClick={onClose}>
      <div className="w-full max-w-md brutalist-modal p-8 relative modal-bottom-sheet max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 w-10 h-10 border-3 border-brut-black bg-brut-pink shadow-brutalist-sm font-black text-xl z-10">×</button>
        <div className="pt-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ===================== MAIN APP =====================
export default function Home() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    setAuthenticated(localStorage.getItem('wedding_auth') === 'true');
  }, []);

  const [data, setData] = useState<AppData>({
    settings: { id: 1, target_amount: 0, wedding_date: null, couple_name: 'Qisti & Aldi', groom_quota: 150, bride_quota: 150 },
    transactions: [],
    budgets: [],
    timeline: [],
    checklistCategories: [],
    checklistItems: [],
    engagementItems: [],
    seserahanItems: [],
    savingsDeposits: [],
    invitations: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadText, setLoadText] = useState('LOADING...');
  const progRef = useRef<NodeJS.Timeout | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  const [partyFilter, setPartyFilter] = useState<PartyFilter>('all');
  const [inviteCategoryFilter, setInviteCategoryFilter] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [timelineView, setTimelineView] = useState<TimelineView>('calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [showAddChecklistItem, setShowAddChecklistItem] = useState(false);
  const [showAddEngagement, setShowAddEngagement] = useState(false);
  const [showAddSeserahan, setShowAddSeserahan] = useState(false);
  const [showEditSeserahan, setShowEditSeserahan] = useState<SeserahanItem | null>(null);
  const [showEditEngagement, setShowEditEngagement] = useState<EngagementItem | null>(null);
  const [showAddBudget, setShowAddBudget] = useState(false);
  const [showAddInvite, setShowAddInvite] = useState(false);
  const [showEditInvite, setShowEditInvite] = useState<Invitation | null>(null);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // Form state
  const [formAmount, setFormAmount] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState('Lainnya');
  const [formParty, setFormParty] = useState<PartyChoice>('joint');
  const [formStatus, setFormStatus] = useState<StatusLabel>('planned');
  const [formItem, setFormItem] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formActual, setFormActual] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formPax, setFormPax] = useState('1');
  const [formGroomQuota, setFormGroomQuota] = useState('');
  const [formBrideQuota, setFormBrideQuota] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Countdown
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    if (!data.settings.wedding_date) return;
    const tick = () => {
      const now = new Date();
      const wed = new Date(data.settings.wedding_date!);
      const diff = wed.getTime() - now.getTime();
      if (diff <= 0) { setCountdown({ days: 0, hours: 0, minutes: 0 }); return; }
      setCountdown({
        days: Math.floor(diff / (1000 * 3600 * 24)),
        hours: Math.floor((diff % (1000 * 3600 * 24)) / (1000 * 3600)),
        minutes: Math.floor((diff % (1000 * 3600)) / (1000 * 60)),
      });
    };
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, [data.settings.wedding_date]);

  const startProgress = useCallback((text: string) => {
    setLoadText(text);
    setLoadProgress(0);
    if (progRef.current) clearInterval(progRef.current);
    let cur = 0;
    progRef.current = setInterval(() => {
      cur += cur < 60 ? 8 : cur < 85 ? 3 : 0.5;
      if (cur > 95) cur = 95;
      setLoadProgress(Math.round(cur));
    }, 200);
  }, []);

  const finishProgress = useCallback(() => {
    if (progRef.current) clearInterval(progRef.current);
    setLoadProgress(100);
    setTimeout(() => setLoadProgress(0), 400);
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    startProgress('FETCHING DATA...');
    try {
      const result = await sb.fetchAllData();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      finishProgress();
      setLoading(false);
    }
  }, [startProgress, finishProgress]);

  const refresh = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  const silentRefresh = useCallback(async () => {
    try {
      const result = await sb.fetchAllData();
      setData(result);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    if (authenticated) fetchAll();
  }, [authenticated, fetchAll]);

  // Derived state
  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const cashBalance = totalIncome - totalExpense;
  const target = data.settings.target_amount;
  const savingsProgress = target > 0 ? (totalIncome / target) * 100 : 0;

  const totalChecklist = data.checklistItems.length;
  const doneChecklist = data.checklistItems.filter(i => i.completed).length;
  const checklistPct = totalChecklist > 0 ? (doneChecklist / totalChecklist) * 100 : 0;
  const mot = getMotivation(checklistPct);

  const totalPlan = data.budgets.reduce((a, b) => a + b.plan, 0);
  const totalPaid = data.budgets.reduce((a, b) => a + b.paid, 0);

  const savingsNeeded = Math.max(0, target - totalIncome);
  const filteredEngagement = data.engagementItems.filter(i => partyFilter === 'all' || i.party === partyFilter);
  const filteredSeserahan = data.seserahanItems.filter(i => partyFilter === 'all' || i.party === partyFilter);

  const engagementTotalActual = data.engagementItems.reduce((a, i) => a + i.actual_amount, 0);
  const seserahanTotalActual = data.seserahanItems.reduce((a, i) => a + i.actual_amount, 0);

  // === Pembagian undangan (Aldi/pria & Qisti/wanita) ===
  const groomQuota = data.settings.groom_quota ?? 150;
  const brideQuota = data.settings.bride_quota ?? 150;
  const groomInvites = data.invitations.filter(i => i.party === 'pria');
  const brideInvites = data.invitations.filter(i => i.party === 'wanita');
  const groomPax = groomInvites.reduce((a, i) => a + i.pax, 0);
  const bridePax = brideInvites.reduce((a, i) => a + i.pax, 0);
  const totalPax = groomPax + bridePax;
  const totalQuota = groomQuota + brideQuota;
  const inviteCat = (i: Invitation) => i.category?.trim() || 'Lainnya';
  // Stats per kategori ikut filter sisi (pria/wanita) yang sedang aktif.
  const invitesByParty = data.invitations.filter(i => partyFilter === 'all' || i.party === partyFilter);
  const inviteCategoryStats = Array.from(new Set(invitesByParty.map(inviteCat)))
    .map(cat => {
      const items = invitesByParty.filter(i => inviteCat(i) === cat);
      return {
        cat,
        count: items.length,
        pax: items.reduce((a, i) => a + i.pax, 0),
        groom: items.filter(i => i.party === 'pria').reduce((a, i) => a + i.pax, 0),
        bride: items.filter(i => i.party === 'wanita').reduce((a, i) => a + i.pax, 0),
      };
    })
    .sort((a, b) => b.pax - a.pax);
  const filteredInvites = data.invitations.filter(i =>
    (partyFilter === 'all' || i.party === partyFilter) &&
    (inviteCategoryFilter === 'all' || inviteCat(i) === inviteCategoryFilter)
  );

  // === Estimasi tabungan bulanan (target tercapai H-7 sebelum hari H) ===
  // Basis: sisa = target dikurangi yang sudah dibayar (totalPaid dari Budget).
  // Tenggat = tanggal nikah dikurangi 7 hari.
  const remainingToPay = Math.max(0, target - totalPaid);
  const savingsDeadline = data.settings.wedding_date
    ? new Date(new Date(data.settings.wedding_date).getTime() - 7 * 24 * 60 * 60 * 1000)
    : null;
  const daysToDeadline = savingsDeadline
    ? Math.ceil((savingsDeadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;
  // Jumlah bulan tersisa untuk menabung (minimal 1 selama tenggat belum lewat)
  const monthsToDeadline = (() => {
    if (!savingsDeadline) return null;
    const now = new Date();
    const diff = (savingsDeadline.getFullYear() - now.getFullYear()) * 12 + (savingsDeadline.getMonth() - now.getMonth());
    return Math.max(1, diff);
  })();
  const deadlinePassed = daysToDeadline !== null && daysToDeadline <= 0;
  // Saldo kas yang sudah ada dipakai dulu untuk menutup sisa pembayaran.
  const netToSave = Math.max(0, remainingToPay - cashBalance);
  const monthlySavingsNeeded = monthsToDeadline && !deadlinePassed
    ? Math.ceil(netToSave / monthsToDeadline)
    : netToSave;

  // Handlers
  const handleAddDeposit = async (amount: number, note?: string) => {
    await sb.addTransaction({
      date: new Date().toISOString(),
      desc: note || 'Setoran Tabungan',
      amount,
      type: 'income',
      category: 'Income',
    });
    confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
    await silentRefresh();
    setShowDepositModal(false);
  };

  const handleUpdateTarget = async () => {
    const val = parseInt(formAmount);
    if (isNaN(val) || val <= 0) return;
    await sb.updateSettings({ target_amount: val });
    await silentRefresh();
    setShowTargetModal(false);
    setFormAmount('');
  };

  const handleOpenDateModal = () => {
    setFormDate(data.settings.wedding_date ? data.settings.wedding_date.slice(0, 10) : '');
    setShowDateModal(true);
  };

  const handleUpdateDate = async () => {
    if (!formDate) return;
    await sb.updateSettings({ wedding_date: formDate });
    await silentRefresh();
    setShowDateModal(false);
  };

  const handleAddExpense = async () => {
    if (!formDesc || !formAmount) return;
    const amount = parseInt(formAmount) || 0;
    await sb.addTransaction({
      date: new Date().toISOString(),
      desc: formDesc,
      amount,
      type: 'expense',
      category: formCategory,
    });
    // Sinkronkan ke budget: kalau kategori = item budget, tambahkan ke `paid`.
    const budget = data.budgets.find(b => b.item === formCategory);
    if (budget) {
      const newPaid = budget.paid + amount;
      await sb.updateBudget(budget.id, {
        paid: newPaid,
        status: newPaid >= budget.plan ? 'paid' : 'planned',
      });
    }
    await silentRefresh();
    setShowExpenseModal(false);
    setFormDesc('');
    setFormAmount('');
  };

  const handleAddChecklistItem = async () => {
    if (!formTitle || !formCategory) return;
    await sb.addChecklistItem({
      category_id: formCategory,
      title: formTitle,
      completed: false,
      priority: 'medium',
      assigned_to: formParty,
      sort_order: 0,
    });
    await silentRefresh();
    setShowAddChecklistItem(false);
    setFormTitle('');
  };

  const handleToggleChecklist = async (id: string, completed: boolean) => {
    await sb.toggleChecklistItem(id, !completed);
    if (!completed) confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
    await silentRefresh();
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm('DELETE THIS ITEM?')) return;
    await sb.deleteChecklistItem(id);
    await silentRefresh();
  };

  const handleAddEngagement = async () => {
    if (!formItem) return;
    await sb.addEngagementItem({
      item: formItem,
      category: formCategory || 'Umum',
      budget_amount: parseInt(formBudget) || 0,
      actual_amount: parseInt(formActual) || 0,
      party: formParty,
      status: formStatus,
    });
    await silentRefresh();
    setShowAddEngagement(false);
    setFormItem('');
    setFormBudget('');
    setFormActual('');
  };

  const handleAddSeserahan = async () => {
    if (!formItem) return;
    await sb.addSeserahanItem({
      item: formItem,
      category: formCategory || 'Umum',
      budget_amount: parseInt(formBudget) || 0,
      actual_amount: parseInt(formActual) || 0,
      party: formParty,
      status: formStatus,
    });
    await silentRefresh();
    setShowAddSeserahan(false);
    setFormItem('');
    setFormBudget('');
    setFormActual('');
  };

  const handleDeleteEngagement = async (id: string) => {
    if (!confirm('DELETE THIS ITEM?')) return;
    await sb.deleteEngagementItem(id);
    await silentRefresh();
  };

  const handleDeleteSeserahan = async (id: string) => {
    if (!confirm('DELETE THIS ITEM?')) return;
    await sb.deleteSeserahanItem(id);
    await silentRefresh();
  };

  const handleUpdateEngagement = async () => {
    if (!showEditEngagement) return;
    await sb.updateEngagementItem(showEditEngagement.id, {
      item: formItem,
      category: formCategory,
      budget_amount: parseInt(formBudget) || 0,
      actual_amount: parseInt(formActual) || 0,
      party: formParty,
      status: formStatus,
    });
    await silentRefresh();
    setShowEditEngagement(null);
  };

  const handleUpdateSeserahan = async () => {
    if (!showEditSeserahan) return;
    await sb.updateSeserahanItem(showEditSeserahan.id, {
      item: formItem,
      category: formCategory,
      budget_amount: parseInt(formBudget) || 0,
      actual_amount: parseInt(formActual) || 0,
      party: formParty,
      status: formStatus,
    });
    await silentRefresh();
    setShowEditSeserahan(null);
  };

  const handleOpenEditEngagement = (item: EngagementItem) => {
    setFormItem(item.item);
    setFormCategory(item.category);
    setFormBudget(item.budget_amount.toString());
    setFormActual(item.actual_amount.toString());
    setFormParty(item.party);
    setFormStatus(item.status);
    setShowEditEngagement(item);
  };

  const handleOpenEditSeserahan = (item: SeserahanItem) => {
    setFormItem(item.item);
    setFormCategory(item.category);
    setFormBudget(item.budget_amount.toString());
    setFormActual(item.actual_amount.toString());
    setFormParty(item.party);
    setFormStatus(item.status);
    setShowEditSeserahan(item);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    await sb.addChecklistCategory(newCategoryName.trim());
    setNewCategoryName('');
    await silentRefresh();
  };

  // ===== INVITATIONS =====
  const handleOpenAddInvite = (party: 'pria' | 'wanita' = 'pria') => {
    setFormItem('');
    setFormPax('1');
    setFormCategory(inviteCategoryFilter !== 'all' && inviteCategoryFilter !== 'Lainnya' ? inviteCategoryFilter : '');
    setFormParty(party);
    setShowAddInvite(true);
  };

  const handleAddInvite = async () => {
    if (!formItem.trim()) return;
    await sb.addInvitation({
      name: formItem.trim(),
      pax: Math.max(1, parseInt(formPax) || 1),
      party: formParty === 'wanita' ? 'wanita' : 'pria',
      category: formCategory || undefined,
      invited: false,
    });
    confetti({ particleCount: 80, spread: 90, origin: { y: 0.5 } });
    await silentRefresh();
    setShowAddInvite(false);
  };

  const handleOpenEditInvite = (item: Invitation) => {
    setFormItem(item.name);
    setFormPax(item.pax.toString());
    setFormCategory(item.category || '');
    setFormParty(item.party);
    setShowEditInvite(item);
  };

  const handleUpdateInvite = async () => {
    if (!showEditInvite || !formItem.trim()) return;
    await sb.updateInvitation(showEditInvite.id, {
      name: formItem.trim(),
      pax: Math.max(1, parseInt(formPax) || 1),
      party: formParty === 'wanita' ? 'wanita' : 'pria',
      category: formCategory || undefined,
    });
    await silentRefresh();
    setShowEditInvite(null);
  };

  const handleToggleInvited = async (item: Invitation) => {
    await sb.updateInvitation(item.id, { invited: !item.invited });
    await silentRefresh();
  };

  const handleDeleteInvite = async (id: string) => {
    if (!confirm('HAPUS TAMU INI?')) return;
    await sb.deleteInvitation(id);
    await silentRefresh();
  };

  const handleOpenQuotaModal = () => {
    setFormGroomQuota(groomQuota.toString());
    setFormBrideQuota(brideQuota.toString());
    setShowQuotaModal(true);
  };

  const handleUpdateQuota = async () => {
    const g = parseInt(formGroomQuota);
    const b = parseInt(formBrideQuota);
    if (isNaN(g) || isNaN(b) || g < 0 || b < 0) return;
    await sb.updateSettings({ groom_quota: g, bride_quota: b });
    await silentRefresh();
    setShowQuotaModal(false);
  };

  if (authenticated === null) return (
    <div className="min-h-screen flex items-center justify-center bg-brut-yellow">
      <FaSyncAlt className="animate-spin text-4xl" />
    </div>
  );
  if (!authenticated) return <PasswordGate onAuth={() => setAuthenticated(true)} />;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-brut-yellow font-sans selection:bg-brut-cyan selection:text-brut-black">

      {/* ===== LOADING OVERLAY ===== */}
      {(loading || loadProgress > 0) && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-brut-white" style={{ zIndex: 200 }}>
          <div className="border-4 border-brut-black p-8 bg-brut-yellow shadow-brutalist animate-in zoom-in duration-300">
            <FaHeart className="animate-pulse mb-6 text-6xl text-brut-pink mx-auto" />
            <p className="font-black text-2xl uppercase tracking-tighter mb-4 text-center">
              {loadProgress < 100 ? `${loadText} ${loadProgress}%` : 'SUCCESS!'}
            </p>
            <div className="w-64 h-8 bg-brut-black border-4 border-brut-black overflow-hidden shadow-brutalist-sm">
              <div className="h-full bg-brut-green transition-all duration-300" style={{ width: `${loadProgress}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* ===== DESKTOP SIDEBAR ===== */}
      <aside className="hidden lg:flex flex-col w-72 bg-brut-white border-r-4 border-brut-black h-screen sticky top-0 p-8 z-40 overflow-y-auto no-scrollbar">
        <div className="mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-2">
            <FaHeart className="text-brut-pink" />
            <span>Wedding</span>
          </h1>
          <p className="font-black text-xs bg-brut-yellow px-2 border-2 border-brut-black inline-block mt-3 uppercase tracking-widest">
            {data.settings.couple_name || 'Qisti & Aldi'}
          </p>
          <button onClick={handleOpenDateModal}
            className="mt-4 w-full brutalist-card p-3 bg-brut-cyan flex items-center gap-3 active:translate-x-0.5 active:translate-y-0.5 transition-all text-left">
            <FaCalendarAlt className="text-lg shrink-0" />
            <div className="min-w-0">
              <p className="font-black uppercase text-[9px] tracking-widest text-brut-black/60 leading-none mb-1">HARI H</p>
              <p className="font-black text-sm leading-none truncate">
                {data.settings.wedding_date
                  ? `${countdown.days} HARI LAGI`
                  : 'SET TANGGAL'}
              </p>
            </div>
          </button>
        </div>

        {/* Desktop Balance Widget (Moved here for better UX) */}
        <div className="mb-10 brutalist-card p-4 bg-brut-white">
          <p className="font-black uppercase text-[10px] tracking-widest text-gray-500 mb-2">CASH ON HAND</p>
          <div className="flex items-center gap-3">
             <div className="flex items-center justify-center w-10 h-10 bg-brut-yellow border-2 border-brut-black shadow-brutalist-sm">
                <FaWallet />
             </div>
             <p className="font-black text-xl tracking-tighter">{formatRupiah(cashBalance)}</p>
          </div>
        </div>

        <nav className="flex flex-col gap-3">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-4 px-5 py-4 border-3 border-brut-black font-black text-sm uppercase transition-all ${
                activeTab === tab.key 
                  ? 'bg-brut-cyan translate-x-1 translate-y-1 shadow-none' 
                  : 'bg-brut-white shadow-brutalist-sm hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              <span className="text-xl">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto space-y-3 pt-6 border-t-4 border-brut-black">
           <button onClick={() => { setShowDepositModal(true); setFormAmount(''); setFormDesc(''); }}
              className="w-full brutalist-button brutalist-button-green !py-3 text-sm">
              <FaPlusCircle /> DEPOSIT
            </button>
            <button onClick={() => { setShowExpenseModal(true); setFormDesc(''); setFormAmount(''); }}
              className="w-full brutalist-button brutalist-button-cyan !py-3 text-sm">
              <FaReceipt /> PAY BILL
            </button>
          <button
            onClick={refresh}
            className="w-full brutalist-button brutalist-button-pink !py-2 text-[10px]"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} /> REFRESH DATA
          </button>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 flex flex-col min-h-screen relative overflow-x-hidden">
        {/* MOBILE/TABLET HEADER */}
        <header className="lg:hidden px-5 py-6 bg-brut-white border-b-4 border-brut-black relative z-30">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                <FaHeart className="text-brut-pink" /> WEDDING
              </h1>
              <button onClick={handleOpenDateModal}
                className="text-[10px] font-black uppercase bg-brut-yellow px-2 border-2 border-brut-black inline-flex items-center gap-1 mt-1 active:translate-y-0.5">
                <FaCalendarAlt className="text-[9px]" />
                {data.settings.wedding_date ? new Date(data.settings.wedding_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'SET DATE'}
              </button>
            </div>
            <div className="flex gap-2">
               <button onClick={refresh} className="w-12 h-12 border-3 border-brut-black bg-brut-white shadow-brutalist-sm flex items-center justify-center active:translate-y-1">
                 <FaSyncAlt className={loading ? 'animate-spin' : ''} />
               </button>
            </div>
          </div>

          <div className="flex justify-between gap-2">
            {[
              { val: countdown.days, label: 'DAYS' },
              { val: countdown.hours, label: 'HRS' },
              { val: countdown.minutes, label: 'MIN' }
            ].map(item => (
              <div key={item.label} className="flex-1 bg-brut-cyan border-3 border-brut-black p-3 shadow-brutalist-sm text-center">
                <div className="text-2xl font-black leading-none">{item.val}</div>
                <div className="text-[10px] font-black uppercase tracking-wider">{item.label}</div>
              </div>
            ))}
          </div>
        </header>

        {/* CONTENT AREA */}
        <div className="flex-1 p-4 md:p-8 lg:p-12 pb-56 lg:pb-12 max-w-7xl mx-auto w-full">
          {/* TAB CONTENT CONTAINER */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* DASHBOARD TAB */}
            {activeTab === 'dashboard' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                   {/* Main Progress */}
                   <div className="lg:col-span-2 brutalist-card p-6 bg-brut-white">
                      <div className="flex justify-between items-end mb-4 gap-2">
                        <p className="font-black text-lg sm:text-xl uppercase tracking-tighter">Tasks Progress</p>
                        <p className="font-black text-xl sm:text-2xl bg-brut-green px-3 border-3 border-brut-black">
                          {Math.round(checklistPct)}%
                        </p>
                      </div>
                      <div className="w-full bg-brut-black border-4 border-brut-black h-12 overflow-hidden shadow-brutalist-sm">
                        <div 
                          className="h-full bg-brut-green transition-all duration-1000 border-r-4 border-brut-black" 
                          style={{ width: `${Math.min(checklistPct, 100)}%` }} 
                        />
                      </div>
                      <div className="flex justify-between mt-4">
                         <p className="text-sm font-black uppercase tracking-tight">
                            {doneChecklist} of {totalChecklist} COMPLETED
                         </p>
                         <p className="text-sm font-black uppercase text-brut-pink bg-brut-black px-2">
                            {mot.text} {mot.emoji}
                         </p>
                      </div>
                   </div>

                   {/* Budget Summary Card */}
                   <div className="brutalist-card p-6 bg-brut-pink text-brut-white">
                      <p className="font-black text-xl uppercase tracking-tighter mb-4 text-brut-black bg-brut-white inline-block px-2">Budget Info</p>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center border-b-2 border-brut-white pb-2">
                            <span className="font-black text-sm uppercase">Collected</span>
                            <span className="font-black text-xl">{formatRupiah(totalIncome)}</span>
                         </div>
                         <div className="flex justify-between items-center border-b-2 border-brut-white pb-2">
                            <span className="font-black text-sm uppercase">Paid</span>
                            <span className="font-black text-xl">{formatRupiah(totalPaid)}</span>
                         </div>
                         <div className="flex justify-between items-center bg-brut-black p-2">
                            <span className="font-black text-sm uppercase text-brut-cyan">Balance</span>
                            <span className="font-black text-xl text-brut-cyan">{formatRupiah(cashBalance)}</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* SAVINGS PLAN — berapa harus nabung per bulan biar tercapai H-7 */}
                <div className="brutalist-card p-6 bg-brut-cyan">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <p className="font-black text-lg sm:text-xl uppercase tracking-tighter flex items-center gap-2">
                      <FaPiggyBank /> Rencana Tabungan
                    </p>
                    <button onClick={() => { setFormAmount(target.toString()); setShowTargetModal(true); }}
                      className="brutalist-button brutalist-button-white !py-2 !text-xs uppercase">
                      Target: {formatRupiah(target)}
                    </button>
                  </div>

                  {!data.settings.wedding_date ? (
                    <button onClick={handleOpenDateModal}
                      className="w-full bg-brut-white border-4 border-brut-black p-8 text-center shadow-brutalist-sm active:translate-y-1 transition-all">
                      <p className="font-black uppercase text-sm">+ Set tanggal nikah untuk lihat estimasi tabungan</p>
                    </button>
                  ) : deadlinePassed ? (
                    <div className="bg-brut-white border-4 border-brut-black p-8 text-center shadow-brutalist-sm">
                      <p className="font-black uppercase text-red-600 text-sm">
                        Tenggat menabung (H-7) sudah lewat. {remainingToPay > 0 ? `Masih kurang ${formatRupiah(remainingToPay)}` : 'Target tercapai! 🎉'}
                      </p>
                    </div>
                  ) : remainingToPay <= 0 ? (
                    <div className="bg-brut-green border-4 border-brut-black p-8 text-center shadow-brutalist">
                      <p className="font-black uppercase text-xl">Semua budget sudah lunas! 🎉</p>
                    </div>
                  ) : netToSave <= 0 ? (
                    <div className="bg-brut-green border-4 border-brut-black p-8 text-center shadow-brutalist">
                      <p className="font-black uppercase text-lg">Saldo kas {formatRupiah(cashBalance)} sudah cukup untuk sisa pembayaran {formatRupiah(remainingToPay)} 🎉</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Angka utama: nabung per bulan */}
                      <div className="bg-brut-yellow border-4 border-brut-black p-6 sm:p-8 shadow-brutalist text-center overflow-hidden">
                        <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-3 text-gray-800">
                          Harus Nabung Per Bulan
                        </p>
                        <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter truncate">
                          {formatRupiah(monthlySavingsNeeded)}
                        </p>
                        <p className="text-[10px] sm:text-xs font-black uppercase mt-3 bg-brut-black text-brut-cyan inline-block px-3 py-1">
                          selama {monthsToDeadline} bulan lagi
                        </p>
                      </div>

                      {/* Rincian */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-brut-white border-3 border-brut-black p-3 shadow-brutalist-sm">
                          <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Sisa Bayar</p>
                          <p className="text-sm sm:text-base font-black text-red-600 truncate">{formatRupiah(remainingToPay)}</p>
                        </div>
                        <div className="bg-brut-white border-3 border-brut-black p-3 shadow-brutalist-sm">
                          <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Saldo Kas</p>
                          <p className="text-sm sm:text-base font-black truncate">{formatRupiah(cashBalance)}</p>
                        </div>
                        <div className="bg-brut-white border-3 border-brut-black p-3 shadow-brutalist-sm">
                          <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Tenggat (H-7)</p>
                          <p className="text-sm sm:text-base font-black truncate">{savingsDeadline!.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                        </div>
                        <div className="bg-brut-white border-3 border-brut-black p-3 shadow-brutalist-sm">
                          <p className="text-[9px] font-black uppercase text-gray-500 mb-1">Sisa Hari</p>
                          <p className="text-sm sm:text-base font-black truncate">{daysToDeadline} hari</p>
                        </div>
                      </div>

                      {/* Rumus singkat */}
                      <p className="text-[10px] font-bold text-gray-500 uppercase text-center">
                        Nabung/bln = (Sisa Bayar − Saldo Kas) ÷ {monthsToDeadline} bulan
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   {/* Budget Breakdown */}
                   <div className="brutalist-card p-6 bg-brut-white">
                      <div className="flex justify-between items-center mb-6">
                        <p className="font-black text-lg uppercase tracking-tight">Expense Breakdown</p>
                        <button onClick={() => setActiveTab('budget')} className="text-xs font-black uppercase underline hover:text-brut-cyan">VIEW ALL</button>
                      </div>
                      <div className="space-y-6">
                        {data.budgets.slice(0, 4).map(b => {
                          const pct = b.plan > 0 ? (b.paid / b.plan) * 100 : 0;
                          return (
                            <div key={b.id}>
                              <div className="flex justify-between text-xs font-black uppercase mb-1">
                                <span className="truncate max-w-[70%]">{b.item}</span>
                                <span className="bg-brut-yellow px-1 border border-brut-black text-brut-black font-bold">{Math.round(pct)}%</span>
                              </div>
                              <div className="w-full h-4 bg-brut-black border-2 border-brut-black overflow-hidden shadow-brutalist-sm">
                                <div className="h-full bg-brut-cyan border-r-2 border-brut-black" style={{ width: `${Math.min(pct, 100)}%` }} />
                              </div>
                            </div>
                          );
                        })}
                        {data.budgets.length === 0 && (
                          <button onClick={() => setShowAddBudget(true)} className="w-full brutalist-button brutalist-button-cyan !py-8 font-black text-lg uppercase">
                            + ADD YOUR FIRST BUDGET
                          </button>
                        )}
                      </div>
                   </div>

                   {/* Recent Activity */}
                   <div className="brutalist-card p-6 bg-brut-white">
                      <p className="font-black text-lg uppercase tracking-tight mb-6">Recent Records</p>
                      <div className="space-y-4">
                        {data.transactions.slice(0, 4).map(t => (
                          <div key={t.id} className="flex justify-between items-center p-3 border-3 border-brut-black bg-brut-white shadow-brutalist-sm group hover:bg-brut-yellow transition-colors">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`flex items-center justify-center border-2 border-brut-black h-10 w-10 shrink-0 shadow-brutalist-sm ${t.type === 'income' ? 'bg-brut-green' : 'bg-brut-cyan'}`}>
                                {t.type === 'income' ? <FaArrowUp /> : <FaReceipt />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black uppercase truncate group-hover:text-brut-black">{t.desc}</p>
                                <p className="text-[10px] font-bold text-gray-500 uppercase">{formatDateShort(t.date)}</p>
                              </div>
                            </div>
                            <span className={`text-xs font-black whitespace-nowrap px-2 border-2 border-brut-black shadow-brutalist-sm ${t.type === 'income' ? 'bg-brut-green' : 'bg-brut-white text-brut-black'}`}>
                              {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                            </span>
                          </div>
                        ))}
                        {data.transactions.length === 0 && (
                          <p className="text-sm text-center font-black text-gray-400 py-10 uppercase border-2 border-dashed border-brut-black">NO ACTIVITY YET</p>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            )}

            {/* BUDGET TAB */}
            {activeTab === 'budget' && (
              <div className="space-y-6">
                <div className="brutalist-card p-6 bg-brut-white flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="bg-brut-yellow border-4 border-brut-black p-4 w-full md:w-auto shadow-brutalist">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">TOTAL PLANNED</p>
                    <p className="text-3xl font-black">{formatRupiah(totalPlan)}</p>
                  </div>
                  <div className="bg-brut-green border-4 border-brut-black p-4 w-full md:w-auto shadow-brutalist">
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1">TOTAL PAID</p>
                    <p className="text-3xl font-black">{formatRupiah(totalPaid)}</p>
                  </div>
                </div>

                <button onClick={() => { setFormItem(''); setFormBudget(''); setFormActual(''); setFormParty('joint'); setShowAddBudget(true); }}
                  className="w-full brutalist-button brutalist-button-cyan !py-6 text-xl">
                  + ADD BUDGET ITEM
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.budgets.map((b) => {
                    const pct = b.plan > 0 ? (b.paid / b.plan) * 100 : 0;
                    return (
                      <div key={b.id} className="brutalist-card p-5 bg-brut-white hover:bg-brut-yellow transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                          <div className="min-w-0">
                            <p className="font-black text-lg uppercase truncate">{b.item}</p>
                            <p className="text-[10px] font-black bg-brut-black text-brut-white px-2 inline-block uppercase mt-1">{b.category}</p>
                          </div>
                          {b.party !== 'joint' && (
                            <span className={`text-[10px] font-black px-2 py-1 border-2 border-brut-black uppercase shadow-brutalist-sm ${
                              b.party === 'pria' ? 'bg-brut-cyan' : 'bg-brut-pink'
                            }`}>
                              {b.party === 'pria' ? 'Groom' : 'Bride'}
                            </span>
                          )}
                        </div>
                        <div className="w-full h-8 bg-brut-black border-3 border-brut-black overflow-hidden mb-3 relative">
                          <div className="h-full bg-brut-green transition-all duration-500"
                            style={{ width: `${Math.min(pct, 100)}%` }} />
                          <span className="absolute inset-0 flex items-center justify-center font-black text-white text-xs mix-blend-difference">
                             {Math.round(pct)}% PAID
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                           <div className="text-[10px] font-black uppercase">
                              <span className="text-gray-500">Plan:</span> {formatRupiah(b.plan)}
                           </div>
                           <div className="text-[10px] font-black uppercase bg-brut-black text-brut-green px-2">
                              PAID: {formatRupiah(b.paid)}
                           </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* CHECKLIST TAB */}
            {activeTab === 'checklist' && (
              <div className="space-y-6">
                <div className="brutalist-card p-6 bg-brut-white">
                  <div className="flex items-center gap-6 mb-4">
                    <span className="text-5xl border-4 border-brut-black p-4 bg-brut-yellow shadow-brutalist">{mot.emoji}</span>
                    <div className="flex-1">
                      <p className="font-black text-2xl uppercase tracking-tighter">{mot.text}</p>
                      <p className="font-black text-sm uppercase bg-brut-cyan inline-block px-2 border-2 border-brut-black mt-2">
                        {doneChecklist} / {totalChecklist} TASKS COMPLETED ({Math.round(checklistPct)}%)
                      </p>
                    </div>
                  </div>
                  <div className="w-full h-8 bg-brut-black border-4 border-brut-black overflow-hidden shadow-brutalist-sm">
                    <div className="h-full bg-brut-green transition-all duration-700"
                      style={{ width: `${Math.min(checklistPct, 100)}%` }} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => setExpandedCategories(new Set())}
                    className="brutalist-button brutalist-button-white !py-2 !text-xs uppercase">
                    COLLAPSE ALL
                  </button>
                  <button onClick={() => setExpandedCategories(new Set(data.checklistCategories.map(c => c.id)))}
                    className="brutalist-button brutalist-button-white !py-2 !text-xs uppercase">
                    EXPAND ALL
                  </button>
                  <button onClick={() => setShowAddChecklistItem(true)}
                    className="brutalist-button brutalist-button-cyan !py-2 !text-xs uppercase ml-auto">
                    + NEW TASK
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                  {data.checklistCategories.map(cat => {
                    const items = data.checklistItems.filter(i => i.category_id === cat.id);
                    const done = items.filter(i => i.completed).length;
                    const expanded = expandedCategories.has(cat.id);
                    return (
                      <div key={cat.id} className="brutalist-card overflow-hidden">
                        <button onClick={() => {
                          const next = new Set(expandedCategories);
                          if (expanded) { next.delete(cat.id); } else { next.add(cat.id); }
                          setExpandedCategories(next);
                        }}
                          className="w-full flex items-center justify-between p-5 text-left bg-brut-yellow border-b-4 border-brut-black hover:bg-brut-cyan transition-colors group">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="font-black text-lg uppercase truncate tracking-tight">{cat.name}</span>
                            <span className="text-xs font-black px-2 py-1 bg-brut-white border-2 border-brut-black shadow-brutalist-sm">
                              {done}/{items.length}
                            </span>
                          </div>
                          {expanded ? <FaChevronDown className="border-2 border-brut-black p-1 bg-brut-white shadow-brutalist-sm group-hover:bg-brut-yellow" /> : <FaChevronRight className="border-2 border-brut-black p-1 bg-brut-white shadow-brutalist-sm group-hover:bg-brut-yellow" />}
                        </button>
                        {expanded && (
                          <div className="bg-brut-white divide-y-2 divide-brut-black">
                            {items.map(item => (
                              <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                                <div className="relative shrink-0">
                                  <input type="checkbox" checked={item.completed}
                                    onChange={() => handleToggleChecklist(item.id, item.completed)}
                                    className="w-10 h-10 border-4 border-brut-black appearance-none cursor-pointer checked:bg-brut-green shadow-brutalist-sm transition-all active:scale-90"
                                  />
                                  {item.completed && <FaCheckCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none text-brut-black text-2xl" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-base font-black uppercase truncate ${item.completed ? 'line-through text-gray-400' : ''}`}>
                                    {item.title}
                                  </p>
                                  <div className="flex gap-2 mt-1">
                                    {item.assigned_to !== 'joint' && (
                                      <span className={`text-[9px] font-black px-1.5 py-0.5 border-2 border-brut-black uppercase ${
                                        item.assigned_to === 'pria' ? 'bg-brut-cyan' : 'bg-brut-pink'
                                      }`}>
                                        {item.assigned_to === 'pria' ? 'GROOM' : 'BRIDE'}
                                      </span>
                                    )}
                                    {item.due_date && <span className="text-[9px] font-black uppercase text-gray-500 bg-gray-200 px-1 border border-brut-black">{formatDateShort(item.due_date)}</span>}
                                  </div>
                                </div>
                                <button onClick={() => handleDeleteChecklist(item.id)} className="w-10 h-10 border-3 border-brut-black bg-brut-white hover:bg-red-500 flex items-center justify-center shadow-brutalist-sm shrink-0">
                                  <FaTrash className="text-sm" />
                                </button>
                              </div>
                            ))}
                            {items.length === 0 && (
                              <p className="text-xs font-black text-center py-8 uppercase text-gray-400 border-2 border-dashed border-gray-200 m-4">EMPTY CATEGORY</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* ADD CATEGORY CARD */}
                  <div className="brutalist-card p-6 bg-brut-white border-dashed">
                     <p className="font-black text-sm uppercase mb-4">Add New Category</p>
                     <div className="flex gap-3">
                        <input
                          placeholder="CATEGORY NAME"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1 brutalist-input !py-2 uppercase text-xs"
                        />
                        <button onClick={handleAddCategory}
                          className="brutalist-button brutalist-button-cyan !py-2 !px-4 text-xs font-black">
                          ADD
                        </button>
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* ENGAGEMENT TAB */}
            {activeTab === 'engagement' && (
              <div className="space-y-6">
                <div className="brutalist-card p-6 bg-brut-white">
                  <p className="font-black text-2xl uppercase tracking-tighter mb-6 text-center border-b-4 border-brut-black pb-4">Engagement Summary</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-brut-cyan border-4 border-brut-black shadow-brutalist text-center">
                      <p className="text-xs font-black uppercase tracking-widest mb-2">ITEMS TOTAL</p>
                      <p className="font-black text-5xl">{data.engagementItems.length}</p>
                    </div>
                    <div className="p-4 bg-brut-green border-4 border-brut-black shadow-brutalist text-center">
                      <p className="text-xs font-black uppercase tracking-widest mb-2">ACTUAL COST</p>
                      <p className="font-black text-3xl sm:text-4xl">{formatRupiah(engagementTotalActual)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex gap-2 p-1 border-3 border-brut-black bg-brut-white shadow-brutalist-sm">
                    {(['all', 'pria', 'wanita', 'joint'] as const).map(p => (
                      <button key={p} onClick={() => setPartyFilter(p)}
                        className={`px-3 py-1 font-black text-[10px] uppercase border-2 border-transparent transition-all ${
                          partyFilter === p ? 'bg-brut-black text-white border-brut-black shadow-brutalist-sm' : 'hover:bg-brut-yellow'
                        }`}>
                        {p === 'all' ? 'ALL' : p === 'pria' ? 'GROOM' : p === 'wanita' ? 'BRIDE' : 'JOINT'}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setFormItem(''); setFormBudget(''); setFormActual(''); setFormParty('joint'); setFormStatus('planned'); setShowAddEngagement(true); }}
                    className="brutalist-button brutalist-button-cyan !py-3 !text-sm uppercase">
                    + ADD ENGAGEMENT ITEM
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredEngagement.map(item => (
                    <div key={item.id} className="brutalist-card p-5 bg-brut-white hover:bg-brut-yellow transition-colors group">
                      <div className="flex justify-between items-start gap-4 mb-6">
                        <div className="min-w-0 flex-1">
                           <p className="font-black text-xl uppercase truncate group-hover:text-brut-black">{item.item}</p>
                           <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 border-2 border-brut-black uppercase shadow-brutalist-sm`}
                                style={{ backgroundColor: STATUS_COLORS[item.status] }}>
                                {item.status}
                              </span>
                              {item.party !== 'joint' && (
                                <span className={`text-[10px] font-black px-2 py-0.5 border-2 border-brut-black uppercase shadow-brutalist-sm ${
                                  item.party === 'pria' ? 'bg-brut-cyan' : 'bg-brut-pink'
                                }`}>
                                  {item.party === 'pria' ? 'GROOM' : 'BRIDE'}
                                </span>
                              )}
                           </div>
                           <p className="text-[10px] font-black bg-brut-black text-brut-white px-2 inline-block uppercase mt-2">{item.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenEditEngagement(item)} className="w-10 h-10 border-3 border-brut-black bg-brut-white hover:bg-brut-cyan flex items-center justify-center shadow-brutalist-sm transition-all active:translate-y-1">
                            <FaEdit className="text-sm" />
                          </button>
                          <button onClick={() => handleDeleteEngagement(item.id)} className="w-10 h-10 border-3 border-brut-black bg-brut-white hover:bg-red-500 flex items-center justify-center shadow-brutalist-sm transition-all active:translate-y-1">
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 border-t-4 border-brut-black pt-5">
                        <div className="bg-brut-white border-2 border-brut-black p-2 shadow-brutalist-sm">
                          <p className="text-[8px] font-black uppercase text-gray-500 mb-1">BUDGET</p>
                          <p className="text-xs font-black">{formatRupiah(item.budget_amount)}</p>
                        </div>
                        <div className="bg-brut-white border-2 border-brut-black p-2 shadow-brutalist-sm">
                          <p className="text-[8px] font-black uppercase text-gray-500 mb-1">ACTUAL</p>
                          <p className="text-xs font-black">{formatRupiah(item.actual_amount)}</p>
                        </div>
                        <div className={`border-2 border-brut-black p-2 shadow-brutalist-sm ${item.budget_amount >= item.actual_amount ? 'bg-brut-green' : 'bg-red-500 text-white'}`}>
                          <p className="text-[8px] font-black uppercase opacity-70 mb-1">DIFF</p>
                          <p className="text-xs font-black">{formatRupiah(item.budget_amount - item.actual_amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredEngagement.length === 0 && (
                     <div className="md:col-span-2 brutalist-card p-20 bg-brut-white border-dashed text-center">
                        <p className="text-2xl font-black uppercase text-gray-300">NO ENGAGEMENT DATA</p>
                     </div>
                  )}
                </div>
              </div>
            )}

            {/* SESERAHAN TAB */}
            {activeTab === 'seserahan' && (
              <div className="space-y-6">
                <div className="brutalist-card p-6 bg-brut-white">
                  <p className="font-black text-2xl uppercase tracking-tighter mb-6 text-center border-b-4 border-brut-black pb-4">Seserahan Summary</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-4 bg-brut-cyan border-4 border-brut-black shadow-brutalist text-center">
                      <p className="text-xs font-black uppercase tracking-widest mb-2">TOTAL ITEMS</p>
                      <p className="font-black text-5xl">{data.seserahanItems.length}</p>
                    </div>
                    <div className="p-4 bg-brut-green border-4 border-brut-black shadow-brutalist text-center">
                      <p className="text-xs font-black uppercase tracking-widest mb-2">TOTAL COST</p>
                      <p className="font-black text-3xl sm:text-4xl">{formatRupiah(seserahanTotalActual)}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-between">
                   <div className="flex gap-2 p-1 border-3 border-brut-black bg-brut-white shadow-brutalist-sm">
                    {(['all', 'pria', 'wanita', 'joint'] as const).map(p => (
                      <button key={p} onClick={() => setPartyFilter(p)}
                        className={`px-3 py-1 font-black text-[10px] uppercase border-2 border-transparent transition-all ${
                          partyFilter === p ? 'bg-brut-black text-white border-brut-black shadow-brutalist-sm' : 'hover:bg-brut-yellow'
                        }`}>
                        {p === 'all' ? 'ALL' : p === 'pria' ? 'GROOM' : p === 'wanita' ? 'BRIDE' : 'JOINT'}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => { setFormItem(''); setFormBudget(''); setFormActual(''); setFormParty('joint'); setFormStatus('planned'); setShowAddSeserahan(true); }}
                    className="brutalist-button brutalist-button-cyan !py-3 !text-sm uppercase">
                    + ADD SESERAHAN ITEM
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredSeserahan.map(item => (
                    <div key={item.id} className="brutalist-card p-5 bg-brut-white hover:bg-brut-yellow transition-colors group">
                      <div className="flex justify-between items-start gap-4 mb-6">
                        <div className="min-w-0 flex-1">
                           <p className="font-black text-xl uppercase truncate group-hover:text-brut-black">{item.item}</p>
                           <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 border-2 border-brut-black uppercase shadow-brutalist-sm`}
                                style={{ backgroundColor: STATUS_COLORS[item.status] }}>
                                {item.status}
                              </span>
                              {item.party !== 'joint' && (
                                <span className={`text-[10px] font-black px-2 py-0.5 border-2 border-brut-black uppercase shadow-brutalist-sm ${
                                  item.party === 'pria' ? 'bg-brut-cyan' : 'bg-brut-pink'
                                }`}>
                                  {item.party === 'pria' ? 'GROOM' : 'BRIDE'}
                                </span>
                              )}
                           </div>
                           <p className="text-[10px] font-black bg-brut-black text-brut-white px-2 inline-block uppercase mt-2">{item.category}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenEditSeserahan(item)} className="w-10 h-10 border-3 border-brut-black bg-brut-white hover:bg-brut-cyan flex items-center justify-center shadow-brutalist-sm transition-all">
                            <FaEdit className="text-sm" />
                          </button>
                          <button onClick={() => handleDeleteSeserahan(item.id)} className="w-10 h-10 border-3 border-brut-black bg-brut-white hover:bg-red-500 flex items-center justify-center shadow-brutalist-sm transition-all">
                            <FaTrash className="text-sm" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 border-t-4 border-brut-black pt-5">
                        <div className="bg-brut-white border-2 border-brut-black p-2 shadow-brutalist-sm">
                          <p className="text-[8px] font-black uppercase text-gray-500 mb-1">BUDGET</p>
                          <p className="text-xs font-black">{formatRupiah(item.budget_amount)}</p>
                        </div>
                        <div className="bg-brut-white border-2 border-brut-black p-2 shadow-brutalist-sm">
                          <p className="text-[8px] font-black uppercase text-gray-500 mb-1">ACTUAL</p>
                          <p className="text-xs font-black">{formatRupiah(item.actual_amount)}</p>
                        </div>
                        <div className={`border-2 border-brut-black p-2 shadow-brutalist-sm ${item.budget_amount >= item.actual_amount ? 'bg-brut-green' : 'bg-red-500 text-white'}`}>
                          <p className="text-[8px] font-black uppercase opacity-70 mb-1">DIFF</p>
                          <p className="text-xs font-black">{formatRupiah(item.budget_amount - item.actual_amount)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredSeserahan.length === 0 && (
                     <div className="md:col-span-2 brutalist-card p-20 bg-brut-white border-dashed text-center">
                        <p className="text-2xl font-black uppercase text-gray-300">NO SESERAHAN DATA</p>
                     </div>
                  )}
                </div>
              </div>
            )}

            {/* INVITATIONS TAB */}
            {activeTab === 'invitations' && (
              <div className="space-y-6">
                {/* Total summary */}
                <div className="brutalist-card p-6 bg-brut-white">
                  <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
                    <p className="font-black text-2xl uppercase tracking-tighter flex items-center gap-2"><FaUsers /> Pembagian Undangan</p>
                    <button onClick={handleOpenQuotaModal} className="brutalist-button brutalist-button-pink !py-2 !text-xs uppercase">EDIT KUOTA</button>
                  </div>
                  <div className="w-full h-14 bg-brut-black border-4 border-brut-black overflow-hidden relative shadow-brutalist-sm">
                    <div className={`h-full transition-all duration-700 ${totalPax > totalQuota ? 'bg-red-500' : 'bg-brut-green'}`}
                      style={{ width: `${totalQuota > 0 ? Math.min(totalPax / totalQuota * 100, 100) : 0}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center font-black text-xl text-white mix-blend-difference">{totalPax} / {totalQuota} PAX</span>
                  </div>
                </div>

                {/* Dua sisi: Aldi (pria) & Qisti (wanita) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[
                    { party: 'pria' as const, name: 'ALDI', role: 'PRIA', pax: groomPax, quota: groomQuota, bg: 'bg-brut-cyan' },
                    { party: 'wanita' as const, name: 'QISTI', role: 'WANITA', pax: bridePax, quota: brideQuota, bg: 'bg-brut-pink' },
                  ].map(s => {
                    const pct = s.quota > 0 ? s.pax / s.quota * 100 : 0;
                    const over = s.pax > s.quota;
                    const remaining = s.quota - s.pax;
                    return (
                      <div key={s.party} className={`brutalist-card p-6 ${s.bg}`}>
                        <div className="flex justify-between items-center mb-4">
                          <p className="font-black text-2xl uppercase tracking-tighter">{s.name}</p>
                          <span className="text-[10px] font-black uppercase bg-brut-black text-white px-2 py-1 border-2 border-brut-black">{s.role}</span>
                        </div>
                        <div className="bg-brut-white border-4 border-brut-black p-4 shadow-brutalist mb-4 text-center">
                          <p className="text-4xl font-black tracking-tighter">{s.pax} <span className="text-lg text-gray-400">/ {s.quota}</span></p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-1">PAX TERPAKAI</p>
                        </div>
                        <div className="w-full h-8 bg-brut-black border-3 border-brut-black overflow-hidden relative shadow-brutalist-sm">
                          <div className={`h-full transition-all duration-700 ${over ? 'bg-red-500' : 'bg-brut-green'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          <span className="absolute inset-0 flex items-center justify-center font-black text-xs text-white mix-blend-difference">{Math.round(pct)}%</span>
                        </div>
                        <div className="mt-3 flex justify-between items-center gap-2">
                          <button onClick={() => handleOpenAddInvite(s.party)} className="brutalist-button brutalist-button-white !py-1 !px-3 !text-[10px]">+ TAMBAH</button>
                          <span className={`text-xs font-black uppercase px-2 py-1 border-2 border-brut-black shadow-brutalist-sm ${over ? 'bg-red-500 text-white' : 'bg-brut-white'}`}>
                            {over ? `LEBIH ${Math.abs(remaining)}` : `SISA ${remaining}`} PAX
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stats per kategori (klik untuk filter) */}
                {inviteCategoryStats.length > 0 && (
                  <div className="brutalist-card p-6 bg-brut-white">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
                      <p className="font-black text-lg uppercase tracking-tight flex items-center gap-2"><FaChartBar /> Stats Per Kategori</p>
                      {inviteCategoryFilter !== 'all' && (
                        <button onClick={() => setInviteCategoryFilter('all')} className="brutalist-button brutalist-button-white !py-1 !px-3 !text-[10px] uppercase">
                          × RESET FILTER
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {inviteCategoryStats.map(s => {
                        const active = inviteCategoryFilter === s.cat;
                        return (
                          <button key={s.cat} onClick={() => setInviteCategoryFilter(active ? 'all' : s.cat)}
                            className={`border-3 border-brut-black p-3 shadow-brutalist-sm text-left transition-all active:translate-y-0.5 ${active ? 'bg-brut-yellow -translate-y-0.5' : 'bg-brut-white hover:bg-brut-yellow/40'}`}>
                            <p className="font-black text-xs uppercase truncate mb-1">{s.cat}</p>
                            <p className="font-black text-2xl tracking-tighter leading-none">{s.pax}<span className="text-[10px] font-bold text-gray-400 uppercase"> pax</span></p>
                            <div className="flex gap-1 mt-2">
                              {partyFilter !== 'wanita' && <span className="text-[8px] font-black px-1 py-0.5 border-2 border-brut-black bg-brut-cyan uppercase">A {s.groom}</span>}
                              {partyFilter !== 'pria' && <span className="text-[8px] font-black px-1 py-0.5 border-2 border-brut-black bg-brut-pink uppercase">Q {s.bride}</span>}
                              <span className="text-[8px] font-black px-1 py-0.5 border-2 border-brut-black bg-brut-white text-gray-500 uppercase">{s.count}×</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filter + tambah */}
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <div className="flex gap-2 p-1 border-3 border-brut-black bg-brut-white shadow-brutalist-sm">
                    {(['all', 'pria', 'wanita'] as const).map(p => (
                      <button key={p} onClick={() => setPartyFilter(p)}
                        className={`px-3 py-1 font-black text-[10px] uppercase border-2 border-transparent transition-all ${
                          partyFilter === p ? 'bg-brut-black text-white border-brut-black shadow-brutalist-sm' : 'hover:bg-brut-yellow'
                        }`}>
                        {p === 'all' ? 'SEMUA' : p === 'pria' ? 'ALDI' : 'QISTI'}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => handleOpenAddInvite()} className="brutalist-button brutalist-button-cyan !py-3 !text-sm uppercase">
                    + TAMBAH TAMU
                  </button>
                </div>

                {/* Daftar tamu */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredInvites.map(item => (
                    <div key={item.id} className="brutalist-card p-4 bg-brut-white flex items-center gap-3 hover:bg-brut-yellow transition-colors">
                      <div className={`flex flex-col items-center justify-center w-14 h-14 border-3 border-brut-black shadow-brutalist-sm shrink-0 ${item.party === 'pria' ? 'bg-brut-cyan' : 'bg-brut-pink'}`}>
                        <span className="font-black text-xl leading-none">{item.pax}</span>
                        <span className="text-[8px] font-black uppercase">PAX</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black uppercase truncate">{item.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 border-2 border-brut-black uppercase ${item.party === 'pria' ? 'bg-brut-cyan' : 'bg-brut-pink'}`}>{item.party === 'pria' ? 'ALDI' : 'QISTI'}</span>
                          {item.category && <span className="text-[9px] font-black px-1.5 py-0.5 border-2 border-brut-black uppercase bg-brut-yellow">{item.category}</span>}
                          <button onClick={() => handleToggleInvited(item)}
                            className={`text-[9px] font-black px-1.5 py-0.5 border-2 border-brut-black uppercase ${item.invited ? 'bg-brut-green' : 'bg-white text-gray-400'}`}>
                            {item.invited ? '✓ DISEBAR' : 'BELUM'}
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => handleOpenEditInvite(item)} className="w-9 h-9 border-3 border-brut-black bg-brut-white hover:bg-brut-cyan flex items-center justify-center shadow-brutalist-sm"><FaEdit className="text-xs" /></button>
                        <button onClick={() => handleDeleteInvite(item.id)} className="w-9 h-9 border-3 border-brut-black bg-brut-white hover:bg-red-500 flex items-center justify-center shadow-brutalist-sm"><FaTrash className="text-xs" /></button>
                      </div>
                    </div>
                  ))}
                  {filteredInvites.length === 0 && (
                    <div className="sm:col-span-2 brutalist-card p-16 bg-brut-white border-dashed text-center">
                      <p className="text-xl font-black uppercase text-gray-300">BELUM ADA DATA TAMU</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SAVINGS TAB */}
            {activeTab === 'savings' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Total Collected */}
                  <div className="brutalist-card p-8 bg-brut-white flex flex-col justify-center text-center">
                    <div className="flex justify-between items-center mb-8">
                      <p className="font-black text-xl uppercase tracking-tighter">Savings Progress</p>
                      <button onClick={() => { setFormAmount(target.toString()); setShowTargetModal(true); }}
                        className="brutalist-button brutalist-button-pink !py-2 !text-xs uppercase">
                        EDIT TARGET
                      </button>
                    </div>
                    <div className="bg-brut-yellow border-4 border-brut-black p-6 sm:p-10 shadow-brutalist mb-8 group hover:scale-[1.02] transition-transform overflow-hidden">
                      <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] mb-4 text-gray-800">TOTAL FUNDS COLLECTED</p>
                      <p className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter truncate">{formatRupiah(totalIncome)}</p>
                    </div>
                    {target > 0 && (
                      <div className="space-y-4">
                        <div className="w-full h-14 bg-brut-black border-4 border-brut-black overflow-hidden relative shadow-brutalist-sm">
                          <div className="h-full bg-brut-green transition-all duration-1000"
                            style={{ width: `${Math.min(savingsProgress, 100)}%` }} />
                          <span className="absolute inset-0 flex items-center justify-center font-black text-2xl text-white mix-blend-difference">
                            {Math.round(savingsProgress)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="bg-brut-white border-3 border-brut-black p-3 shadow-brutalist-sm">
                            <p className="text-[10px] font-black uppercase text-gray-500 mb-1">STILL NEEDED</p>
                            <p className="text-lg font-black text-red-600">{formatRupiah(savingsNeeded)}</p>
                          </div>
                          <div className="bg-brut-white border-3 border-brut-black p-3 shadow-brutalist-sm">
                            <p className="text-[10px] font-black uppercase text-gray-500 mb-1">FINAL TARGET</p>
                            <p className="text-lg font-black">{formatRupiah(target)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-8">
                    {/* Quick Deposit */}
                    <div className="brutalist-card p-6 bg-brut-white">
                      <p className="font-black text-xl uppercase tracking-tighter mb-6 border-b-4 border-brut-black pb-2 inline-block">Quick Bank Deposit</p>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        {QUICK_SELECT.map(qty => (
                          <button key={qty} onClick={() => handleAddDeposit(qty)}
                            className="brutalist-button brutalist-button-white !py-4 text-lg">
                            {formatRupiah(qty)}
                          </button>
                        ))}
                      </div>
                      <button onClick={() => { setFormAmount(''); setFormDesc(''); setShowDepositModal(true); }}
                        className="w-full brutalist-button brutalist-button-cyan !py-5 font-black text-xl uppercase shadow-brutalist">
                        + CUSTOM DEPOSIT
                      </button>
                    </div>

                    {/* History */}
                    <div className="brutalist-card p-6 bg-brut-white">
                      <p className="font-black text-xl uppercase tracking-tighter mb-6 border-b-4 border-brut-black pb-2 inline-block">Deposit Logs</p>
                      <div className="space-y-3">
                        {data.transactions.filter(t => t.type === 'income').slice(0, 6).map(t => (
                          <div key={t.id} className="flex justify-between items-center p-3 border-3 border-brut-black bg-brut-white shadow-brutalist-sm hover:bg-brut-green transition-colors text-brut-black">
                            <div>
                              <p className="text-sm font-black uppercase">{t.desc}</p>
                              <p className="text-[10px] font-bold text-gray-500 uppercase">{formatDateShort(t.date)}</p>
                            </div>
                            <span className="text-sm font-black bg-brut-black text-brut-green px-3 py-1 border-2 border-brut-green shadow-brutalist-sm">+{formatRupiah(t.amount)}</span>
                          </div>
                        ))}
                        {data.transactions.filter(t => t.type === 'income').length === 0 && (
                           <p className="text-center font-black text-gray-400 py-10 uppercase border-2 border-dashed border-gray-200">NO DEPOSITS FOUND</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <div className="space-y-8">
                <div className="flex gap-4 border-b-4 border-brut-black pb-6 overflow-x-auto no-scrollbar">
                  <button onClick={() => setTimelineView('calendar')}
                    className={`brutalist-button !py-3 !px-8 text-sm uppercase tracking-widest ${
                      timelineView === 'calendar' ? 'bg-brut-cyan' : 'bg-brut-white text-brut-black'
                    }`}>
                    <FaCalendarAlt className="inline mr-2" /> CALENDAR VIEW
                  </button>
                  <button onClick={() => setTimelineView('gantt')}
                    className={`brutalist-button !py-3 !px-8 text-sm uppercase tracking-widest ${
                      timelineView === 'gantt' ? 'bg-brut-cyan' : 'bg-brut-white text-brut-black'
                    }`}>
                    <FaChartBar className="inline mr-2" /> GANTT CHART
                  </button>
                </div>

                {timelineView === 'calendar' && (
                  (() => {
                    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
                    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                    const today = new Date();
                    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

                    const eventsOnDate = (day: number) =>
                      data.timeline.filter(e => {
                        if (!e.deadline) return false;
                        const d = new Date(e.deadline);
                        return d.getDate() === day && d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
                      });

                    const catColors: Record<string, string> = {
                      Vendor: '#00F0FF', Konsep: '#FEFF00', Perhiasan: '#FF00FF',
                      Busana: '#00FF00', Admin: '#FFFFFF', Keuangan: '#00FF00',
                      Acara: '#FF0000', Barang: '#FFA500', Digital: '#00F0FF', Personal: '#00FF00',
                    };

                    return (
                      <div className="brutalist-card p-6 bg-brut-white shadow-brutalist">
                        <div className="flex items-center justify-between mb-8">
                          <button onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); } else setCalendarMonth(m => m - 1); }}
                            className="w-12 h-12 border-4 border-brut-black bg-brut-white shadow-brutalist-sm flex items-center justify-center text-2xl active:translate-y-1">
                            <FaChevronLeft />
                          </button>
                          <p className="font-black text-3xl uppercase tracking-tighter bg-brut-black text-brut-white px-4 border-4 border-brut-black shadow-brutalist-sm">{months[calendarMonth]} {calendarYear}</p>
                          <button onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); } else setCalendarMonth(m => m + 1); }}
                            className="w-12 h-12 border-4 border-brut-black bg-brut-white shadow-brutalist-sm flex items-center justify-center text-2xl active:translate-y-1">
                            <FaChevronRightIcon />
                          </button>
                        </div>

                        <div className="grid grid-cols-7 border-4 border-brut-black">
                          {dayNames.map(d => (
                            <div key={d} className="text-center font-black text-xs uppercase py-4 border-b-4 border-brut-black bg-gray-100 text-brut-black">{d}</div>
                          ))}
                          {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} className="p-1 min-h-[80px] sm:min-h-[120px] border-r-4 border-b-4 border-brut-black bg-gray-50/50" />
                          ))}
                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const events = eventsOnDate(day);
                            const isToday = day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
                            return (
                              <div key={day} className={`p-1 min-h-[80px] sm:min-h-[120px] border-r-4 border-b-4 border-brut-black relative group ${isToday ? 'bg-brut-cyan/20' : 'bg-brut-white hover:bg-brut-yellow/10 transition-colors'}`}>
                                <div className="text-right p-1">
                                  <span className={`text-sm font-black w-8 h-8 flex items-center justify-center border-2 border-brut-black shadow-brutalist-sm ml-auto ${isToday ? 'bg-brut-black text-white' : 'bg-brut-white text-brut-black'}`}>
                                    {day}
                                  </span>
                                </div>
                                <div className="mt-2 space-y-1 overflow-y-auto max-h-[80px] no-scrollbar">
                                  {events.map(e => (
                                    <div key={e.id} className="text-[7px] sm:text-[9px] font-black truncate px-1 border-2 border-brut-black uppercase leading-none py-1 shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] text-brut-black"
                                      style={{ backgroundColor: catColors[e.category] || '#FFF' }}>
                                      {e.task}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()
                )}

                {timelineView === 'gantt' && (
                  (() => {
                    if (!data.settings.wedding_date) {
                      return <div className="brutalist-card p-20 bg-brut-white text-center">
                        <p className="text-xl font-black uppercase text-gray-400">SET WEDDING DATE TO GENERATE GANTT CHART</p>
                      </div>;
                    }
                    const startDate = new Date();
                    const endDate = new Date(data.settings.wedding_date);
                    const totalMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth() + 1;

                    const monthLabels: string[] = [];
                    for (let i = 0; i < totalMonths; i++) {
                      const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                      monthLabels.push(d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }));
                    }

                    const sortedTimeline = [...data.timeline].sort((a, b) => {
                      if (!a.deadline) return 1; if (!b.deadline) return -1;
                      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
                    });

                    const getTaskPosition = (deadline?: string) => {
                      if (!deadline) return { left: '0%', width: '0%' };
                      const d = new Date(deadline);
                      const monthIdx = (d.getFullYear() - startDate.getFullYear()) * 12 + d.getMonth() - startDate.getMonth();
                      const pct = Math.max(0, Math.min(monthIdx / totalMonths * 100, 95));
                      return { left: `${pct}%`, width: `${Math.max(8, 100 / totalMonths)}%` };
                    };

                    const barCatColors: Record<string, string> = {
                      Vendor: '#00F0FF', Konsep: '#FEFF00', Perhiasan: '#FF00FF',
                      Busana: '#00FF00', Admin: '#FFFFFF', Keuangan: '#00FF00',
                      Acara: '#FF0000', Barang: '#FFA500', Digital: '#00F0FF', Personal: '#00FF00',
                    };

                    return (
                      <div className="brutalist-card p-6 bg-brut-white overflow-x-auto shadow-brutalist">
                        <p className="font-black text-xl uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">Gantt Pipeline</p>
                        <div className="min-w-[800px]">
                          <div className="flex border-b-4 border-brut-black mb-6 pb-4" style={{ marginLeft: '160px' }}>
                            {monthLabels.map((m, i) => (
                              <div key={i} className="text-xs font-black text-center flex-1 uppercase tracking-widest border-l-2 border-gray-200 text-brut-black">
                                {m}
                              </div>
                            ))}
                          </div>

                          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 no-scrollbar">
                            {sortedTimeline.map(e => {
                              const pos = getTaskPosition(e.deadline);
                              return (
                                <div key={e.id} className="flex items-center gap-6 group">
                                  <div className="text-[11px] font-black uppercase truncate w-[140px] shrink-0 group-hover:text-brut-cyan transition-colors text-brut-black">
                                    {e.task}
                                  </div>
                                  <div className="flex-1 relative h-10 bg-gray-100 border-3 border-brut-black shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                                    <div className="absolute h-full border-r-3 border-brut-black flex items-center justify-center transition-all shadow-brutalist-sm active:scale-95 cursor-pointer"
                                      style={{
                                        left: pos.left,
                                        width: pos.width,
                                        backgroundColor: barCatColors[e.category] || '#9ca3af',
                                      }}>
                                      {e.status === 'Done' && <FaCheckCircle className="text-black text-sm" />}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ===== MOBILE BOTTOM UI CONTAINER ===== */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        <div className="p-4 flex flex-col gap-4">
          
          {/* MOBILE FLOATING ACTION BAR */}
          <div className="brutalist-card p-4 bg-brut-white flex items-center justify-between shadow-brutalist text-brut-black pointer-events-auto max-w-lg mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-brut-yellow border-3 border-brut-black text-xl shadow-brutalist-sm">
                <FaWallet />
              </div>
              <div>
                <p className="font-black uppercase text-[10px] tracking-widest leading-none mb-1 text-gray-500">CASH</p>
                <p className="font-black text-lg leading-none">{formatRupiah(cashBalance)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setShowDepositModal(true); setFormAmount(''); setFormDesc(''); }}
                className="w-12 h-12 bg-brut-green border-3 border-brut-black shadow-brutalist-sm flex items-center justify-center active:translate-y-1 active:shadow-none transition-all">
                <FaPlusCircle className="text-xl" />
              </button>
              <button onClick={() => { setShowExpenseModal(true); setFormDesc(''); setFormAmount(''); }}
                className="w-12 h-12 bg-brut-cyan border-3 border-brut-black shadow-brutalist-sm flex items-center justify-center active:translate-y-1 active:shadow-none transition-all">
                <FaReceipt className="text-xl" />
              </button>
            </div>
          </div>

          {/* MOBILE BOTTOM NAV */}
          <nav className="bg-brut-white border-4 border-brut-black p-2 shadow-brutalist pointer-events-auto max-w-lg mx-auto w-full">
            <div className="flex gap-2 overflow-x-auto no-scrollbar text-brut-black">
              {TAB_CONFIG.map(tab => (
                <button 
                  key={tab.key} 
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-col items-center justify-center min-w-[64px] flex-1 py-3 border-3 border-brut-black font-black text-[9px] uppercase tracking-tighter transition-all ${
                    activeTab === tab.key 
                      ? 'bg-brut-cyan -translate-y-1 shadow-brutalist-sm' 
                      : 'bg-brut-white hover:bg-brut-yellow'
                  }`}
                >
                  <span className="text-xl mb-1">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </nav>
          
          {/* Safe area spacer */}
          <div className="h-safe" />
        </div>
      </div>

      {/* ============================================ */}
      {/* ===== MODALS ===== */}
      {/* ============================================ */}

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <BottomSheet onClose={() => setShowDepositModal(false)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">Deposit Cash</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">AMOUNT (IDR)</label>
              <input type="number" placeholder="0"
                className="w-full brutalist-input text-2xl font-black"
                value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">DESCRIPTION</label>
              <input type="text" placeholder="GIFT, SALARY, ETC."
                className="w-full brutalist-input uppercase text-sm"
                value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowDepositModal(false)} className="brutalist-button brutalist-button-white !py-4 font-black">CANCEL</button>
              <button onClick={() => handleAddDeposit(parseInt(formAmount) || 0, formDesc)} className="brutalist-button brutalist-button-cyan !py-4 font-black">SAVE RECORD</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* TARGET MODAL */}
      {showTargetModal && (
        <BottomSheet onClose={() => setShowTargetModal(false)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">Set Savings Target</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">TARGET AMOUNT (IDR)</label>
              <input type="number" placeholder="0"
                className="w-full brutalist-input text-2xl font-black"
                value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowTargetModal(false)} className="brutalist-button brutalist-button-white !py-4 font-black">CANCEL</button>
              <button onClick={handleUpdateTarget} className="brutalist-button brutalist-button-cyan !py-4 font-black">UPDATE TARGET</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* WEDDING DATE MODAL */}
      {showDateModal && (
        <BottomSheet onClose={() => setShowDateModal(false)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">Tanggal Pernikahan</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">HARI H</label>
              <input type="date"
                className="w-full brutalist-input text-lg font-black uppercase"
                value={formDate} onChange={(e) => setFormDate(e.target.value)} />
              <p className="text-[10px] font-bold text-gray-500 uppercase mt-2">Dipakai untuk countdown, gantt &amp; estimasi tabungan (tenggat H-7).</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowDateModal(false)} className="brutalist-button brutalist-button-white !py-4 font-black">CANCEL</button>
              <button onClick={handleUpdateDate} className="brutalist-button brutalist-button-cyan !py-4 font-black">SIMPAN</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* EXPENSE MODAL */}
      {showExpenseModal && (
        <BottomSheet onClose={() => setShowExpenseModal(false)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">Record Payment</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">VENDOR / CATEGORY</label>
              <select className="w-full brutalist-input text-sm uppercase font-black cursor-pointer"
                value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                <option value="Lainnya">GENERAL / OTHER</option>
                {data.budgets.map(b => <option key={b.id} value={b.item}>{b.item}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">DESCRIPTION</label>
              <input type="text" placeholder="DOWN PAYMENT, FULL PAID, ETC."
                className="w-full brutalist-input text-sm uppercase"
                value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">AMOUNT (IDR)</label>
              <input type="number" placeholder="0"
                className="w-full brutalist-input text-2xl font-black"
                value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowExpenseModal(false)} className="brutalist-button brutalist-button-white !py-4 font-black">CANCEL</button>
              <button onClick={handleAddExpense} className="brutalist-button brutalist-button-cyan !py-4 font-black">RECORD PAID</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* ADD CHECKLIST ITEM MODAL */}
      {showAddChecklistItem && (
        <BottomSheet onClose={() => setShowAddChecklistItem(false)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">Create New Task</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">CATEGORY</label>
              <select className="w-full brutalist-input text-sm font-black uppercase text-brut-black"
                value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
                <option value="">SELECT CATEGORY</option>
                {data.checklistCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">TASK TITLE</label>
              <input type="text" placeholder="WHAT NEEDS TO BE DONE?"
                className="w-full brutalist-input text-sm uppercase"
                value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">ASSIGN TO</label>
              <select className="w-full brutalist-input text-sm font-black uppercase text-brut-black"
                value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
                <option value="joint">JOINT / BOTH</option>
                <option value="pria">GROOM</option>
                <option value="wanita">BRIDE</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowAddChecklistItem(false)} className="brutalist-button brutalist-button-white !py-4 font-black">CANCEL</button>
              <button onClick={handleAddChecklistItem} className="brutalist-button brutalist-button-cyan !py-4 font-black">CREATE TASK</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* ADD ENGAGEMENT MODAL */}
      {showAddEngagement && (
        <BottomSheet onClose={() => setShowAddEngagement(false)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">New Engagement Item</h3>
          <div className="space-y-4">
            <input type="text" placeholder="ITEM NAME" className="w-full brutalist-input uppercase text-sm" value={formItem} onChange={(e) => setFormItem(e.target.value)} />
            <input type="text" placeholder="CATEGORY" className="w-full brutalist-input uppercase text-sm" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-[8px] font-black uppercase mb-1 text-brut-black">BUDGET</label>
                  <input type="number" placeholder="BUDGET" className="w-full brutalist-input text-xs" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
               </div>
               <div>
                  <label className="block text-[8px] font-black uppercase mb-1 text-brut-black">ACTUAL</label>
                  <input type="number" placeholder="ACTUAL" className="w-full brutalist-input text-xs" value={formActual} onChange={(e) => setFormActual(e.target.value)} />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <select className="w-full brutalist-input text-[10px] font-black uppercase text-brut-black" value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
                  <option value="joint">JOINT</option>
                  <option value="pria">GROOM</option>
                  <option value="wanita">BRIDE</option>
               </select>
               <select className="w-full brutalist-input text-[10px] font-black uppercase text-brut-black" value={formStatus} onChange={(e) => setFormStatus(e.target.value as StatusLabel)}>
                  <option value="planned">PLANNED</option>
                  <option value="ordered">ORDERED</option>
                  <option value="done">DONE</option>
                  <option value="cancelled">CANCELLED</option>
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowAddEngagement(false)} className="brutalist-button brutalist-button-white !py-3 font-black text-xs">CANCEL</button>
              <button onClick={handleAddEngagement} className="brutalist-button brutalist-button-cyan !py-3 font-black text-xs">SAVE ITEM</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* ADD SESERAHAN MODAL */}
      {showAddSeserahan && (
        <BottomSheet onClose={() => setShowAddSeserahan(false)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">New Seserahan Item</h3>
          <div className="space-y-4">
            <input type="text" placeholder="ITEM NAME" className="w-full brutalist-input uppercase text-sm" value={formItem} onChange={(e) => setFormItem(e.target.value)} />
            <input type="text" placeholder="CATEGORY" className="w-full brutalist-input uppercase text-sm" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-[8px] font-black uppercase mb-1 text-brut-black">BUDGET</label>
                  <input type="number" placeholder="BUDGET" className="w-full brutalist-input text-xs" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
               </div>
               <div>
                  <label className="block text-[8px] font-black uppercase mb-1 text-brut-black">ACTUAL</label>
                  <input type="number" placeholder="ACTUAL" className="w-full brutalist-input text-xs" value={formActual} onChange={(e) => setFormActual(e.target.value)} />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
               <select className="w-full brutalist-input text-[10px] font-black uppercase text-brut-black" value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
                  <option value="joint">JOINT</option>
                  <option value="pria">GROOM</option>
                  <option value="wanita">BRIDE</option>
               </select>
               <select className="w-full brutalist-input text-[10px] font-black uppercase text-brut-black" value={formStatus} onChange={(e) => setFormStatus(e.target.value as StatusLabel)}>
                  <option value="planned">PLANNED</option>
                  <option value="ordered">ORDERED</option>
                  <option value="done">DONE</option>
                  <option value="cancelled">CANCELLED</option>
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowAddSeserahan(false)} className="brutalist-button brutalist-button-white !py-3 font-black text-xs">CANCEL</button>
              <button onClick={handleAddSeserahan} className="brutalist-button brutalist-button-cyan !py-3 font-black text-xs">SAVE ITEM</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* EDIT ENGAGEMENT MODAL */}
      {showEditEngagement && (
        <BottomSheet onClose={() => setShowEditEngagement(null)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">Edit Engagement</h3>
          <div className="space-y-4 text-brut-black">
            <input type="text" placeholder="ITEM NAME" className="w-full brutalist-input uppercase text-sm" value={formItem} onChange={(e) => setFormItem(e.target.value)} />
            <input type="text" placeholder="CATEGORY" className="w-full brutalist-input uppercase text-sm" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
               <input type="number" placeholder="BUDGET" className="w-full brutalist-input text-xs" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
               <input type="number" placeholder="ACTUAL" className="w-full brutalist-input text-xs" value={formActual} onChange={(e) => setFormActual(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <select className="w-full brutalist-input text-[10px] font-black uppercase" value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
                  <option value="joint">JOINT</option>
                  <option value="pria">GROOM</option>
                  <option value="wanita">BRIDE</option>
               </select>
               <select className="w-full brutalist-input text-[10px] font-black uppercase" value={formStatus} onChange={(e) => setFormStatus(e.target.value as StatusLabel)}>
                  <option value="planned">PLANNED</option>
                  <option value="ordered">ORDERED</option>
                  <option value="done">DONE</option>
                  <option value="cancelled">CANCELLED</option>
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowEditEngagement(null)} className="brutalist-button brutalist-button-white !py-3 font-black text-xs">CANCEL</button>
              <button onClick={handleUpdateEngagement} className="brutalist-button brutalist-button-cyan !py-3 font-black text-xs">UPDATE</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* EDIT SESERAHAN MODAL */}
      {showEditSeserahan && (
        <BottomSheet onClose={() => setShowEditSeserahan(null)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">Edit Seserahan</h3>
          <div className="space-y-4 text-brut-black">
            <input type="text" placeholder="ITEM NAME" className="w-full brutalist-input uppercase text-sm" value={formItem} onChange={(e) => setFormItem(e.target.value)} />
            <input type="text" placeholder="CATEGORY" className="w-full brutalist-input uppercase text-sm" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
               <input type="number" placeholder="BUDGET" className="w-full brutalist-input text-xs" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
               <input type="number" placeholder="ACTUAL" className="w-full brutalist-input text-xs" value={formActual} onChange={(e) => setFormActual(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
               <select className="w-full brutalist-input text-[10px] font-black uppercase" value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
                  <option value="joint">JOINT</option>
                  <option value="pria">GROOM</option>
                  <option value="wanita">BRIDE</option>
               </select>
               <select className="w-full brutalist-input text-[10px] font-black uppercase" value={formStatus} onChange={(e) => setFormStatus(e.target.value as StatusLabel)}>
                  <option value="planned">PLANNED</option>
                  <option value="ordered">ORDERED</option>
                  <option value="done">DONE</option>
                  <option value="cancelled">CANCELLED</option>
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowEditSeserahan(null)} className="brutalist-button brutalist-button-white !py-3 font-black text-xs">CANCEL</button>
              <button onClick={handleUpdateSeserahan} className="brutalist-button brutalist-button-cyan !py-3 font-black text-xs">UPDATE</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* ADD BUDGET MODAL */}
      {showAddBudget && (
        <BottomSheet onClose={() => setShowAddBudget(false)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">New Budget Entry</h3>
          <div className="space-y-4 text-brut-black">
             <div>
                <label className="block text-[10px] font-black uppercase mb-1">VENDOR / ITEM NAME</label>
                <input type="text" placeholder="E.G. VENUE, CATERING, MUA" className="w-full brutalist-input uppercase text-sm" value={formItem} onChange={(e) => setFormItem(e.target.value)} />
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase mb-1">CATEGORY</label>
                <input type="text" placeholder="CONCEPT, ADMIN, ETC." className="w-full brutalist-input uppercase text-sm" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[8px] font-black uppercase mb-1">PLANNED COST</label>
                  <input type="number" placeholder="0" className="w-full brutalist-input text-xs" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[8px] font-black uppercase mb-1">INITIAL PAID</label>
                  <input type="number" placeholder="0" className="w-full brutalist-input text-xs" value={formActual} onChange={(e) => setFormActual(e.target.value)} />
                </div>
             </div>
             <div>
                <label className="block text-[10px] font-black uppercase mb-1">RESPONSIBLE PARTY</label>
                <select className="w-full brutalist-input text-sm font-black uppercase" value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
                  <option value="joint">JOINT / BOTH</option>
                  <option value="pria">GROOM</option>
                  <option value="wanita">BRIDE</option>
                </select>
             </div>
             <div className="grid grid-cols-2 gap-4 pt-4">
                <button onClick={() => setShowAddBudget(false)} className="brutalist-button brutalist-button-white !py-3 font-black text-xs">CANCEL</button>
                <button onClick={async () => {
                   if (!formItem) return;
                   await sb.addBudget({
                      item: formItem,
                      category: formCategory || 'Umum',
                      plan: parseInt(formBudget) || 0,
                      paid: parseInt(formActual) || 0,
                      status: 'planned',
                      party: formParty,
                   });
                   await silentRefresh();
                   setShowAddBudget(false);
                }} className="brutalist-button brutalist-button-cyan !py-3 font-black text-xs">ADD ENTRY</button>
             </div>
          </div>
        </BottomSheet>
      )}

      {/* ADD / EDIT INVITATION MODAL */}
      {(showAddInvite || showEditInvite) && (
        <BottomSheet onClose={() => { setShowAddInvite(false); setShowEditInvite(null); }}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">
            {showEditInvite ? 'Edit Tamu' : 'Tambah Tamu'}
          </h3>
          <div className="space-y-4 text-brut-black">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">NAMA TAMU / KELUARGA</label>
              <input type="text" placeholder="MIS. KELUARGA BUDI" className="w-full brutalist-input uppercase text-sm"
                value={formItem} onChange={(e) => setFormItem(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2">JUMLAH PAX</label>
                <input type="number" min="1" placeholder="1" className="w-full brutalist-input text-lg font-black"
                  value={formPax} onChange={(e) => setFormPax(e.target.value)} />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2">SISI</label>
                <select className="w-full brutalist-input text-sm font-black uppercase" value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
                  <option value="pria">ALDI (PRIA)</option>
                  <option value="wanita">QISTI (WANITA)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">KATEGORI (OPSIONAL)</label>
              <input type="text" placeholder="KELUARGA, TEMAN, KANTOR" className="w-full brutalist-input uppercase text-sm"
                value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => { setShowAddInvite(false); setShowEditInvite(null); }} className="brutalist-button brutalist-button-white !py-4 font-black">CANCEL</button>
              <button onClick={showEditInvite ? handleUpdateInvite : handleAddInvite} className="brutalist-button brutalist-button-cyan !py-4 font-black">SIMPAN</button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* QUOTA MODAL */}
      {showQuotaModal && (
        <BottomSheet onClose={() => setShowQuotaModal(false)}>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-8 border-b-4 border-brut-black pb-2 inline-block">Edit Kuota Pax</h3>
          <div className="space-y-4 text-brut-black">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">KUOTA ALDI (PRIA)</label>
              <input type="number" min="0" placeholder="150" className="w-full brutalist-input text-lg font-black"
                value={formGroomQuota} onChange={(e) => setFormGroomQuota(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest mb-2">KUOTA QISTI (WANITA)</label>
              <input type="number" min="0" placeholder="150" className="w-full brutalist-input text-lg font-black"
                value={formBrideQuota} onChange={(e) => setFormBrideQuota(e.target.value)} />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase">Total kuota = {(parseInt(formGroomQuota) || 0) + (parseInt(formBrideQuota) || 0)} pax</p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button onClick={() => setShowQuotaModal(false)} className="brutalist-button brutalist-button-white !py-4 font-black">CANCEL</button>
              <button onClick={handleUpdateQuota} className="brutalist-button brutalist-button-cyan !py-4 font-black">SIMPAN</button>
            </div>
          </div>
        </BottomSheet>
      )}

    </div>
  );
}
