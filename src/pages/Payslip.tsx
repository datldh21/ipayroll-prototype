import { useState } from 'react';
import { FileText, Send, Mail, CheckCircle, Eye, X, Download, Printer, MailCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/payrollCalculator';
import { PayrollRecord, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '../types';

export default function Payslip() {
  const { payrollBatches, employees, emailsSent, setEmailsSent } = useApp();
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [previewRecord, setPreviewRecord] = useState<PayrollRecord | null>(null);
  const [sending, setSending] = useState(false);
  const [sendComplete, setSendComplete] = useState(false);

  const approvedBatches = payrollBatches.filter((b) => b.status === 'approved');
  const selectedBatch = approvedBatches.find((b) => b.id === selectedBatchId);

  const handleSendAll = () => {
    if (!selectedBatch) return;
    setSending(true);
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= selectedBatch.records.length) {
        clearInterval(interval);
        setSending(false);
        setSendComplete(true);
        setTimeout(() => setSendComplete(false), 5000);
        return;
      }
      const record = selectedBatch.records[idx];
      setEmailsSent((prev) => ({ ...prev, [`${selectedBatch.id}-${record.employeeId}`]: true }));
      idx++;
    }, 300);
  };

  const handleSendSingle = (employeeId: string) => {
    if (!selectedBatch) return;
    setEmailsSent((prev) => ({ ...prev, [`${selectedBatch.id}-${employeeId}`]: true }));
  };

  const isEmailSent = (employeeId: string) => {
    if (!selectedBatch) return false;
    return !!emailsSent[`${selectedBatch.id}-${employeeId}`];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Phiếu lương & Gửi Email</h1>
          <p className="text-sm text-slate-500 mt-1">Tạo phiếu lương và gửi email hàng loạt cho nhân viên</p>
        </div>
      </div>

      {/* Batch Selector */}
      <div className="flex flex-wrap items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <FileText size={20} className="text-blue-500" />
        <span className="text-sm font-medium text-slate-600">Chọn kỳ lương đã duyệt:</span>
        <select value={selectedBatchId} onChange={(e) => setSelectedBatchId(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-w-[200px]">
          <option value="">— Chọn kỳ lương —</option>
          {approvedBatches.map((b) => (
            <option key={b.id} value={b.id}>T{b.month}/{b.year} ({b.totalEmployees} NV)</option>
          ))}
        </select>
        {selectedBatch && (
          <button onClick={handleSendAll} disabled={sending}
            className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25 ml-auto disabled:opacity-50 disabled:cursor-not-allowed">
            {sending ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang gửi...</>
            ) : (
              <><Send size={16} />Gửi email hàng loạt</>
            )}
          </button>
        )}
      </div>

      {sendComplete && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} />
          Đã gửi phiếu lương qua email cho toàn bộ nhân viên thành công!
        </div>
      )}

      {approvedBatches.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <FileText size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-lg font-semibold text-slate-600 mb-2">Chưa có bảng lương được duyệt</h3>
          <p className="text-sm text-slate-400">Bảng lương cần được Quản lý phê duyệt trước khi tạo phiếu lương</p>
        </div>
      )}

      {selectedBatch && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-700">Phiếu lương T{selectedBatch.month}/{selectedBatch.year}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedBatch.totalEmployees} nhân viên</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <MailCheck size={14} className="text-green-500" />
              <span>Đã gửi: {selectedBatch.records.filter((r) => isEmailSent(r.employeeId)).length}/{selectedBatch.totalEmployees}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5 font-medium">Mã NV</th>
                  <th className="px-5 py-3.5 font-medium">Họ và tên</th>
                  <th className="px-5 py-3.5 font-medium">Email</th>
                  <th className="px-5 py-3.5 font-medium text-right">Gross</th>
                  <th className="px-5 py-3.5 font-medium text-right">Net</th>
                  <th className="px-5 py-3.5 font-medium text-center">Email</th>
                  <th className="px-5 py-3.5 font-medium text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedBatch.records.map((r) => {
                  const emp = employees.find((e) => e.id === r.employeeId);
                  const sent = isEmailSent(r.employeeId);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{r.employeeId}</td>
                      <td className="px-5 py-3 font-medium text-slate-800">{r.employeeName}</td>
                      <td className="px-5 py-3 text-slate-500 text-xs">{emp?.email || '—'}</td>
                      <td className="px-5 py-3 text-right text-slate-700">{formatCurrency(r.grossSalary)}</td>
                      <td className="px-5 py-3 text-right font-bold text-blue-700">{formatCurrency(r.netSalary)}</td>
                      <td className="px-5 py-3 text-center">
                        {sent ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                            <CheckCircle size={13} />Đã gửi
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Chưa gửi</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setPreviewRecord(r)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Xem phiếu lương">
                            <Eye size={15} />
                          </button>
                          {!sent && (
                            <button onClick={() => handleSendSingle(r.employeeId)}
                              className="p-1.5 rounded-lg hover:bg-green-50 text-slate-400 hover:text-green-600 transition-colors" title="Gửi email">
                              <Mail size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {previewRecord && <PayslipPreview record={previewRecord} onClose={() => setPreviewRecord(null)} />}
    </div>
  );
}

function PayslipPreview({ record: r, onClose }: { record: PayrollRecord; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="In"><Printer size={16} /></button>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500" title="Tải xuống"><Download size={16} /></button>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>

        <div className="p-6">
          {/* Company Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl mx-auto mb-2 flex items-center justify-center text-white font-bold text-lg">iP</div>
            <h2 className="text-lg font-bold text-slate-800">PHIẾU LƯƠNG</h2>
            <p className="text-sm text-slate-500">Tháng {r.month}/{r.year}</p>
          </div>

          {/* Employee Info */}
          <div className="bg-slate-50 rounded-xl p-4 mb-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400">Nhân viên</p>
              <p className="font-semibold text-slate-800">{r.employeeName}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Mã NV</p>
              <p className="font-medium text-slate-700">{r.employeeId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Phòng ban</p>
              <p className="font-medium text-slate-700">{r.department}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Trạng thái</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[r.status]}`}>
                {EMPLOYEE_STATUS_LABELS[r.status]}
              </span>
            </div>
          </div>

          {/* Thu nhập */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              Thu nhập
            </h3>
            <div className="space-y-1.5 text-sm">
              {r.probationDays > 0 && r.officialDays > 0 ? (
                <>
                  <PayslipRow label={`Thu nhập giai đoạn TV (${r.probationDays} ngày)`} value={r.probationTotal} />
                  <PayslipRow label={`Thu nhập giai đoạn CT (${r.officialDays} ngày)`} value={r.officialTotal} />
                </>
              ) : (
                <PayslipRow label={`Thu nhập theo ngày công (${r.actualDays}/${r.standardDays})`} value={r.probationTotal + r.officialTotal} />
              )}
              {r.totalVariableIncome > 0 && (
                <PayslipRow label="Thu nhập khác (HH, thưởng, TC)" value={r.totalVariableIncome} />
              )}
              <div className="border-t border-slate-200 pt-1.5">
                <PayslipRow label="TỔNG THU NHẬP (GROSS)" value={r.grossSalary} bold />
              </div>
            </div>
          </div>

          {/* Khấu trừ */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
              Khấu trừ
            </h3>
            <div className="space-y-1.5 text-sm">
              <PayslipRow label={`Thuế TNCN (${r.taxMethod === 'progressive' ? 'Lũy tiến' : '10%'})`} value={-r.pit} />
              <PayslipRow label="BHXH NLĐ (8%)" value={-r.siBhxh} />
              <PayslipRow label="BHYT NLĐ (1.5%)" value={-r.siBhyt} />
              <PayslipRow label="BHTN NLĐ (1%)" value={-r.siBhtn} />
              {r.retroDeduction > 0 && <PayslipRow label="Truy thu sau thuế" value={-r.retroDeduction} />}
              {r.retroAddition > 0 && <PayslipRow label="Cộng thêm sau thuế" value={r.retroAddition} />}
              <div className="bg-slate-50 rounded-lg p-2 mt-1">
                <PayslipRow label="Đoàn phí (Cty đóng thay)" value={0} sub="Không trừ NLĐ" />
              </div>
              <div className="border-t border-slate-200 pt-1.5">
                <PayslipRow label="TỔNG KHẤU TRỪ" value={-r.totalDeduction} bold />
              </div>
            </div>
          </div>

          {/* Net */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 text-white text-center">
            <p className="text-xs text-blue-200 mb-1">THỰC LĨNH</p>
            <p className="text-2xl font-bold">{formatCurrency(r.netSalary)} VNĐ</p>
          </div>

          <p className="text-[10px] text-slate-400 text-center mt-4">
            Phiếu lương được tạo tự động bởi hệ thống iPayroll. Mọi thắc mắc vui lòng liên hệ phòng Nhân sự.
          </p>
        </div>
      </div>
    </div>
  );
}

function PayslipRow({ label, value, bold = false, sub }: { label: string; value: number; bold?: boolean; sub?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className={`${bold ? 'font-semibold text-slate-800' : 'text-slate-600'}`}>{label}</span>
        {sub && <span className="text-[10px] text-slate-400 ml-1">({sub})</span>}
      </div>
      <span className={`${bold ? 'font-bold' : 'font-medium'} ${value < 0 ? 'text-red-600' : 'text-slate-700'}`}>
        {value === 0 ? '—' : `${value < 0 ? '−' : ''}${formatCurrency(Math.abs(value))}`}
      </span>
    </div>
  );
}
