import { useState, useMemo, useCallback } from 'react';
import { Shield, Save, Check, Info, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/payrollCalculator';
import {
  SocialInsurance as SI,
  EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS,
  SI_BHXH_RATE, SI_BHYT_RATE, SI_BHTN_RATE,
  SI_BHXH_EMPLOYER_RATE, SI_BHYT_EMPLOYER_RATE, SI_BHTN_EMPLOYER_RATE,
  UNION_FEE_RATE, SI_MIN_BASE,
} from '../types';

const UNPAID_LEAVE_THRESHOLD = 14;

// Statuses that never participate in BHXH
const EXEMPT_STATUSES = new Set(['thai_san', 'thu_viec', 'nghi_viec_tv']);

export default function SocialInsurance() {
  const { employees, timekeeping, socialInsurance, setSocialInsurance } = useApp();
  const [month, setMonth] = useState(2);
  const [year, setYear] = useState(2026);
  const [savedRows, setSavedRows] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, Partial<SI>>>({});

  // Only employees participating in BHXH
  const eligibleEmployees = useMemo(
    () => employees.filter(e => !EXEMPT_STATUSES.has(e.status)),
    [employees],
  );

  const currentData = useMemo(
    () => socialInsurance.filter(si => si.month === month && si.year === year),
    [socialInsurance, month, year],
  );

  const getUnpaidLeave = useCallback((empId: string) => {
    const tk = timekeeping.find(t => t.employeeId === empId && t.month === month && t.year === year);
    return tk?.unpaidLeave ?? 0;
  }, [timekeeping, month, year]);

  // ── Recalculate all ──
  const handleRecalculate = () => {
    setSocialInsurance(prev =>
      prev.map(si => {
        const emp = employees.find(e => e.id === si.employeeId);
        if (!emp || si.month !== month || si.year !== year) return si;

        const zero = {
          baseSI: 0, bhxh: 0, bhyt: 0, bhtn: 0, siEmployee: 0,
          bhxhEmployer: 0, bhytEmployer: 0, bhtnEmployer: 0, siEmployer: 0, unionFee: 0,
        };

        if (EXEMPT_STATUSES.has(emp.status)) {
          const note = emp.status === 'thai_san' ? 'Thai sản - Miễn đóng'
            : emp.status === 'thu_viec' ? 'Thử việc - Chưa đóng'
            : 'Nghỉ việc TV - Không đóng';
          return { ...si, ...zero, isExempt: true, note };
        }

        const base = Math.max(emp.baseSalary * 0.5, SI_MIN_BASE);

        // Nghỉ việc chính thức: >14 ngày không lương → chỉ đóng BHYT
        if (emp.status === 'nghi_viec_ct') {
          const unpaid = getUnpaidLeave(emp.id);
          if (unpaid > UNPAID_LEAVE_THRESHOLD) {
            const bhytEmp = Math.round(base * SI_BHYT_RATE);
            const bhytEr  = Math.round(base * SI_BHYT_EMPLOYER_RATE);
            return {
              ...si,
              baseSI: base,
              bhxh: 0, bhyt: bhytEmp, bhtn: 0,
              siEmployee: bhytEmp,
              bhxhEmployer: 0, bhytEmployer: bhytEr, bhtnEmployer: 0,
              siEmployer: bhytEr,
              unionFee: 0,
              isExempt: false,
              note: `Nghỉ việc >${UNPAID_LEAVE_THRESHOLD} ngày KL → chỉ BHYT`,
            };
          }
        }

        // Full insurance
        return {
          ...si,
          baseSI: base,
          bhxh:         Math.round(base * SI_BHXH_RATE),
          bhyt:         Math.round(base * SI_BHYT_RATE),
          bhtn:         Math.round(base * SI_BHTN_RATE),
          siEmployee:   Math.round(base * (SI_BHXH_RATE + SI_BHYT_RATE + SI_BHTN_RATE)),
          bhxhEmployer: Math.round(base * SI_BHXH_EMPLOYER_RATE),
          bhytEmployer: Math.round(base * SI_BHYT_EMPLOYER_RATE),
          bhtnEmployer: Math.round(base * SI_BHTN_EMPLOYER_RATE),
          siEmployer:   Math.round(base * (SI_BHXH_EMPLOYER_RATE + SI_BHYT_EMPLOYER_RATE + SI_BHTN_EMPLOYER_RATE)),
          unionFee:     Math.round(base * UNION_FEE_RATE),
          isExempt: false,
          note: '',
        };
      })
    );
    setDrafts({});
  };

  // ── Per-row draft editing ──
  const getDraft = (empId: string): SI | null => {
    const original = currentData.find(s => s.employeeId === empId);
    if (!original) return null;
    const d = drafts[empId];
    return d ? { ...original, ...d } : original;
  };

  const isDirty = (empId: string) => !!drafts[empId];

  const handleFieldChange = useCallback((empId: string, field: keyof SI, value: number) => {
    setDrafts(prev => {
      const current = prev[empId] || {};
      return { ...prev, [empId]: { ...current, [field]: value } };
    });
  }, []);

  const handleRowSave = useCallback((empId: string) => {
    const draft = drafts[empId];
    if (!draft) return;
    setSocialInsurance(prev =>
      prev.map(si => {
        if (si.employeeId !== empId || si.month !== month || si.year !== year) return si;
        return { ...si, ...draft };
      })
    );
    setDrafts(prev => { const n = { ...prev }; delete n[empId]; return n; });
    setSavedRows(prev => ({ ...prev, [empId]: true }));
    setTimeout(() => setSavedRows(prev => ({ ...prev, [empId]: false })), 2000);
  }, [drafts, month, year, setSocialInsurance]);

  // ── Summaries (from committed data, not drafts) ──
  const eligibleData = useMemo(
    () => currentData.filter(si => eligibleEmployees.some(e => e.id === si.employeeId)),
    [currentData, eligibleEmployees],
  );
  const totalSI         = eligibleData.reduce((s, si) => s + si.siEmployee, 0);
  const totalSIEmployer = eligibleData.reduce((s, si) => s + si.siEmployer, 0);
  const totalUnion      = eligibleData.reduce((s, si) => s + si.unionFee, 0);
  const bhytOnlyCount   = eligibleData.filter(si => si.bhxh === 0 && si.bhyt > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bảo hiểm Xã hội</h1>
          <p className="text-sm text-slate-500 mt-1">Module tách biệt — Mapping (VLOOKUP) sang bảng lương chính</p>
        </div>
        <button
          onClick={handleRecalculate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
        >
          <RefreshCw size={16} />
          Tính lại toàn bộ
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800">
        <div className="flex items-start gap-2">
          <Info size={16} className="mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-medium">Quy tắc tính BHXH (theo INSURANCE.md):</p>
            <ul className="list-disc list-inside text-xs space-y-0.5 text-blue-700">
              <li>Căn cứ đóng = 50% Lương cơ bản, tối thiểu {formatCurrency(SI_MIN_BASE)} VNĐ</li>
              <li><strong>NLĐ đóng:</strong> BHXH 8% + BHYT 1.5% + BHTN 1% = <strong>10.5%</strong></li>
              <li><strong>Công ty đóng:</strong> BHXH 17.5% + BHYT 3% + BHTN 1% = <strong>21.5%</strong></li>
              <li><strong>Đoàn phí 2%:</strong> Cty đóng thay — <strong>KHÔNG trừ NLĐ</strong></li>
              <li><strong>Thai sản / Thử việc:</strong> Miễn đóng (ẩn khỏi bảng)</li>
              <li><strong>Nghỉ việc:</strong> Trên {UNPAID_LEAVE_THRESHOLD} ngày không lương → chỉ đóng BHYT; ngược lại → đóng toàn bộ</li>
              <li><strong>Rule 15th:</strong> Pass thử việc trước 15 → đóng trong tháng; sau 15 → tháng sau</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Month selector */}
      <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <Shield size={20} className="text-blue-500" />
        <span className="text-sm font-medium text-slate-600">Kỳ BHXH:</span>
        <select value={month} onChange={(e) => { setMonth(Number(e.target.value)); setDrafts({}); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => { setYear(Number(e.target.value)); setDrafts({}); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {[2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">NLĐ đóng (10.5%)</p>
          <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(totalSI)}</p>
          <p className="text-xs text-slate-400 mt-1">BHXH 8% + BHYT 1.5% + BHTN 1%</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Cty đóng (21.5%)</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(totalSIEmployer)}</p>
          <p className="text-xs text-slate-400 mt-1">BHXH 17.5% + BHYT 3% + BHTN 1%</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Đoàn phí Cty (2%)</p>
          <p className="text-2xl font-bold text-slate-700 mt-2">{formatCurrency(totalUnion)}</p>
          <p className="text-xs text-slate-400 mt-1">Cty đóng thay, không trừ NLĐ</p>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Chỉ đóng BHYT</p>
          <p className="text-2xl font-bold text-amber-600 mt-2">{bhytOnlyCount}</p>
          <p className="text-xs text-slate-400 mt-1">Nghỉ việc &gt;{UNPAID_LEAVE_THRESHOLD} ngày KL</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {/* Group headers */}
              <tr className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <th rowSpan={2} className="px-4 py-2 font-medium text-left align-bottom">Mã NV</th>
                <th rowSpan={2} className="px-4 py-2 font-medium text-left align-bottom">Họ và tên</th>
                <th rowSpan={2} className="px-4 py-2 font-medium text-left align-bottom">Trạng thái</th>
                <th rowSpan={2} className="px-4 py-2 font-medium text-right align-bottom">Căn cứ đóng</th>
                <th colSpan={4} className="px-4 py-2 font-semibold text-center text-red-600 border-l border-slate-200 bg-red-50/40">
                  NLĐ đóng
                </th>
                <th colSpan={4} className="px-4 py-2 font-semibold text-center text-blue-600 border-l border-slate-200 bg-blue-50/40">
                  Cty đóng
                </th>
                <th rowSpan={2} className="px-4 py-2 font-medium text-right align-bottom border-l border-slate-200">Đoàn phí 2%</th>
                <th rowSpan={2} className="px-4 py-2 font-medium text-left align-bottom">Ghi chú</th>
                <th rowSpan={2} className="px-4 py-2 w-20 align-bottom"></th>
              </tr>
              <tr className="bg-slate-50/80 text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-3 py-2 font-medium text-right text-red-500 border-l border-slate-200">BHXH 8%</th>
                <th className="px-3 py-2 font-medium text-right text-red-500">BHYT 1.5%</th>
                <th className="px-3 py-2 font-medium text-right text-red-500">BHTN 1%</th>
                <th className="px-3 py-2 font-medium text-right text-red-700 bg-red-50/30">Cộng 10.5%</th>
                <th className="px-3 py-2 font-medium text-right text-blue-500 border-l border-slate-200">BHXH 17.5%</th>
                <th className="px-3 py-2 font-medium text-right text-blue-500">BHYT 3%</th>
                <th className="px-3 py-2 font-medium text-right text-blue-500">BHTN 1%</th>
                <th className="px-3 py-2 font-medium text-right text-blue-700 bg-blue-50/30">Cộng 21.5%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eligibleEmployees.map(emp => {
                const si = getDraft(emp.id);
                if (!si) return null;
                const dirty = isDirty(emp.id);
                const justSaved = savedRows[emp.id];
                const bhytOnly = si.bhxh === 0 && si.bhyt > 0;

                return (
                  <tr
                    key={emp.id}
                    className={`transition-colors ${
                      dirty ? 'bg-amber-50/40' : justSaved ? 'bg-green-50/40'
                      : bhytOnly ? 'bg-amber-50/20' : 'hover:bg-slate-50/50'
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{emp.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{emp.fullName}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${EMPLOYEE_STATUS_COLORS[emp.status]}`}>
                        {EMPLOYEE_STATUS_LABELS[emp.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatCurrency(si.baseSI)}</td>

                    {/* NLĐ đóng */}
                    <td className="px-3 py-3 text-right text-red-600 border-l border-slate-100">
                      <MoneyCell value={si.bhxh} empId={emp.id} field="bhxh" onChange={handleFieldChange} dimmed={bhytOnly} />
                    </td>
                    <td className="px-3 py-3 text-right text-red-600">
                      <MoneyCell value={si.bhyt} empId={emp.id} field="bhyt" onChange={handleFieldChange} />
                    </td>
                    <td className="px-3 py-3 text-right text-red-600">
                      <MoneyCell value={si.bhtn} empId={emp.id} field="bhtn" onChange={handleFieldChange} dimmed={bhytOnly} />
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-red-700 bg-red-50/30">
                      {formatCurrency(si.siEmployee)}
                    </td>

                    {/* Cty đóng */}
                    <td className="px-3 py-3 text-right text-blue-600 border-l border-slate-100">
                      <MoneyCell value={si.bhxhEmployer} empId={emp.id} field="bhxhEmployer" onChange={handleFieldChange} dimmed={bhytOnly} />
                    </td>
                    <td className="px-3 py-3 text-right text-blue-600">
                      <MoneyCell value={si.bhytEmployer} empId={emp.id} field="bhytEmployer" onChange={handleFieldChange} />
                    </td>
                    <td className="px-3 py-3 text-right text-blue-600">
                      <MoneyCell value={si.bhtnEmployer} empId={emp.id} field="bhtnEmployer" onChange={handleFieldChange} dimmed={bhytOnly} />
                    </td>
                    <td className="px-3 py-3 text-right font-semibold text-blue-700 bg-blue-50/30">
                      {formatCurrency(si.siEmployer)}
                    </td>

                    {/* Đoàn phí & note */}
                    <td className="px-4 py-3 text-right text-slate-500 border-l border-slate-100">{formatCurrency(si.unionFee)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">{si.note || '—'}</td>

                    {/* Row save */}
                    <td className="px-3 py-3 text-center">
                      {dirty ? (
                        <button
                          onClick={() => handleRowSave(emp.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm"
                        >
                          <Save size={13} />
                          Lưu
                        </button>
                      ) : justSaved ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                          <Check size={14} />
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-semibold text-sm border-t-2 border-slate-200">
                <td colSpan={4} className="px-4 py-3 text-right text-slate-600">TỔNG CỘNG</td>
                <td className="px-3 py-3 text-right text-red-600 border-l border-slate-100">{formatCurrency(eligibleData.reduce((s, si) => s + si.bhxh, 0))}</td>
                <td className="px-3 py-3 text-right text-red-600">{formatCurrency(eligibleData.reduce((s, si) => s + si.bhyt, 0))}</td>
                <td className="px-3 py-3 text-right text-red-600">{formatCurrency(eligibleData.reduce((s, si) => s + si.bhtn, 0))}</td>
                <td className="px-3 py-3 text-right text-red-700 bg-red-50/30">{formatCurrency(totalSI)}</td>
                <td className="px-3 py-3 text-right text-blue-600 border-l border-slate-100">{formatCurrency(eligibleData.reduce((s, si) => s + si.bhxhEmployer, 0))}</td>
                <td className="px-3 py-3 text-right text-blue-600">{formatCurrency(eligibleData.reduce((s, si) => s + si.bhytEmployer, 0))}</td>
                <td className="px-3 py-3 text-right text-blue-600">{formatCurrency(eligibleData.reduce((s, si) => s + si.bhtnEmployer, 0))}</td>
                <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{formatCurrency(totalSIEmployer)}</td>
                <td className="px-4 py-3 text-right text-slate-600 border-l border-slate-100">{formatCurrency(totalUnion)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
          <span>Hiển thị {eligibleEmployees.length} NV tham gia BHXH / {employees.length} tổng NV</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-50 border border-red-300 rounded"></span> NLĐ đóng
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-blue-50 border border-blue-300 rounded"></span> Cty đóng
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-amber-50 border border-amber-300 rounded"></span> Chỉ BHYT
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

function MoneyCell({
  value,
  empId,
  field,
  onChange,
  dimmed,
}: {
  value: number;
  empId: string;
  field: keyof SI;
  onChange: (empId: string, field: keyof SI, value: number) => void;
  dimmed?: boolean;
}) {
  return (
    <span
      className={`cursor-pointer tabular-nums ${dimmed ? 'text-slate-300 line-through decoration-slate-300' : ''}`}
      onDoubleClick={() => {
        const input = prompt('Nhập giá trị mới:', String(value));
        if (input !== null && !isNaN(Number(input))) {
          onChange(empId, field, Number(input));
        }
      }}
      title="Nhấp đúp để sửa"
    >
      {formatCurrency(value)}
    </span>
  );
}
