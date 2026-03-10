import { useState, useCallback } from 'react';
import { CalendarClock, Upload, Info, Save, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Timekeeping as TK } from '../types';

export default function Timekeeping() {
  const { employees, timekeeping, setTimekeeping } = useApp();
  const [month, setMonth] = useState(2);
  const [year, setYear] = useState(2026);

  // Per-row draft edits — only committed on row save
  const [drafts, setDrafts] = useState<Record<string, Partial<TK>>>({});
  // Track which rows were just saved (for brief success flash)
  const [savedRows, setSavedRows] = useState<Record<string, boolean>>({});

  const getDraft = (empId: string): TK | null => {
    const original = timekeeping.find(t => t.employeeId === empId && t.month === month && t.year === year);
    if (!original) return null;
    const d = drafts[empId];
    return d ? { ...original, ...d } : original;
  };

  const isDirty = (empId: string) => !!drafts[empId];

  const handleFieldChange = useCallback((empId: string, field: keyof TK, value: number) => {
    setDrafts(prev => {
      const current = prev[empId] || {};
      const original = timekeeping.find(t => t.employeeId === empId && t.month === month && t.year === year);
      if (!original) return prev;

      const merged = { ...original, ...current, [field]: value };

      if (field === 'probationDays' || field === 'officialDays') {
        merged.actualDays = merged.probationDays + merged.officialDays;
      }
      if (field === 'actualDays') {
        merged.probationDays = 0;
        merged.officialDays = value;
      }

      const { employeeId: _eid, month: _m, year: _y, ...rest } = merged;
      void _eid; void _m; void _y;
      return { ...prev, [empId]: rest };
    });
  }, [timekeeping, month, year]);

  const handleRowSave = useCallback((empId: string) => {
    const draft = drafts[empId];
    if (!draft) return;

    setTimekeeping(prev =>
      prev.map(t => {
        if (t.employeeId !== empId || t.month !== month || t.year !== year) return t;
        return { ...t, ...draft };
      })
    );

    setDrafts(prev => {
      const next = { ...prev };
      delete next[empId];
      return next;
    });

    setSavedRows(prev => ({ ...prev, [empId]: true }));
    setTimeout(() => setSavedRows(prev => ({ ...prev, [empId]: false })), 2000);
  }, [drafts, month, year, setTimekeeping]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dữ liệu Chấm công</h1>
          <p className="text-sm text-slate-500 mt-1">Import hoặc cập nhật dữ liệu từ hệ thống iCheck</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors">
          <Upload size={16} />
          Import Excel
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 flex items-start gap-2">
        <Info size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Chia 2 giai đoạn ngày công</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Với NV "Hết thử việc trong tháng": chia ngày công thành <strong>Thử việc</strong> + <strong>Chính thức</strong>.
            Mỗi khoản thu nhập trong gói HĐ sẽ được prorate riêng cho từng giai đoạn.
          </p>
        </div>
      </div>

      {/* Month/Year selector */}
      <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <CalendarClock size={20} className="text-blue-500" />
        <span className="text-sm font-medium text-slate-600">Kỳ chấm công:</span>
        <select
          value={month}
          onChange={(e) => { setMonth(Number(e.target.value)); setDrafts({}); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => { setYear(Number(e.target.value)); setDrafts({}); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {[2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3.5 font-medium">Mã NV</th>
                <th className="px-4 py-3.5 font-medium">Họ và tên</th>
                <th className="px-4 py-3.5 font-medium text-center">Công chuẩn</th>
                <th className="px-4 py-3.5 font-medium text-center bg-yellow-50/50">Ngày công TV</th>
                <th className="px-4 py-3.5 font-medium text-center bg-green-50/50">Ngày công CT</th>
                <th className="px-4 py-3.5 font-medium text-center">Nghỉ KL</th>
                <th className="px-4 py-3.5 font-medium text-center bg-blue-50/50">Tổng ngày công</th>
                <th className="px-4 py-3.5 font-medium text-center">Phép dư</th>
                <th className="px-4 py-3.5 font-medium text-center w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const tk = getDraft(emp.id);
                if (!tk) return null;
                const dirty = isDirty(emp.id);
                const justSaved = savedRows[emp.id];
                const hasTwoPhase = emp.status === 'het_thu_viec';

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors ${dirty ? 'bg-amber-50/40' : justSaved ? 'bg-green-50/40' : 'hover:bg-slate-50/50'}`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{emp.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{emp.fullName}</td>
                    {/* Công chuẩn */}
                    <td className="px-4 py-3 text-center">
                      <NumInput
                        value={tk.standardDays}
                        onChange={(v) => handleFieldChange(emp.id, 'standardDays', v)}
                      />
                    </td>
                    {/* Ngày công thử việc */}
                    <td className={`px-4 py-3 text-center ${hasTwoPhase ? 'bg-yellow-50/30' : ''}`}>
                      <NumInput
                        value={tk.probationDays}
                        onChange={(v) => handleFieldChange(emp.id, 'probationDays', v)}
                        highlight={tk.probationDays > 0 ? 'yellow' : undefined}
                      />
                    </td>
                    {/* Ngày công chính thức */}
                    <td className={`px-4 py-3 text-center ${hasTwoPhase ? 'bg-green-50/30' : ''}`}>
                      <NumInput
                        value={tk.officialDays}
                        onChange={(v) => handleFieldChange(emp.id, 'officialDays', v)}
                        highlight={tk.officialDays > 0 && tk.probationDays > 0 ? 'green' : undefined}
                      />
                    </td>
                    {/* Nghỉ không lương */}
                    <td className="px-4 py-3 text-center">
                      <NumInput
                        value={tk.unpaidLeave}
                        onChange={(v) => handleFieldChange(emp.id, 'unpaidLeave', v)}
                        highlight={tk.unpaidLeave > 0 ? 'red' : undefined}
                      />
                    </td>
                    {/* Tổng ngày công (read-only) */}
                    <td className="px-4 py-3 text-center bg-blue-50/20">
                      <span className={`inline-block w-14 text-center px-1 py-1.5 rounded-lg text-sm font-semibold
                        ${tk.actualDays < tk.standardDays ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-blue-700'}`}>
                        {tk.actualDays}
                      </span>
                    </td>
                    {/* Phép dư */}
                    <td className="px-4 py-3 text-center">
                      <NumInput
                        value={tk.remainingLeave}
                        onChange={(v) => handleFieldChange(emp.id, 'remainingLeave', v)}
                      />
                    </td>
                    {/* Save button per row */}
                    <td className="px-4 py-3 text-center">
                      {dirty ? (
                        <button
                          onClick={() => handleRowSave(emp.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                          title="Lưu dòng này"
                        >
                          <Save size={13} />
                          Lưu
                        </button>
                      ) : justSaved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <Check size={14} />
                          Đã lưu
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Tổng: {employees.length} nhân viên</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-yellow-50 border border-yellow-300 rounded"></span> Giai đoạn TV
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-50 border border-green-300 rounded"></span> Giai đoạn CT
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-50 border border-red-300 rounded"></span> Nghỉ KL
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Reusable number input for cells ──
function NumInput({
  value,
  onChange,
  highlight,
}: {
  value: number;
  onChange: (v: number) => void;
  highlight?: 'yellow' | 'green' | 'red';
}) {
  const borderColor = highlight === 'yellow' ? 'border-yellow-300 bg-yellow-50 font-medium'
    : highlight === 'green' ? 'border-green-300 bg-green-50 font-medium'
    : highlight === 'red' ? 'border-red-300 bg-red-50'
    : 'border-slate-200';

  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-14 text-center px-1 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${borderColor}`}
      min={0}
      max={31}
    />
  );
}
