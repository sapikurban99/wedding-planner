'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FaHeart, FaWallet, FaPlusCircle, FaReceipt, FaSyncAlt, FaArrowDown, FaCalendarAlt, FaInfoCircle, FaCheckCircle, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
// @ts-ignore
import confetti from 'canvas-confetti';
import { AppData, Transaction, TimelineEvent, BudgetItem } from '../type';

// --- PASSWORD GATE COMPONENT ---
function PasswordGate({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setChecking(true);
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.ok) {
        localStorage.setItem('wedding_auth', 'true');
        onAuthenticated();
      } else {
        setError('Password salah 😢');
        setPassword('');
      }
    } catch {
      setError('Gagal koneksi ke server');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(to bottom right, #f43f5e, #ec4899, #e11d48)' }}>
      <div className="absolute top-10 left-10 w-24 h-24 bg-white-10 rounded-full" style={{ filter: 'blur(32px)' }}></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-white-10 rounded-full" style={{ filter: 'blur(32px)' }}></div>

      <div className="w-full max-w-sm" style={{ position: 'relative', zIndex: 10 }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white-20 rounded-full mb-4">
            <FaHeart className="text-3xl" style={{ color: '#ffffff' }} />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: '#ffffff' }}>Wedding Dream</h1>
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
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 pr-12 rounded-2xl outline-none font-medium text-base"
              style={{ border: '2px solid #fce7f3', color: '#374151', backgroundColor: '#ffffff', WebkitAppearance: 'none' }}
              autoFocus
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 p-1"
              style={{ transform: 'translateY(-50%)', color: '#9ca3af' }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {error && <p className="text-xs text-center mb-3 font-medium" style={{ color: '#ef4444' }}>{error}</p>}

          <button
            type="submit"
            disabled={checking}
            className="w-full py-4 font-bold rounded-2xl shadow-lg text-base"
            style={{
              background: 'linear-gradient(to right, #ec4899, #f43f5e)',
              color: '#ffffff',
              opacity: checking ? 0.6 : 1,
              WebkitTransition: 'all 0.2s',
              transition: 'all 0.2s'
            }}
          >
            {checking ? <FaSyncAlt className="animate-spin inline mr-2" /> : null}
            {checking ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
        <p className="text-center text-xs mt-6" style={{ color: '#fbcfe8' }}>💍 With love, forever</p>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = localStorage.getItem('wedding_auth');
    setIsAuthenticated(auth === 'true');
  }, []);

  const [data, setData] = useState<AppData>({
    target: 0,
    weddingDate: '',
    transactions: [],
    budgets: [],
    timeline: []
  });

  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Memuat Data...');
  const [loadProgress, setLoadProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'budget' | 'history'>('timeline');

  const startProgress = useCallback((text: string = 'Memproses...') => {
    setLoadingText(text);
    setLoadProgress(0);
    if (progressInterval.current) clearInterval(progressInterval.current);
    let current = 0;
    progressInterval.current = setInterval(() => {
      current += current < 60 ? 8 : current < 85 ? 3 : 0.5;
      if (current > 95) current = 95;
      setLoadProgress(Math.round(current));
    }, 200);
  }, []);

  const finishProgress = useCallback(() => {
    if (progressInterval.current) clearInterval(progressInterval.current);
    setLoadProgress(100);
    setTimeout(() => setLoadProgress(0), 400);
  }, []);

  const [isModalOpen, setModalOpen] = useState(false);
  const [isCashModalOpen, setCashModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');

  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Lainnya');
  const [cashInput, setCashInput] = useState('');

  const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.length < 10) return dateString;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  const fetchData = async () => {
    setLoading(true);
    startProgress('Memuat Data...');
    try {
      const res = await fetch('/api/proxy');
      const json = await res.json();
      if (!json.error) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      finishProgress();
      setLoading(false);
    }
  };

  const postData = async (payload: any) => {
    setLoading(true);
    startProgress('Menyimpan Data...');
    try {
      await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const res = await fetch('/api/proxy');
      const json = await res.json();
      if (!json.error) setData(json);

      closeModals();

      if (payload.action === 'toggleTask' && payload.status === 'Done') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (payload.type === 'income') confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });
    } catch (e) {
      alert("Gagal simpan data");
    } finally {
      finishProgress();
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  const income = data.transactions.filter((t: Transaction) => t.type === 'income').reduce((a: number, b: Transaction) => a + b.amount, 0);
  const expense = data.transactions.filter((t: Transaction) => t.type === 'expense').reduce((a: number, b: Transaction) => a + b.amount, 0);
  const cash = income - expense;
  const asset = income;
  const gap = data.target - asset;
  const progressPercent = data.target > 0 ? (asset / data.target) * 100 : 0;

  const getDaysLeft = () => {
    if (!data.weddingDate) return 0;
    const diff = new Date(data.weddingDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const daysLeft = getDaysLeft();
  const monthsLeft = Math.max(1, Math.ceil(daysLeft / 30));
  const monthlyTarget = gap > 0 ? gap / monthsLeft : 0;

  const handleToggleTask = (task: string, isChecked: boolean) => {
    const newTimeline = data.timeline.map((t: TimelineEvent) =>
      t.task === task ? { ...t, status: (isChecked ? 'Done' : 'Pending') as 'Done' | 'Pending' } : t
    );
    setData({ ...data, timeline: newTimeline });
    postData({ action: 'toggleTask', task, status: isChecked ? 'Done' : 'Pending' });
  };

  const handleSubmitTrx = () => {
    if (!formDesc || !formAmount) return;
    postData({
      action: 'addTransaction',
      id: Date.now(),
      date: new Date().toISOString(),
      type: modalType,
      desc: formDesc,
      amount: parseInt(formAmount),
      category: modalType === 'expense' ? formCategory : 'Income'
    });
  };

  const handleSubmitCash = () => {
    const real = parseInt(cashInput);
    const diff = real - cash;
    if (diff !== 0) {
      postData({
        action: 'addTransaction',
        id: Date.now(),
        date: new Date().toISOString(),
        type: diff > 0 ? 'income' : 'expense',
        desc: 'Koreksi Saldo Fisik',
        amount: Math.abs(diff),
        category: 'Lainnya'
      });
    }
  };

  const closeModals = () => {
    setModalOpen(false); setCashModalOpen(false);
    setFormDesc(''); setFormAmount('');
  };

  if (isAuthenticated === null) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdf2f8' }}>
      <FaSyncAlt className="animate-spin text-2xl" style={{ color: '#f472b6' }} />
    </div>
  );
  if (!isAuthenticated) return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen flex justify-center font-sans" style={{ backgroundColor: '#fdf2f8', color: '#1f2937' }}>

      {/* ===== FULL SCREEN LOADING OVERLAY ===== */}
      {(loading || loadProgress > 0) && (
        <div className="fixed inset-0 flex flex-col items-center justify-center safe-blur"
          style={{ zIndex: 100, WebkitTransition: 'opacity 0.3s', transition: 'opacity 0.3s' }}>
          <FaHeart className="animate-pulse mb-6" style={{ color: '#ec4899', fontSize: '3rem' }} />
          <p className="font-bold mb-4 text-lg" style={{ color: '#1f2937' }}>
            {loadProgress < 100 ? `${loadingText} ${loadProgress}%` : 'Selesai ✓'}
          </p>
          <div className="w-64 h-3 rounded-full overflow-hidden" style={{ backgroundColor: '#fce7f3', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)' }}>
            <div
              className="h-full"
              style={{
                width: `${loadProgress}%`,
                background: 'linear-gradient(to right, #ec4899, #f43f5e, #ec4899)',
                WebkitTransition: 'width 0.2s ease-out',
                transition: 'width 0.2s ease-out',
                borderRadius: '9999px'
              }}
            ></div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md min-h-screen shadow-2xl relative" style={{ backgroundColor: '#ffffff', paddingBottom: '11rem' }}>

        {/* ===== HEADER ===== */}
        <div className="px-5 pt-6 pb-14 rounded-b-3xl shadow-lg relative overflow-hidden"
          style={{ background: 'linear-gradient(to bottom right, #ec4899, #e11d48)', color: '#ffffff' }}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white-10 rounded-full" style={{ filter: 'blur(20px)', marginRight: '-16px', marginTop: '-16px' }}></div>

          <div className="flex justify-between items-center mb-4 relative" style={{ zIndex: 10 }}>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2"><FaHeart style={{ color: '#fbcfe8' }} /> Wedding Dream</h1>
              <p className="text-xs" style={{ color: '#fce7f3', opacity: 0.9 }}>
                {data.weddingDate ? new Date(data.weddingDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '...'}
              </p>
            </div>
            <button onClick={fetchData} className="text-xs bg-white-20 p-2.5 rounded-full flex items-center justify-center"
              style={{ minWidth: '44px', minHeight: '44px', WebkitTransition: 'all 0.2s', transition: 'all 0.2s' }}>
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="text-center relative" style={{ zIndex: 10, marginTop: '1rem' }}>
            <p className="font-bold uppercase" style={{ color: '#fce7f3', fontSize: '10px', letterSpacing: '0.05em' }}>Kekurangan Biaya</p>
            <h2 className="text-2xl font-bold mt-1">{formatRupiah(Math.max(0, gap))}</h2>

            <div className="w-full bg-black-20 rounded-full h-3 mt-4 overflow-hidden relative">
              <div className="h-3 rounded-full"
                style={{
                  backgroundColor: '#ffffff',
                  width: `${Math.min(progressPercent, 100)}%`,
                  WebkitTransition: 'width 0.7s ease-out',
                  transition: 'width 0.7s ease-out'
                }}></div>
            </div>
            <div className="flex justify-between mt-2 font-medium" style={{ fontSize: '10px', color: '#fce7f3' }}>
              <span>{progressPercent.toFixed(1)}% Terkumpul</span>
              <span>Target: {formatRupiah(data.target)}</span>
            </div>
          </div>
        </div>

        {/* ===== STATS GRID ===== */}
        <div className="px-4 grid grid-cols-2 gap-3 relative" style={{ marginTop: '-2rem', zIndex: 20 }}>
          <div className="col-span-2 rounded-2xl p-4 text-center shadow-md" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
            <p className="font-bold uppercase" style={{ color: '#9ca3af', fontSize: '10px' }}>Uang Terkumpul</p>
            <p className="font-bold text-2xl" style={{ color: '#059669' }}>{formatRupiah(asset)}</p>
          </div>
          <div className="rounded-2xl p-4 text-center shadow-md" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
            <p className="font-bold uppercase" style={{ color: '#9ca3af', fontSize: '10px' }}>Waktu Tersisa</p>
            <p className="font-bold text-lg" style={{ color: '#1f2937' }}>{daysLeft} Hari</p>
          </div>
          <div className="rounded-2xl p-4 text-center shadow-md" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
            <p className="font-bold uppercase" style={{ color: '#9ca3af', fontSize: '10px' }}>Target Nabung</p>
            <p className="font-bold text-lg" style={{ color: '#db2777' }}>{formatRupiah(monthlyTarget)} <span style={{ fontSize: '10px', color: '#9ca3af', display: 'block' }}>/bln</span></p>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div className="px-4 mt-6 flex gap-1 pb-0" style={{ borderBottom: '1px solid #f3f4f6' }}>
          {(['timeline', 'budget', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="text-sm font-bold py-3 flex-1 whitespace-nowrap"
              style={{
                minHeight: '44px',
                color: activeTab === tab ? '#db2777' : '#9ca3af',
                borderBottom: activeTab === tab ? '2px solid #db2777' : '2px solid transparent',
                WebkitTransition: 'all 0.2s',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
                backgroundColor: 'transparent'
              }}
            >
              {tab === 'timeline' ? 'Timeline' : tab === 'budget' ? 'Anggaran' : 'Riwayat'}
            </button>
          ))}
        </div>

        {/* ===== CONTENT ===== */}
        <div className="px-4 mt-4 pb-4">

          {/* 1. TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl mb-4 flex items-start gap-3"
                style={{ backgroundColor: '#fdf2f8', border: '1px solid #fce7f3' }}>
                <FaInfoCircle className="mt-0.5" style={{ color: '#ec4899', minWidth: '16px', flexShrink: 0 }} />
                <div className="text-xs" style={{ color: '#4b5563' }}>
                  <p className="font-bold" style={{ color: '#be185d' }}>Fokus Bulan Ini:</p>
                  <p>Segera DP MUA (Urgent) & Pastikan Venue aman.</p>
                </div>
              </div>

              {data.timeline.map((item: TimelineEvent, idx: number) => (
                <label key={idx} className="flex items-center gap-3 cursor-pointer p-4 rounded-xl shadow-sm"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6', minHeight: '56px' }}>
                  <div className="relative" style={{ flexShrink: 0 }}>
                    <input
                      type="checkbox"
                      checked={item.status === 'Done'}
                      onChange={(e) => handleToggleTask(item.task, e.target.checked)}
                      style={{
                        WebkitAppearance: 'none',
                        appearance: 'none',
                        width: '24px',
                        height: '24px',
                        border: '2px solid ' + (item.status === 'Done' ? '#ec4899' : '#f9a8d4'),
                        borderRadius: '8px',
                        backgroundColor: item.status === 'Done' ? '#ec4899' : 'transparent',
                        cursor: 'pointer'
                      }}
                    />
                    {item.status === 'Done' && (
                      <FaCheckCircle className="absolute top-0 left-0 w-6 h-6 pointer-events-none p-1" style={{ color: '#ffffff' }} />
                    )}
                  </div>
                  <div className="flex-1" style={{ minWidth: 0 }}>
                    <p className="font-bold text-sm" style={{
                      color: item.status === 'Done' ? '#9ca3af' : '#374151',
                      textDecoration: item.status === 'Done' ? 'line-through' : 'none',
                      lineHeight: 1.3
                    }}>
                      {item.task}
                    </p>
                    <div className="flex items-center gap-2 mt-1" style={{ flexWrap: 'wrap' }}>
                      <span className="flex items-center gap-1 font-bold"
                        style={{
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: item.status === 'Done' ? '#f3f4f6' : '#fce7f3',
                          color: item.status === 'Done' ? '#9ca3af' : '#be185d'
                        }}>
                        <FaCalendarAlt style={{ width: '10px', height: '10px' }} /> {item.deadline ? formatDate(item.deadline) : ''}
                      </span>
                      <span style={{ fontSize: '10px', color: '#9ca3af', border: '1px solid #f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{item.category}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* 2. BUDGET */}
          {activeTab === 'budget' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl flex justify-between items-center"
                style={{ backgroundColor: '#f9fafb', border: '1px solid #f3f4f6' }}>
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: '#6b7280' }}>Total Rencana</p>
                  <p className="text-lg font-bold" style={{ color: '#be185d' }}>{formatRupiah(data.budgets.reduce((a: number, b: BudgetItem) => a + b.plan, 0))}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase" style={{ color: '#6b7280' }}>Sudah Dibayar</p>
                  <p className="text-lg font-bold" style={{ color: '#059669' }}>{formatRupiah(data.budgets.reduce((a: number, b: BudgetItem) => a + b.paid, 0))}</p>
                </div>
              </div>

              {data.budgets.map((b: BudgetItem, idx: number) => {
                const pct = b.plan > 0 ? (b.paid / b.plan) * 100 : 0;
                return (
                  <div key={idx} className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-sm" style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '8px' }}>{b.item}</span>
                      <span className="text-xs font-bold" style={{ color: '#db2777', flexShrink: 0 }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full mb-2 overflow-hidden" style={{ backgroundColor: '#f3f4f6' }}>
                      <div className="h-2 rounded-full" style={{
                        backgroundColor: '#ec4899',
                        width: `${Math.min(pct, 100)}%`,
                        WebkitTransition: 'width 0.5s',
                        transition: 'width 0.5s'
                      }}></div>
                    </div>
                    <div className="flex justify-between" style={{ fontSize: '10px', color: '#9ca3af' }}>
                      <span>Paid: {formatRupiah(b.paid)}</span>
                      <span>Plan: {formatRupiah(b.plan)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. HISTORY */}
          {activeTab === 'history' && (
            <ul className="space-y-3">
              {[...data.transactions].sort((a: Transaction, b: Transaction) => b.date.localeCompare(a.date)).map((trx: Transaction) => {
                const isInc = trx.type === 'income';
                return (
                  <li key={trx.id} className="p-3 rounded-xl flex justify-between items-center shadow-sm"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #f3f4f6' }}>
                    <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                      <div className="flex items-center justify-center text-xs"
                        style={{
                          width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                          backgroundColor: isInc ? '#d1fae5' : '#fce7f3',
                          color: isInc ? '#059669' : '#db2777'
                        }}>
                        {isInc ? <FaArrowDown /> : <FaReceipt />}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p className="font-bold text-xs" style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trx.desc}</p>
                        <p style={{ fontSize: '10px', color: '#9ca3af' }}>{new Date(trx.date).toLocaleDateString('id-ID')} • {isInc ? 'Tabungan' : trx.category}</p>
                      </div>
                    </div>
                    <span className="font-bold text-xs" style={{ flexShrink: 0, marginLeft: '8px', color: isInc ? '#059669' : '#db2777' }}>
                      {isInc ? '+' : '-'} {formatRupiah(trx.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ===== FLOATING CASH CARD ===== */}
        <div className="fixed bottom-28 left-0 right-0 flex justify-center px-4" style={{ zIndex: 30, pointerEvents: 'none' }}>
          <div className="w-full max-w-md" style={{ pointerEvents: 'auto' }}>
            <div className="safe-blur p-3 rounded-2xl shadow-lg flex justify-between items-center mx-1"
              style={{ border: '1px solid #fbcfe8' }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fce7f3', color: '#ec4899', flexShrink: 0 }}>
                  <FaWallet />
                </div>
                <div>
                  <p className="font-bold uppercase" style={{ fontSize: '10px', color: '#6b7280' }}>Sisa Kas Tunai</p>
                  <p className="font-bold text-lg" style={{ color: '#1f2937', lineHeight: 1 }}>{formatRupiah(cash)}</p>
                </div>
              </div>
              <button
                onClick={() => { setCashInput(cash.toString()); setCashModalOpen(true); }}
                className="text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-center"
                style={{
                  color: '#db2777',
                  border: '1px solid #fbcfe8',
                  minHeight: '44px',
                  minWidth: '44px',
                  backgroundColor: 'transparent',
                  WebkitTransition: 'all 0.2s',
                  transition: 'all 0.2s'
                }}
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* ===== FLOATING ACTION BUTTONS ===== */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-safe" style={{ zIndex: 40 }}>
          <div className="w-full max-w-md px-4 pb-4 pt-2"
            style={{ background: 'linear-gradient(to top, #fdf2f8, rgba(253,242,248,0.95), transparent)' }}>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setModalType('income'); setModalOpen(true); }}
                className="py-3.5 rounded-2xl shadow-lg font-bold flex justify-center items-center gap-2 text-sm"
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  minHeight: '48px',
                  WebkitTransition: 'all 0.2s',
                  transition: 'all 0.2s'
                }}
              >
                <FaPlusCircle /> Nabung
              </button>
              <button
                onClick={() => { setModalType('expense'); setModalOpen(true); }}
                className="py-3.5 rounded-2xl shadow-lg font-bold flex justify-center items-center gap-2 text-sm"
                style={{
                  backgroundColor: '#db2777',
                  color: '#ffffff',
                  minHeight: '48px',
                  WebkitTransition: 'all 0.2s',
                  transition: 'all 0.2s'
                }}
              >
                <FaReceipt /> Bayar
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ===== TRANSACTION MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 safe-blur-overlay flex items-end justify-center modal-overlay"
          style={{ zIndex: 50 }}
          onClick={closeModals}>
          <div className="w-full rounded-t-3xl p-6 shadow-2xl pb-safe"
            style={{ backgroundColor: '#ffffff', maxWidth: '24rem' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4"><div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#d1d5db' }}></div></div>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>{modalType === 'income' ? '💰 Tabung Uang' : '💳 Bayar Vendor'}</h3>
            {modalType === 'expense' && (
              <div className="mb-3">
                <label className="text-xs font-bold ml-1" style={{ color: '#6b7280' }}>Pos Anggaran</label>
                <select
                  className="w-full p-3.5 rounded-xl mt-1 outline-none text-sm"
                  style={{
                    border: '2px solid #fce7f3',
                    backgroundColor: 'rgba(253,242,248,0.5)',
                    minHeight: '48px',
                    color: '#374151',
                    WebkitAppearance: 'menulist'
                  }}
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                >
                  <option value="Lainnya">Lainnya</option>
                  {data.budgets.map((b: BudgetItem, i: number) => <option key={i} value={b.item}>{b.item}</option>)}
                </select>
              </div>
            )}
            <input
              type="text"
              placeholder="Keterangan (Contoh: Gaji, DP MUA)"
              className="w-full p-3.5 rounded-xl mb-3 outline-none text-sm"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', backgroundColor: '#ffffff', WebkitAppearance: 'none' }}
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
            <input
              type="number"
              placeholder="Jumlah (Rp)"
              className="w-full p-3.5 rounded-xl mb-6 outline-none font-bold text-lg"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#374151', backgroundColor: '#ffffff', WebkitAppearance: 'none' }}
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={closeModals} className="flex-1 py-3.5 rounded-xl font-bold"
                style={{ color: '#6b7280', backgroundColor: '#f3f4f6', minHeight: '48px' }}>
                Batal
              </button>
              <button onClick={handleSubmitTrx} className="flex-1 py-3.5 rounded-xl font-bold"
                style={{
                  color: '#ffffff',
                  backgroundColor: modalType === 'income' ? '#10b981' : '#db2777',
                  minHeight: '48px'
                }}>
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CASH MODAL ===== */}
      {isCashModalOpen && (
        <div className="fixed inset-0 safe-blur-overlay flex items-end justify-center modal-overlay"
          style={{ zIndex: 50 }}
          onClick={closeModals}>
          <div className="w-full rounded-t-3xl p-6 shadow-2xl pb-safe"
            style={{ backgroundColor: '#ffffff', maxWidth: '24rem' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4"><div className="w-10 h-1 rounded-full" style={{ backgroundColor: '#d1d5db' }}></div></div>
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1f2937' }}>📊 Koreksi Saldo Fisik</h3>
            <input
              type="number"
              className="w-full p-3.5 rounded-xl mb-6 outline-none font-bold text-xl"
              style={{ border: '2px solid #fce7f3', minHeight: '48px', color: '#db2777', backgroundColor: '#ffffff', WebkitAppearance: 'none' }}
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={closeModals} className="flex-1 py-3.5 rounded-xl font-bold"
                style={{ color: '#6b7280', backgroundColor: '#f3f4f6', minHeight: '48px' }}>
                Batal
              </button>
              <button onClick={handleSubmitCash} className="flex-1 py-3.5 rounded-xl font-bold"
                style={{ color: '#ffffff', backgroundColor: '#db2777', minHeight: '48px' }}>
                Update
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}