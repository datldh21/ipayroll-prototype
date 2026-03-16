import React, { useState, useEffect, useCallback } from 'react';
import { X, Save } from 'lucide-react';
import { PayrollRecord, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '../types';
import { formatCurrency } from '../utils/payrollCalculator';
import { PayrollEditableFields } from '../context/AppContext';

const fc = (v: number) => (v === 0 ? '0' : formatCurrency(v));
const fcSigned = (v: number) => {
  if (v === 0) return '0';
  return `${v < 0 ? '−' : ''}${formatCurrency(Math.abs(v))}`;
};

interface Props {
  record: PayrollRecord;
  batchId: string;
  onClose: () => void;
  onUpdate: (batchId: string, recordId: string, changes: PayrollEditableFields) => void;
}

export default function PayrollDetailModal({ record: r, batchId, onClose, onUpdate }: Props) {
  const [edits, setEdits] = useState<PayrollEditableFields>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setEdits({});
    setDirty(false);
  }, [r.id]);

  const setField = useCallback(<K extends keyof PayrollEditableFields>(key: K, val: PayrollEditableFields[K]) => {
    setEdits(prev => ({ ...prev, [key]: val }));
    setDirty(true);
  }, []);

  const handleSave = () => {
    if (!dirty) return;
    onUpdate(batchId, r.id, edits);
    setDirty(false);
  };

  const v = (key: keyof PayrollEditableFields): number =>
    (edits[key] as number | undefined) ?? (r[key as keyof PayrollRecord] as number);

  const vs = (key: keyof PayrollEditableFields): string =>
    (edits[key] as string | undefined) ?? (r[key as keyof PayrollRecord] as string);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Chi tiết lương — {r.employeeName}</h2>
            <p className="text-sm text-slate-500">T{r.month}/{r.year} &bull; {r.department}</p>
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Save size={14} /> Lưu
              </button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 text-sm">
          {/* ── Trạng thái & Ngày công chuẩn ── */}
          <div className="flex items-center gap-4 flex-wrap">
            <InfoPill label="Trạng thái">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[r.status]}`}>
                {EMPLOYEE_STATUS_LABELS[r.status]}
              </span>
            </InfoPill>
            <InfoPill label="Ngày công chuẩn">
              <span className="font-semibold text-slate-800">{r.standardDays} ngày</span>
            </InfoPill>
            <InfoPill label="Biểu thuế">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${r.taxMethod === 'progressive' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                {r.taxMethod === 'progressive' ? 'Lũy tiến' : 'Flat 10%'}
              </span>
            </InfoPill>
          </div>

          {/* ── LƯƠNG THỬ VIỆC THEO HĐTV ── */}
          {(r.probationDays > 0 || r.status === 'thu_viec' || r.status === 'nghi_viec_tv') && (
            <Section title="LƯƠNG THỬ VIỆC THEO HĐTV" color="yellow">
              <Row label="Lương thử việc" value={r.probPackageBaseSalary} />
              <Row label="Trợ cấp ăn trưa" value={r.probPackageLunch} />
              <Row label="Thưởng hiệu quả CV" value={r.probPackagePerfBonus} />
              <TotalRow label="Tổng cộng" value={r.probPackageTotal} />
            </Section>
          )}

          {/* ── GÓI THU NHẬP THEO HĐLĐ MỚI NHẤT ── */}
          <Section title="GÓI THU NHẬP THEO HĐLĐ MỚI NHẤT" color="emerald">
            <Row label="Lương cơ bản" value={r.packageBaseSalary} />
            <Row label="Trợ cấp ăn trưa" value={r.packageLunch} />
            <Row label="Hỗ trợ Điện thoại" value={r.packagePhone} />
            <Row label="Thưởng hiệu quả CV" value={r.packagePerfBonus} />
            <TotalRow label="Tổng cộng" value={r.packageTotal} />
          </Section>

          {/* ── NGÀY CÔNG THỬ VIỆC ── */}
          {(r.probationDays > 0 || r.unpaidLeaveProbation > 0) && (
            <Section title="NGÀY CÔNG THỬ VIỆC" color="yellow">
              <Row label="Nghỉ không lương" value={r.unpaidLeaveProbation} plain />
              <Row label="Ngày công tính lương TV" value={r.probationDays} plain bold />
            </Section>
          )}

          {/* ── NGÀY CÔNG CHÍNH THỨC ── */}
          {(r.officialDays > 0 || r.unpaidLeaveOfficial > 0) && (
            <Section title="NGÀY CÔNG CHÍNH THỨC" color="emerald">
              <Row label="Nghỉ không lương" value={r.unpaidLeaveOfficial} plain />
              <Row label="Ngày công tính lương" value={r.officialDays} plain bold />
            </Section>
          )}

          {/* ── THU NHẬP THEO NGÀY CÔNG TRONG THÁNG ── */}
          <Section title="THU NHẬP THEO NGÀY CÔNG TRONG THÁNG" color="teal">
            <Row label="Lương cơ bản" value={r.proratedBaseSalary} />
            <Row label="Trợ cấp ăn trưa" value={r.totalLunchActual} />
            <Row label="Hỗ trợ Điện thoại" value={r.totalPhoneActual} />
            <Row label="Thưởng hiệu quả CV" value={r.proratedPerfBonus} />
            <TotalRow label="Tổng cộng" value={r.proratedTotal} />
          </Section>

          {/* ── THU NHẬP KHÁC (editable) ── */}
          <Section title="THU NHẬP KHÁC" color="cyan" editable>
            <EditableRow label="Hoa hồng giới thiệu ứng viên" amount={v('commission')} detail={vs('commissionDetail')} onAmountChange={(n) => setField('commission', n)} onDetailChange={(s) => setField('commissionDetail', s)} />
            <EditableRow label="Thưởng khác" amount={v('bonus')} detail={vs('bonusDetail')} onAmountChange={(n) => setField('bonus', n)} onDetailChange={(s) => setField('bonusDetail', s)} />
            <EditableRow label="Thu nhập khác" amount={v('otherIncome')} detail={vs('otherIncomeDetail')} onAmountChange={(n) => setField('otherIncome', n)} onDetailChange={(s) => setField('otherIncomeDetail', s)} />
            <EditableRow label="Trợ cấp khác" amount={v('otherAllowance')} detail={vs('otherAllowanceDetail')} onAmountChange={(n) => setField('otherAllowance', n)} onDetailChange={(s) => setField('otherAllowanceDetail', s)} />
            <TotalRow label="Tổng cộng" value={v('commission') + v('bonus') + v('otherIncome') + v('otherAllowance')} />
          </Section>

          {/* ── TỔNG THU NHẬP ── */}
          <HighlightRow label="TỔNG THU NHẬP" value={r.grossSalary} color="emerald" />

          {/* ── THU NHẬP CHỊU THUẾ ── */}
          <Row label="Thu nhập chịu thuế" value={r.taxableIncome} bold />

          {/* ── CÁC KHOẢN GIẢM TRỪ THUẾ ── */}
          <Section title="CÁC KHOẢN GIẢM TRỪ THUẾ" color="amber">
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">BH bắt buộc trừ lương</p>
            <div className="ml-3 space-y-1">
              <Row label="BHXH (8%)" value={r.siBhxh} />
              <Row label="BHYT (1.5%)" value={r.siBhyt} />
              <Row label="BHTN (1%)" value={r.siBhtn} />
              <Row label="Cộng (10.5%)" value={r.siEmployee} bold />
            </div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-3 mb-1">Giảm trừ gia cảnh</p>
            <div className="ml-3 space-y-1">
              <Row label="Giảm trừ bản thân" value={r.personalDeduction} />
              <Row label="Số người PT" value={r.dependentCount} plain />
              <Row label="Giảm trừ NPT" value={r.dependentDeduction} />
            </div>
          </Section>

          {/* ── THU NHẬP TÍNH THUẾ ── */}
          <Row label="Thu nhập tính thuế" value={r.taxAssessableIncome} bold />

          {/* ── KHOẢN TRỪ VÀO LƯƠNG ── */}
          <Section title="KHOẢN TRỪ VÀO LƯƠNG" color="rose">
            <Row label="Biểu thuế suất" value={0} plain>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.taxMethod === 'progressive' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                {r.taxMethod === 'progressive' ? 'Lũy tiến' : '10%'}
              </span>
            </Row>
            <Row label="Thuế TNCN" value={r.pit} negative />
            <Row label="BH bắt buộc (10.5%)" value={r.siEmployee} negative />
            <Row label="Đoàn phí" value={r.unionFee} sub="Cty đóng thay — không trừ NLĐ" />
            <div className="flex items-center justify-between py-1">
              <span className="text-slate-600">Truy thu sau thuế</span>
              <input
                type="number"
                className="w-36 text-right px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                value={v('retroDeduction')}
                onChange={(e) => setField('retroDeduction', Number(e.target.value) || 0)}
              />
            </div>
            <TotalRow label="Tổng cộng" value={r.totalDeduction} negative />
          </Section>

          {/* ── CỘNG THÊM SAU THUẾ ── */}
          <div className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-xl">
            <span className="font-medium text-slate-700">Cộng thêm sau thuế</span>
            <input
              type="number"
              className="w-36 text-right px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500/30"
              value={v('retroAddition')}
              onChange={(e) => setField('retroAddition', Number(e.target.value) || 0)}
            />
          </div>

          {/* ── THỰC LĨNH ── */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
            <p className="text-sm font-medium text-blue-200">THỰC LĨNH</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(r.netSalary)} VNĐ</p>
            <p className="text-xs text-blue-300 mt-2">
              = Gross ({fc(r.grossSalary)}) − Tổng trừ ({fc(r.totalDeduction)})
              {r.retroAddition > 0 ? ` + Cộng thêm (${fc(r.retroAddition)})` : ''}
            </p>
          </div>

          {/* ── CHI PHÍ CÔNG TY TRẢ ── */}
          <Section title="CHI PHÍ CÔNG TY TRẢ" color="slate">
            <Row label="BH bắt buộc (21.5%)" value={r.siEmployer} />
            <Row label="Đoàn phí (2%)" value={r.employerUnionFee} />
          </Section>

          {/* ── TỔNG CHI PHÍ CT CHI TRẢ ── */}
          <HighlightRow label="TỔNG CHI PHÍ CT CHI TRẢ" value={r.totalEmployerCost} color="slate" />

          {/* ── THÔNG TIN BỔ SUNG ── */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <InfoLine label="Tài khoản chi phí" value={r.costAccount} />
              <InfoLine label="Số tài khoản" value={r.bankAccount} />
              <InfoLine label="Ngân hàng" value={r.bankName} />
              <InfoLine label="Email" value={r.email} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoPill({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}:</span>
      {children}
    </div>
  );
}

function Section({ title, color, children, editable }: { title: string; color: string; children: React.ReactNode; editable?: boolean }) {
  const borderColors: Record<string, string> = {
    emerald: 'border-l-emerald-500', amber: 'border-l-amber-500',
    rose: 'border-l-rose-500', blue: 'border-l-blue-500', slate: 'border-l-slate-400',
    yellow: 'border-l-yellow-500', teal: 'border-l-teal-500', cyan: 'border-l-cyan-500',
  };
  return (
    <div className={`border-l-4 ${borderColors[color] || 'border-l-blue-500'} pl-4 space-y-1.5`}>
      <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
        {title}
        {editable && <span className="text-[9px] font-normal text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Có thể chỉnh sửa</span>}
      </h3>
      {children}
    </div>
  );
}

function Row({ label, value, bold, negative, plain, sub, children }: {
  label: string; value: number; bold?: boolean; negative?: boolean; plain?: boolean; sub?: string; children?: React.ReactNode;
}) {
  const display = children ?? (
    plain
      ? <span className={bold ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}>{value}</span>
      : <span className={`${bold ? 'font-bold text-slate-800' : 'font-medium text-slate-700'} ${negative ? 'text-red-600' : ''}`}>
          {negative ? fcSigned(-value) : fc(value)}
        </span>
  );

  return (
    <div className="flex items-center justify-between py-0.5">
      <div>
        <span className={bold ? 'font-semibold text-slate-800' : 'text-slate-600'}>{label}</span>
        {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
      </div>
      {display}
    </div>
  );
}

function TotalRow({ label, value, negative }: { label: string; value: number; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 pt-1.5 mt-1.5">
      <span className="font-semibold text-slate-800">{label}</span>
      <span className={`font-bold text-slate-800 ${negative ? 'text-red-600' : ''}`}>
        {negative ? fcSigned(-value) : fc(value)}
      </span>
    </div>
  );
}

function EditableRow({ label, amount, detail, onAmountChange, onDetailChange }: {
  label: string; amount: number; detail: string;
  onAmountChange: (n: number) => void; onDetailChange: (s: string) => void;
}) {
  return (
    <div className="space-y-1 py-1">
      <div className="flex items-center justify-between gap-3">
        <span className="text-slate-600 shrink-0">{label}</span>
        <input
          type="number"
          className="w-36 text-right px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          value={amount}
          onChange={(e) => onAmountChange(Number(e.target.value) || 0)}
        />
      </div>
      <input
        type="text"
        placeholder="Chi tiết..."
        className="w-full px-2 py-1 border border-slate-100 rounded-lg text-xs text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        value={detail}
        onChange={(e) => onDetailChange(e.target.value)}
      />
    </div>
  );
}

function HighlightRow({ label, value, color }: { label: string; value: number; color: string }) {
  const bgClass = color === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-800';
  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl font-bold ${bgClass}`}>
      <span>{label}</span>
      <span className="text-lg">{fc(value)}</span>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="font-medium text-slate-700">{value || '—'}</p>
    </div>
  );
}
