import { useState } from 'react';
import { Shield, Save, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/payrollCalculator';
import {
  EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS,
  SI_BHXH_RATE, SI_BHYT_RATE, SI_BHTN_RATE, SI_RATE_EMPLOYEE,
  SI_BHXH_EMPLOYER_RATE, SI_BHYT_EMPLOYER_RATE, SI_BHTN_EMPLOYER_RATE, SI_RATE_EMPLOYER,
  UNION_FEE_RATE, SI_MIN_BASE,
} from '../types';

export default function SocialInsurance() {
  const { employees, socialInsurance, setSocialInsurance } = useApp();
  const [month, setMonth] = useState(2);
  const [year, setYear] = useState(2026);
  const [saved, setSaved] = useState(false);
  const [showEmployer, setShowEmployer] = useState(false);

  const handleRecalculate = () => {
    setSocialInsurance((prev) =>
      prev.map((si) => {
        const emp = employees.find((e) => e.id === si.employeeId);
        if (!emp || si.month !== month || si.year !== year) return si;

        const zero = {
          baseSI: 0, bhxh: 0, bhyt: 0, bhtn: 0, siEmployee: 0,
          bhxhEmployer: 0, bhytEmployer: 0, bhtnEmployer: 0, siEmployer: 0, unionFee: 0,
        };

        // Thai sản: Miễn đóng BHXH (RULE.md mục 4: tự động bằng 0)
        if (emp.status === 'thai_san') {
          return { ...si, ...zero, isExempt: true, note: 'Thai sản - Miễn đóng BHXH' };
        }

        // Thử việc thuần: chưa đóng BH
        if (emp.status === 'thu_viec') {
          return { ...si, ...zero, isExempt: true, note: 'Đang thử việc - Chưa đóng BHXH' };
        }

        // Tính mức đóng: 50% Lương cơ bản, tối thiểu 5.310.000
        const base = Math.max(emp.baseSalary * 0.5, SI_MIN_BASE);
        return {
          ...si,
          baseSI: base,
          bhxh: Math.round(base * SI_BHXH_RATE),
          bhyt: Math.round(base * SI_BHYT_RATE),
          bhtn: Math.round(base * SI_BHTN_RATE),
          siEmployee: Math.round(base * SI_RATE_EMPLOYEE),
          bhxhEmployer: Math.round(base * SI_BHXH_EMPLOYER_RATE),
          bhytEmployer: Math.round(base * SI_BHYT_EMPLOYER_RATE),
          bhtnEmployer: Math.round(base * SI_BHTN_EMPLOYER_RATE),
          siEmployer: Math.round(base * SI_RATE_EMPLOYER),
          unionFee: Math.round(base * UNION_FEE_RATE),
          isExempt: false,
          note: '',
        };
      })
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const currentData = socialInsurance.filter((si) => si.month === month && si.year === year);
  const totalSI = currentData.reduce((s, si) => s + si.siEmployee, 0);
  const totalSIEmployer = currentData.reduce((s, si) => s + si.siEmployer, 0);
  const totalUnion = currentData.reduce((s, si) => s + si.unionFee, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bảo hiểm Xã hội</h1>
          <p className="text-sm text-slate-500 mt-1">Module tách biệt — Mapping (VLOOKUP) sang bảng lương chính</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRecalculate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            <RefreshCw size={16} />
            Tính lại
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
          >
            <Save size={16} />
            Lưu
          </button>
        </div>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <AlertCircle size={16} />
          Đã lưu dữ liệu BHXH thành công!
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
        <div className="flex items-start gap-2">
          <Info size={16} className="mt-0.5 flex-shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Quy tắc tính BHXH (theo RULE.md):</p>
            <ul className="list-disc list-inside text-xs space-y-0.5 text-blue-700">
              <li>Căn cứ đóng = 50% Lương cơ bản, tối thiểu {formatCurrency(SI_MIN_BASE)} VNĐ</li>
              <li><strong>NLĐ đóng:</strong> BHXH 8% + BHYT 1.5% + BHTN 1% = <strong>10.5%</strong></li>
              <li><strong>Công ty đóng:</strong> BHXH 17.5% + BHYT 3% + BHTN 1% = <strong>21.5%</strong></li>
              <li><strong>Đoàn phí 2%:</strong> Cty đóng thay, hiển thị trên bảng lương nhưng <strong>KHÔNG trừ NLĐ</strong></li>
              <li><strong>Thai sản:</strong> Miễn đóng BHXH (tự động = 0), nhưng vẫn tính thuế lũy tiến</li>
              <li><strong>Rule 15th:</strong> Pass thử việc trước 15 → đóng trong tháng; sau 15 → tháng sau</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <Shield size={20} className="text-blue-500" />
        <span className="text-sm font-medium text-slate-600">Kỳ BHXH:</span>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {[2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 ml-auto text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={showEmployer} onChange={(e) => setShowEmployer(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
          Hiện phần Cty đóng
        </label>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">BH NLĐ đóng (10.5%)</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalSI)}</p>
          <p className="text-xs text-slate-400 mt-1">BHXH 8% + BHYT 1.5% + BHTN 1%</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">BH Cty đóng (21.5%)</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(totalSIEmployer)}</p>
          <p className="text-xs text-slate-400 mt-1">BHXH 17.5% + BHYT 3% + BHTN 1%</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Đoàn phí Cty (2%)</p>
          <p className="text-2xl font-bold text-slate-700 mt-2">{formatCurrency(totalUnion)}</p>
          <p className="text-xs text-slate-400 mt-1">Cty đóng thay, không trừ NLĐ</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">NV miễn đóng</p>
          <p className="text-2xl font-bold text-slate-700 mt-2">
            {currentData.filter((si) => si.isExempt).length}
          </p>
          <p className="text-xs text-slate-400 mt-1">Thai sản / Thử việc</p>
        </div>
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
                <th className="px-4 py-3.5 font-medium text-right">Căn cứ đóng</th>
                <th className="px-4 py-3.5 font-medium text-right text-red-600">BHXH 8%</th>
                <th className="px-4 py-3.5 font-medium text-right text-red-600">BHYT 1.5%</th>
                <th className="px-4 py-3.5 font-medium text-right text-red-600">BHTN 1%</th>
                <th className="px-4 py-3.5 font-medium text-right bg-red-50/50">Cộng 10.5%</th>
                {showEmployer && (
                  <>
                    <th className="px-4 py-3.5 font-medium text-right text-blue-600">Cty BHXH</th>
                    <th className="px-4 py-3.5 font-medium text-right text-blue-600">Cty BHYT</th>
                    <th className="px-4 py-3.5 font-medium text-right text-blue-600">Cty BHTN</th>
                    <th className="px-4 py-3.5 font-medium text-right bg-blue-50/50">Cộng 21.5%</th>
                  </>
                )}
                <th className="px-4 py-3.5 font-medium text-right">Đoàn phí</th>
                <th className="px-4 py-3.5 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => {
                const si = currentData.find((s) => s.employeeId === emp.id);
                if (!si) return null;
                return (
                  <tr key={emp.id} className={`hover:bg-slate-50/50 transition-colors ${si.isExempt ? 'bg-slate-50/30' : ''}`}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{emp.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{emp.fullName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[emp.status]}`}>
                        {EMPLOYEE_STATUS_LABELS[emp.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(si.baseSI)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(si.bhxh)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(si.bhyt)}</td>
                    <td className="px-4 py-3 text-right text-red-600">{formatCurrency(si.bhtn)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-700 bg-red-50/30">{formatCurrency(si.siEmployee)}</td>
                    {showEmployer && (
                      <>
                        <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(si.bhxhEmployer)}</td>
                        <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(si.bhytEmployer)}</td>
                        <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(si.bhtnEmployer)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700 bg-blue-50/30">{formatCurrency(si.siEmployer)}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(si.unionFee)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[180px] truncate">{si.note || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-sm">
                <td colSpan={4} className="px-4 py-3 text-right text-slate-600">TỔNG CỘNG</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(currentData.reduce((s, si) => s + si.bhxh, 0))}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(currentData.reduce((s, si) => s + si.bhyt, 0))}</td>
                <td className="px-4 py-3 text-right text-red-600">{formatCurrency(currentData.reduce((s, si) => s + si.bhtn, 0))}</td>
                <td className="px-4 py-3 text-right text-red-700 bg-red-50/30">{formatCurrency(totalSI)}</td>
                {showEmployer && (
                  <>
                    <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(currentData.reduce((s, si) => s + si.bhxhEmployer, 0))}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(currentData.reduce((s, si) => s + si.bhytEmployer, 0))}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(currentData.reduce((s, si) => s + si.bhtnEmployer, 0))}</td>
                    <td className="px-4 py-3 text-right text-blue-700 bg-blue-50/30">{formatCurrency(totalSIEmployer)}</td>
                  </>
                )}
                <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(totalUnion)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
