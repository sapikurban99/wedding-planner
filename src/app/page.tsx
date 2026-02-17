'use client';

import { useState, useEffect } from 'react';
import { FaHeart, FaWallet, FaPlusCircle, FaReceipt, FaSyncAlt, FaArrowDown, FaCalendarAlt, FaInfoCircle, FaCheckCircle } from 'react-icons/fa';
// @ts-ignore
import confetti from 'canvas-confetti';
import { AppData, Transaction, TimelineEvent, BudgetItem } from '../type'; // Import tipe data

export default function Home() {
  // --- STATE ---
  const [data, setData] = useState<AppData>({
    target: 0,
    weddingDate: '',
    transactions: [],
    budgets: [],
    timeline: []
  });
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'budget' | 'history'>('timeline');
  
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
    if (!dateString || dateString.length < 10) return dateString; // Kalau bukan tanggal ISO, balikin aslinya
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  };

  // --- API HANDLERS (Ke Internal Proxy) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/proxy'); // Request ke folder api/proxy
      const json = await res.json();
      if (!json.error) setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const postData = async (payload: any) => {
    setLoading(true);
    try {
      await fetch('/api/proxy', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      fetchData(); // Refresh data tanpa reload page
      closeModals();
      
      // Efek Confetti
      if (payload.action === 'toggleTask' && payload.status === 'Done') confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      if (payload.type === 'income') confetti({ particleCount: 50, spread: 50, origin: { y: 0.8 } });

    } catch (e) {
      alert("Gagal simpan data");
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- CALCULATIONS ---
  const income = data.transactions.filter((t: Transaction) => t.type === 'income').reduce((a: number, b: Transaction) => a + b.amount, 0);
  const expense = data.transactions.filter((t: Transaction) => t.type === 'expense').reduce((a: number, b: Transaction) => a + b.amount, 0);
  const cash = income - expense;
  const asset = income; // Asumsi: Total Uang Masuk = Progress (Kas + DP)
  const gap = data.target - asset;
  const progressPercent = data.target > 0 ? (asset / data.target) * 100 : 0;

  const getDaysLeft = () => {
    if (!data.weddingDate) return 0;
    const diff = new Date(data.weddingDate).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  };

  // --- ACTIONS ---
  const handleToggleTask = (task: string, isChecked: boolean) => {
    // Optimistic Update UI
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

  return (
    <div className="min-h-screen bg-pink-50 flex justify-center font-sans text-gray-800">
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 z-50 flex flex-col items-center justify-center backdrop-blur-sm">
          <FaSyncAlt className="animate-spin text-3xl text-pink-500 mb-2"/>
          <p className="text-pink-600 font-bold text-xs animate-pulse">Sinkronisasi Cloud...</p>
        </div>
      )}

      <div className="w-full max-w-md bg-white min-h-screen shadow-2xl relative pb-32">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-pink-500 to-rose-600 p-6 pb-12 text-white rounded-b-[2.5rem] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full blur-xl -mr-4 -mt-4"></div>
          
          <div className="flex justify-between items-center mb-4 relative z-10">
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2"><FaHeart className="text-pink-200"/> Wedding Dream</h1>
              <p className="text-xs text-pink-100 opacity-90">
                {data.weddingDate ? new Date(data.weddingDate).toLocaleDateString('id-ID', { dateStyle: 'long' }) : 'Loading...'}
              </p>
            </div>
            <button onClick={fetchData} className="text-xs bg-white/20 p-2 rounded-full hover:bg-white/30 transition"><FaSyncAlt /></button>
          </div>

          <div className="text-center relative z-10 mt-4">
            <p className="text-pink-100 text-[10px] font-bold uppercase tracking-wider">Kekurangan Biaya</p>
            <h2 className="text-3xl font-bold mt-1">{formatRupiah(Math.max(0, gap))}</h2>
            
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

        {/* STATS GRID */}
        <div className="px-5 -mt-8 grid grid-cols-2 gap-3 relative z-20">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border-b-4 border-pink-400">
            <p className="text-gray-400 text-[10px] font-bold uppercase">Waktu Tersisa</p>
            <p className="text-gray-800 font-bold text-lg">{getDaysLeft()} Hari</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm border-b-4 border-emerald-400">
            <p className="text-gray-400 text-[10px] font-bold uppercase">Uang Terkumpul</p>
            <p className="text-emerald-600 font-bold text-lg">{formatRupiah(asset)}</p>
          </div>
        </div>

        {/* TABS */}
        <div className="px-5 mt-6 flex gap-2 border-b border-gray-100 pb-2 overflow-x-auto no-scrollbar">
          {['timeline', 'budget', 'history'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-sm font-bold pb-1 flex-1 capitalize whitespace-nowrap transition-colors ${
                activeTab === tab ? 'text-pink-600 border-b-2 border-pink-600' : 'text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* CONTENT */}
        <div className="px-5 mt-4 pb-24">
          
          {/* 1. TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
               <div className="bg-pink-50 border border-pink-100 p-3 rounded-xl mb-4 flex items-start gap-3">
                <FaInfoCircle className="text-pink-500 mt-1 min-w-[16px]" />
                <div className="text-xs text-gray-600">
                    <p className="font-bold text-pink-700">Fokus Bulan Ini:</p>
                    <p>Segera DP MUA (Urgent) & Pastikan Venue aman.</p>
                </div>
              </div>
              
              {data.timeline.map((item: TimelineEvent, idx: number) => (
                <label key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition">
                  <div className="relative">
                    <input 
                        type="checkbox" 
                        checked={item.status === 'Done'}
                        onChange={(e) => handleToggleTask(item.task, e.target.checked)}
                        className="peer appearance-none w-5 h-5 border-2 border-pink-300 rounded checked:bg-pink-500 checked:border-pink-500 transition-colors"
                    />
                    <FaCheckCircle className="absolute top-0 left-0 w-5 h-5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity p-0.5" />
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm leading-tight ${item.status === 'Done' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.task}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 ${item.status === 'Done' ? 'bg-gray-100 text-gray-400' : 'bg-pink-100 text-pink-700'}`}>
                        <FaCalendarAlt size={10} /> {item.deadline ? formatDate(item.deadline) : ''}
                      </span>
                      <span className="text-[10px] text-gray-400 border border-gray-200 px-1 rounded">{item.category}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}

          {/* 2. BUDGET */}
          {activeTab === 'budget' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
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
                 const pct = (b.paid / b.plan) * 100;
                 return (
                   <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                     <div className="flex justify-between mb-1">
                       <span className="font-bold text-sm text-gray-700">{b.item}</span>
                       <span className="text-xs font-bold text-pink-600">{pct.toFixed(0)}%</span>
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
             <ul className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
               {[...data.transactions].sort((a: Transaction, b: Transaction) => b.date.localeCompare(a.date)).map((trx: Transaction) => {
                 const isInc = trx.type === 'income';
                 return (
                   <li key={trx.id} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center shadow-sm">
                     <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${isInc ? 'bg-emerald-100 text-emerald-600' : 'bg-pink-100 text-pink-600'}`}>
                         {isInc ? <FaArrowDown /> : <FaReceipt />}
                       </div>
                       <div>
                         <p className="font-bold text-gray-700 text-xs truncate max-w-[150px]">{trx.desc}</p>
                         <p className="text-[10px] text-gray-400">{new Date(trx.date).toLocaleDateString('id-ID')} • {isInc ? 'Tabungan' : trx.category}</p>
                       </div>
                     </div>
                     <span className={`font-bold text-xs ${isInc ? 'text-emerald-600' : 'text-pink-600'}`}>
                       {isInc ? '+' : '-'} {formatRupiah(trx.amount)}
                     </span>
                   </li>
                 );
               })}
             </ul>
          )}
        </div>

        {/* FLOATING CASH CARD */}
        <div className="fixed bottom-24 left-0 right-0 flex justify-center z-30 pointer-events-none">
          <div className="w-full max-w-md px-5 pointer-events-auto">
            <div className="bg-white/90 backdrop-blur border border-pink-200 p-3 rounded-2xl shadow-lg flex justify-between items-center">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500"><FaWallet /></div>
                 <div>
                   <p className="text-[10px] text-gray-500 font-bold uppercase">Sisa Kas Tunai</p>
                   <p className="text-gray-800 font-bold text-xl leading-none">{formatRupiah(cash)}</p>
                 </div>
               </div>
               <button 
                onClick={() => { setCashInput(cash.toString()); setCashModalOpen(true); }}
                className="text-xs font-bold text-pink-600 border border-pink-200 px-3 py-1.5 rounded-lg hover:bg-pink-50"
               >
                 Edit
               </button>
            </div>
          </div>
        </div>

        {/* FLOATING ACTION BUTTONS */}
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40">
           <div className="w-full max-w-md px-5 grid grid-cols-2 gap-4">
             <button 
               onClick={() => { setModalType('income'); setModalOpen(true); }}
               className="bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-2xl shadow-lg font-bold flex justify-center items-center gap-2 transition active:scale-95"
             >
               <FaPlusCircle /> Nabung
             </button>
             <button 
               onClick={() => { setModalType('expense'); setModalOpen(true); }}
               className="bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-2xl shadow-lg font-bold flex justify-center items-center gap-2 transition active:scale-95"
             >
               <FaReceipt /> Bayar
             </button>
           </div>
        </div>

      </div>

      {/* TRANSACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
             <h3 className="text-lg font-bold mb-4 text-gray-800">
               {modalType === 'income' ? 'Tabung Uang' : 'Bayar Vendor'}
             </h3>
             
             {modalType === 'expense' && (
               <div className="mb-3">
                 <label className="text-xs font-bold text-gray-500 ml-1">Pos Anggaran</label>
                 <select 
                  className="w-full p-3 border border-pink-200 rounded-xl mt-1 bg-pink-50 outline-none focus:ring-2 focus:ring-pink-500 text-sm"
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
              className="w-full p-3 border border-pink-200 rounded-xl mb-3 outline-none focus:ring-2 focus:ring-pink-500"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
             />
             <input 
              type="number" 
              placeholder="Jumlah (Rp)" 
              className="w-full p-3 border border-pink-200 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-pink-500 font-bold text-lg"
              value={formAmount}
              onChange={(e) => setFormAmount(e.target.value)}
             />

             <div className="flex gap-3">
               <button onClick={closeModals} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">Batal</button>
               <button onClick={handleSubmitTrx} className={`flex-1 py-3 rounded-xl font-bold text-white ${modalType==='income'?'bg-emerald-500':'bg-pink-600'}`}>Simpan</button>
             </div>
          </div>
        </div>
      )}

      {/* CASH MODAL */}
      {isCashModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl">
             <h3 className="text-lg font-bold text-gray-800">Koreksi Saldo Fisik</h3>
             <input 
               type="number" 
               className="w-full p-3 border border-pink-200 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-pink-500 font-bold text-xl text-pink-600"
               value={cashInput}
               onChange={(e) => setCashInput(e.target.value)}
             />
             <div className="flex gap-3">
               <button onClick={closeModals} className="flex-1 py-3 rounded-xl font-bold text-gray-500 bg-gray-100">Batal</button>
               <button onClick={handleSubmitCash} className="flex-1 py-3 rounded-xl font-bold text-white bg-pink-600">Update</button>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}