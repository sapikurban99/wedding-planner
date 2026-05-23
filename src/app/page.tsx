'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FaHeart, FaWallet, FaPlusCircle, FaReceipt, FaSyncAlt,
  FaCheckCircle, FaLock, FaEye, FaEyeSlash, FaEdit, FaTrash,
  FaChevronDown, FaChevronRight, FaRing, FaGift,
  FaPiggyBank, FaClipboardList, FaArrowUp,
  FaCalendarAlt, FaChartBar, FaChevronLeft, FaChevronRight as FaChevronRightIcon
} from 'react-icons/fa';
import confetti from 'canvas-confetti';
import * as sb from '../lib/supabaseService';
import type {
  AppData, BudgetItem, TimelineEvent,
  ChecklistItem, EngagementItem, SeserahanItem
} from '../type';

const formatRupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const formatDateShort = (s: string) => {
  if (!s || s.length < 10) return s;
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
};

const QUICK_SELECT = [100000, 250000, 500000, 1000000];

type MainTab = 'dashboard' | 'checklist' | 'engagement' | 'seserahan' | 'savings' | 'budget' | 'timeline';
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
  planned: '#f59e0b',
  ordered: '#3b82f6',
  done: '#10b981',
  cancelled: '#ef4444',
};

const TAB_CONFIG: { key: MainTab; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <FaHeart /> },
  { key: 'budget', label: 'Budget', icon: <FaWallet /> },
  { key: 'checklist', label: 'Checklist', icon: <FaClipboardList /> },
  { key: 'engagement', label: 'Engagement', icon: <FaRing /> },
  { key: 'seserahan', label: 'Seserahan', icon: <FaGift /> },
  { key: 'savings', label: 'Tabungan', icon: <FaPiggyBank /> },
  { key: 'timeline', label: 'Timeline', icon: <FaCalendarAlt /> },
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
        setErr('Password salah');
        setPw('');
      }
    } catch {
      setErr('Gagal koneksi');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom right, #f43f5e, #ec4899, #e11d48)' }}>
      <div className="absolute top-10 left-10 w-24 h-24 bg-white-10 rounded-full" style={{ filter: 'blur(32px)' }} />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-white-10 rounded-full" style={{ filter: 'blur(32px)' }} />
      <div className="w-full max-w-sm relative" style={{ zIndex: 10 }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white-20 rounded-full mb-4">
            <FaHeart className="text-3xl" style={{ color: '#fff' }} />
          </div>
          <h1 className="text-2xl font-bold text-white">Wedding Dream</h1>
          <p className="text-sm mt-1" style={{ color: '#fce7f3' }}>Qisti & Aldi</p>
        </div>
        <form onSubmit={handleSubmit} className="safe-blur rounded-3xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3" style={{ backgroundColor: '#fce7f3' }}>
              <FaLock className="text-lg" style={{ color: '#ec4899' }} />
            </div>
            <h2 className="text-lg font-bold" style={{ color: '#1f2937' }}>Masukkan Password</h2>
            <p className="text-xs mt-1" style={{ color: '#9ca3af' }}>Untuk mengakses Wedding Planner</p>
          </div>
          <div className="relative mb-4">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="Password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full p-4 pr-12 rounded-2xl outline-none font-medium text-base"
              style={{ border: '2px solid #fce7f3', color: '#374151', backgroundColor: '#fff', WebkitAppearance: 'none' }}
              autoFocus
              autoComplete="off"
            />
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="absolute right-4 top-1/2 p-1" style={{ transform: 'translateY(-50%)', color: '#9ca3af' }}>
              {showPw ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {err && <p className="text-xs text-center mb-3 font-medium" style={{ color: '#ef4444' }}>{err}</p>}
          <button type="submit" disabled={checking}
            className="w-full py-4 font-bold rounded-2xl shadow-lg text-base"
            style={{
              background: 'linear-gradient(to right, #ec4899, #f43f5e)',
              color: '#fff',
              opacity: checking ? 0.6 : 1,
            }}>
            {checking ? <FaSyncAlt className="animate-spin inline mr-2" /> : null}
            {checking ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
        <p className="text-center text-xs mt-6" style={{ color: '#fbcfe8' }}>With love, forever</p>
      </div>
    </div>
  );
}

// ===================== BOTTOM SHEET (top-level, avoid re-mount) =====================
function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 safe-blur-overlay flex items-end justify-center modal-overlay" style={{ zIndex: 50 }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-6 shadow-2xl pb-safe modal-bottom-sheet"
        style={{ backgroundColor: '#fff', maxWidth: '24rem' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center mb-4"><div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#d1d5db' }} /></div>
        {children}
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
    settings: { id: 1, target_amount: 0, wedding_date: null, couple_name: 'Qisti & Aldi' },
    transactions: [],
    budgets: [],
    timeline: [],
    checklistCategories: [],
    checklistItems: [],
    engagementItems: [],
    seserahanItems: [],
    savingsDeposits: [],
  });

  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadText, setLoadText] = useState('Memuat...');
  const progRef = useRef<NodeJS.Timeout | null>(null);

  // Tab state
  const [activeTab, setActiveTab] = useState<MainTab>('dashboard');
  // Filters
  const [partyFilter, setPartyFilter] = useState<PartyFilter>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [timelineView, setTimelineView] = useState<TimelineView>('calendar');
  const [calendarMonth, setCalendarMonth] = useState(() => new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(() => new Date().getFullYear());

  // Modals
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showAddChecklistItem, setShowAddChecklistItem] = useState(false);
  const [showAddEngagement, setShowAddEngagement] = useState(false);
  const [showAddSeserahan, setShowAddSeserahan] = useState(false);
  const [showEditSeserahan, setShowEditSeserahan] = useState<SeserahanItem | null>(null);
  const [showEditEngagement, setShowEditEngagement] = useState<EngagementItem | null>(null);
  const [showAddBudget, setShowAddBudget] = useState(false);

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
  const [formDeadline, setFormDeadline] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  // Countdown
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  // ====== COUNTDOWN TIMER ======
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

  // ====== DATA LOADING ======
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
    startProgress('Memuat Data...');
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

  // ====== DERIVED STATE ======
  const totalIncome = data.transactions.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0);
  const totalExpense = data.transactions.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0);
  const cashBalance = totalIncome - totalExpense;
  const target = data.settings.target_amount;
  const fundingGap = Math.max(0, target - totalIncome);
  const savingsProgress = target > 0 ? (totalIncome / target) * 100 : 0;

  // Checklist progress
  const totalChecklist = data.checklistItems.length;
  const doneChecklist = data.checklistItems.filter(i => i.completed).length;
  const checklistPct = totalChecklist > 0 ? (doneChecklist / totalChecklist) * 100 : 0;
  const mot = getMotivation(checklistPct);

  // Budget totals
  const totalPlan = data.budgets.reduce((a, b) => a + b.plan, 0);
  const totalPaid = data.budgets.reduce((a, b) => a + b.paid, 0);

  // Savings = total income from transactions
  const savingsNeeded = Math.max(0, target - totalIncome);

  // Filtered lists
  const filteredEngagement = data.engagementItems.filter(i => partyFilter === 'all' || i.party === partyFilter);
  const filteredSeserahan = data.seserahanItems.filter(i => partyFilter === 'all' || i.party === partyFilter);

  const engagementTotalBudget = filteredEngagement.reduce((a, i) => a + i.budget_amount, 0);
  const engagementTotalActual = filteredEngagement.reduce((a, i) => a + i.actual_amount, 0);
  const seserahanTotalBudget = filteredSeserahan.reduce((a, i) => a + i.budget_amount, 0);
  const seserahanTotalActual = filteredSeserahan.reduce((a, i) => a + i.actual_amount, 0);

  // ====== HANDLERS ======
  const handleAddDeposit = async (amount: number, note?: string) => {
    await sb.addTransaction({
      date: new Date().toISOString(),
      desc: note || 'Setoran Tabungan',
      amount,
      type: 'income',
      category: 'Income',
    });
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
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

  const handleAddExpense = async () => {
    if (!formDesc || !formAmount) return;
    const amt = parseInt(formAmount);
    await sb.addTransaction({
      date: new Date().toISOString(),
      desc: formDesc,
      amount: amt,
      type: 'expense',
      category: formCategory,
    });
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
      assigned_to: formParty as 'pria' | 'wanita' | 'joint',
      sort_order: 0,
    });
    await silentRefresh();
    setShowAddChecklistItem(false);
    setFormTitle('');
  };

  const handleToggleChecklist = async (id: string, completed: boolean) => {
    await sb.toggleChecklistItem(id, !completed);
    if (!completed) confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    await silentRefresh();
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm('Hapus item ini?')) return;
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
      status: formStatus || 'planned',
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
      status: formStatus || 'planned',
    });
    await silentRefresh();
    setShowAddSeserahan(false);
    setFormItem('');
    setFormBudget('');
    setFormActual('');
  };

  const handleDeleteEngagement = async (id: string) => {
    if (!confirm('Hapus item ini?')) return;
    await sb.deleteEngagementItem(id);
    await silentRefresh();
  };

  const handleDeleteSeserahan = async (id: string) => {
    if (!confirm('Hapus item ini?')) return;
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


  const renderSavingsProgressBar = () => {
    const pct = Math.min(savingsProgress, 100);
    const markers = [25, 50, 75, 100];
    return (
      <div className="relative w-full h-5 mt-2">
        <div className="w-full h-full rounded-full overflow-hidden relative" style={{ backgroundColor: '#f3f4f6' }}>
          <div className="h-full rounded-full relative transition-all duration-700"
            style={{ width: `${pct}%`, background: 'linear-gradient(to right, #ec4899, #f43f5e)' }} />
        </div>
        {markers.map(m => (
          <div key={m} className="absolute top-0 flex flex-col items-center" style={{ left: `${m}%`, transform: 'translateX(-50%)' }}>
            <div className="w-0.5 h-5" style={{ backgroundColor: pct >= m ? '#fff' : '#d1d5db', opacity: 0.5 }} />
            <span className="text-[8px] font-bold mt-0.5" style={{ color: '#9ca3af' }}>{m}%</span>
          </div>
        ))}
      </div>
    );
  };

  if (authenticated === null) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf2f8' }}>
      <FaSyncAlt className="animate-spin text-2xl" style={{ color: '#f472b6' }} />
    </div>
  );
  if (!authenticated) return <PasswordGate onAuth={() => setAuthenticated(true)} />;

  return (
    <div className="min-h-screen flex justify-center font-sans" style={{ backgroundColor: '#fdf2f8', color: '#1f2937' }}>

      {/* ===== LOADING OVERLAY ===== */}
      {(loading || loadProgress > 0) && (
        <div className="fixed inset-0 flex flex-col items-center justify-center safe-blur" style={{ zIndex: 100, transition: 'opacity 0.3s' }}>
          <FaHeart className="animate-pulse mb-6" style={{ color: '#ec4899', fontSize: '3rem' }} />
          <p className="font-bold mb-4 text-lg" style={{ color: '#1f2937' }}>
            {loadProgress < 100 ? `${loadText} ${loadProgress}%` : 'Selesai'}
          </p>
          <div className="w-64 h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#fce7f3' }}>
            <div className="h-full" style={{
              width: `${loadProgress}%`,
              background: 'linear-gradient(to right, #ec4899, #f43f5e, #ec4899)',
              transition: 'width 0.2s ease-out',
              borderRadius: '9999px',
            }} />
          </div>
        </div>
      )}

      <div className="w-full max-w-md min-h-screen shadow-2xl relative" style={{ backgroundColor: '#fff', paddingBottom: '10rem' }}>

        {/* ===== HEADER ===== */}
        <div className="px-5 pt-6 pb-14 rounded-b-3xl shadow-lg relative overflow-hidden"
          style={{ background: 'linear-gradient(to bottom right, #ec4899, #e11d48)', color: '#fff' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white-10 rounded-full" style={{ filter: 'blur(20px)', marginRight: '-16px', marginTop: '-16px' }} />
          <div className="flex justify-between items-center mb-4 relative" style={{ zIndex: 10 }}>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2"><FaHeart style={{ color: '#fbcfe8' }} /> {data.settings.couple_name || 'Wedding Dream'}</h1>
              <p className="text-xs" style={{ color: '#fce7f3', opacity: 0.9 }}>
                {data.settings.wedding_date ? new Date(data.settings.wedding_date).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'Atur tanggal pernikahan'}
              </p>
            </div>
            <button onClick={refresh} className="text-xs bg-white-20 p-2.5 rounded-full flex items-center justify-center"
              style={{ minWidth: '44px', minHeight: '44px', transition: 'all 0.2s' }}>
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Countdown */}
          <div className="flex justify-center gap-5 my-3 relative" style={{ zIndex: 10 }}>
            <div className="text-center">
              <div className="text-2xl font-bold">{countdown.days}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: '#fce7f3' }}>Hari</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{countdown.hours}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: '#fce7f3' }}>Jam</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{countdown.minutes}</div>
              <div className="text-[10px] uppercase tracking-wider" style={{ color: '#fce7f3' }}>Menit</div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="text-center relative" style={{ zIndex: 10, marginTop: '0.5rem' }}>
            <p className="text-xs" style={{ color: '#fce7f3' }}>
              {doneChecklist}/{totalChecklist} tugas selesai {totalChecklist > 0 ? `(${Math.round(checklistPct)}%)` : ''}
            </p>
            <div className="w-full bg-black-20 rounded-full h-2.5 mt-2 overflow-hidden">
              <div className="h-2.5 rounded-full transition-all duration-700" style={{ backgroundColor: '#fff', width: `${Math.min(checklistPct, 100)}%` }} />
            </div>
          </div>
        </div>

        {/* ===== TAB NAVIGATION ===== */}
        <div className="px-2 mt-[-0.5rem] relative z-20">
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1" style={{ scrollSnapType: 'x mandatory' }}>
            {TAB_CONFIG.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl whitespace-nowrap font-bold text-xs transition-all"
                style={{
                  backgroundColor: activeTab === tab.key ? '#ec4899' : '#fff',
                  color: activeTab === tab.key ? '#fff' : '#6b7280',
                  border: activeTab === tab.key ? 'none' : '1px solid #f3f4f6',
                  boxShadow: activeTab === tab.key ? '0 2px 8px rgba(236,72,153,0.3)' : 'none',
                  scrollSnapAlign: 'start',
                }}>
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== CONTENT AREA ===== */}
        <div className="px-4 mt-4 pb-4">

          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              {/* Budget Summary */}
              <div className="rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #f3f4f6' }}>
                <div className="flex justify-between items-center mb-3">
                  <p className="font-bold text-sm" style={{ color: '#374151' }}>Ringkasan Budget</p>
                  {target === 0 && (
                    <button onClick={() => setShowTargetModal(true)}
                      className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ color: '#ec4899', backgroundColor: '#fdf2f8' }}>
                      Yuk, atur target
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl text-center" style={{ backgroundColor: '#f9fafb' }}>
                    <p className="text-[10px] font-bold uppercase" style={{ color: '#9ca3af' }}>Total Terkumpul</p>
                    <p className="font-bold text-lg" style={{ color: '#059669' }}>{formatRupiah(totalIncome)}</p>
                  </div>
                  <div className="p-3 rounded-xl text-center" style={{ backgroundColor: '#f9fafb' }}>
                    <p className="text-[10px] font-bold uppercase" style={{ color: '#9ca3af' }}>Target</p>
                    <p className="font-bold text-lg" style={{ color: '#db2777' }}>{target > 0 ? formatRupiah(target) : '—'}</p>
                  </div>
                </div>
                {target > 0 && (
                  <>
                    <div className="w-full h-2.5 rounded-full mt-3 overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                      <div className="h-2.5 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min(savingsProgress, 100)}%`, backgroundColor: '#10b981' }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px]" style={{ color: '#9ca3af' }}>
                      <span>{savingsProgress.toFixed(1)}%</span>
                      <span>Kekurangan: {formatRupiah(fundingGap)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Budget Items Status */}
              <div className="rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #f3f4f6' }}>
                <p className="font-bold text-sm mb-3" style={{ color: '#374151' }}>Anggaran Pernikahan</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold" style={{ color: '#6b7280' }}>Rencana: {formatRupiah(totalPlan)}</span>
                  <span className="text-xs font-bold" style={{ color: '#059669' }}>Terbayar: {formatRupiah(totalPaid)}</span>
                </div>
                {data.budgets.length === 0 ? (
                  <button onClick={() => setShowAddBudget(true)}
                    className="w-full py-3 rounded-xl text-xs font-bold" style={{ color: '#ec4899', backgroundColor: '#fdf2f8' }}>
                    + Tambah Anggaran
                  </button>
                ) : (
                  data.budgets.slice(0, 5).map(b => {
                    const pct = b.plan > 0 ? (b.paid / b.plan) * 100 : 0;
                    return (
                      <div key={b.id} className="flex items-center gap-2 py-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium truncate" style={{ color: '#374151' }}>{b.item}</span>
                            <span className="font-bold" style={{ color: '#db2777' }}>{Math.round(pct)}%</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full mt-1 overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                            <div className="h-1.5 rounded-full" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: '#ec4899' }} />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                {data.budgets.length > 5 && (
                  <button onClick={() => setActiveTab('budget')} className="w-full text-center text-xs font-bold mt-2" style={{ color: '#ec4899' }}>
                    Lihat semua ({data.budgets.length})
                  </button>
                )}
              </div>

              {/* Recent Transactions */}
              <div className="rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #f3f4f6' }}>
                <p className="font-bold text-sm mb-3" style={{ color: '#374151' }}>Transaksi Terakhir</p>
                {data.transactions.slice(0, 3).map(t => (
                  <div key={t.id} className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#f3f4f6' }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center justify-center text-xs"
                        style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, backgroundColor: t.type === 'income' ? '#d1fae5' : '#fce7f3', color: t.type === 'income' ? '#059669' : '#db2777' }}>
                        {t.type === 'income' ? <FaArrowUp /> : <FaReceipt />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: '#374151' }}>{t.desc}</p>
                        <p className="text-[10px]" style={{ color: '#9ca3af' }}>{formatDateShort(t.date)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold flex-shrink-0" style={{ color: t.type === 'income' ? '#059669' : '#db2777' }}>
                      {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                    </span>
                  </div>
                ))}
                {data.transactions.length === 0 && (
                  <p className="text-xs text-center" style={{ color: '#9ca3af' }}>Belum ada transaksi</p>
                )}
              </div>
            </div>
          )}

          {/* ===== BUDGET TAB ===== */}
          {activeTab === 'budget' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl flex justify-between items-center" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: '#6b7280' }}>Total Rencana</p>
                  <p className="text-lg font-bold" style={{ color: '#be185d' }}>{formatRupiah(totalPlan)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase" style={{ color: '#6b7280' }}>Sudah Dibayar</p>
                  <p className="text-lg font-bold" style={{ color: '#059669' }}>{formatRupiah(totalPaid)}</p>
                </div>
              </div>

              <button onClick={() => { setFormItem(''); setFormBudget(''); setFormActual(''); setFormParty('joint'); setShowAddBudget(true); }}
                className="w-full py-3 rounded-xl text-xs font-bold" style={{ color: '#ec4899', backgroundColor: '#fdf2f8' }}>
                + Tambah Anggaran
              </button>

              {data.budgets.map((b) => {
                const pct = b.plan > 0 ? (b.paid / b.plan) * 100 : 0;
                return (
                  <div key={b.id} className="p-4 rounded-xl shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6' }}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate" style={{ color: '#374151' }}>{b.item}</span>
                          {b.party !== 'joint' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{
                              backgroundColor: b.party === 'pria' ? '#dbeafe' : '#fce7f3',
                              color: b.party === 'pria' ? '#2563eb' : '#db2777',
                            }}>
                              {b.party === 'pria' ? 'Pria' : 'Wanita'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px]" style={{ color: '#9ca3af' }}>{b.category}</p>
                      </div>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                      <div className="h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: '#ec4899' }} />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px]" style={{ color: '#9ca3af' }}>
                      <span>Dibayar: {formatRupiah(b.paid)}</span>
                      <span>Rencana: {formatRupiah(b.plan)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ===== CHECKLIST TAB ===== */}
          {activeTab === 'checklist' && (
            <div className="space-y-3">
              {/* Motivation */}
              <div className="p-3 rounded-xl" style={{ backgroundColor: '#fdf2f8', border: '1px solid #fce7f3' }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{mot.emoji}</span>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#be185d' }}>{mot.text}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{doneChecklist}/{totalChecklist} selesai ({Math.round(checklistPct)}%)</p>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full mt-2 overflow-hidden" style={{ backgroundColor: '#fce7f3' }}>
                  <div className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(checklistPct, 100)}%`, backgroundColor: '#ec4899' }} />
                </div>
              </div>

              {/* Category filter */}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button onClick={() => setExpandedCategories(new Set())}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap" style={{
                    backgroundColor: '#fff', border: '1px solid #f3f4f6', color: '#6b7280' }}>
                  Collapse All
                </button>
                <button onClick={() => setExpandedCategories(new Set(data.checklistCategories.map(c => c.id)))}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap" style={{
                    backgroundColor: '#fff', border: '1px solid #f3f4f6', color: '#6b7280' }}>
                  Expand All
                </button>
                <button onClick={() => setShowAddChecklistItem(true)}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap" style={{
                    backgroundColor: '#ec4899', color: '#fff' }}>
                  + Tambah Data
                </button>
              </div>

              {/* Categories */}
              {data.checklistCategories.map(cat => {
                const items = data.checklistItems.filter(i => i.category_id === cat.id);
                const done = items.filter(i => i.completed).length;
                const expanded = expandedCategories.has(cat.id);
                return (
                  <div key={cat.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid #f3f4f6' }}>
                    <button onClick={() => {
                      const next = new Set(expandedCategories);
                      if (expanded) { next.delete(cat.id); } else { next.add(cat.id); }
                      setExpandedCategories(next);
                    }}
                      className="w-full flex items-center justify-between p-3 text-left" style={{ backgroundColor: '#f9fafb' }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-sm truncate" style={{ color: '#374151' }}>{cat.name}</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fce7f3', color: '#db2777' }}>
                          {done}/{items.length}
                        </span>
                      </div>
                      {expanded ? <FaChevronDown style={{ color: '#9ca3af', fontSize: '12px' }} /> : <FaChevronRight style={{ color: '#9ca3af', fontSize: '12px' }} />}
                    </button>
                    {expanded && (
                      <div className="divide-y" style={{ borderColor: '#f3f4f6' }}>
                        {items.map(item => (
                          <div key={item.id} className="flex items-center gap-3 p-3" style={{ backgroundColor: '#fff' }}>
                            <input type="checkbox" checked={item.completed}
                              onChange={() => handleToggleChecklist(item.id, item.completed)}
                              style={{
                                WebkitAppearance: 'none', appearance: 'none', width: '22px', height: '22px',
                                border: '2px solid ' + (item.completed ? '#ec4899' : '#f9a8d4'),
                                borderRadius: '6px', backgroundColor: item.completed ? '#ec4899' : 'transparent',
                                cursor: 'pointer', flexShrink: 0,
                              }} />
                            {item.completed && <FaCheckCircle className="absolute pointer-events-none" style={{ color: '#fff', width: '22px', height: '22px', padding: '3px' }} />}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate" style={{
                                color: item.completed ? '#9ca3af' : '#374151',
                                textDecoration: item.completed ? 'line-through' : 'none',
                              }}>{item.title}</p>
                              <div className="flex gap-1 mt-0.5">
                                {item.assigned_to !== 'joint' && (
                                  <span className="text-[8px] font-bold px-1 py-0.5 rounded" style={{
                                    backgroundColor: item.assigned_to === 'pria' ? '#dbeafe' : '#fce7f3',
                                    color: item.assigned_to === 'pria' ? '#2563eb' : '#db2777',
                                  }}>
                                    {item.assigned_to === 'pria' ? 'Pria' : 'Wanita'}
                                  </span>
                                )}
                                {item.due_date && <span className="text-[8px]" style={{ color: '#9ca3af' }}>{formatDateShort(item.due_date)}</span>}
                              </div>
                            </div>
                            <button onClick={() => handleDeleteChecklist(item.id)} className="p-1.5 rounded-lg flex-shrink-0" style={{ color: '#ef4444' }}>
                              <FaTrash style={{ fontSize: '11px' }} />
                            </button>
                          </div>
                        ))}
                        {items.length === 0 && (
                          <p className="text-xs text-center py-3" style={{ color: '#9ca3af' }}>Belum ada item</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {data.checklistCategories.length === 0 && (
                <div className="text-center py-6">
                  <p className="text-sm font-bold" style={{ color: '#9ca3af' }}>Belum ada kategori</p>
                  <p className="text-xs mt-1" style={{ color: '#d1d5db' }}>Tambahkan kategori checklist dulu</p>
                  <div className="mt-3 flex justify-center gap-2">
                    <input
                      placeholder="Nama kategori"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="p-2 rounded-xl text-xs outline-none"
                      style={{ border: '1px solid #fce7f3', color: '#374151', width: '150px' }}
                    />
                    <button onClick={handleAddCategory}
                      className="text-xs font-bold px-3 py-2 rounded-xl" style={{ backgroundColor: '#ec4899', color: '#fff' }}>
                      Tambah
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== ENGAGEMENT TAB ===== */}
          {activeTab === 'engagement' && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                <p className="font-bold text-sm mb-2" style={{ color: '#374151' }}>Ringkasan Engagement</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg text-center" style={{ backgroundColor: '#fff' }}>
                    <p className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>Total Item</p>
                    <p className="font-bold text-lg" style={{ color: '#374151' }}>{data.engagementItems.length}</p>
                  </div>
                  <div className="p-2 rounded-lg text-center" style={{ backgroundColor: '#fff' }}>
                    <p className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>Total Biaya</p>
                    <p className="font-bold text-lg" style={{ color: '#db2777' }}>{formatRupiah(engagementTotalActual)}</p>
                  </div>
                </div>
              </div>

              {/* Split Budget */}
              {(() => {
                const pria = data.engagementItems.filter(i => i.party === 'pria').reduce((a, i) => a + i.budget_amount, 0);
                const wanita = data.engagementItems.filter(i => i.party === 'wanita').reduce((a, i) => a + i.budget_amount, 0);
                const total = pria + wanita;
                return total > 0 ? (
                  <div className="p-4 rounded-xl" style={{ border: '1px solid #f3f4f6' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#6b7280' }}>Split Budget</p>
                    <div className="flex gap-3">
                      <div className="flex-1 p-2 rounded-lg" style={{ backgroundColor: '#dbeafe' }}>
                        <p className="text-[10px] font-bold text-center" style={{ color: '#2563eb' }}>Pria</p>
                        <p className="text-xs font-bold text-center" style={{ color: '#1e40af' }}>{formatRupiah(pria)}</p>
                      </div>
                      <div className="flex-1 p-2 rounded-lg" style={{ backgroundColor: '#fce7f3' }}>
                        <p className="text-[10px] font-bold text-center" style={{ color: '#db2777' }}>Wanita</p>
                        <p className="text-xs font-bold text-center" style={{ color: '#be185d' }}>{formatRupiah(wanita)}</p>
                      </div>
                      <div className="flex-1 p-2 rounded-lg" style={{ backgroundColor: '#f3f4f6' }}>
                        <p className="text-[10px] font-bold text-center" style={{ color: '#6b7280' }}>Total</p>
                        <p className="text-xs font-bold text-center" style={{ color: '#374151' }}>{formatRupiah(total)}</p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

              {/* Party Filter */}
              <div className="flex gap-2">
                {(['all', 'pria', 'wanita', 'joint'] as const).map(p => (
                  <button key={p} onClick={() => setPartyFilter(p)}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap" style={{
                      backgroundColor: partyFilter === p ? '#ec4899' : '#fff',
                      color: partyFilter === p ? '#fff' : '#6b7280',
                      border: partyFilter === p ? 'none' : '1px solid #f3f4f6',
                    }}>
                    {p === 'all' ? 'Semua' : p === 'pria' ? 'Pria' : p === 'wanita' ? 'Wanita' : 'Bersama'}
                  </button>
                ))}
                <button onClick={() => { setFormItem(''); setFormBudget(''); setFormActual(''); setFormParty('joint'); setFormStatus('planned'); setShowAddEngagement(true); }}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap ml-auto" style={{ backgroundColor: '#ec4899', color: '#fff' }}>
                  + Tambah
                </button>
              </div>

              {/* Items */}
              {filteredEngagement.map(item => (
                <div key={item.id} className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6' }}>
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate" style={{ color: '#374151' }}>{item.item}</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${STATUS_COLORS[item.status]}20`, color: STATUS_COLORS[item.status] }}>
                          {item.status}
                        </span>
                        {item.party !== 'joint' && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                            backgroundColor: item.party === 'pria' ? '#dbeafe' : '#fce7f3',
                            color: item.party === 'pria' ? '#2563eb' : '#db2777',
                          }}>
                            {item.party === 'pria' ? 'Pria' : 'Wanita'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{item.category}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleOpenEditEngagement(item)} className="p-1.5 rounded-lg text-xs" style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}>
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeleteEngagement(item.id)} className="p-1.5 rounded-lg text-xs" style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  {/* Budget vs Realisasi */}
                  <div className="mt-2 flex gap-3">
                    <div className="flex-1">
                      <p className="text-[9px] font-bold" style={{ color: '#f59e0b' }}>Budget</p>
                      <p className="text-xs font-bold" style={{ color: '#374151' }}>{formatRupiah(item.budget_amount)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-bold" style={{ color: '#10b981' }}>Realisasi</p>
                      <p className="text-xs font-bold" style={{ color: '#374151' }}>{formatRupiah(item.actual_amount)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-bold" style={{ color: '#6b7280' }}>Selisih</p>
                      <p className="text-xs font-bold" style={{
                        color: item.budget_amount >= item.actual_amount ? '#059669' : '#ef4444'
                      }}>
                        {formatRupiah(item.budget_amount - item.actual_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredEngagement.length === 0 && (
                <p className="text-xs text-center py-6" style={{ color: '#9ca3af' }}>Belum ada item engagement</p>
              )}
            </div>
          )}

          {/* ===== SESERAHAN TAB ===== */}
          {activeTab === 'seserahan' && (
            <div className="space-y-3">
              {/* Summary */}
              <div className="p-4 rounded-xl" style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                <p className="font-bold text-sm mb-2" style={{ color: '#374151' }}>Ringkasan Seserahan</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg text-center" style={{ backgroundColor: '#fff' }}>
                    <p className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>Total Item</p>
                    <p className="font-bold text-lg" style={{ color: '#374151' }}>{data.seserahanItems.length}</p>
                  </div>
                  <div className="p-2 rounded-lg text-center" style={{ backgroundColor: '#fff' }}>
                    <p className="text-[10px] font-bold" style={{ color: '#9ca3af' }}>Total Biaya</p>
                    <p className="font-bold text-lg" style={{ color: '#db2777' }}>{formatRupiah(seserahanTotalActual)}</p>
                  </div>
                </div>
              </div>

              {/* Budget vs Realisasi Summary */}
              {(() => {
                const totalBudgetSeserahan = data.seserahanItems.reduce((a, i) => a + i.budget_amount, 0);
                const totalActualSeserahan = data.seserahanItems.reduce((a, i) => a + i.actual_amount, 0);
                return (
                  <div className="p-4 rounded-xl" style={{ border: '1px solid #f3f4f6' }}>
                    <p className="text-xs font-bold mb-2" style={{ color: '#6b7280' }}>Budget vs Realisasi</p>
                    <div className="flex gap-3">
                      <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: '#fffbeb' }}>
                        <p className="text-[10px] font-bold" style={{ color: '#f59e0b' }}>Budget</p>
                        <p className="text-sm font-bold" style={{ color: '#92400e' }}>{formatRupiah(totalBudgetSeserahan)}</p>
                      </div>
                      <div className="flex-1 p-2 rounded-lg text-center" style={{ backgroundColor: '#f0fdf4' }}>
                        <p className="text-[10px] font-bold" style={{ color: '#16a34a' }}>Realisasi</p>
                        <p className="text-sm font-bold" style={{ color: '#166534' }}>{formatRupiah(totalActualSeserahan)}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Party Filter */}
              <div className="flex gap-2">
                {(['all', 'pria', 'wanita', 'joint'] as const).map(p => (
                  <button key={p} onClick={() => setPartyFilter(p)}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap" style={{
                      backgroundColor: partyFilter === p ? '#ec4899' : '#fff',
                      color: partyFilter === p ? '#fff' : '#6b7280',
                      border: partyFilter === p ? 'none' : '1px solid #f3f4f6',
                    }}>
                    {p === 'all' ? 'Semua' : p === 'pria' ? 'Pria' : p === 'wanita' ? 'Wanita' : 'Bersama'}
                  </button>
                ))}
                <button onClick={() => { setFormItem(''); setFormBudget(''); setFormActual(''); setFormParty('joint'); setFormStatus('planned'); setShowAddSeserahan(true); }}
                  className="text-[10px] font-bold px-3 py-1.5 rounded-full whitespace-nowrap ml-auto" style={{ backgroundColor: '#ec4899', color: '#fff' }}>
                  + Tambah
                </button>
              </div>

              {/* Items */}
              {filteredSeserahan.map(item => (
                <div key={item.id} className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: '#fff', border: '1px solid #f3f4f6' }}>
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm truncate" style={{ color: '#374151' }}>{item.item}</span>
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded"
                          style={{ backgroundColor: `${STATUS_COLORS[item.status]}20`, color: STATUS_COLORS[item.status] }}>
                          {item.status}
                        </span>
                        {item.party !== 'joint' && (
                          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded" style={{
                            backgroundColor: item.party === 'pria' ? '#dbeafe' : '#fce7f3',
                            color: item.party === 'pria' ? '#2563eb' : '#db2777',
                          }}>
                            {item.party === 'pria' ? 'Pria' : 'Wanita'}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] mt-0.5" style={{ color: '#9ca3af' }}>{item.category}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => handleOpenEditSeserahan(item)} className="p-1.5 rounded-lg text-xs" style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}>
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeleteSeserahan(item.id)} className="p-1.5 rounded-lg text-xs" style={{ color: '#ef4444', backgroundColor: '#fef2f2' }}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex gap-3">
                    <div className="flex-1">
                      <p className="text-[9px] font-bold" style={{ color: '#f59e0b' }}>Budget</p>
                      <p className="text-xs font-bold" style={{ color: '#374151' }}>{formatRupiah(item.budget_amount)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-bold" style={{ color: '#10b981' }}>Realisasi</p>
                      <p className="text-xs font-bold" style={{ color: '#374151' }}>{formatRupiah(item.actual_amount)}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-bold" style={{ color: '#6b7280' }}>Selisih</p>
                      <p className="text-xs font-bold" style={{
                        color: item.budget_amount >= item.actual_amount ? '#059669' : '#ef4444'
                      }}>
                        {formatRupiah(item.budget_amount - item.actual_amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredSeserahan.length === 0 && (
                <p className="text-xs text-center py-6" style={{ color: '#9ca3af' }}>Belum ada item seserahan</p>
              )}
            </div>
          )}

          {/* ===== SAVINGS TAB ===== */}
          {activeTab === 'savings' && (
            <div className="space-y-4">
              {/* Target */}
              <div className="rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #f3f4f6' }}>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-sm" style={{ color: '#374151' }}>Tabungan Bersama</p>
                  <button onClick={() => { setFormAmount(target.toString()); setShowTargetModal(true); }}
                    className="text-[10px] font-bold px-3 py-1.5 rounded-full" style={{ color: '#ec4899', backgroundColor: '#fdf2f8' }}>
                    Ubah Target
                  </button>
                </div>
                <div className="text-center mb-2">
                  <p className="text-[10px] font-bold uppercase" style={{ color: '#9ca3af' }}>Total Terkumpul</p>
                  <p className="text-2xl font-bold" style={{ color: '#059669' }}>{formatRupiah(totalIncome)}</p>
                </div>
                {target > 0 && (
                  <>
                    {renderSavingsProgressBar()}
                    <div className="flex justify-between mt-2 text-xs">
                      <span className="font-bold" style={{ color: '#6b7280' }}>
                        Sisa: {formatRupiah(savingsNeeded)}
                      </span>
                      <span className="font-bold" style={{ color: '#db2777' }}>
                        Target: {formatRupiah(target)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Quick Select */}
              <div className="rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #f3f4f6' }}>
                <p className="font-bold text-sm mb-3" style={{ color: '#374151' }}>Pilih Cepat</p>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_SELECT.map(qty => (
                    <button key={qty} onClick={() => handleAddDeposit(qty)}
                      className="py-3 rounded-xl font-bold text-sm transition-all"
                      style={{ backgroundColor: '#fdf2f8', color: '#db2777', border: '1px solid #fce7f3' }}>
                      {formatRupiah(qty)}
                    </button>
                  ))}
                </div>
                <button onClick={() => { setFormAmount(''); setFormDesc(''); setShowDepositModal(true); }}
                  className="w-full py-3 mt-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: '#ec4899', color: '#fff' }}>
                  + Atur Nominal Lain
                </button>
              </div>

              {/* Recent Deposits (from income transactions) */}
              <div className="rounded-2xl p-5 shadow-sm" style={{ border: '1px solid #f3f4f6' }}>
                <p className="font-bold text-sm mb-3" style={{ color: '#374151' }}>Riwayat Setoran</p>
                {data.transactions.filter(t => t.type === 'income').slice(0, 5).map(t => (
                  <div key={t.id} className="flex justify-between items-center py-2 border-b" style={{ borderColor: '#f3f4f6' }}>
                    <div>
                      <p className="text-xs font-bold" style={{ color: '#374151' }}>{t.desc}</p>
                      <p className="text-[10px]" style={{ color: '#9ca3af' }}>{formatDateShort(t.date)}</p>
                    </div>
                    <span className="text-xs font-bold" style={{ color: '#059669' }}>+{formatRupiah(t.amount)}</span>
                  </div>
                ))}
                {data.transactions.filter(t => t.type === 'income').length === 0 && (
                  <p className="text-xs text-center" style={{ color: '#9ca3af' }}>Belum ada setoran</p>
                )}
              </div>
            </div>
          )}

          {/* ===== TIMELINE TAB ===== */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Sub-tabs: Calendar / Gantt */}
              <div className="flex gap-2">
                <button onClick={() => setTimelineView('calendar')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all"
                  style={{
                    backgroundColor: timelineView === 'calendar' ? '#ec4899' : '#fff',
                    color: timelineView === 'calendar' ? '#fff' : '#6b7280',
                    border: timelineView === 'calendar' ? 'none' : '1px solid #f3f4f6',
                  }}>
                  <FaCalendarAlt /> Kalender
                </button>
                <button onClick={() => setTimelineView('gantt')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all"
                  style={{
                    backgroundColor: timelineView === 'gantt' ? '#ec4899' : '#fff',
                    color: timelineView === 'gantt' ? '#fff' : '#6b7280',
                    border: timelineView === 'gantt' ? 'none' : '1px solid #f3f4f6',
                  }}>
                  <FaChartBar /> Gantt Chart
                </button>
              </div>

              {/* CALENDAR VIEW */}
              {timelineView === 'calendar' && (
                (() => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                  const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                  const today = new Date();
                  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

                  const eventsOnDate = (day: number) =>
                    data.timeline.filter(e => {
                      if (!e.deadline) return false;
                      const d = new Date(e.deadline);
                      return d.getDate() === day && d.getMonth() === calendarMonth && d.getFullYear() === calendarYear;
                    });

                  const catColors: Record<string, string> = {
                    Vendor: '#ec4899', Konsep: '#f59e0b', Perhiasan: '#8b5cf6',
                    Busana: '#06b6d4', Admin: '#3b82f6', Keuangan: '#10b981',
                    Acara: '#ef4444', Barang: '#f97316', Digital: '#6366f1', Personal: '#14b8a6',
                  };

                  return (
                    <div className="rounded-2xl p-4 shadow-sm" style={{ border: '1px solid #f3f4f6' }}>
                      {/* Month navigation */}
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); } else setCalendarMonth(m => m - 1); }}
                          className="p-2 rounded-lg" style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}>
                          <FaChevronLeft style={{ fontSize: '12px' }} />
                        </button>
                        <p className="font-bold text-sm" style={{ color: '#374151' }}>{months[calendarMonth]} {calendarYear}</p>
                        <button onClick={() => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); } else setCalendarMonth(m => m + 1); }}
                          className="p-2 rounded-lg" style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}>
                          <FaChevronRightIcon style={{ fontSize: '12px' }} />
                        </button>
                      </div>

                      {/* Day names */}
                      <div className="grid grid-cols-7 mb-2">
                        {dayNames.map(d => (
                          <div key={d} className="text-center text-[10px] font-bold py-1" style={{ color: '#9ca3af' }}>{d}</div>
                        ))}
                      </div>

                      {/* Calendar grid */}
                      <div className="grid grid-cols-7">
                        {Array.from({ length: firstDay }).map((_, i) => (
                          <div key={`empty-${i}`} className="p-1.5 min-h-[40px]" />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const events = eventsOnDate(day);
                          const isToday = day === today.getDate() && calendarMonth === today.getMonth() && calendarYear === today.getFullYear();
                          const isPast = new Date(calendarYear, calendarMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                          return (
                            <div key={day} className="p-1 min-h-[44px] border-t" style={{ borderColor: '#f3f4f6' }}>
                              <div className="text-center mb-0.5">
                                <span className="text-[11px] font-bold inline-flex items-center justify-center"
                                  style={{
                                    width: '22px', height: '22px', borderRadius: '50%',
                                    backgroundColor: isToday ? '#ec4899' : 'transparent',
                                    color: isToday ? '#fff' : isPast ? '#d1d5db' : '#374151',
                                  }}>
                                  {day}
                                </span>
                              </div>
                              {events.slice(0, 2).map(e => (
                                <div key={e.id} className="text-[7px] font-bold truncate rounded px-0.5 mb-0.5 leading-tight"
                                  style={{
                                    backgroundColor: `${catColors[e.category] || '#9ca3af'}20`,
                                    color: catColors[e.category] || '#6b7280',
                                    textDecoration: e.status === 'Done' ? 'line-through' : 'none',
                                  }}>
                                  {e.task}
                                </div>
                              ))}
                              {events.length > 2 && (
                                <div className="text-[7px] font-bold text-center" style={{ color: '#9ca3af' }}>+{events.length - 2}</div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* GANTT CHART VIEW */}
              {timelineView === 'gantt' && (
                (() => {
                  if (!data.settings.wedding_date) {
                    return <p className="text-xs text-center py-6" style={{ color: '#9ca3af' }}>Atur tanggal pernikahan dulu</p>;
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

                  const statusBarColors: Record<string, string> = {
                    Done: '#10b981', Pending: '#f59e0b', planned: '#3b82f6',
                    confirmed: '#8b5cf6', completed: '#10b981', cancelled: '#ef4444',
                  };

                  const getTaskPosition = (deadline?: string) => {
                    if (!deadline) return { left: '0%', width: '0%' };
                    const d = new Date(deadline);
                    const monthIdx = (d.getFullYear() - startDate.getFullYear()) * 12 + d.getMonth() - startDate.getMonth();
                    const pct = Math.max(0, Math.min(monthIdx / totalMonths * 100, 95));
                    return { left: `${pct}%`, width: `${Math.max(3, 100 / totalMonths)}%` };
                  };

                  const catGanttColors: Record<string, string> = {
                    Vendor: '#fce7f3', Konsep: '#fef3c7', Perhiasan: '#ede9fe',
                    Busana: '#cffafe', Admin: '#dbeafe', Keuangan: '#d1fae5',
                    Acara: '#fee2e2', Barang: '#fed7aa', Digital: '#e0e7ff', Personal: '#ccfbf1',
                  };

                  const barCatColors: Record<string, string> = {
                    Vendor: '#ec4899', Konsep: '#f59e0b', Perhiasan: '#8b5cf6',
                    Busana: '#06b6d4', Admin: '#3b82f6', Keuangan: '#10b981',
                    Acara: '#ef4444', Barang: '#f97316', Digital: '#6366f1', Personal: '#14b8a6',
                  };

                  return (
                    <div className="rounded-2xl p-4 shadow-sm" style={{ border: '1px solid #f3f4f6' }}>
                      <p className="font-bold text-sm mb-3" style={{ color: '#374151' }}>Gantt Chart Timeline</p>

                      {/* Month headers */}
                      <div className="flex border-b mb-2" style={{ borderColor: '#f3f4f6', marginLeft: '80px' }}>
                        {monthLabels.map((m, i) => (
                          <div key={i} className="text-[8px] font-bold text-center flex-1 py-1 truncate" style={{ color: '#9ca3af' }}>
                            {m}
                          </div>
                        ))}
                      </div>

                      {/* Task rows */}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                        {sortedTimeline.map(e => {
                          const pos = getTaskPosition(e.deadline);
                          return (
                            <div key={e.id} className="flex items-center gap-2 min-h-[28px]">
                              <div className="text-[10px] font-bold truncate" style={{ width: '76px', flexShrink: 0, color: e.status === 'Done' ? '#9ca3af' : '#374151' }}>
                                {e.task}
                              </div>
                              <div className="flex-1 relative h-6 rounded" style={{ backgroundColor: catGanttColors[e.category] || '#f3f4f6' }}>
                                <div className="absolute h-full rounded flex items-center px-1 transition-all"
                                  style={{
                                    left: pos.left,
                                    width: pos.width,
                                    backgroundColor: barCatColors[e.category] || '#9ca3af',
                                    opacity: e.status === 'Done' ? 0.5 : 0.85,
                                    minWidth: '4px',
                                  }}>
                                  <span className="text-[7px] font-bold text-white truncate w-full">
                                    {e.status === 'Done' ? '✓' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {sortedTimeline.length === 0 && (
                          <p className="text-xs text-center py-6" style={{ color: '#9ca3af' }}>Belum ada timeline</p>
                        )}
                      </div>

                      {/* Legend */}
                      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t" style={{ borderColor: '#f3f4f6' }}>
                        {Object.entries(barCatColors).map(([cat, color]) => (
                          <div key={cat} className="flex items-center gap-1">
                            <div style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: color }} />
                            <span className="text-[8px]" style={{ color: '#6b7280' }}>{cat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          )}
        </div>
      </div>

      {/* ===== FLOATING CASH CARD ===== */}
      <div className="fixed bottom-24 left-0 right-0 flex justify-center px-4" style={{ zIndex: 30, pointerEvents: 'none' }}>
        <div className="w-full max-w-md" style={{ pointerEvents: 'auto' }}>
          <div className="safe-blur p-3 rounded-2xl shadow-lg flex justify-between items-center mx-1" style={{ border: '1px solid #fbcfe8' }}>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fce7f3', color: '#ec4899', flexShrink: 0 }}>
                <FaWallet />
              </div>
              <div>
                <p className="font-bold uppercase" style={{ fontSize: '10px', color: '#6b7280' }}>Sisa Kas Tunai</p>
                <p className="font-bold text-lg" style={{ color: '#1f2937', lineHeight: 1 }}>{formatRupiah(cashBalance)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== BOTTOM ACTION BUTTONS ===== */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-safe" style={{ zIndex: 40 }}>
        <div className="w-full max-w-md px-4 pb-4 pt-2"
          style={{ background: 'linear-gradient(to top, #fdf2f8, rgba(253,242,248,0.95), transparent)' }}>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => { setShowDepositModal(true); setFormAmount(''); setFormDesc(''); }}
              className="py-3.5 rounded-2xl shadow-lg font-bold flex justify-center items-center gap-2 text-sm"
              style={{ backgroundColor: '#10b981', color: '#fff', minHeight: '48px' }}>
              <FaPlusCircle /> Nabung
            </button>
            <button onClick={() => { setShowExpenseModal(true); setFormDesc(''); setFormAmount(''); }}
              className="py-3.5 rounded-2xl shadow-lg font-bold flex justify-center items-center gap-2 text-sm"
              style={{ backgroundColor: '#db2777', color: '#fff', minHeight: '48px' }}>
              <FaReceipt /> Bayar
            </button>
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* ===== MODALS ===== */}
      {/* ============================================ */}

      {/* DEPOSIT MODAL */}
      {showDepositModal && (
        <BottomSheet onClose={() => setShowDepositModal(false)}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>Setor Tabungan</h3>
          <input type="number" placeholder="Jumlah (Rp)"
            className="w-full p-3.5 rounded-xl mb-4 outline-none font-bold text-lg"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', backgroundColor: '#fff', WebkitAppearance: 'none' }}
            value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
          <input type="text" placeholder="Keterangan (opsional)"
            className="w-full p-3.5 rounded-xl mb-6 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', backgroundColor: '#fff', WebkitAppearance: 'none' }}
            value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
          <div className="flex gap-3">
            <button onClick={() => setShowDepositModal(false)} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6', minHeight: '48px' }}>Batal</button>
            <button onClick={() => handleAddDeposit(parseInt(formAmount) || 0, formDesc)} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#fff', backgroundColor: '#10b981', minHeight: '48px' }}>Simpan</button>
          </div>
        </BottomSheet>
      )}

      {/* TARGET MODAL */}
      {showTargetModal && (
        <BottomSheet onClose={() => setShowTargetModal(false)}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>{target === 0 ? 'Atur Target' : 'Ubah Target'}</h3>
          <input type="number" placeholder="Target (Rp)"
            className="w-full p-3.5 rounded-xl mb-6 outline-none font-bold text-lg"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#db2777', backgroundColor: '#fff', WebkitAppearance: 'none' }}
            value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
          <div className="flex gap-3">
            <button onClick={() => setShowTargetModal(false)} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6', minHeight: '48px' }}>Batal</button>
            <button onClick={handleUpdateTarget} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#fff', backgroundColor: '#ec4899', minHeight: '48px' }}>Simpan</button>
          </div>
        </BottomSheet>
      )}

      {/* EXPENSE MODAL */}
      {showExpenseModal && (
        <BottomSheet onClose={() => setShowExpenseModal(false)}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>Bayar Vendor</h3>
          <select className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', backgroundColor: 'rgba(253,242,248,0.5)', WebkitAppearance: 'menulist' }}
            value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
            <option value="Lainnya">Lainnya</option>
            {data.budgets.map(b => <option key={b.id} value={b.item}>{b.item}</option>)}
          </select>
          <input type="text" placeholder="Keterangan"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', backgroundColor: '#fff', WebkitAppearance: 'none' }}
            value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
          <input type="number" placeholder="Jumlah (Rp)"
            className="w-full p-3.5 rounded-xl mb-6 outline-none font-bold text-lg"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', backgroundColor: '#fff', WebkitAppearance: 'none' }}
            value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
          <div className="flex gap-3">
            <button onClick={() => setShowExpenseModal(false)} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6', minHeight: '48px' }}>Batal</button>
            <button onClick={handleAddExpense} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#fff', backgroundColor: '#db2777', minHeight: '48px' }}>Simpan</button>
          </div>
        </BottomSheet>
      )}

      {/* ADD CHECKLIST ITEM MODAL */}
      {showAddChecklistItem && (
        <BottomSheet onClose={() => setShowAddChecklistItem(false)}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>Tambah Item Checklist</h3>
          <select className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
            value={formCategory} onChange={(e) => setFormCategory(e.target.value)}>
            <option value="">Pilih Kategori</option>
            {data.checklistCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="text" placeholder="Judul tugas"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', backgroundColor: '#fff', WebkitAppearance: 'none' }}
            value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
          <select className="w-full p-3.5 rounded-xl mb-6 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
            value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
            <option value="joint">Bersama</option>
            <option value="pria">Pihak Pria</option>
            <option value="wanita">Pihak Wanita</option>
          </select>
          <div className="flex gap-3">
            <button onClick={() => setShowAddChecklistItem(false)} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}>Batal</button>
            <button onClick={handleAddChecklistItem} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#fff', backgroundColor: '#ec4899' }}>Simpan</button>
          </div>
        </BottomSheet>
      )}

      {/* ADD ENGAGEMENT MODAL */}
      {showAddEngagement && (
        <BottomSheet onClose={() => setShowAddEngagement(false)}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>Tambah Item Engagement</h3>
          <input type="text" placeholder="Nama item"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
            value={formItem} onChange={(e) => setFormItem(e.target.value)} />
          <input type="text" placeholder="Kategori"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
            value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input type="number" placeholder="Budget (Rp)"
              className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
              value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
            <input type="number" placeholder="Realisasi (Rp)"
              className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
              value={formActual} onChange={(e) => setFormActual(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
              value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
              <option value="joint">Bersama</option>
              <option value="pria">Pria</option>
              <option value="wanita">Wanita</option>
            </select>
            <select className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
              value={formStatus} onChange={(e) => setFormStatus(e.target.value as StatusLabel)}>
              <option value="planned">Planned</option>
              <option value="ordered">Order</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddEngagement(false)} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}>Batal</button>
            <button onClick={handleAddEngagement} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#fff', backgroundColor: '#ec4899' }}>Simpan</button>
          </div>
        </BottomSheet>
      )}

      {/* ADD SESERAHAN MODAL */}
      {showAddSeserahan && (
        <BottomSheet onClose={() => setShowAddSeserahan(false)}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>Tambah Item Seserahan</h3>
          <input type="text" placeholder="Nama item"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
            value={formItem} onChange={(e) => setFormItem(e.target.value)} />
          <input type="text" placeholder="Kategori"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
            value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input type="number" placeholder="Budget (Rp)"
              className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
              value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
            <input type="number" placeholder="Realisasi (Rp)"
              className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
              value={formActual} onChange={(e) => setFormActual(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
              value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
              <option value="joint">Bersama</option>
              <option value="pria">Pria</option>
              <option value="wanita">Wanita</option>
            </select>
            <select className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
              value={formStatus} onChange={(e) => setFormStatus(e.target.value as StatusLabel)}>
              <option value="planned">Planned</option>
              <option value="ordered">Order</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowAddSeserahan(false)} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}>Batal</button>
            <button onClick={handleAddSeserahan} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#fff', backgroundColor: '#ec4899' }}>Simpan</button>
          </div>
        </BottomSheet>
      )}

      {/* EDIT ENGAGEMENT MODAL */}
      {showEditEngagement && (
        <BottomSheet onClose={() => setShowEditEngagement(null)}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>Edit Engagement Item</h3>
          <input type="text" placeholder="Nama item"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
            value={formItem} onChange={(e) => setFormItem(e.target.value)} />
          <input type="text" placeholder="Kategori"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
            value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input type="number" placeholder="Budget (Rp)"
              className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
              value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
            <input type="number" placeholder="Realisasi (Rp)"
              className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
              value={formActual} onChange={(e) => setFormActual(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <select className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
              value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
              <option value="joint">Bersama</option>
              <option value="pria">Pria</option>
              <option value="wanita">Wanita</option>
            </select>
            <select className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
              value={formStatus} onChange={(e) => setFormStatus(e.target.value as StatusLabel)}>
              <option value="planned">Planned</option>
              <option value="ordered">Order</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowEditEngagement(null)} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}>Batal</button>
            <button onClick={handleUpdateEngagement} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#fff', backgroundColor: '#ec4899' }}>Simpan</button>
          </div>
        </BottomSheet>
      )}

      {/* EDIT SESERAHAN MODAL */}
      {showEditSeserahan && (
        <BottomSheet onClose={() => setShowEditSeserahan(null)}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>Edit Seserahan Item</h3>
          <input type="text" placeholder="Nama item"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
            value={formItem} onChange={(e) => setFormItem(e.target.value)} />
          <input type="text" placeholder="Kategori"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
            value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input type="number" placeholder="Budget (Rp)"
              className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
              value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
            <input type="number" placeholder="Realisasi (Rp)"
              className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
              value={formActual} onChange={(e) => setFormActual(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-6">
            <select className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
              value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
              <option value="joint">Bersama</option>
              <option value="pria">Pria</option>
              <option value="wanita">Wanita</option>
            </select>
            <select className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
              value={formStatus} onChange={(e) => setFormStatus(e.target.value as StatusLabel)}>
              <option value="planned">Planned</option>
              <option value="ordered">Order</option>
              <option value="done">Done</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowEditSeserahan(null)} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}>Batal</button>
            <button onClick={handleUpdateSeserahan} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#fff', backgroundColor: '#ec4899' }}>Simpan</button>
          </div>
        </BottomSheet>
      )}

      {/* ADD BUDGET MODAL */}
      {showAddBudget && (
        <BottomSheet onClose={() => setShowAddBudget(false)}>
          <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>Tambah Anggaran</h3>
          <input type="text" placeholder="Nama item (e.g. Venue, MUA)"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
            value={formItem} onChange={(e) => setFormItem(e.target.value)} />
          <input type="text" placeholder="Kategori"
            className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
            value={formCategory} onChange={(e) => setFormCategory(e.target.value)} />
          <div className="grid grid-cols-2 gap-2 mb-3">
            <input type="number" placeholder="Rencana (Rp)"
              className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
              value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
            <input type="number" placeholder="Dibayar (Rp)"
              className="w-full p-3.5 rounded-xl outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'none' }}
              value={formActual} onChange={(e) => setFormActual(e.target.value)} />
          </div>
          <select className="w-full p-3.5 rounded-xl mb-6 outline-none text-sm"
            style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', WebkitAppearance: 'menulist' }}
            value={formParty} onChange={(e) => setFormParty(e.target.value as PartyChoice)}>
            <option value="joint">Bersama</option>
            <option value="pria">Pria</option>
            <option value="wanita">Wanita</option>
          </select>
          <div className="flex gap-3">
            <button onClick={() => setShowAddBudget(false)} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#6b7280', backgroundColor: '#f3f4f6' }}>Batal</button>
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
            }} className="flex-1 py-3.5 rounded-xl font-bold"
              style={{ color: '#fff', backgroundColor: '#ec4899' }}>Simpan</button>
          </div>
        </BottomSheet>
      )}

    </div>
  );
}
