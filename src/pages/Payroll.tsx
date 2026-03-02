import React, { useState } from 'react';
import { Calculator, Play, Eye, X, ChevronDown, ChevronUp, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/payrollCalculator';
import { PayrollRecord, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '../types';

export default function Payroll() {
  const { payrollBatches, generatePayroll, setPayrollBatches } = useApp();
  const [month, setMonth] = useState(2);
  const [year, setYear] = useState(2026);
  const [detailRecord, setDetailRecord] = useState<PayrollRecord | null>(null);
  const [showVariableIncome, setShowVariableIncome] = useState(false);

  const currentBatch = payrollBatches.find((b) => b.month === month && b.year === year);

  const handleGenerate = () => {
    generatePayroll(month, year);
  };

  const handleSubmitForApproval = () => {
    if (!currentBatch) return;
    setPayrollBatches((prev) =>
      prev.map((b) =>
        b.id === currentBatch.id ? { ...b, status: 'pending_approval' as const } : b
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Bảng lương</h1>
          <p className="text-sm text-slate-500 mt-1">Tính toán Gross → Net theo 7 nhóm logic (RULE.md)</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <Calculator size={20} className="text-blue-500" />
        <span className="text-sm font-medium text-slate-600">Kỳ lương:</span>
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
          {[2025, 2026].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <div className="flex items-center gap-3 ml-auto">
          <button onClick={handleGenerate}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25">
            <Play size={16} />
            Tính lương
          </button>
          {currentBatch && currentBatch.status === 'draft' && (
            <button onClick={handleSubmitForApproval}
              className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25">
              <Send size={16} />
              Gửi duyệt
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {currentBatch && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <SummaryCard label="Tổng NV" value={String(currentBatch.totalEmployees)} sub="nhân viên" />
            <SummaryCard label="Tổng Gross" value={formatCurrency(currentBatch.totalGross)} sub="VNĐ" />
            <SummaryCard label="Tổng Net" value={formatCurrency(currentBatch.totalNet)} sub="Thực lĩnh" />
            <SummaryCard label="Tổng Thuế" value={formatCurrency(currentBatch.totalTax)} sub="TNCN" />
            <SummaryCard label="BH NLĐ 10.5%" value={formatCurrency(currentBatch.totalSI)} sub="NLĐ đóng" />
            <SummaryCard label="Chi phí Cty" value={formatCurrency(currentBatch.totalEmployerCost)} sub="Nhóm 7" />
          </div>

          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-medium
              ${currentBatch.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                currentBatch.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                currentBatch.status === 'approved' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'}`}>
              {currentBatch.status === 'draft' ? 'Nháp' :
               currentBatch.status === 'pending_approval' ? 'Đang chờ duyệt' :
               currentBatch.status === 'approved' ? 'Đã duyệt' : 'Đã chi trả'}
            </span>
            <span className="text-xs text-slate-400">
              Tạo bởi: {currentBatch.createdBy}
              {currentBatch.approvedBy && ` • Duyệt bởi: ${currentBatch.approvedBy}`}
            </span>
          </div>

          {/* Toggle */}
          <button onClick={() => setShowVariableIncome(!showVariableIncome)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
            {showVariableIncome ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showVariableIncome ? 'Ẩn chi tiết thu nhập' : 'Hiện chi tiết thu nhập'}
          </button>

          {/* Payroll Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                    <th className="px-3 py-3.5 font-medium sticky left-0 bg-slate-50/80 z-10">Mã NV</th>
                    <th className="px-3 py-3.5 font-medium">Họ và tên</th>
                    <th className="px-3 py-3.5 font-medium">TT</th>
                    <th className="px-3 py-3.5 font-medium text-center">Công</th>
                    {showVariableIncome && (
                      <>
                        <th className="px-3 py-3.5 font-medium text-right bg-yellow-50/50">TN TV</th>
                        <th className="px-3 py-3.5 font-medium text-right bg-green-50/50">TN CT</th>
                        <th className="px-3 py-3.5 font-medium text-right">TN Khác</th>
                      </>
                    )}
                    <th className="px-3 py-3.5 font-medium text-right bg-emerald-50/50">Gross</th>
                    <th className="px-3 py-3.5 font-medium text-right">Chịu thuế</th>
                    <th className="px-3 py-3.5 font-medium text-right">BH 10.5%</th>
                    <th className="px-3 py-3.5 font-medium text-right">Thuế</th>
                    <th className="px-3 py-3.5 font-medium text-center">Loại</th>
                    <th className="px-3 py-3.5 font-medium text-right">Tổng trừ</th>
                    <th className="px-3 py-3.5 font-medium text-right bg-blue-50/50">Net</th>
                    <th className="px-3 py-3.5 font-medium text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentBatch.records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-3 py-3 font-mono text-xs text-slate-500 sticky left-0 bg-white">{r.employeeId}</td>
                      <td className="px-3 py-3 font-medium text-slate-800 whitespace-nowrap">{r.employeeName}</td>
                      <td className="px-3 py-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[r.status]}`}>
                          {EMPLOYEE_STATUS_LABELS[r.status].slice(0, 6)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-xs">
                        {r.probationDays > 0 && r.officialDays > 0
                          ? <span><span className="text-yellow-600">{r.probationDays}</span>+<span className="text-green-600">{r.officialDays}</span>/{r.standardDays}</span>
                          : <span className={r.actualDays < r.standardDays ? 'text-amber-600 font-medium' : ''}>{r.actualDays}/{r.standardDays}</span>
                        }
                      </td>
                      {showVariableIncome && (
                        <>
                          <td className="px-3 py-3 text-right text-yellow-700 bg-yellow-50/20 text-xs">{formatCurrency(r.probationTotal)}</td>
                          <td className="px-3 py-3 text-right text-green-700 bg-green-50/20 text-xs">{formatCurrency(r.officialTotal)}</td>
                          <td className="px-3 py-3 text-right text-slate-600 text-xs">{formatCurrency(r.totalVariableIncome)}</td>
                        </>
                      )}
                      <td className="px-3 py-3 text-right font-semibold text-emerald-700 bg-emerald-50/30">
                        {formatCurrency(r.grossSalary)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600 text-xs">{formatCurrency(r.taxableIncome)}</td>
                      <td className="px-3 py-3 text-right text-red-600 text-xs">{formatCurrency(r.siEmployee)}</td>
                      <td className="px-3 py-3 text-right text-red-600 text-xs">{formatCurrency(r.pit)}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium
                          ${r.taxMethod === 'progressive' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {r.taxMethod === 'progressive' ? 'LT' : '10%'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-red-600 text-xs font-medium">{formatCurrency(r.totalDeduction)}</td>
                      <td className="px-3 py-3 text-right font-bold text-blue-700 bg-blue-50/30">
                        {formatCurrency(r.netSalary)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button onClick={() => setDetailRecord(r)}
                          className="p-1 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold text-xs">
                    <td colSpan={showVariableIncome ? 4 : 4} className="px-3 py-3 text-right text-slate-600">TỔNG</td>
                    {showVariableIncome && (
                      <>
                        <td className="px-3 py-3 text-right text-yellow-700">{formatCurrency(currentBatch.records.reduce((s, r) => s + r.probationTotal, 0))}</td>
                        <td className="px-3 py-3 text-right text-green-700">{formatCurrency(currentBatch.records.reduce((s, r) => s + r.officialTotal, 0))}</td>
                        <td className="px-3 py-3 text-right">{formatCurrency(currentBatch.records.reduce((s, r) => s + r.totalVariableIncome, 0))}</td>
                      </>
                    )}
                    <td className="px-3 py-3 text-right text-emerald-700 bg-emerald-50/30">{formatCurrency(currentBatch.totalGross)}</td>
                    <td className="px-3 py-3 text-right">{formatCurrency(currentBatch.records.reduce((s, r) => s + r.taxableIncome, 0))}</td>
                    <td className="px-3 py-3 text-right text-red-600">{formatCurrency(currentBatch.totalSI)}</td>
                    <td className="px-3 py-3 text-right text-red-600">{formatCurrency(currentBatch.totalTax)}</td>
                    <td></td>
                    <td className="px-3 py-3 text-right text-red-600">{formatCurrency(currentBatch.records.reduce((s, r) => s + r.totalDeduction, 0))}</td>
                    <td className="px-3 py-3 text-right text-blue-700 bg-blue-50/30">{formatCurrency(currentBatch.totalNet)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}

      {!currentBatch && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <Calculator size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Chưa có dữ liệu bảng lương</h3>
          <p className="text-sm text-slate-400 mb-6">Nhấn "Tính lương" để hệ thống tự động tính toán theo 7 nhóm logic RULE.md</p>
          <button onClick={handleGenerate}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25">
            <Play size={16} />
            Tính lương tháng {month}/{year}
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {detailRecord && (
        <PayrollDetailModal record={detailRecord} onClose={() => setDetailRecord(null)} />
      )}
    </div>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
      <p className="text-[10px] text-slate-500 uppercase tracking-wide font-medium">{label}</p>
      <p className="text-lg font-bold text-slate-800 mt-1">{value}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
    </div>
  );
}

function PayrollDetailModal({ record: r, onClose }: { record: PayrollRecord; onClose: () => void }) {
  const hasTwoPhase = r.probationDays > 0 && r.officialDays > 0;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Chi tiết lương — {r.employeeName}</h2>
            <p className="text-sm text-slate-500">T{r.month}/{r.year} • {r.department}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Status */}
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[r.status]}`}>
              {EMPLOYEE_STATUS_LABELS[r.status]}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium
              ${r.taxMethod === 'progressive' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
              Thuế: {r.taxMethod === 'progressive' ? 'Lũy tiến' : 'Flat 10%'}
            </span>
            <span className="text-xs text-slate-400">
              Công: {hasTwoPhase
                ? `${r.probationDays} ngày TV + ${r.officialDays} ngày CT`
                : `${r.actualDays}/${r.standardDays} ngày`
              }
            </span>
          </div>

          {/* ═══ NHÓM 1: THU NHẬP THEO NGÀY CÔNG ═══ */}
          <Section title="NHÓM 1 — THU NHẬP THEO NGÀY CÔNG (PRORATED)" color="emerald" num="1">
            <p className="text-[10px] text-slate-400 mb-2 italic">
              Công thức: (Khoản trong gói HĐ / {r.standardDays} ngày chuẩn) × Số ngày thực tế
            </p>
            {hasTwoPhase ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-yellow-50 rounded-xl p-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-yellow-700 uppercase">Giai đoạn Thử việc ({r.probationDays} ngày)</p>
                  <DetailRow label="Lương CB" value={r.probationBaseSalary} />
                  <DetailRow label="Ăn trưa" value={r.probationLunch} />
                  <DetailRow label="Điện thoại" value={r.probationPhone} />
                  <DetailRow label="Thưởng HQCV" value={r.probationPerfBonus} />
                  <DetailRow label="Cộng TV" value={r.probationTotal} bold className="border-t border-yellow-200 pt-1 mt-1" />
                </div>
                <div className="bg-green-50 rounded-xl p-3 space-y-1.5">
                  <p className="text-[10px] font-bold text-green-700 uppercase">Giai đoạn Chính thức ({r.officialDays} ngày)</p>
                  <DetailRow label="Lương CB" value={r.officialBaseSalary} />
                  <DetailRow label="Ăn trưa" value={r.officialLunch} />
                  <DetailRow label="Điện thoại" value={r.officialPhone} />
                  <DetailRow label="Thưởng HQCV" value={r.officialPerfBonus} />
                  <DetailRow label="Cộng CT" value={r.officialTotal} bold className="border-t border-green-200 pt-1 mt-1" />
                </div>
              </div>
            ) : (
              <>
                <DetailRow label={`Lương CB thực tế (${r.actualDays}/${r.standardDays} ngày)`} value={r.probationDays > 0 ? r.probationBaseSalary : r.officialBaseSalary} />
                <DetailRow label="Trợ cấp ăn trưa" value={r.totalLunchActual} />
                <DetailRow label="Hỗ trợ điện thoại" value={r.totalPhoneActual} />
                <DetailRow label="Thưởng hiệu quả CV" value={r.probationDays > 0 ? r.probationPerfBonus : r.officialPerfBonus} />
                <DetailRow label="Cộng thu nhập ngày công" value={r.probationTotal + r.officialTotal} bold className="border-t border-slate-200 pt-1 mt-1" />
              </>
            )}
          </Section>

          {/* ═══ NHÓM 2: THU NHẬP KHÁC & GROSS ═══ */}
          <Section title="NHÓM 2 — THU NHẬP KHÁC & TỔNG THU NHẬP" color="emerald" num="2">
            <DetailRow label="Hoa hồng" value={r.commission} />
            <DetailRow label="Thưởng khác" value={r.bonus} />
            <DetailRow label="Thu nhập khác (L&D)" value={r.otherIncome} />
            <DetailRow label="Trợ cấp khác (OT, đi lại)" value={r.otherAllowance} />
            <DetailRow label="Cộng thu nhập khác" value={r.totalVariableIncome} className="border-t border-slate-200 pt-1 mt-1" />
            <DetailRow label="TỔNG THU NHẬP (GROSS)" value={r.grossSalary} bold
              className="border-t-2 border-emerald-300 pt-2 mt-2 text-emerald-700" />
          </Section>

          {/* ═══ NHÓM 3: THU NHẬP CHỊU THUẾ ═══ */}
          <Section title="NHÓM 3 — THU NHẬP CHỊU THUẾ" color="amber" num="3">
            <DetailRow label="Tổng thu nhập (Gross)" value={r.grossSalary} />
            <DetailRow label="(−) Trợ cấp ăn trưa (không chịu thuế)" value={-r.nonTaxableLunch} />
            <DetailRow label="(−) Hỗ trợ điện thoại (không chịu thuế)" value={-r.nonTaxablePhone} />
            <DetailRow label="THU NHẬP CHỊU THUẾ" value={r.taxableIncome} bold
              className="border-t border-amber-300 pt-1 mt-1" />
          </Section>

          {/* ═══ NHÓM 4+5: GIẢM TRỪ & THUẾ ═══ */}
          <Section title={`NHÓM 4+5 — GIẢM TRỪ & THUẾ TNCN (${r.taxMethod === 'progressive' ? 'Lũy tiến' : 'Flat 10%'})`} color="rose" num="4–5">
            {r.taxMethod === 'progressive' ? (
              <>
                <DetailRow label="Thu nhập chịu thuế" value={r.taxableIncome} />
                <DetailRow label="(−) BH bắt buộc NLĐ 10.5%" value={-r.siEmployee} />
                <DetailRow label="(−) Giảm trừ bản thân" value={-r.personalDeduction} />
                <DetailRow label={`(−) Giảm trừ NPT (×${Math.round(r.dependentDeduction / 6_200_000)})`} value={-r.dependentDeduction} />
                <DetailRow label="THU NHẬP TÍNH THUẾ" value={r.taxAssessableIncome} bold className="border-t border-slate-200 pt-1 mt-1" />
                <DetailRow label="→ Thuế TNCN (Lũy tiến 7 bậc)" value={-r.pit} bold className="text-red-600 mt-1" />
              </>
            ) : (
              <>
                <DetailRow label="Thu nhập tính thuế = Thu nhập chịu thuế" value={r.taxAssessableIncome} />
                <p className="text-[10px] text-slate-400 italic">
                  Không trừ giảm trừ gia cảnh hay bảo hiểm (RULE.md mục 5 — TH2)
                </p>
                <DetailRow label="→ Thuế TNCN (10% flat)" value={-r.pit} bold className="text-red-600 mt-1" />
              </>
            )}
          </Section>

          {/* ═══ NHÓM 6: KHẤU TRỪ & NET ═══ */}
          <Section title="NHÓM 6 — KHẤU TRỪ THỰC TẾ & THỰC LĨNH" color="blue" num="6">
            <p className="text-[10px] text-slate-500 mb-1.5">Khoản trừ vào lương = Thuế + BH 10.5% + Truy thu</p>
            <DetailRow label="Thuế TNCN" value={-r.pit} />
            <div className="ml-4 space-y-1 text-xs">
              <DetailRow label="BHXH NLĐ (8%)" value={-r.siBhxh} />
              <DetailRow label="BHYT NLĐ (1.5%)" value={-r.siBhyt} />
              <DetailRow label="BHTN NLĐ (1%)" value={-r.siBhtn} />
            </div>
            <DetailRow label="Cộng BH bắt buộc NLĐ (10.5%)" value={-r.siEmployee} bold />
            {r.retroDeduction > 0 && <DetailRow label="Truy thu sau thuế" value={-r.retroDeduction} />}
            <DetailRow label="TỔNG KHẤU TRỪ" value={-r.totalDeduction} bold className="border-t border-slate-300 pt-1 mt-1 text-red-600" />

            <div className="bg-slate-50 rounded-lg p-2 mt-2 text-xs">
              <DetailRow label="Đoàn phí 2% (Cty đóng thay)" value={r.unionFee}
                sub="Hiển thị trên BL nhưng KHÔNG trừ vào lương NLĐ" />
            </div>

            {r.retroAddition > 0 && <DetailRow label="(+) Cộng thêm sau thuế" value={r.retroAddition} />}
          </Section>

          {/* NET */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
            <p className="text-sm font-medium text-blue-200">THỰC LĨNH (NET SALARY)</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(r.netSalary)} VNĐ</p>
            <p className="text-xs text-blue-300 mt-2">
              = Gross ({formatCurrency(r.grossSalary)}) − Tổng trừ ({formatCurrency(r.totalDeduction)})
              {r.retroAddition > 0 ? ` + Cộng thêm (${formatCurrency(r.retroAddition)})` : ''}
            </p>
          </div>

          {/* ═══ NHÓM 7: CHI PHÍ CÔNG TY ═══ */}
          <Section title="NHÓM 7 — CHI PHÍ CÔNG TY TRẢ" color="slate" num="7">
            <p className="text-[10px] text-slate-400 italic mb-1.5">
              Không hiển thị trên phiếu lương NV — dùng cho dữ liệu tài chính
            </p>
            <DetailRow label="Lương thực lĩnh NV" value={r.netSalary} />
            <DetailRow label="BHXH Cty (17.5%)" value={r.siEmployerBhxh} />
            <DetailRow label="BHYT Cty (3%)" value={r.siEmployerBhyt} />
            <DetailRow label="BHTN Cty (1%)" value={r.siEmployerBhtn} />
            <DetailRow label="Cộng BH Cty (21.5%)" value={r.siEmployer} />
            <DetailRow label="Đoàn phí Cty (2%)" value={r.employerUnionFee} />
            <DetailRow label="TỔNG CHI PHÍ CÔNG TY" value={r.totalEmployerCost} bold
              className="border-t-2 border-slate-300 pt-2 mt-2" />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, color, num, children }: { title: string; color: string; num: string; children: React.ReactNode }) {
  const borderColor: Record<string, string> = {
    emerald: 'border-l-emerald-500',
    amber: 'border-l-amber-500',
    rose: 'border-l-rose-500',
    blue: 'border-l-blue-500',
    slate: 'border-l-slate-400',
  };
  return (
    <div className={`border-l-4 ${borderColor[color] || 'border-l-blue-500'} pl-4 space-y-1.5`}>
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 text-[9px] flex items-center justify-center font-bold">{num}</span>
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetailRow({
  label, value, bold = false, className = '', sub,
}: {
  label: string; value: number; bold?: boolean; className?: string; sub?: string;
}) {
  return (
    <div className={`flex items-center justify-between text-sm ${className}`}>
      <div>
        <span className={`${bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{label}</span>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
      <span className={`${bold ? 'font-bold text-slate-800' : 'font-medium text-slate-700'} ${value < 0 ? 'text-red-600' : ''}`}>
        {value === 0 ? '0' : `${value < 0 ? '−' : ''}${formatCurrency(Math.abs(value))}`}
      </span>
    </div>
  );
}
