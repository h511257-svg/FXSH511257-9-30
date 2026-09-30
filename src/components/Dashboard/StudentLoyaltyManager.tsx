import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Users,
  Award,
  CreditCard,
  Gift,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Search,
  CheckCircle,
  X
} from 'lucide-react';

export const StudentLoyaltyManager: React.FC = () => {
  const { students, registerStudent, topUpStudentCard } = useStore();
  const [searchId, setSearchId] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  // New student form
  const [newId, setNewId] = useState('');
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('高一 1班');
  const [initialBalance, setInitialBalance] = useState(200);

  const filteredStudents = students.filter(s =>
    s.studentId.includes(searchId) || s.name.includes(searchId) || s.gradeClass.includes(searchId)
  );

  const sortedByPoints = [...students].sort((a, b) => b.points - a.points);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newName.trim()) return;

    registerStudent({
      studentId: newId.trim(),
      name: newName.trim(),
      gradeClass: newGrade,
      avatarColor: 'bg-emerald-500',
      cardBalance: initialBalance
    });

    setIsRegisterModalOpen(false);
    setNewId('');
    setNewName('');
  };

  const loyaltyGifts = [
    { points: 100, name: '麥香奶茶 1瓶', desc: '下課解渴好夥伴', icon: '🧃' },
    { points: 200, name: 'PLUS 立可帶替芯 1入', desc: '做筆記刷題神器', icon: '✂️' },
    { points: 350, name: '黑椒豬排蛋堡 1份', desc: '早自習現做美味', icon: '🍔' },
    { points: 500, name: '青楓高中校慶限量金榜題名紀念筆袋', desc: '學長姐大考祈福加持', icon: '🎒' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>學生會員 ID 整合與福利積點管理 (Student ID & Loyalty Rewards)</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            結帳自動綁定 8 碼學號，每消費 10 元積累 1 點；點數可折現（10點=$1）或兌換福利社精選限定文具與早餐。
          </p>
        </div>

        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>註冊新生福利卡</span>
        </button>
      </div>

      {/* Points Leaderboard & Gifts Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Points Leaderboard */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h4 className="font-bold text-slate-900 text-xs">全校福利社消費積點風雲榜 (Top Loyalty Students)</h4>
            </div>
            <span className="text-[10px] text-slate-400">即時更新</span>
          </div>

          <div className="space-y-2.5">
            {sortedByPoints.slice(0, 5).map((student, idx) => (
              <div
                key={student.studentId}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/50 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                    idx === 0 ? 'bg-amber-400 text-white shadow-xs' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800">{student.name}</span>
                    <span className="text-[10px] text-slate-400 ml-1.5">{student.gradeClass} ({student.studentId})</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold font-mono text-amber-600">{student.points} 點</span>
                  <div className="text-[10px] text-slate-400 font-mono">累計消費 NT${student.totalSpent}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loyalty Gifts Catalog */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-indigo-600" />
                <h4 className="font-bold text-slate-900 text-xs">福利積點專屬好禮兌換池 (Rewards Catalog)</h4>
              </div>
              <span className="text-[10px] text-indigo-600 font-semibold">可在前台結帳折抵</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {loyaltyGifts.map((gift, i) => (
                <div key={i} className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/30 flex flex-col justify-between text-xs">
                  <div>
                    <span className="text-2xl block mb-1">{gift.icon}</span>
                    <h5 className="font-bold text-slate-800 leading-snug">{gift.name}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{gift.desc}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-indigo-100 flex items-center justify-between">
                    <span className="text-indigo-700 font-bold font-mono">{gift.points} 點</span>
                    <span className="text-[10px] text-slate-400">福利社自兌</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
            💡 <strong>集點規則說明：</strong>段考週購買文具享「點數 3 倍送」，累積滿 10 點可於前台結帳自動折抵 NT$ 1 現金。
          </div>
        </div>
      </div>

      {/* Student Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="font-bold text-slate-900 text-xs">在校學生福利卡資料庫 ({students.length} 位會員)</h4>
          <div className="relative sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder="搜尋學號、姓名、班級..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">學號 / 姓名</th>
                <th className="py-2.5 px-3 font-semibold">班級</th>
                <th className="py-2.5 px-3 font-semibold text-right">學生證悠遊卡餘額</th>
                <th className="py-2.5 px-3 font-semibold text-right">累積福利點數</th>
                <th className="py-2.5 px-3 font-semibold text-right">累計消費總額</th>
                <th className="py-2.5 px-4 font-semibold text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map(student => (
                <tr key={student.studentId} className="hover:bg-slate-50/70">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${student.avatarColor} text-white flex items-center justify-center font-bold text-xs shrink-0`}>
                        {student.name.slice(0, 1)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">學號: {student.studentId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">{student.gradeClass}</td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span className="font-bold text-emerald-600">NT$ {student.cardBalance}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono">
                    <span className="font-bold text-amber-600">{student.points} 點</span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">
                    NT$ {student.totalSpent}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => topUpStudentCard(student.studentId, 100)}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[11px] transition cursor-pointer"
                    >
                      + 儲值 $100
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGISTER STUDENT MODAL */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">註冊在校生福利卡</h3>
              <button onClick={() => setIsRegisterModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">學號 (8位數)</label>
                <input
                  type="text"
                  required
                  value={newId}
                  onChange={e => setNewId(e.target.value)}
                  placeholder="例如：11309012"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">學生姓名</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="例如：張小明"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">年級與班級</label>
                <input
                  type="text"
                  required
                  value={newGrade}
                  onChange={e => setNewGrade(e.target.value)}
                  placeholder="例如：高一 2班"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">學生證悠遊卡預設開卡餘額 (NT$)</label>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={e => setInitialBalance(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  確認開卡註冊
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
