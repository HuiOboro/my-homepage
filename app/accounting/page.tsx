'use client';

import React, { useState, useEffect } from 'react';

// 账单数据类型定义
interface RecordItem {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  category: string;
  datetime: string;
  note: string;
}

export default function AccountingApp() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [budget, setBudget] = useState<number>(3000);
  const [showBudgetModal, setShowBudgetModal] = useState<boolean>(false);
  const [tempBudget, setTempBudget] = useState<string>('3000');
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false); // 标记数据是否已加载完成

  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('餐饮');
  const [datetime, setDatetime] = useState<string>('');
  const [note, setNote] = useState<string>('');

  const categories = ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '工资', '其他'];

  // 1. 页面首次加载时：读取本地存储的数据
  useEffect(() => {
    const savedRecords = localStorage.getItem('my_accounting_records');
    if (savedRecords) {
      try {
        setRecords(JSON.parse(savedRecords));
      } catch (e) {
        console.error('读取记录失败', e);
      }
    }

    const savedBudget = localStorage.getItem('my_accounting_budget');
    if (savedBudget) {
      setBudget(parseFloat(savedBudget));
    }

    // 设置默认消费时间为当前时间
    const now = new Date();
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setDatetime(localIso);

    setIsLoaded(true); // 标记加载完成
  }, []);

  // 2. 当账单数据发生变化时：自动保存到本地存储
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('my_accounting_records', JSON.stringify(records));
    }
  }, [records, isLoaded]);

  // 3. 当预算发生变化时：自动保存到本地存储
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('my_accounting_budget', budget.toString());
    }
  }, [budget, isLoaded]);

  // 计算本月总支出与总收入
  const totalExpense = records
    .filter((r) => r.type === 'expense')
    .reduce((sum, r) => sum + r.amount, 0);

  const totalIncome = records
    .filter((r) => r.type === 'income')
    .reduce((sum, r) => sum + r.amount, 0);

  const budgetUsagePercent = budget > 0 ? Math.min((totalExpense / budget) * 100, 100) : 0;

  // 添加账单
  const handleAddRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('请输入有效的金额！');
      return;
    }

    const newRecord: RecordItem = {
      id: Date.now().toString(),
      type,
      amount: parseFloat(amount),
      category,
      datetime: datetime.replace('T', ' '),
      note,
    };

    setRecords([newRecord, ...records]);
    setAmount('');
    setNote('');
  };

  // 删除账单
  const handleDeleteRecord = (id: string) => {
    setRecords(records.filter((r) => r.id !== id));
  };

  // 一键分享摘要
  const handleShare = () => {
    let shareText = `📊 【我的记账明细分享】\n`;
    shareText += `-------------------------\n`;
    shareText += `💰 本月总支出：${totalExpense.toFixed(2)} 元\n`;
    shareText += `💵 本月总收入：${totalIncome.toFixed(2)} 元\n`;
    shareText += `🎯 每月预算：${budget.toFixed(2)} 元 (已使用 ${((totalExpense / budget) * 100).toFixed(1)}%)\n`;
    shareText += `-------------------------\n`;
    shareText += `近期明细：\n`;

    records.slice(0, 5).forEach((item) => {
      const symbol = item.type === 'expense' ? '-' : '+';
      shareText += `• [${item.datetime}] ${item.category} ${symbol}${item.amount.toFixed(2)}元 ${item.note ? `(${item.note})` : ''}\n`;
    });

    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <main 
  className="min-h-screen bg-slate-100 py-6 px-4 font-sans text-slate-800 notranslate" 
  translate="no"
>
      <div className="max-w-md mx-auto space-y-5">
        
        {/* 顶部标题与分享 */}
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-slate-900">📑 我的随手记账</h1>
            <p className="text-xs text-slate-500">随时随地，精准控费</p>
          </div>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg border border-indigo-100 hover:bg-indigo-100 transition"
          >
            {copied ? '✅ 已复制摘要' : '📤 分享给朋友'}
          </button>
        </div>

        {/* 预算与支出卡片 */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-lg space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400">本月总支出</p>
              <p className="text-3xl font-extrabold mt-0.5">¥ {totalExpense.toFixed(2)}</p>
            </div>
            <button
              onClick={() => {
                setTempBudget(budget.toString());
                setShowBudgetModal(true);
              }}
              className="text-xs bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1 rounded-full text-slate-300 border border-slate-600"
            >
              设置预算 ⚙️
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>预算使用进度</span>
              <span>
                ¥{totalExpense.toFixed(0)} / ¥{budget} ({((totalExpense / budget) * 100).toFixed(0)}%)
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  totalExpense >= budget
                    ? 'bg-red-500'
                    : totalExpense >= budget * 0.8
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${budgetUsagePercent}%` }}
              ></div>
            </div>
          </div>

          {totalExpense >= budget ? (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs p-2.5 rounded-xl flex items-center gap-2">
              <span>⚠️</span>
              <span>警告：您的本月支出已超过设定的预算上限！</span>
            </div>
          ) : totalExpense >= budget * 0.8 ? (
            <div className="bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs p-2.5 rounded-xl flex items-center gap-2">
              <span>💡</span>
              <span>提醒：本月支出已达到预算的 80%，请注意控制消费。</span>
            </div>
          ) : null}
        </div>

        {/* 记账表单 */}
        <form onSubmit={handleAddRecord} className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-700 border-b pb-2">记一笔账</h2>

          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl text-center text-sm font-medium">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-1.5 rounded-lg transition ${
                type === 'expense' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              💸 支出
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-1.5 rounded-lg transition ${
                type === 'income' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600'
              }`}
            >
              💰 收入
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">金额 (元)</label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">消费分类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">消费时间</label>
            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">备注信息</label>
            <input
              type="text"
              placeholder="例如：请朋友吃午饭、购买外设..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition shadow-sm text-sm"
          >
            保存记录
          </button>
        </form>

        {/* 近期明细列表 */}
        <div className="bg-white p-5 rounded-2xl shadow-sm space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-sm font-bold text-slate-700">近期明细</h2>
            <span className="text-xs text-slate-400">共 {records.length} 笔</span>
          </div>

          {records.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-6">暂无账单记录，快记一笔吧~</p>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto">
              {records.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
                        {item.category}
                      </span>
                      {item.note && <span className="text-xs text-slate-600">{item.note}</span>}
                    </div>
                    <p className="text-[10px] text-slate-400">{item.datetime}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`font-bold text-sm ${
                        item.type === 'expense' ? 'text-red-500' : 'text-emerald-600'
                      }`}
                    >
                      {item.type === 'expense' ? '-' : '+'}¥{item.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteRecord(item.id)}
                      className="text-slate-300 hover:text-red-500 text-xs transition"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 预算弹窗 */}
        {showBudgetModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-5 w-full max-w-xs space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-slate-800">设置每月预算上限</h3>
              <div>
                <label className="block text-xs text-slate-500 mb-1">每月预算金额 (元)</label>
                <input
                  type="number"
                  value={tempBudget}
                  onChange={(e) => setTempBudget(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowBudgetModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    const b = parseFloat(tempBudget);
                    if (b > 0) setBudget(b);
                    setShowBudgetModal(false);
                  }}
                  className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}