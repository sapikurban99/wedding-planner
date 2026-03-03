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
        // PERUBAHAN: Gunakan localStorage agar tidak perlu login terus menerus
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
    <div className="min-h-screen bg-gradient-to-br from-[#f43f5e] via-[#ec4899] to-[#e11d48] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-24 h-24 bg-[#ffffff1a] rounded-full blur-2xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-[#ffffff1a] rounded-full blur-2xl"></div>

      <div className="w-full max-w-sm z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#ffffff33] backdrop-blur-sm rounded-full mb-4">
            <FaHeart className="text-[#ffffff] text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-[#ffffff]">Wedding Dream</h1>
          <p className="text-[#fce7f3] text-sm mt-1">Qisti & Aldi</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#fffffff2] backdrop-blur-md rounded-3xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#fce7f3] rounded-full mb-3">
              <FaLock className="text-[#ec4899] text-lg" />
            </div>
            <h2 className="text-lg font-bold text-[#1f2937]">Masukkan Password</h2>
            <p className="text-xs text-[#9ca3af] mt-1">Untuk mengakses Wedding Planner</p>
          </div>

          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 pr-12 border-2 border-[#fce7f3] rounded-2xl outline-none focus:border-[#f472b6] text-[#374151] font-medium transition-all text-base bg-[#ffffff]"
              autoFocus
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#4b5563] p-1"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {error && <p className="text-[#ef4444] text-xs text-center mb-3 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={checking}
            className="w-full py-4 bg-gradient-to-r from-[#ec4899] to-[#f43f5e] text-[#ffffff] font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 text-base"
          >
            {checking ? <FaSyncAlt className="animate-spin inline mr-2" /> : null}
            {checking ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>
        <p className="text-center text-[#fbcfe8] text-xs mt-6">💍 With love, forever</p>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // PERUBAHAN: Cek dari localStorage
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

  // PERUBAHAN: Custom loading text
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
      // Ambil ulang data setelah save
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
    // Optimistic Update
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

  if (isAuthenticated === null) return <div className="min-h-screen bg-[#fdf2f8] flex items-center justify-center"><FaSyncAlt className="animate-spin text-2xl text-[#f472b6]" /></div>;
  if (!isAuthenticated) return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;

  return (
    <div className="min-h-screen bg-[#fdf2f8] flex justify-center font-sans text-[#1f2937]">

      {/* ===== FULL SCREEN LOADING OVERLAY ===== */}
      {(loading || loadProgress > 0) && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#ffffffea] backdrop-blur-md transition-opacity duration-300">
          <FaHeart className="text-[#ec4899] text-5xl animate-pulse mb-6 shadow-sm" />
          <p className="text-[#1f2937] font-bold mb-4 text-lg">
            {loadProgress < 100 ? `${loadingText} ${loadProgress}%` : 'Selesai ✓'}
          </p>
          <div className="w-64 h-3 bg-[#fce7f3] rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-[#ec4899] via-[#f43f5e] to-[#ec4899] transition-all duration-200 ease-out"
              style={{ width: `${loadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-[#ffffff] min-h-screen shadow-2xl relative pb-44">

        {/* ===== HEADER ===== */}
        <div className="bg-gradient-to-br from-[#ec4899] to-[#e11d48] px-5 pt-6 pb-14 text-[#ffffff] rounded-b-[2rem] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffffff1a] rounded-full blur-xl -mr-4 -mt-4"></div>

          <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2"><FaHeart className="text-[#fbcfe8]" /> Wedding Dream</h1>
              <p className="text-xs text-[#fce7f3] opacity-90">
                {data.weddingDate ? new Date(data.weddingDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '...'}
              </p>
            </div>
            <button onClick={fetchData} className="text-xs bg-[#ffffff33] p-2.5 rounded-full hover:bg-[#ffffff4d] transition active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center">
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="text-center relative z-10 mt-4">
            <p className="text-[#fce7f3] text-[10px] font-bold uppercase tracking-wider">Kekurangan Biaya</p>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">{formatRupiah(Math.max(0, gap))}</h2>

            <div className="w-full bg-[#00000033] rounded-full h-3 mt-4 overflow-hidden backdrop-blur-sm relative">
              <div className="bg-[#ffffff] h-3 rounded-full transition-all duration-700 ease-out" style={{ width: `${Math.min(progressPercent, 100)}%` }}></div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-medium text-[#fce7f3]">
              <span>{progressPercent.toFixed(1)}% Terkumpul</span>
              <span>Target: {formatRupiah(data.target)}</span>
            </div>
          </div>
        </div>

        {/* ===== STATS GRID ===== */}
        <div className="px-4 -mt-8 grid grid-cols-2 gap-3 relative z-20">
          <div className="bg-[#ffffff] col-span-2 rounded-2xl p-4 text-center shadow-md border border-[#f3f4f6]">
            <p className="text-[#9ca3af] text-[10px] font-bold uppercase">Uang Terkumpul</p>
            <p className="text-[#059669] font-bold text-2xl">{formatRupiah(asset)}</p>
          </div>
          <div className="bg-[#ffffff] rounded-2xl p-4 text-center shadow-md border border-[#f3f4f6]">
            <p className="text-[#9ca3af] text-[10px] font-bold uppercase">Waktu Tersisa</p>
            <p className="text-[#1f2937] font-bold text-lg">{daysLeft} Hari</p>
          </div>
          <div className="bg-[#ffffff] rounded-2xl p-4 text-center shadow-md border border-[#f3f4f6]">
            <p className="text-[#9ca3af] text-[10px] font-bold uppercase">Target Nabung</p>
            <p className="text-[#db2777] font-bold text-lg">{formatRupiah(monthlyTarget)} <span className="text-[10px] text-[#9ca3af] block sm:inline">/bln</span></p>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div className="px-4 mt-6 flex gap-1 border-b border-[#f3f4f6] pb-0">
          {(['timeline', 'budget', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-bold py-3 flex-1 capitalize whitespace-nowrap transition-all min-h-[44px] ${activeTab === tab ? 'text-[#db2777] border-b-2 border-[#db2777]' : 'text-[#9ca3af] hover:text-[#6b7280]'
                }`}
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
              <div className="bg-[#fdf2f8] border border-[#fce7f3] p-3 rounded-xl mb-4 flex items-start gap-3">
                <FaInfoCircle className="text-[#ec4899] mt-0.5 min-w-[16px] flex-shrink-0" />
                <div className="text-xs text-[#4b5563]">
                  <p className="font-bold text-[#be185d]">Fokus Bulan Ini:</p>
                  <p>Segera DP MUA (Urgent) & Pastikan Venue aman.</p>
                </div>
              </div>

              {data.timeline.map((item: TimelineEvent, idx: number) => (
                <label key={idx} className="bg-[#ffffff] p-4 rounded-xl shadow-sm border border-[#f3f4f6] flex items-center gap-3 cursor-pointer transition active:bg-[#f9fafb] min-h-[56px]">
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={item.status === 'Done'}
                      onChange={(e) => handleToggleTask(item.task, e.target.checked)}
                      className="peer appearance-none w-6 h-6 border-2 border-[#f9a8d4] rounded-lg checked:bg-[#ec4899] checked:border-[#ec4899] transition-colors"
                    />
                    <FaCheckCircle className="absolute top-0 left-0 w-6 h-6 text-[#ffffff] pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm leading-tight ${item.status === 'Done' ? 'line-through text-[#9ca3af]' : 'text-[#374151]'}`}>
                      {item.task}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 ${item.status === 'Done' ? 'bg-[#f3f4f6] text-[#9ca3af]' : 'bg-[#fce7f3] text-[#be185d]'}`}>
                        <FaCalendarAlt size={10} /> {item.deadline ? formatDate(item.deadline) : ''}
                      </span>
                      <span className="text-[10px] text-[#9ca3af] border border-[#f3f4f6] px-1.5 py-0.5 rounded">{item.category}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* 2. BUDGET */}
          {activeTab === 'budget' && (
            <div className="space-y-3">
              <div className="bg-[#f9fafb] border border-[#f3f4f6] p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-[#6b7280] font-bold uppercase">Total Rencana</p>
                  <p className="text-lg font-bold text-[#be185d]">{formatRupiah(data.budgets.reduce((a: number, b: BudgetItem) => a + b.plan, 0))}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#6b7280] font-bold uppercase">Sudah Dibayar</p>
                  <p className="text-lg font-bold text-[#059669]">{formatRupiah(data.budgets.reduce((a: number, b: BudgetItem) => a + b.paid, 0))}</p>
                </div>
              </div>

              {data.budgets.map((b: BudgetItem, idx: number) => {
                const pct = b.plan > 0 ? (b.paid / b.plan) * 100 : 0;
                return (
                  <div key={idx} className="bg-[#ffffff] p-3 rounded-xl border border-[#f3f4f6] shadow-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-sm text-[#374151] truncate mr-2">{b.item}</span>
                      <span className="text-xs font-bold text-[#db2777] flex-shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-[#f3f4f6] h-2 rounded-full mb-2 overflow-hidden">
                      <div className="bg-[#ec4899] h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-[#9ca3af]">
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
                  <li key={trx.id} className="bg-[#ffffff] p-3 rounded-xl border border-[#f3f4f6] flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isInc ? 'bg-[#d1fae5] text-[#059669]' : 'bg-[#fce7f3] text-[#db2777]'}`}>
                        {isInc ? <FaArrowDown /> : <FaReceipt />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[#374151] text-xs truncate">{trx.desc}</p>
                        <p className="text-[10px] text-[#9ca3af]">{new Date(trx.date).toLocaleDateString('id-ID')} • {isInc ? 'Tabungan' : trx.category}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-xs flex-shrink-0 ml-2 ${isInc ? 'text-[#059669]' : 'text-[#db2777]'}`}>
                      {isInc ? '+' : '-'} {formatRupiah(trx.amount)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ===== FLOATING CASH CARD ===== */}
        <div className="fixed bottom-28 left-0 right-0 flex justify-center z-30 pointer-events-none px-4">
          <div className="w-full max-w-md pointer-events-auto">
            <div className="bg-[#fffffff2] backdrop-blur-md border border-[#fbcfe8] p-3 rounded-2xl shadow-lg flex justify-between items-center mx-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#fce7f3] flex items-center justify-center text-[#ec4899] flex-shrink-0"><FaWallet /></div>
                <div>
                  <p className="text-[10px] text-[#6b7280] font-bold uppercase">Sisa Kas Tunai</p>
                  <p className="text-[#1f2937] font-bold text-lg sm:text-xl leading-none">{formatRupiah(cash)}</p>
                </div>
              </div>
              <button
                onClick={() => { setCashInput(cash.toString()); setCashModalOpen(true); }}
                className="text-xs font-bold text-[#db2777] border border-[#fbcfe8] px-3 py-2 rounded-xl hover:bg-[#fdf2f8] transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* ===== FLOATING ACTION BUTTONS ===== */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center z-40 pb-safe">
          <div className="w-full max-w-md px-4 pb-4 pt-2 bg-gradient-to-t from-[#fdf2f8] via-[#fdf2f8f2] to-transparent">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setModalType('income'); setModalOpen(true); }}
                className="bg-[#10b981] hover:bg-[#059669] text-[#ffffff] py-3.5 rounded-2xl shadow-lg font-bold flex justify-center items-center gap-2 transition active:scale-95 min-h-[48px] text-sm"
              >
                <FaPlusCircle /> Nabung
              </button>
              <button
                onClick={() => { setModalType('expense'); setModalOpen(true); }}
                className="bg-[#db2777] hover:bg-[#be185d] text-[#ffffff] py-3.5 rounded-2xl shadow-lg font-bold flex justify-center items-center gap-2 transition active:scale-95 min-h-[48px] text-sm"
              >
                <FaReceipt /> Bayar
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ===== TRANSACTION MODAL ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#00000080] backdrop-blur-sm z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={closeModals}>
          <div className="bg-[#ffffff] w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl pb-safe" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4 sm:hidden"><div className="w-10 h-1 bg-[#d1d5db] rounded-full"></div></div>
            <h3 className="text-lg font-bold mb-4 text-[#1f2937]">{modalType === 'income' ? '💰 Tabung Uang' : '💳 Bayar Vendor'}</h3>
            {modalType === 'expense' && (
              <div className="mb-3">
                <label className="text-xs font-bold text-[#6b7280] ml-1">Pos Anggaran</label>
                <select
                  className="w-full p-3.5 border-2 border-[#fce7f3] rounded-xl mt-1 bg-[#fdf2f880] outline-none focus:border-[#f472b6] text-sm min-h-[48px] text-[#374151]"
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
              className="w-full p-3.5 border-2 border-[#fce7f3] rounded-xl mb-3 outline-none focus:border-[#f472b6] text-sm min-h-[48px] text-[#374151] bg-[#ffffff]"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
            <input
              type="number"
              placeholder="Jumlah (Rp)"
              className="w-full p-3.5 border-2 border-[#fce7f3] rounded-xl mb-6 outline-none focus:border-[#f472b6] font-bold text-lg min-h-[48px] text-[#374151] bg-[#ffffff]"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={closeModals} className="flex-1 py-3.5 rounded-xl font-bold text-[#6b7280] bg-[#f3f4f6] hover:bg-[#e5e7eb] transition min-h-[48px]">Batal</button>
              <button onClick={handleSubmitTrx} className={`flex-1 py-3.5 rounded-xl font-bold text-[#ffffff] transition min-h-[48px] ${modalType === 'income' ? 'bg-[#10b981] hover:bg-[#059669]' : 'bg-[#db2777] hover:bg-[#be185d]'}`}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CASH MODAL ===== */}
      {isCashModalOpen && (
        <div className="fixed inset-0 bg-[#00000080] backdrop-blur-sm z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={closeModals}>
          <div className="bg-[#ffffff] w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl pb-safe" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center mb-4 sm:hidden"><div className="w-10 h-1 bg-[#d1d5db] rounded-full"></div></div>
            <h3 className="text-lg font-bold text-[#1f2937] mb-4">📊 Koreksi Saldo Fisik</h3>
            <input
              type="number"
              className="w-full p-3.5 border-2 border-[#fce7f3] rounded-xl mb-6 outline-none focus:border-[#f472b6] font-bold text-xl text-[#db2777] min-h-[48px] bg-[#ffffff]"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={closeModals} className="flex-1 py-3.5 rounded-xl font-bold text-[#6b7280] bg-[#f3f4f6] hover:bg-[#e5e7eb] transition min-h-[48px]">Batal</button>
              <button onClick={handleSubmitCash} className="flex-1 py-3.5 rounded-xl font-bold text-[#ffffff] bg-[#db2777] hover:bg-[#be185d] transition min-h-[48px]">Update</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}