import { useState } from 'react';
import { CheckCircle, XCircle, Eye, Clock, Shield, AlertTriangle, ThumbsUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/payrollCalculator';
import { PayrollBatch, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '../types';

export default function Approval() {
  const { payrollBatches, approveBatch, currentUser, setPayrollBatches } = useApp();
  const [viewBatch, setViewBatch] = useState<PayrollBatch | null>(null);
  const isManager = currentUser.role === 'manager';

  const pendingBatches = payrollBatches.filter((b) => b.status === 'pending_approval');
  const approvedBatches = payrollBatches.filter((b) => b.status === 'approved');
  const draftBatches = payrollBatches.filter((b) => b.status === 'draft');

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
        <h1 className="text-2xl font-bold text-slate-800">Phê duyệt Bảng lương</h1>
        <p className="text-sm text-slate-500 mt-1">
          {isManager
            ? 'Xem xét và duyệt bảng lương do Chuyên viên C&B gửi lên'
            : 'Theo dõi trạng thái phê duyệt bảng lương'}
        </p>
      </div>

      {/* Role Notice */}
      {!isManager && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-800 flex items-start gap-2">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Bạn đang đăng nhập với vai trò Chuyên viên C&B</p>
            <p className="text-xs text-amber-600 mt-1">Chỉ Quản lý mới có quyền "Duyệt" hoặc "Từ chối" bảng lương. Nhấn "Đổi vai trò" ở góc phải trên cùng để chuyển sang vai trò Quản lý.</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatusCard
          icon={Clock}
          label="Chờ duyệt"
          count={pendingBatches.length}
          color="amber"
        />
        <StatusCard
          icon={CheckCircle}
          label="Đã duyệt"
          count={approvedBatches.length}
          color="green"
        />
        <StatusCard
          icon={Shield}
          label="Nháp"
          count={draftBatches.length}
          color="slate"
        />
      </div>

      {/* Pending Approval */}
      {pendingBatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <Clock size={18} className="text-amber-500" />
            Đang chờ duyệt ({pendingBatches.length})
          </h2>
          {pendingBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              canApprove={isManager}
              onApprove={() => approveBatch(batch.id)}
              onReject={() => handleReject(batch.id)}
              onView={() => setViewBatch(batch)}
            />
          ))}
        </div>
      )}

      {/* Approved */}
      {approvedBatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-500" />
            Đã duyệt ({approvedBatches.length})
          </h2>
          {approvedBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              canApprove={false}
              onView={() => setViewBatch(batch)}
            />
          ))}
        </div>
      )}

      {/* Draft */}
      {draftBatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
            <Shield size={18} className="text-slate-400" />
            Nháp ({draftBatches.length})
          </h2>
          {draftBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              canApprove={false}
              onView={() => setViewBatch(batch)}
            />
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

      {/* View Batch Detail Modal */}
      {viewBatch && (
        <BatchDetailModal batch={viewBatch} onClose={() => setViewBatch(null)} />
      )}
    </div>
  );
}

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
  batch,
  canApprove,
  onApprove,
  onReject,
  onView,
}: {
  batch: PayrollBatch;
  canApprove: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onView: () => void;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-slate-800">
              Kỳ lương T{batch.month}/{batch.year}
            </h3>
            <span className={`
              text-xs px-2.5 py-0.5 rounded-full font-medium
              ${batch.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                batch.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                batch.status === 'approved' ? 'bg-green-100 text-green-700' :
                'bg-blue-100 text-blue-700'}
            `}>
              {batch.status === 'draft' ? 'Nháp' :
               batch.status === 'pending_approval' ? 'Chờ duyệt' :
               batch.status === 'approved' ? 'Đã duyệt' : 'Đã chi'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400">Nhân viên</p>
              <p className="font-semibold text-slate-700">{batch.totalEmployees}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Tổng Gross</p>
              <p className="font-semibold text-emerald-600">{formatCurrency(batch.totalGross)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Tổng Net</p>
              <p className="font-semibold text-blue-600">{formatCurrency(batch.totalNet)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Người tạo</p>
              <p className="font-medium text-slate-600">{batch.createdBy}</p>
            </div>
          </div>
          {batch.approvedBy && (
            <p className="text-xs text-green-600 mt-2">
              Duyệt bởi: {batch.approvedBy} lúc {new Date(batch.approvedAt!).toLocaleString('vi-VN')}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <Eye size={14} />
            Xem
          </button>
          {canApprove && batch.status === 'pending_approval' && (
            <>
              <button
                onClick={onReject}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                <XCircle size={14} />
                Từ chối
              </button>
              <button
                onClick={onApprove}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors shadow-lg shadow-green-600/25"
              >
                <ThumbsUp size={14} />
                Duyệt
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
      <div
        className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">
            Chi tiết bảng lương T{batch.month}/{batch.year}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <XCircle size={18} />
          </button>
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
