import { useState } from 'react';
import { CalendarClock, Save, Upload, AlertCircle, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '../types';

export default function Timekeeping() {
  const { employees, timekeeping, setTimekeeping } = useApp();
  const [month, setMonth] = useState(2);
  const [year, setYear] = useState(2026);
  const [saved, setSaved] = useState(false);

  const handleUpdate = (employeeId: string, field: string, value: number) => {
    setTimekeeping((prev) =>
      prev.map((t) => {
        if (t.employeeId !== employeeId || t.month !== month || t.year !== year) return t;
        const updated = { ...t, [field]: value };
        // Tự đồng bộ actualDays = probationDays + officialDays
        if (field === 'probationDays' || field === 'officialDays') {
          updated.actualDays = updated.probationDays + updated.officialDays;
        }
        if (field === 'actualDays') {
          // Nếu sửa tổng, reset split
          updated.probationDays = 0;
          updated.officialDays = value;
        }
        return updated;
      })
    );
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dữ liệu Chấm công</h1>
          <p className="text-sm text-slate-500 mt-1">Import hoặc cập nhật dữ liệu từ hệ thống iCheck</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors">
            <Upload size={16} />
            Import Excel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
          >
            <Save size={16} />
            Lưu thay đổi
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <AlertCircle size={16} />
          Đã lưu dữ liệu chấm công thành công!
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 flex items-start gap-2">
        <Info size={16} className="mt-0.5 flex-shrink-0" />
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
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
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
                <th className="px-4 py-3.5 font-medium">Trạng thái</th>
                <th className="px-4 py-3.5 font-medium text-center">Công chuẩn</th>
                <th className="px-4 py-3.5 font-medium text-center bg-yellow-50/50">Ngày TV</th>
                <th className="px-4 py-3.5 font-medium text-center bg-green-50/50">Ngày CT</th>
                <th className="px-4 py-3.5 font-medium text-center bg-blue-50/50">Tổng TT</th>
                <th className="px-4 py-3.5 font-medium text-center">Phép dư</th>
                <th className="px-4 py-3.5 font-medium text-center">Nghỉ KL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const tk = timekeeping.find(
                  (t) => t.employeeId === emp.id && t.month === month && t.year === year
                );
                if (!tk) return null;
                const hasTwoPhase = emp.status === 'het_thu_viec';
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{emp.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{emp.fullName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[emp.status]}`}>
                        {EMPLOYEE_STATUS_LABELS[emp.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={tk.standardDays}
                        onChange={(e) => handleUpdate(emp.id, 'standardDays', Number(e.target.value))}
                        className="w-14 text-center px-1 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        min={0} max={31}
                      />
                    </td>
                    <td className={`px-4 py-3 text-center ${hasTwoPhase ? 'bg-yellow-50/30' : ''}`}>
                      <input
                        type="number"
                        value={tk.probationDays}
                        onChange={(e) => handleUpdate(emp.id, 'probationDays', Number(e.target.value))}
                        className={`w-14 text-center px-1 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20
                          ${tk.probationDays > 0 ? 'border-yellow-300 bg-yellow-50 font-medium' : 'border-slate-200'}`}
                        min={0} max={31}
                      />
                    </td>
                    <td className={`px-4 py-3 text-center ${hasTwoPhase ? 'bg-green-50/30' : ''}`}>
                      <input
                        type="number"
                        value={tk.officialDays}
                        onChange={(e) => handleUpdate(emp.id, 'officialDays', Number(e.target.value))}
                        className={`w-14 text-center px-1 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20
                          ${tk.officialDays > 0 && tk.probationDays > 0 ? 'border-green-300 bg-green-50 font-medium' : 'border-slate-200'}`}
                        min={0} max={31}
                      />
                    </td>
                    <td className="px-4 py-3 text-center bg-blue-50/20">
                      <span className={`inline-block w-14 text-center px-1 py-1.5 rounded-lg text-sm font-semibold
                        ${tk.actualDays < tk.standardDays ? 'text-amber-700 bg-amber-50 border border-amber-200' : 'text-blue-700'}`}>
                        {tk.actualDays}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={tk.remainingLeave}
                        onChange={(e) => handleUpdate(emp.id, 'remainingLeave', Number(e.target.value))}
                        className="w-14 text-center px-1 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        min={0}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={tk.unpaidLeave}
                        onChange={(e) => handleUpdate(emp.id, 'unpaidLeave', Number(e.target.value))}
                        className={`w-14 text-center px-1 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20
                          ${tk.unpaidLeave > 0 ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                        min={0}
                      />
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
