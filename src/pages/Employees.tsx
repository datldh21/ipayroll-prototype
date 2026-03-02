import { useState } from 'react';
import {
  Search,
  Plus,
  Edit3,
  Eye,
  X,
  User,
  Building2,
  CreditCard,
  Calendar,
  Users as UsersIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatDate } from '../utils/payrollCalculator';
import {
  Employee,
  EmployeeStatus,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_COLORS,
} from '../types';

export default function Employees() {
  const { employees, setEmployees } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showDetail, setShowDetail] = useState<Employee | null>(null);

  const filtered = employees.filter((e) => {
    const matchSearch = e.fullName.toLowerCase().includes(search.toLowerCase())
      || e.id.toLowerCase().includes(search.toLowerCase())
      || e.department.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSaveEmployee = (emp: Employee) => {
    setEmployees((prev) => {
      const idx = prev.findIndex((e) => e.id === emp.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = emp;
        return updated;
      }
      return [...prev, emp];
    });
    setShowModal(false);
    setEditingEmployee(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Nhân viên</h1>
          <p className="text-sm text-slate-500 mt-1">Dữ liệu nhân sự từ hệ thống HRIS</p>
        </div>
        <button
          onClick={() => { setEditingEmployee(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
        >
          <Plus size={16} />
          Thêm nhân viên
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, mã NV, phòng ban..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(EMPLOYEE_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3.5 font-medium">Mã NV</th>
                <th className="px-5 py-3.5 font-medium">Họ và tên</th>
                <th className="px-5 py-3.5 font-medium">Phòng ban</th>
                <th className="px-5 py-3.5 font-medium">Vị trí / Level</th>
                <th className="px-5 py-3.5 font-medium">Trạng thái</th>
                <th className="px-5 py-3.5 font-medium text-right">Lương cơ bản</th>
                <th className="px-5 py-3.5 font-medium">NPT</th>
                <th className="px-5 py-3.5 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{emp.id}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white">
                        {emp.fullName.charAt(emp.fullName.lastIndexOf(' ') + 1)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{emp.fullName}</p>
                        <p className="text-xs text-slate-400">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{emp.department}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-slate-700">{emp.position}</p>
                    <p className="text-xs text-slate-400">{emp.level}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[emp.status]}`}>
                      {EMPLOYEE_STATUS_LABELS[emp.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-slate-700">
                    {formatCurrency(emp.baseSalary)}
                  </td>
                  <td className="px-5 py-3.5 text-center text-slate-600">{emp.dependents}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setShowDetail(emp)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => { setEditingEmployee(emp); setShowModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit3 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          Hiển thị {filtered.length} / {employees.length} nhân viên
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <DetailModal employee={showDetail} onClose={() => setShowDetail(null)} />
      )}

      {/* Edit/Add Modal */}
      {showModal && (
        <EmployeeFormModal
          employee={editingEmployee}
          onSave={handleSaveEmployee}
          onClose={() => { setShowModal(false); setEditingEmployee(null); }}
          nextId={`EMP${String(employees.length + 1).padStart(3, '0')}`}
        />
      )}
    </div>
  );
}

function DetailModal({ employee: emp, onClose }: { employee: Employee; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Thông tin nhân viên</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl font-bold text-white">
              {emp.fullName.charAt(emp.fullName.lastIndexOf(' ') + 1)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{emp.fullName}</h3>
              <p className="text-sm text-slate-500">{emp.id} • {emp.position}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[emp.status]}`}>
                {EMPLOYEE_STATUS_LABELS[emp.status]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoItem icon={Building2} label="Phòng ban" value={emp.department} />
            <InfoItem icon={User} label="Level" value={emp.level} />
            <InfoItem icon={CreditCard} label="Ngân hàng" value={`${emp.bankName} - ${emp.bankAccount}`} />
            <InfoItem icon={UsersIcon} label="Người phụ thuộc" value={String(emp.dependents)} />
            <InfoItem icon={Calendar} label="Ngày onboard" value={formatDate(emp.onboardDate)} />
            <InfoItem icon={Calendar} label="Ngày chính thức" value={formatDate(emp.officialDate)} />
            {emp.lastWorkingDate && (
              <InfoItem icon={Calendar} label="Ngày nghỉ việc" value={formatDate(emp.lastWorkingDate)} />
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">Lương cơ bản</p>
            <p className="text-xl font-bold text-slate-800">{formatCurrency(emp.baseSalary)} VNĐ</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function EmployeeFormModal({
  employee,
  onSave,
  onClose,
  nextId,
}: {
  employee: Employee | null;
  onSave: (emp: Employee) => void;
  onClose: () => void;
  nextId: string;
}) {
  const [form, setForm] = useState<Employee>(
    employee || {
      id: nextId,
      fullName: '',
      email: '',
      phone: '',
      bankAccount: '',
      bankName: '',
      department: '',
      position: '',
      level: '',
      status: 'thu_viec' as EmployeeStatus,
      onboardDate: '',
      officialDate: '',
      lastWorkingDate: '',
      dependents: 0,
      baseSalary: 0,
    }
  );

  const update = (field: keyof Employee, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-slate-800">
            {employee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Mã NV" value={form.id} disabled />
            <FormField label="Họ và tên" value={form.fullName} onChange={(v) => update('fullName', v)} />
            <FormField label="Email" value={form.email} onChange={(v) => update('email', v)} />
            <FormField label="Điện thoại" value={form.phone} onChange={(v) => update('phone', v)} />
            <FormField label="Phòng ban" value={form.department} onChange={(v) => update('department', v)} />
            <FormField label="Vị trí" value={form.position} onChange={(v) => update('position', v)} />
            <FormField label="Level" value={form.level} onChange={(v) => update('level', v)} />
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => update('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {Object.entries(EMPLOYEE_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <FormField label="Ngân hàng" value={form.bankName} onChange={(v) => update('bankName', v)} />
            <FormField label="Số tài khoản" value={form.bankAccount} onChange={(v) => update('bankAccount', v)} />
            <FormField label="Ngày onboard" type="date" value={form.onboardDate} onChange={(v) => update('onboardDate', v)} />
            <FormField label="Ngày chính thức" type="date" value={form.officialDate} onChange={(v) => update('officialDate', v)} />
            <FormField label="Ngày nghỉ việc" type="date" value={form.lastWorkingDate} onChange={(v) => update('lastWorkingDate', v)} />
            <FormField label="Số người phụ thuộc" type="number" value={String(form.dependents)} onChange={(v) => update('dependents', Number(v))} />
            <FormField label="Lương cơ bản" type="number" value={String(form.baseSalary)} onChange={(v) => update('baseSalary', Number(v))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            className="px-6 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
          >
            {employee ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  disabled = false,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  );
}
