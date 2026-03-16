import React, { useState } from 'react';
import { Calculator, Play, Eye, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/payrollCalculator';
import { PayrollRecord, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '../types';
import PayrollDetailModal from '../components/PayrollDetailModal';

const fc = (v: number) => (v === 0 ? '0' : formatCurrency(v));

// Frozen info column widths (px)
const COL_W = [64, 120, 72, 52, 64] as const;  // Mã NV, Họ tên, TT, C.chuẩn, Phép dư
const FREEZE_TOTAL = COL_W.reduce((a, b) => a + b, 0);

export default function Payroll() {
  const { payrollBatches, generatePayroll, setPayrollBatches, updatePayrollRecord } = useApp();
  const [month, setMonth] = useState(2);
  const [year, setYear] = useState(2026);
  const [detailRecord, setDetailRecord] = useState<PayrollRecord | null>(null);

  const currentBatch = payrollBatches.find((b) => b.month === month && b.year === year);
  const recs = currentBatch?.records ?? [];

  const handleGenerate = () => generatePayroll(month, year);

  const handleSubmitForApproval = () => {
    if (!currentBatch) return;
    setPayrollBatches((prev) =>
      prev.map((b) =>
        b.id === currentBatch.id ? { ...b, status: 'pending_approval' as const } : b
      )
    );
  };

  const handleInlineChange = (recordId: string, field: string, value: number | string) => {
    if (!currentBatch) return;
    updatePayrollRecord(currentBatch.id, recordId, { [field]: value });
  };

  const sum = (fn: (r: PayrollRecord) => number) => recs.reduce((s, r) => s + fn(r), 0);

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
            <Play size={16} /> Tính lương
          </button>
          {currentBatch?.status === 'draft' && (
            <button onClick={handleSubmitForApproval}
              className="flex items-center gap-2 bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/25">
              <Send size={16} /> Gửi duyệt
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

          {/* Full detail payroll table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] whitespace-nowrap">
                <thead>
                  {/* Row 1: Group headers */}
                  <tr className="bg-slate-100 text-[10px] text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th colSpan={5} className="px-2 py-2 text-left font-semibold sticky left-0 bg-slate-100 z-30 border-r border-slate-200" style={{ minWidth: FREEZE_TOTAL }}>Thông tin</th>
                    <th colSpan={4} className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-yellow-50/60 text-yellow-700">
                      Lương TV theo HĐTV
                    </th>
                    <th colSpan={5} className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-emerald-50/60 text-emerald-700">
                      Gói TN theo HĐLĐ
                    </th>
                    <th colSpan={2} className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-yellow-50/40 text-yellow-600">
                      NC Thử việc
                    </th>
                    <th colSpan={2} className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-green-50/40 text-green-600">
                      NC Chính thức
                    </th>
                    <th colSpan={5} className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-teal-50/60 text-teal-700">
                      TN theo ngày công
                    </th>
                    <th colSpan={5} className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-cyan-50/60 text-cyan-700">
                      Thu nhập khác
                    </th>
                    <th className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-emerald-50/40 text-emerald-700">Tổng TN</th>
                    <th className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-amber-50/40 text-amber-700">TN chịu thuế</th>
                    <th colSpan={7} className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-amber-50/60 text-amber-700">
                      Giảm trừ thuế
                    </th>
                    <th className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-orange-50/40 text-orange-700">TN tính thuế</th>
                    <th colSpan={6} className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-red-50/60 text-red-700">
                      Khoản trừ vào lương
                    </th>
                    <th className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-green-50/40 text-green-600">+ Sau thuế</th>
                    <th className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-blue-50/60 text-blue-700">Thực lĩnh</th>
                    <th colSpan={2} className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-slate-50/80 text-slate-600">
                      CP Cty trả
                    </th>
                    <th className="px-2 py-2 text-center font-semibold border-l border-slate-200 bg-slate-100 text-slate-700">Tổng CP CT</th>
                    <th colSpan={4} className="px-2 py-2 text-center font-semibold border-l border-slate-200">Thông tin TK</th>
                    <th className="px-2 py-2 border-l border-slate-200"></th>
                  </tr>
                  {/* Row 2: Column headers */}
                  <tr className="bg-slate-50/80 text-[10px] text-slate-500 uppercase tracking-wider">
                    {/* Frozen Info: 5 cols */}
                    <th className="px-2 py-2 font-medium text-left sticky z-20 bg-slate-50" style={{ left: 0, minWidth: COL_W[0] }}>Mã NV</th>
                    <th className="px-2 py-2 font-medium text-left sticky z-20 bg-slate-50" style={{ left: COL_W[0], minWidth: COL_W[1] }}>Họ tên</th>
                    <th className="px-2 py-2 font-medium text-left sticky z-20 bg-slate-50" style={{ left: COL_W[0] + COL_W[1], minWidth: COL_W[2] }}>TT</th>
                    <th className="px-2 py-2 font-medium text-center sticky z-20 bg-slate-50" style={{ left: COL_W[0] + COL_W[1] + COL_W[2], minWidth: COL_W[3] }}>C.chuẩn</th>
                    <th className="px-2 py-2 font-medium text-center sticky z-20 bg-slate-50 border-r border-slate-200" style={{ left: COL_W[0] + COL_W[1] + COL_W[2] + COL_W[3], minWidth: COL_W[4] }}>Phép dư</th>
                    {/* Lương TV theo HĐTV 4 cols */}
                    <Th border>Lương TV</Th>
                    <Th>TC ăn trưa</Th>
                    <Th>Thưởng HQCV</Th>
                    <Th bg="bg-yellow-50/40" className="font-semibold">Tổng TV</Th>
                    {/* Gói TN theo HĐLĐ 5 cols */}
                    <Th border>Lương CB</Th>
                    <Th>TC ăn trưa</Th>
                    <Th>HT ĐT</Th>
                    <Th>Thưởng HQCV</Th>
                    <Th bg="bg-emerald-50/40" className="font-semibold">Tổng HĐ</Th>
                    {/* NC Thử việc 2 cols */}
                    <Th border>Nghỉ KKL</Th>
                    <Th bg="bg-yellow-50/30">NC TV</Th>
                    {/* NC Chính thức 2 cols */}
                    <Th border>Nghỉ KKL</Th>
                    <Th bg="bg-green-50/30">NC CT</Th>
                    {/* TN theo ngày công 5 cols */}
                    <Th border>Lương CB</Th>
                    <Th>TC ăn trưa</Th>
                    <Th>HT ĐT</Th>
                    <Th>Thưởng HQCV</Th>
                    <Th bg="bg-teal-50/40" className="font-semibold">Cộng NC</Th>
                    {/* Thu nhập khác 5 cols */}
                    <Th border>Hoa hồng</Th>
                    <Th>Thưởng</Th>
                    <Th>TN khác</Th>
                    <Th>TC khác</Th>
                    <Th bg="bg-cyan-50/40" className="font-semibold">Cộng TN khác</Th>
                    {/* Tổng TN */}
                    <Th border bg="bg-emerald-50/40" className="font-semibold text-emerald-700">Gross</Th>
                    {/* TN chịu thuế */}
                    <Th border className="font-semibold">TN chịu thuế</Th>
                    {/* Giảm trừ thuế 7 cols */}
                    <Th border className="text-red-500">BHXH 8%</Th>
                    <Th className="text-red-500">BHYT 1.5%</Th>
                    <Th className="text-red-500">BHTN 1%</Th>
                    <Th className="text-red-500 font-semibold">Cộng 10.5%</Th>
                    <Th>GT bản thân</Th>
                    <Th>Số NPT</Th>
                    <Th>GT NPT</Th>
                    {/* TN tính thuế */}
                    <Th border className="font-semibold">TN tính thuế</Th>
                    {/* Khoản trừ 6 cols */}
                    <Th border>Biểu thuế</Th>
                    <Th className="text-red-500 font-semibold">Thuế TNCN</Th>
                    <Th className="text-red-500">BH 10.5%</Th>
                    <Th>Đoàn phí</Th>
                    <Th>Truy thu</Th>
                    <Th className="text-red-600 font-semibold">Tổng trừ</Th>
                    {/* + Sau thuế */}
                    <Th border>Cộng thêm</Th>
                    {/* Thực lĩnh */}
                    <Th border bg="bg-blue-50/40" className="font-semibold text-blue-700">Net</Th>
                    {/* CP Cty 2 cols */}
                    <Th border>BH Cty 21.5%</Th>
                    <Th>ĐP Cty 2%</Th>
                    {/* Tổng CP CT */}
                    <Th border bg="bg-slate-100/60" className="font-semibold">Tổng CP Cty</Th>
                    {/* Thông tin TK 4 cols */}
                    <Th border>TK chi phí</Th>
                    <Th>Số TK</Th>
                    <Th>Ngân hàng</Th>
                    <Th>Email</Th>
                    {/* Detail */}
                    <Th border></Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Frozen Info */}
                      <td className="px-2 py-2 font-mono text-[10px] text-slate-500 sticky z-10 bg-white" style={{ left: 0, minWidth: COL_W[0] }}>{r.employeeId}</td>
                      <td className="px-2 py-2 font-medium text-slate-800 sticky z-10 bg-white" style={{ left: COL_W[0], minWidth: COL_W[1] }}>{r.employeeName}</td>
                      <td className="px-2 py-2 sticky z-10 bg-white" style={{ left: COL_W[0] + COL_W[1], minWidth: COL_W[2] }}>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[r.status]}`}>
                          {EMPLOYEE_STATUS_LABELS[r.status].slice(0, 6)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-center sticky z-10 bg-white" style={{ left: COL_W[0] + COL_W[1] + COL_W[2], minWidth: COL_W[3] }}>{r.standardDays}</td>
                      <td className="px-2 py-2 text-center sticky z-10 bg-white border-r border-slate-100" style={{ left: COL_W[0] + COL_W[1] + COL_W[2] + COL_W[3], minWidth: COL_W[4] }}>
                        <InlineInput value={r.remainingLeave} onChange={(n) => handleInlineChange(r.id, 'remainingLeave', n)} />
                      </td>
                      {/* Lương TV theo HĐTV */}
                      <Td border>{fc(r.probPackageBaseSalary)}</Td>
                      <Td>{fc(r.probPackageLunch)}</Td>
                      <Td>{fc(r.probPackagePerfBonus)}</Td>
                      <Td className="font-semibold text-yellow-700 bg-yellow-50/20">{fc(r.probPackageTotal)}</Td>
                      {/* Gói TN theo HĐLĐ */}
                      <Td border>{fc(r.packageBaseSalary)}</Td>
                      <Td>{fc(r.packageLunch)}</Td>
                      <Td>{fc(r.packagePhone)}</Td>
                      <Td>{fc(r.packagePerfBonus)}</Td>
                      <Td className="font-semibold text-emerald-700 bg-emerald-50/20">{fc(r.packageTotal)}</Td>
                      {/* NC Thử việc */}
                      <Td border className="text-center">{r.unpaidLeaveProbation}</Td>
                      <Td className="text-center" highlight={r.probationDays > 0 ? 'yellow' : undefined}>{r.probationDays}</Td>
                      {/* NC Chính thức */}
                      <Td border className="text-center">{r.unpaidLeaveOfficial}</Td>
                      <Td className="text-center" highlight={r.officialDays > 0 && r.probationDays > 0 ? 'green' : undefined}>{r.officialDays}</Td>
                      {/* TN theo ngày công */}
                      <Td border>{fc(r.proratedBaseSalary)}</Td>
                      <Td>{fc(r.totalLunchActual)}</Td>
                      <Td>{fc(r.totalPhoneActual)}</Td>
                      <Td>{fc(r.proratedPerfBonus)}</Td>
                      <Td className="font-semibold text-teal-700 bg-teal-50/20">{fc(r.proratedTotal)}</Td>
                      {/* Thu nhập khác */}
                      <Td border>
                        <InlineAmountDetail
                          amount={r.commission} detail={r.commissionDetail}
                          onAmountChange={(n) => handleInlineChange(r.id, 'commission', n)}
                          onDetailChange={(s) => handleInlineChange(r.id, 'commissionDetail', s)}
                        />
                      </Td>
                      <Td>
                        <InlineAmountDetail
                          amount={r.bonus} detail={r.bonusDetail}
                          onAmountChange={(n) => handleInlineChange(r.id, 'bonus', n)}
                          onDetailChange={(s) => handleInlineChange(r.id, 'bonusDetail', s)}
                        />
                      </Td>
                      <Td>
                        <InlineAmountDetail
                          amount={r.otherIncome} detail={r.otherIncomeDetail}
                          onAmountChange={(n) => handleInlineChange(r.id, 'otherIncome', n)}
                          onDetailChange={(s) => handleInlineChange(r.id, 'otherIncomeDetail', s)}
                        />
                      </Td>
                      <Td>
                        <InlineAmountDetail
                          amount={r.otherAllowance} detail={r.otherAllowanceDetail}
                          onAmountChange={(n) => handleInlineChange(r.id, 'otherAllowance', n)}
                          onDetailChange={(s) => handleInlineChange(r.id, 'otherAllowanceDetail', s)}
                        />
                      </Td>
                      <Td className="font-semibold text-cyan-700 bg-cyan-50/20">{fc(r.totalVariableIncome)}</Td>
                      {/* Tổng TN */}
                      <Td border className="font-bold text-emerald-700 bg-emerald-50/30">{fc(r.grossSalary)}</Td>
                      {/* TN chịu thuế */}
                      <Td border className="font-semibold">{fc(r.taxableIncome)}</Td>
                      {/* Giảm trừ thuế */}
                      <Td border className="text-red-600">{fc(r.siBhxh)}</Td>
                      <Td className="text-red-600">{fc(r.siBhyt)}</Td>
                      <Td className="text-red-600">{fc(r.siBhtn)}</Td>
                      <Td className="text-red-600 font-semibold">{fc(r.siEmployee)}</Td>
                      <Td className="text-slate-500">{fc(r.personalDeduction)}</Td>
                      <Td className="text-center text-slate-500">{r.dependentCount}</Td>
                      <Td className="text-slate-500">{fc(r.dependentDeduction)}</Td>
                      {/* TN tính thuế */}
                      <Td border className="font-semibold">{fc(r.taxAssessableIncome)}</Td>
                      {/* Khoản trừ */}
                      <Td border>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium
                          ${r.taxMethod === 'progressive' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {r.taxMethod === 'progressive' ? 'LT' : '10%'}
                        </span>
                      </Td>
                      <Td className="text-red-600 font-semibold">{fc(r.pit)}</Td>
                      <Td className="text-red-600">{fc(r.siEmployee)}</Td>
                      <Td className="text-slate-400">{fc(r.unionFee)}</Td>
                      <Td>
                        <InlineInput value={r.retroDeduction} onChange={(n) => handleInlineChange(r.id, 'retroDeduction', n)} />
                      </Td>
                      <Td className="text-red-600 font-semibold">{fc(r.totalDeduction)}</Td>
                      {/* + Sau thuế */}
                      <Td border>
                        <InlineInput value={r.retroAddition} onChange={(n) => handleInlineChange(r.id, 'retroAddition', n)} />
                      </Td>
                      {/* Thực lĩnh */}
                      <Td border className="font-bold text-blue-700 bg-blue-50/30">{fc(r.netSalary)}</Td>
                      {/* CP Cty */}
                      <Td border className="text-blue-600">{fc(r.siEmployer)}</Td>
                      <Td className="text-slate-500">{fc(r.employerUnionFee)}</Td>
                      {/* Tổng CP CT */}
                      <Td border className="font-bold text-slate-800">{fc(r.totalEmployerCost)}</Td>
                      {/* Thông tin TK */}
                      <Td border className="text-slate-500 text-[10px]">{r.costAccount}</Td>
                      <Td className="text-slate-500 text-[10px] font-mono">{r.bankAccount}</Td>
                      <Td className="text-slate-500 text-[10px]">{r.bankName}</Td>
                      <Td className="text-slate-500 text-[10px]">{r.email}</Td>
                      {/* Detail btn */}
                      <Td border>
                        <button onClick={() => setDetailRecord(r)}
                          className="p-1 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Eye size={13} />
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 font-semibold text-[11px] border-t-2 border-slate-200">
                    <td colSpan={5} className="px-2 py-2.5 text-right text-slate-600 sticky left-0 bg-slate-50 z-10 border-r border-slate-200" style={{ minWidth: FREEZE_TOTAL }}>TỔNG</td>
                    {/* Lương TV theo HĐTV — skip totals for contract amounts */}
                    <td colSpan={4} className="border-l border-slate-200"></td>
                    {/* Gói TN theo HĐLĐ — skip */}
                    <td colSpan={5} className="border-l border-slate-200"></td>
                    {/* NC TV — skip */}
                    <td colSpan={2} className="border-l border-slate-200"></td>
                    {/* NC CT — skip */}
                    <td colSpan={2} className="border-l border-slate-200"></td>
                    {/* TN theo ngày công */}
                    <Td border>{fc(sum(r => r.proratedBaseSalary))}</Td>
                    <Td>{fc(sum(r => r.totalLunchActual))}</Td>
                    <Td>{fc(sum(r => r.totalPhoneActual))}</Td>
                    <Td>{fc(sum(r => r.proratedPerfBonus))}</Td>
                    <Td className="text-teal-700">{fc(sum(r => r.proratedTotal))}</Td>
                    {/* Thu nhập khác */}
                    <Td border>{fc(sum(r => r.commission))}</Td>
                    <Td>{fc(sum(r => r.bonus))}</Td>
                    <Td>{fc(sum(r => r.otherIncome))}</Td>
                    <Td>{fc(sum(r => r.otherAllowance))}</Td>
                    <Td className="text-cyan-700">{fc(sum(r => r.totalVariableIncome))}</Td>
                    {/* Tổng TN */}
                    <Td border className="text-emerald-700 bg-emerald-50/30">{fc(sum(r => r.grossSalary))}</Td>
                    {/* TN chịu thuế */}
                    <Td border>{fc(sum(r => r.taxableIncome))}</Td>
                    {/* Giảm trừ */}
                    <Td border className="text-red-600">{fc(sum(r => r.siBhxh))}</Td>
                    <Td className="text-red-600">{fc(sum(r => r.siBhyt))}</Td>
                    <Td className="text-red-600">{fc(sum(r => r.siBhtn))}</Td>
                    <Td className="text-red-600">{fc(sum(r => r.siEmployee))}</Td>
                    <Td></Td>
                    <Td></Td>
                    <Td></Td>
                    {/* TN tính thuế */}
                    <Td border>{fc(sum(r => r.taxAssessableIncome))}</Td>
                    {/* Khoản trừ */}
                    <Td border></Td>
                    <Td className="text-red-600">{fc(sum(r => r.pit))}</Td>
                    <Td className="text-red-600">{fc(sum(r => r.siEmployee))}</Td>
                    <Td>{fc(sum(r => r.unionFee))}</Td>
                    <Td>{fc(sum(r => r.retroDeduction))}</Td>
                    <Td className="text-red-600">{fc(sum(r => r.totalDeduction))}</Td>
                    {/* + Sau thuế */}
                    <Td border>{fc(sum(r => r.retroAddition))}</Td>
                    {/* Net */}
                    <Td border className="text-blue-700 bg-blue-50/30">{fc(sum(r => r.netSalary))}</Td>
                    {/* CP Cty */}
                    <Td border className="text-blue-600">{fc(sum(r => r.siEmployer))}</Td>
                    <Td>{fc(sum(r => r.employerUnionFee))}</Td>
                    {/* Tổng CP CT */}
                    <Td border className="text-slate-800">{fc(sum(r => r.totalEmployerCost))}</Td>
                    {/* TK info — skip */}
                    <td colSpan={4} className="border-l border-slate-200"></td>
                    <Td border></Td>
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
            <Play size={16} /> Tính lương tháng {month}/{year}
          </button>
        </div>
      )}

      {detailRecord && currentBatch && (
        <PayrollDetailModal
          record={currentBatch.records.find(r => r.id === detailRecord.id) ?? detailRecord}
          batchId={currentBatch.id}
          onClose={() => setDetailRecord(null)}
          onUpdate={updatePayrollRecord}
        />
      )}
    </div>
  );
}

function Th({
  children, border, bg, className = '',
}: {
  children?: React.ReactNode; border?: boolean; bg?: string; className?: string;
}) {
  return (
    <th className={`px-2 py-2 font-medium text-right ${border ? 'border-l border-slate-200' : ''} ${bg ?? ''} ${className}`}>
      {children}
    </th>
  );
}

function Td({
  children, border, className = '', highlight,
}: {
  children?: React.ReactNode; border?: boolean; className?: string; highlight?: 'yellow' | 'green';
}) {
  const hlClass = highlight === 'yellow' ? 'bg-yellow-50 text-yellow-700 font-medium'
    : highlight === 'green' ? 'bg-green-50 text-green-700 font-medium' : '';
  return (
    <td className={`px-2 py-2 text-right ${border ? 'border-l border-slate-100' : ''} ${hlClass} ${className}`}>
      {children}
    </td>
  );
}

function InlineInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <input
      type="number"
      className="w-20 text-right px-1 py-0.5 text-[11px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-blue-50/30"
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
    />
  );
}

function InlineAmountDetail({ amount, detail, onAmountChange, onDetailChange }: {
  amount: number; detail: string;
  onAmountChange: (n: number) => void; onDetailChange: (s: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-[96px]">
      <input
        type="number"
        className="w-full text-right px-1 py-0.5 text-[11px] border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-blue-50/30"
        value={amount}
        onChange={(e) => onAmountChange(Number(e.target.value) || 0)}
      />
      <input
        type="text"
        placeholder="Chi tiết…"
        className="w-full px-1 py-0.5 text-[9px] text-slate-500 border border-slate-100 rounded focus:outline-none focus:ring-1 focus:ring-blue-400 bg-slate-50/50 placeholder:text-slate-300"
        value={detail}
        onChange={(e) => onDetailChange(e.target.value)}
      />
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
