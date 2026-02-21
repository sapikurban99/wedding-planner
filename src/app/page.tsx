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
        sessionStorage.setItem('wedding_auth', 'true');
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
    <div className="min-h-screen bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute top-1/3 right-1/4 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>

      <div className="w-full max-w-sm">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-4">
            <FaHeart className="text-white text-3xl" />
          </div>
          <h1 className="text-2xl font-bold text-white">Wedding Dream</h1>
          <p className="text-pink-100 text-sm mt-1">Qisti & Aldi</p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="bg-white/95 backdrop-blur-md rounded-3xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-100 rounded-full mb-3">
              <FaLock className="text-pink-500 text-lg" />
            </div>
            <h2 className="text-lg font-bold text-gray-800">Masukkan Password</h2>
            <p className="text-xs text-gray-400 mt-1">Untuk mengakses Wedding Planner</p>
          </div>

          <div className="relative mb-4">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 pr-12 border-2 border-pink-100 rounded-2xl outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 text-gray-700 font-medium transition-all text-base"
              autoFocus
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {error && (
            <p className="text-red-500 text-xs text-center mb-3 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={checking}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-60 text-base"
          >
            {checking ? (
              <FaSyncAlt className="animate-spin inline mr-2" />
            ) : null}
            {checking ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>

        <p className="text-center text-pink-200 text-xs mt-6">💍 With love, forever</p>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function Home() {
  // --- AUTH STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem('wedding_auth');
    setIsAuthenticated(auth === 'true');
  }, []);

  // --- STATE ---
  const [data, setData] = useState<AppData>({
    target: 0,
    weddingDate: '',
    transactions: [],
    budgets: [],
    timeline: []
  });

  const [loading, setLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'budget' | 'history'>('timeline');

  // Simulated progress helper
  const startProgress = useCallback(() => {
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

  // Modal State
  const [isModalOpen, setModalOpen] = useState(false);
  const [isCashModalOpen, setCashModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'income' | 'expense'>('income');

  // Form State
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('Lainnya');
  const [cashInput, setCashInput] = useState('');

  // --- HELPER FUNCTIONS ---
  const formatRupiah = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString.length < 10) return dateString;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // --- API HANDLERS ---
  const fetchData = async () => {
    setLoading(true);
    startProgress();
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
    startProgress();
    try {
      await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      fetchData();
      closeModals();

      if (payload.action === 'toggleTask' && payload.status === 'Done') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (payload.type === 'income') confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });

    } catch (e) {
      alert("Gagal simpan data");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchData();
  }, [isAuthenticated]);

  // --- CALCULATIONS ---
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

  // --- ACTIONS ---
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

  // Tab labels in Indonesian
  const tabLabels: Record<string, string> = {
    timeline: 'Timeline',
    budget: 'Anggaran',
    history: 'Riwayat',
  };

  // --- AUTH CHECK ---
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-pink-50 flex items-center justify-center">
        <FaSyncAlt className="animate-spin text-2xl text-pink-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-pink-50 flex justify-center font-sans text-gray-800">

      {/* ===== TOP PROGRESS BAR ===== */}
      {(loading || loadProgress > 0) && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="h-1.5 bg-pink-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-400 transition-all duration-300 ease-out"
              style={{ width: `${loadProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-center">
            <span className="text-[10px] font-bold text-pink-500 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-b-lg shadow-sm">
              {loadProgress < 100 ? `Sinkronisasi... ${loadProgress}%` : 'Selesai ✓'}
            </span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative pb-44">

        {/* ===== HEADER ===== */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 px-5 pt-6 pb-14 text-white rounded-b-[2rem] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-xl -mr-4 -mt-4"></div>

          <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2"><FaHeart className="text-pink-200" /> Wedding Dream</h1>
              <p className="text-xs text-pink-100 opacity-90">
                {data.weddingDate ? new Date(data.weddingDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : '...'}
              </p>
            </div>
            <button
              onClick={fetchData}
              className="text-xs bg-white/20 p-2.5 rounded-full hover:bg-white/30 transition active:scale-90 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <FaSyncAlt className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className="text-center relative z-10 mt-4">
            <p className="text-pink-100 text-[10px] font-bold uppercase tracking-wider">Kekurangan Biaya</p>
            <h2 className="text-2xl sm:text-3xl font-bold mt-1">{formatRupiah(Math.max(0, gap))}</h2>

            <div className="w-full bg-black/20 rounded-full h-3 mt-4 overflow-hidden backdrop-blur-sm relative">
              <div
                className="bg-white h-3 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-medium text-pink-100">
              <span>{progressPercent.toFixed(1)}% Terkumpul</span>
              <span>Target: {formatRupiah(data.target)}</span>
            </div>
          </div>
        </div>

        {/* ===== STATS GRID ===== */}
        <div className="px-4 -mt-8 grid grid-cols-2 gap-3 relative z-20">
          <div className="bg-white rounded-2xl p-4 text-center shadow-md border border-gray-100">
            <p className="text-gray-400 text-[10px] font-bold uppercase">Waktu Tersisa</p>
            <p className="text-gray-800 font-bold text-lg">{getDaysLeft()} Hari</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-md border border-gray-100">
            <p className="text-gray-400 text-[10px] font-bold uppercase">Uang Terkumpul</p>
            <p className="text-emerald-600 font-bold text-lg">{formatRupiah(asset)}</p>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div className="px-4 mt-6 flex gap-1 border-b border-gray-100 pb-0">
          {(['timeline', 'budget', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm font-bold py-3 flex-1 capitalize whitespace-nowrap transition-all min-h-[44px] ${activeTab === tab
                ? 'text-pink-600 border-b-2 border-pink-600'
                : 'text-gray-400 hover:text-gray-500'
                }`}
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>

        {/* ===== CONTENT ===== */}
        <div className="px-4 mt-4 pb-4">

          {/* 1. TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3">
              <div className="bg-pink-50 border border-pink-100 p-3 rounded-xl mb-4 flex items-start gap-3">
                <FaInfoCircle className="text-pink-500 mt-0.5 min-w-[16px] flex-shrink-0" />
                <div className="text-xs text-gray-600">
                  <p className="font-bold text-pink-700">Fokus Bulan Ini:</p>
                  <p>Segera DP MUA (Urgent) & Pastikan Venue aman.</p>
                </div>
              </div>

              {data.timeline.map((item: TimelineEvent, idx: number) => (
                <label key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition active:bg-gray-50 min-h-[56px]">
                  <div className="relative flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={item.status === 'Done'}
                      onChange={(e) => handleToggleTask(item.task, e.target.checked)}
                      className="peer appearance-none w-6 h-6 border-2 border-pink-300 rounded-lg checked:bg-pink-500 checked:border-pink-500 transition-colors"
                    />
                    <FaCheckCircle className="absolute top-0 left-0 w-6 h-6 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity p-1" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm leading-tight ${item.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.task}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 ${item.status === 'Done' ? 'bg-gray-100 text-gray-400' : 'bg-pink-100 text-pink-700'}`}>
                        <FaCalendarAlt size={10} /> {item.deadline ? formatDate(item.deadline) : ''}
                      </span>
                      <span className="text-[10px] text-gray-400 border border-gray-200 px-1.5 py-0.5 rounded">{item.category}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* 2. BUDGET */}
          {activeTab === 'budget' && (
            <div className="space-y-3">
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Total Rencana</p>
                  <p className="text-lg font-bold text-pink-700">{formatRupiah(data.budgets.reduce((a: number, b: BudgetItem) => a + b.plan, 0))}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase">Sudah Dibayar</p>
                  <p className="text-lg font-bold text-emerald-600">{formatRupiah(data.budgets.reduce((a: number, b: BudgetItem) => a + b.paid, 0))}</p>
                </div>
              </div>

              {data.budgets.map((b: BudgetItem, idx: number) => {
                const pct = b.plan > 0 ? (b.paid / b.plan) * 100 : 0;
                return (
                  <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-sm text-gray-700 truncate mr-2">{b.item}</span>
                      <span className="text-xs font-bold text-pink-600 flex-shrink-0">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full mb-2 overflow-hidden">
                      <div className="bg-pink-500 h-2 rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }}></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400">
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
                  <li key={trx.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${isInc ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                        {isInc ? <FaArrowDown /> : <FaReceipt />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-700 text-xs truncate">{trx.desc}</p>
                        <p className="text-[10px] text-gray-400">{new Date(trx.date).toLocaleDateString('id-ID')} • {isInc ? 'Tabungan' : trx.category}</p>
                      </div>
                    </div>
                    <span className={`font-bold text-xs flex-shrink-0 ml-2 ${isInc ? 'text-emerald-600' : 'text-pink-600'}`}>
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
            <div className="bg-white/95 backdrop-blur-md border border-pink-200 p-3 rounded-2xl shadow-lg flex justify-between items-center mx-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 flex-shrink-0"><FaWallet /></div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Sisa Kas Tunai</p>
                  <p className="text-gray-800 font-bold text-lg sm:text-xl leading-none">{formatRupiah(cash)}</p>
                </div>
              </div>
              <button
                onClick={() => { setCashInput(cash.toString()); setCashModalOpen(true); }}
                className="text-xs font-bold text-pink-600 border border-pink-200 px-3 py-2 rounded-xl hover:bg-pink-50 active:bg-pink-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                Edit
              </button>
            </div>
          </div>
        </div>

        {/* ===== FLOATING ACTION BUTTONS ===== */}
        <div className="fixed bottom-0 left-0 right-0 flex justify-center z-40 pb-safe">
          <div className="w-full max-w-md px-4 pb-4 pt-2 bg-gradient-to-t from-pink-50 via-pink-50/95 to-transparent">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setModalType('income'); setModalOpen(true); }}
                className="bg-emerald-500 hover:bg-emerald-600 text-white py-3.5 rounded-2xl shadow-lg font-bold flex justify-center items-center gap-2 transition active:scale-95 min-h-[48px] text-sm"
              >
                <FaPlusCircle /> Nabung
              </button>
              <button
                onClick={() => { setModalType('expense'); setModalOpen(true); }}
                className="bg-pink-600 hover:bg-pink-700 text-white py-3.5 rounded-2xl shadow-lg font-bold flex justify-center items-center gap-2 transition active:scale-95 min-h-[48px] text-sm"
              >
                <FaReceipt /> Bayar
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* ===== TRANSACTION MODAL (Bottom Sheet) ===== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={closeModals}>
          <div
            className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl modal-bottom-sheet pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center mb-4 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <h3 className="text-lg font-bold mb-4 text-gray-800">
              {modalType === 'income' ? '💰 Tabung Uang' : '💳 Bayar Vendor'}
            </h3>

            {modalType === 'expense' && (
              <div className="mb-3">
                <label className="text-xs font-bold text-gray-500 ml-1">Pos Anggaran</label>
                <select
                  className="w-full p-3.5 border-2 border-pink-100 rounded-xl mt-1 bg-pink-50/50 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 text-sm transition-all min-h-[48px]"
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
              className="w-full p-3.5 border-2 border-pink-100 rounded-xl mb-3 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 transition-all text-sm min-h-[48px]"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
            />
            <input
              type="number"
              placeholder="Jumlah (Rp)"
              className="w-full p-3.5 border-2 border-pink-100 rounded-xl mb-6 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 font-bold text-lg transition-all min-h-[48px]"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
            />

            <div className="flex gap-3">
              <button onClick={closeModals} className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition min-h-[48px]">Batal</button>
              <button onClick={handleSubmitTrx} className={`flex-1 py-3.5 rounded-xl font-bold text-white transition active:scale-[0.98] min-h-[48px] ${modalType === 'income' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-pink-600 hover:bg-pink-700'}`}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CASH MODAL (Bottom Sheet) ===== */}
      {isCashModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={closeModals}>
          <div
            className="bg-white w-full sm:max-w-sm sm:rounded-2xl rounded-t-3xl p-6 shadow-2xl modal-bottom-sheet pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center mb-4 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Koreksi Saldo Fisik</h3>
            <input
              type="number"
              className="w-full p-3.5 border-2 border-pink-100 rounded-xl mb-6 outline-none focus:border-pink-400 focus:ring-4 focus:ring-pink-100 font-bold text-xl text-pink-600 transition-all min-h-[48px]"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
            />
            <div className="flex gap-3">
              <button onClick={closeModals} className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition min-h-[48px]">Batal</button>
              <button onClick={handleSubmitCash} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-pink-600 hover:bg-pink-700 active:scale-[0.98] transition min-h-[48px]">Update</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}