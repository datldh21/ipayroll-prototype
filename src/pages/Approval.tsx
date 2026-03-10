import { useState } from 'react';
import {
  CheckCircle, XCircle, Eye, Clock, Shield, AlertTriangle, ThumbsUp,
  MessageSquarePlus, Send, MessageCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/payrollCalculator';
import {
  PayrollBatch, Proposal, ProposalType, ProposalStatus,
  EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS,
  PROPOSAL_TYPE_LABELS, PROPOSAL_STATUS_LABELS, PROPOSAL_STATUS_COLORS,
} from '../types';

type Tab = 'approval' | 'proposals';

export default function Approval() {
  const { payrollBatches, approveBatch, currentUser, setPayrollBatches, proposals, addProposal, respondProposal, employees } = useApp();
  const [tab, setTab] = useState<Tab>('approval');
  const [viewBatch, setViewBatch] = useState<PayrollBatch | null>(null);
  const isManager = currentUser.role === 'manager';

  const pendingBatches = payrollBatches.filter((b) => b.status === 'pending_approval');
  const approvedBatches = payrollBatches.filter((b) => b.status === 'approved');
  const draftBatches = payrollBatches.filter((b) => b.status === 'draft');

  const pendingProposals = proposals.filter(p => p.status === 'pending' || p.status === 'processing');

  const handleReject = (batchId: string) => {
    setPayrollBatches((prev) =>
      prev.map((b) =>
        b.id === batchId ? { ...b, status: 'draft' as const } : b
      )
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Phê duyệt &amp; Đề xuất</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isManager
            ? 'Duyệt bảng lương và xem đề xuất từ nhân viên'
            : 'Gửi duyệt bảng lương và quản lý đề xuất chỉnh sửa'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('approval')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'approval'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Shield size={15} />
          Phê duyệt bảng lương
          {pendingBatches.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center">
              {pendingBatches.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('proposals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            tab === 'proposals'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <MessageSquarePlus size={15} />
          Đề xuất chỉnh sửa
          {pendingProposals.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center">
              {pendingProposals.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab: Phê duyệt */}
      {tab === 'approval' && (
        <div className="space-y-6">
          {!isManager && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Bạn đang đăng nhập với vai trò Chuyên viên C&B</p>
                <p className="text-xs text-amber-600 mt-1">Chỉ Quản lý mới có quyền "Duyệt" hoặc "Từ chối". Nhấn "Đổi vai trò" ở góc phải trên cùng.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatusCard icon={Clock} label="Chờ duyệt" count={pendingBatches.length} color="amber" />
            <StatusCard icon={CheckCircle} label="Đã duyệt" count={approvedBatches.length} color="green" />
            <StatusCard icon={Shield} label="Nháp" count={draftBatches.length} color="slate" />
          </div>

          {pendingBatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <Clock size={18} className="text-amber-500" /> Đang chờ duyệt ({pendingBatches.length})
              </h2>
              {pendingBatches.map((batch) => (
                <BatchCard key={batch.id} batch={batch} canApprove={isManager}
                  onApprove={() => approveBatch(batch.id)}
                  onReject={() => handleReject(batch.id)}
                  onView={() => setViewBatch(batch)} />
              ))}
            </div>
          )}

          {approvedBatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-500" /> Đã duyệt ({approvedBatches.length})
              </h2>
              {approvedBatches.map((batch) => (
                <BatchCard key={batch.id} batch={batch} canApprove={false} onView={() => setViewBatch(batch)} />
              ))}
            </div>
          )}

          {draftBatches.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                <Shield size={18} className="text-slate-400" /> Nháp ({draftBatches.length})
              </h2>
              {draftBatches.map((batch) => (
                <BatchCard key={batch.id} batch={batch} canApprove={false} onView={() => setViewBatch(batch)} />
              ))}
            </div>
          )}

          {payrollBatches.length === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
              <CheckCircle size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">Chưa có bảng lương</h3>
              <p className="text-sm text-slate-400">Vào mục "Bảng lương" để tạo và gửi duyệt</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Đề xuất */}
      {tab === 'proposals' && (
        <ProposalsTab
          proposals={proposals}
          employees={employees}
          currentUser={currentUser}
          addProposal={addProposal}
          respondProposal={respondProposal}
        />
      )}

      {viewBatch && <BatchDetailModal batch={viewBatch} onClose={() => setViewBatch(null)} />}
    </div>
  );
}

// ══════════════════════════════════════════
// PROPOSALS TAB
// ══════════════════════════════════════════

function ProposalsTab({
  proposals,
  employees,
  currentUser,
  addProposal,
  respondProposal,
}: {
  proposals: Proposal[];
  employees: { id: string; fullName: string; department: string }[];
  currentUser: { name: string; role: string };
  addProposal: (p: Omit<Proposal, 'id' | 'createdAt' | 'status'>) => void;
  respondProposal: (id: string, status: ProposalStatus, response: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<ProposalStatus>('resolved');

  // New proposal form state
  const [formEmpId, setFormEmpId] = useState('');
  const [formType, setFormType] = useState<ProposalType>('timekeeping');
  const [formMonth, setFormMonth] = useState(2);
  const [formYear, setFormYear] = useState(2026);
  const [formSubject, setFormSubject] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const isCB = currentUser.role === 'cb_specialist';

  const filtered = proposals.filter(p => filterStatus === 'all' || p.status === filterStatus);

  const handleSubmitProposal = () => {
    const emp = employees.find(e => e.id === formEmpId);
    if (!emp || !formSubject.trim()) return;
    addProposal({
      employeeId: emp.id,
      employeeName: emp.fullName,
      department: emp.department,
      type: formType,
      month: formMonth,
      year: formYear,
      subject: formSubject,
      description: formDesc,
    });
    setFormEmpId('');
    setFormSubject('');
    setFormDesc('');
    setShowForm(false);
  };

  const handleRespond = (id: string) => {
    if (!responseText.trim()) return;
    respondProposal(id, responseStatus, responseText);
    setResponseText('');
    setExpandedId(null);
  };

  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const processingCount = proposals.filter(p => p.status === 'processing').length;

  return (
    <div className="space-y-6">
      {/* Summary + New button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="text-slate-500">
              Tổng: <strong className="text-slate-800">{proposals.length}</strong> đề xuất
            </span>
            {pendingCount > 0 && (
              <span className="flex items-center gap-1.5 text-amber-600">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                {pendingCount} chờ xử lý
              </span>
            )}
            {processingCount > 0 && (
              <span className="text-blue-600">{processingCount} đang xử lý</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(PROPOSAL_STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            onClick={() => setShowForm(p => !p)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
          >
            <MessageSquarePlus size={16} />
            Tạo đề xuất
          </button>
        </div>
      </div>

      {/* New Proposal Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-blue-200 p-6 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <MessageSquarePlus size={18} className="text-blue-500" />
            Tạo đề xuất chỉnh sửa mới
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nhân viên</label>
              <select value={formEmpId} onChange={e => setFormEmpId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="">— Chọn NV —</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.fullName} ({e.id})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Loại</label>
              <select value={formType} onChange={e => setFormType(e.target.value as ProposalType)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option value="timekeeping">Bảng công</option>
                <option value="payroll">Bảng lương</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Tháng</label>
              <select value={formMonth} onChange={e => setFormMonth(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Năm</label>
              <select value={formYear} onChange={e => setFormYear(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                {[2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tiêu đề</label>
            <input value={formSubject} onChange={e => setFormSubject(e.target.value)}
              placeholder="Ví dụ: Thiếu ngày công tháng 2"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Mô tả chi tiết</label>
            <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={3}
              placeholder="Mô tả chi tiết vấn đề cần chỉnh sửa..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Hủy
            </button>
            <button onClick={handleSubmitProposal} disabled={!formEmpId || !formSubject.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25 disabled:opacity-50 disabled:cursor-not-allowed">
              <Send size={15} />
              Gửi đề xuất
            </button>
          </div>
        </div>
      )}

      {/* Proposals list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <MessageCircle size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Chưa có đề xuất nào</p>
          </div>
        )}

        {filtered.map(p => {
          const isExpanded = expandedId === p.id;
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Header */}
              <div
                className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : p.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    p.type === 'timekeeping' ? 'bg-cyan-50 text-cyan-600' : 'bg-violet-50 text-violet-600'
                  }`}>
                    <MessageCircle size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-semibold text-slate-800">{p.subject}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${PROPOSAL_STATUS_COLORS[p.status]}`}>
                        {PROPOSAL_STATUS_LABELS[p.status]}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        p.type === 'timekeeping' ? 'bg-cyan-100 text-cyan-700' : 'bg-violet-100 text-violet-700'
                      }`}>
                        {PROPOSAL_TYPE_LABELS[p.type]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="font-medium text-slate-700">{p.employeeName}</span>
                      <span>{p.department}</span>
                      <span>T{p.month}/{p.year}</span>
                      <span>{new Date(p.createdAt).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-slate-400">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-5 space-y-4">
                  {/* Description */}
                  <div className="bg-slate-50 rounded-xl p-4">
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Nội dung đề xuất</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{p.description}</p>
                  </div>

                  {/* Response (if exists) */}
                  {p.response && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-xs font-medium text-blue-600">Phản hồi từ {p.respondedBy}</p>
                        {p.respondedAt && (
                          <span className="text-[10px] text-blue-400">
                            {new Date(p.respondedAt).toLocaleString('vi-VN')}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">{p.response}</p>
                    </div>
                  )}

                  {/* Response form (for C&B / Manager, only on pending/processing) */}
                  {(p.status === 'pending' || p.status === 'processing') && isCB && (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Phản hồi đề xuất</p>
                      <textarea
                        value={expandedId === p.id ? responseText : ''}
                        onChange={e => setResponseText(e.target.value)}
                        rows={2}
                        placeholder="Nhập phản hồi cho nhân viên..."
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <select
                          value={responseStatus}
                          onChange={e => setResponseStatus(e.target.value as ProposalStatus)}
                          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="processing">Đang xử lý</option>
                          <option value="resolved">Đã xử lý</option>
                          <option value="rejected">Từ chối</option>
                        </select>
                        <button
                          onClick={() => handleRespond(p.id)}
                          disabled={!responseText.trim()}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Send size={14} />
                          Gửi phản hồi
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// SHARED COMPONENTS (giữ nguyên)
// ══════════════════════════════════════════

function StatusCard({ icon: Icon, label, count, color }: { icon: any; label: string; count: number; color: string }) {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
    green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-500' },
    slate: { bg: 'bg-slate-50', text: 'text-slate-700', icon: 'text-slate-400' },
  };
  const c = colorMap[color] || colorMap.slate;
  return (
    <div className={`${c.bg} rounded-2xl p-5 border border-slate-100`}>
      <div className="flex items-center gap-3">
        <Icon size={20} className={c.icon} />
        <div>
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className={`text-2xl font-bold ${c.text}`}>{count}</p>
        </div>
      </div>
    </div>
  );
}

function BatchCard({
  batch, canApprove, onApprove, onReject, onView,
}: {
  batch: PayrollBatch; canApprove: boolean;
  onApprove?: () => void; onReject?: () => void; onView: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-slate-800">Kỳ lương T{batch.month}/{batch.year}</h3>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium
              ${batch.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                batch.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                batch.status === 'approved' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'}`}>
              {batch.status === 'draft' ? 'Nháp' :
               batch.status === 'pending_approval' ? 'Chờ duyệt' :
               batch.status === 'approved' ? 'Đã duyệt' : 'Đã chi'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><p className="text-xs text-slate-400">Nhân viên</p><p className="font-semibold text-slate-700">{batch.totalEmployees}</p></div>
            <div><p className="text-xs text-slate-400">Tổng Gross</p><p className="font-semibold text-emerald-600">{formatCurrency(batch.totalGross)}</p></div>
            <div><p className="text-xs text-slate-400">Tổng Net</p><p className="font-semibold text-blue-600">{formatCurrency(batch.totalNet)}</p></div>
            <div><p className="text-xs text-slate-400">Người tạo</p><p className="font-medium text-slate-600">{batch.createdBy}</p></div>
          </div>
          {batch.approvedBy && (
            <p className="text-xs text-green-600 mt-2">
              Duyệt bởi: {batch.approvedBy} lúc {new Date(batch.approvedAt!).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onView}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors">
            <Eye size={14} /> Xem
          </button>
          {canApprove && batch.status === 'pending_approval' && (
            <>
              <button onClick={onReject}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                <XCircle size={14} /> Từ chối
              </button>
              <button onClick={onApprove}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25">
                <ThumbsUp size={14} /> Duyệt
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BatchDetailModal({ batch, onClose }: { batch: PayrollBatch; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">Chi tiết bảng lương T{batch.month}/{batch.year}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><XCircle size={18} /></button>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                  <th className="px-3 py-3 font-medium">Mã NV</th>
                  <th className="px-3 py-3 font-medium">Họ và tên</th>
                  <th className="px-3 py-3 font-medium">Trạng thái</th>
                  <th className="px-3 py-3 font-medium text-right">Gross</th>
                  <th className="px-3 py-3 font-medium text-right">BHXH</th>
                  <th className="px-3 py-3 font-medium text-right">Thuế</th>
                  <th className="px-3 py-3 font-medium text-right">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batch.records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-mono text-xs text-slate-500">{r.employeeId}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{r.employeeName}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[r.status]}`}>
                        {EMPLOYEE_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">{formatCurrency(r.grossSalary)}</td>
                    <td className="px-3 py-2.5 text-right text-red-600">{formatCurrency(r.siEmployee)}</td>
                    <td className="px-3 py-2.5 text-right text-red-600">{formatCurrency(r.pit)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-blue-700">{formatCurrency(r.netSalary)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
