import { useState, useMemo, useRef } from 'react';
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
  Download,
  Upload,
  Filter,
  ChevronDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from '../context/AppContext';
import { employeesService } from '../services/employees';
import { formatCurrency, formatDate } from '../utils/payrollCalculator';
import {
  Employee,
  EmployeeStatus,
  GrossPackage,
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_COLORS,
} from '../types';

// ── Org hierarchy column labels ──
const ORG_LEVEL_LABELS = ['Level 1 (Công ty)', 'Level 2 (Khối)', 'Level 3 (Phòng)', 'Level 4 (Bộ phận)', 'Level 5 (Nhóm)'] as const;
const ORG_LEVEL_KEYS: (keyof Employee)[] = ['orgLevel1', 'orgLevel2', 'orgLevel3', 'orgLevel4', 'orgLevel5'];

export default function Employees() {
  const { employees, setEmployees, grossPackage } = useApp();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterLevel2, setFilterLevel2] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showDetail, setShowDetail] = useState<Employee | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Derive unique filter options ──
  const departments = useMemo(() => [...new Set(employees.map(e => e.department))].sort(), [employees]);
  const level2s = useMemo(() => [...new Set(employees.map(e => e.orgLevel2).filter(Boolean))].sort(), [employees]);

  // ── Filtering ──
  const filtered = useMemo(() => employees.filter((e) => {
    const matchSearch = search === '' || [e.fullName, e.id, e.department, e.position, e.orgLevel2, e.orgLevel4]
      .some(f => f.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchDept = filterDept === 'all' || e.department === filterDept;
    const matchLevel2 = filterLevel2 === 'all' || e.orgLevel2 === filterLevel2;
    return matchSearch && matchStatus && matchDept && matchLevel2;
  }), [employees, search, filterStatus, filterDept, filterLevel2]);

  const getLunch = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp?.lunchAllowance ?? grossPackage.lunch;
  };
  const getPhone = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp?.phoneAllowance ?? grossPackage.phone;
  };
  const getPerfBonus = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    const base = emp?.baseSalary ?? 0;
    const lunch = getLunch(empId);
    const phone = getPhone(empId);
    return base - lunch - phone;
  };

  // ── CRUD ──
  const handleSaveEmployee = async (emp: Employee) => {
    setSaveError(null);
    setSaving(true);
    try {
      const isUpdate = employees.some((e) => e.id === emp.id);
      const saved = isUpdate
        ? await employeesService.update(emp.id, emp)
        : await employeesService.create(emp);
      setEmployees((prev) => {
        const idx = prev.findIndex((e) => e.id === saved.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = saved;
          return updated;
        }
        return [...prev, saved];
      });
      setShowModal(false);
      setEditingEmployee(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể lưu nhân viên';
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  };

  // ── Excel Export ──
  const handleExport = () => {
    const rows = employees.map(emp => ({
      'Mã NV':         emp.id,
      'Họ và tên':     emp.fullName,
      'Email':         emp.email,
      'Điện thoại':    emp.phone,
      'Level 1':       emp.orgLevel1,
      'Level 2':       emp.orgLevel2,
      'Level 3':       emp.orgLevel3,
      'Level 4':       emp.orgLevel4,
      'Level 5':       emp.orgLevel5,
      'Phòng ban':     emp.department,
      'Vị trí':        emp.position,
      'Level':         emp.level,
      'Trạng thái':    EMPLOYEE_STATUS_LABELS[emp.status],
      'Lương cơ bản':  emp.baseSalary,
      'Trợ cấp ăn trưa': getLunch(emp.id),
      'HT Điện thoại': getPhone(emp.id),
      'Trợ cấp khác (CLCV)': getPerfBonus(emp.id),
      'Người phụ thuộc': emp.dependents,
      'Ngân hàng':     emp.bankName,
      'Số TK':         emp.bankAccount,
      'Ngày onboard':  emp.onboardDate,
      'Ngày chính thức': emp.officialDate,
      'Ngày nghỉ việc': emp.lastWorkingDate,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);

    const colWidths = Object.keys(rows[0] || {}).map(k => ({
      wch: Math.max(k.length + 2, 14),
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nhân viên');
    XLSX.writeFile(wb, `NhanVien_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // ── Excel Import ──
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setImportError(null);
      setImporting(true);
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

        const statusLabelToKey = Object.fromEntries(
          Object.entries(EMPLOYEE_STATUS_LABELS).map(([k, v]) => [v, k])
        );

        const imported: Employee[] = rows.map((row, idx) => {
          const lunchVal = row['Trợ cấp ăn trưa'];
          const phoneVal = row['HT Điện thoại'];
          return {
            id:              String(row['Mã NV'] || `IMP${String(idx + 1).padStart(3, '0')}`),
            fullName:        String(row['Họ và tên'] || ''),
            email:           String(row['Email'] || ''),
            phone:           String(row['Điện thoại'] || ''),
            bankAccount:     String(row['Số TK'] || ''),
            bankName:        String(row['Ngân hàng'] || ''),
            department:      String(row['Phòng ban'] || row['Level 3'] || ''),
            position:        String(row['Vị trí'] || ''),
            level:           String(row['Level'] || ''),
            orgLevel1:       String(row['Level 1'] || ''),
            orgLevel2:       String(row['Level 2'] || ''),
            orgLevel3:       String(row['Level 3'] || ''),
            orgLevel4:       String(row['Level 4'] || ''),
            orgLevel5:       String(row['Level 5'] || ''),
            status:          (statusLabelToKey[String(row['Trạng thái'])] || 'chinh_thuc') as EmployeeStatus,
            onboardDate:     String(row['Ngày onboard'] || ''),
            officialDate:    String(row['Ngày chính thức'] || ''),
            lastWorkingDate: String(row['Ngày nghỉ việc'] || ''),
            dependents:      Number(row['Người phụ thuộc'] || 0),
            baseSalary:      Number(row['Lương cơ bản'] || 0),
            costAccount:     String(row['TK chi phí'] || '6421'),
            lunchAllowance:  lunchVal !== undefined && lunchVal !== '' && !Number.isNaN(Number(lunchVal)) ? Number(lunchVal) : undefined,
            phoneAllowance:  phoneVal !== undefined && phoneVal !== '' && !Number.isNaN(Number(phoneVal)) ? Number(phoneVal) : undefined,
          };
        });

        const saved: Employee[] = [];
        const errors: string[] = [];
        for (const imp of imported) {
          try {
            const exists = employees.some((e) => e.id === imp.id);
            const result = exists
              ? await employeesService.update(imp.id, imp)
              : await employeesService.create(imp);
            saved.push(result);
          } catch (err) {
            errors.push(`${imp.id} (${imp.fullName}): ${err instanceof Error ? err.message : 'Lỗi'}`);
          }
        }

        setEmployees((prev) => {
          const map = new Map(prev.map((e) => [e.id, e]));
          saved.forEach((s) => map.set(s.id, s));
          return Array.from(map.values());
        });

        if (errors.length > 0) {
          setImportError(`${errors.length} nhân viên lỗi: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`);
        }
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Không thể nhập Excel');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const hasActiveFilters = filterStatus !== 'all' || filterDept !== 'all' || filterLevel2 !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Nhân viên</h1>
          <p className="text-sm text-slate-500 mt-1">Dữ liệu nhân sự từ hệ thống HRIS</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
          >
            <Download size={15} />
            Xuất Excel
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            <Upload size={15} />
            {importing ? 'Đang nhập...' : 'Nhập Excel'}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
          <button
            onClick={() => { setEditingEmployee(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
          >
            <Plus size={16} />
            Thêm nhân viên
          </button>
        </div>
      </div>

      {importError && (
        <div className="px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
          {importError}
        </div>
      )}

      {/* Search + Filter toggle */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên, mã NV, phòng ban, khối..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(p => !p)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              hasActiveFilters
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Filter size={15} />
            Bộ lọc
            {hasActiveFilters && (
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                {[filterStatus, filterDept, filterLevel2].filter(f => f !== 'all').length}
              </span>
            )}
            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white min-w-[160px]"
              >
                <option value="all">Tất cả</option>
                {Object.entries(EMPLOYEE_STATUS_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Phòng ban</label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white min-w-[160px]"
              >
                <option value="all">Tất cả</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Khối</label>
              <select
                value={filterLevel2}
                onChange={(e) => setFilterLevel2(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white min-w-[160px]"
              >
                <option value="all">Tất cả</option>
                {level2s.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            {hasActiveFilters && (
              <div className="flex items-end">
                <button
                  onClick={() => { setFilterStatus('all'); setFilterDept('all'); setFilterLevel2('all'); }}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  Xoá bộ lọc
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium sticky left-0 bg-slate-50/80 z-10">Họ và tên</th>
                {ORG_LEVEL_LABELS.map((label, i) => (
                  <th key={i} className="px-4 py-3 font-medium whitespace-nowrap">{label}</th>
                ))}
                <th className="px-4 py-3 font-medium">Vị trí / Level</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">Lương CB (BHXH)</th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">TC Ăn trưa</th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">HT Điện thoại</th>
                <th className="px-4 py-3 font-medium text-right whitespace-nowrap">TC Khác (CLCV)</th>
                <th className="px-4 py-3 font-medium text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Họ và tên — sticky */}
                  <td className="px-4 py-3 sticky left-0 bg-white z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {emp.fullName.charAt(emp.fullName.lastIndexOf(' ') + 1)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{emp.fullName}</p>
                        <p className="text-xs text-slate-400">{emp.id}</p>
                      </div>
                    </div>
                  </td>
                  {/* Level 1-5 */}
                  {ORG_LEVEL_KEYS.map((key) => (
                    <td key={key} className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                      {(emp[key] as string) || '—'}
                    </td>
                  ))}
                  {/* Vị trí / Level */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="text-slate-700 text-xs">{emp.position}</p>
                    <p className="text-xs text-slate-400">{emp.level}</p>
                  </td>
                  {/* Trạng thái */}
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${EMPLOYEE_STATUS_COLORS[emp.status]}`}>
                      {EMPLOYEE_STATUS_LABELS[emp.status]}
                    </span>
                  </td>
                  {/* Lương cơ bản */}
                  <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                    {formatCurrency(emp.baseSalary)}
                  </td>
                  {/* Trợ cấp ăn trưa */}
                  <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                    {formatCurrency(getLunch(emp.id))}
                  </td>
                  {/* HT Điện thoại */}
                  <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                    {formatCurrency(getPhone(emp.id))}
                  </td>
                  {/* Trợ cấp khác (CLCV) */}
                  <td className="px-4 py-3 text-right text-slate-600 whitespace-nowrap">
                    {formatCurrency(getPerfBonus(emp.id))}
                  </td>
                  {/* Actions */}
                  <td className="px-4 py-3">
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-12 text-center text-slate-400 text-sm">
                    Không tìm thấy nhân viên nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
          Hiển thị {filtered.length} / {employees.length} nhân viên
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <DetailModal
          employee={showDetail}
          lunch={getLunch(showDetail.id)}
          phone={getPhone(showDetail.id)}
          perfBonus={getPerfBonus(showDetail.id)}
          onClose={() => setShowDetail(null)}
        />
      )}

      {/* Edit/Add Modal */}
      {showModal && (
        <EmployeeFormModal
          employee={editingEmployee}
          grossPackage={grossPackage}
          onSave={handleSaveEmployee}
          onClose={() => { setShowModal(false); setEditingEmployee(null); setSaveError(null); }}
          nextId={`EMP${String(employees.length + 1).padStart(3, '0')}`}
          saving={saving}
          saveError={saveError}
        />
      )}
    </div>
  );
}

// ── Detail Modal ──
function DetailModal({
  employee: emp,
  lunch,
  phone,
  perfBonus,
  onClose,
}: {
  employee: Employee;
  lunch: number;
  phone: number;
  perfBonus: number;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Thông tin nhân viên</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xl font-bold text-white">
              {emp.fullName.charAt(emp.fullName.lastIndexOf(' ') + 1)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{emp.fullName}</h3>
              <p className="text-sm text-slate-500">{emp.id} &middot; {emp.position}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EMPLOYEE_STATUS_COLORS[emp.status]}`}>
                {EMPLOYEE_STATUS_LABELS[emp.status]}
              </span>
            </div>
          </div>

          {/* Org hierarchy */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Cơ cấu tổ chức</p>
            {ORG_LEVEL_LABELS.map((label, i) => {
              const val = emp[ORG_LEVEL_KEYS[i]] as string;
              return val ? (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-400 w-32 shrink-0 text-xs">{label}</span>
                  <span className="font-medium text-slate-700">{val}</span>
                </div>
              ) : null;
            })}
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

          {/* Lương TV theo HĐTV */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Lương TV theo HĐTV</p>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-500 mb-1">Lương cơ bản</p>
                <p className="text-base font-bold text-blue-800">{formatCurrency(emp.baseSalary)}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-orange-500 mb-1">TC Ăn trưa</p>
                <p className="text-base font-bold text-orange-800">{formatCurrency(lunch)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-500 mb-1">Thưởng HQCV</p>
                <p className="text-base font-bold text-emerald-800">{formatCurrency(emp.baseSalary - lunch)}</p>
              </div>
            </div>
          </div>

          {/* Gói TN theo HĐLĐ */}
          <div className="bg-slate-50 rounded-xl p-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Gói TN theo HĐLĐ</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-blue-500 mb-1">Lương cơ bản</p>
                <p className="text-base font-bold text-blue-800">{formatCurrency(emp.baseSalary)}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <p className="text-xs text-orange-500 mb-1">TC Ăn trưa</p>
                <p className="text-base font-bold text-orange-800">{formatCurrency(lunch)}</p>
              </div>
              <div className="bg-violet-50 rounded-xl p-3">
                <p className="text-xs text-violet-500 mb-1">HT Điện thoại</p>
                <p className="text-base font-bold text-violet-800">{formatCurrency(phone)}</p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3">
                <p className="text-xs text-emerald-500 mb-1">Thưởng HQCV</p>
                <p className="text-base font-bold text-emerald-800">{formatCurrency(perfBonus)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

// ── Form Modal ──
function EmployeeFormModal({
  employee,
  grossPackage,
  onSave,
  onClose,
  nextId,
  saving = false,
  saveError = null,
}: {
  employee: Employee | null;
  grossPackage: GrossPackage;
  onSave: (emp: Employee) => void | Promise<void>;
  onClose: () => void;
  nextId: string;
  saving?: boolean;
  saveError?: string | null;
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
      orgLevel1: '',
      orgLevel2: '',
      orgLevel3: '',
      orgLevel4: '',
      orgLevel5: '',
      status: 'thu_viec' as EmployeeStatus,
      onboardDate: '',
      officialDate: '',
      lastWorkingDate: '',
      dependents: 0,
      baseSalary: 0,
      costAccount: '6421',
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
        <div className="p-6 space-y-5">
          {/* Basic info */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thông tin cơ bản</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Mã NV" value={form.id} disabled />
              <FormField label="Họ và tên" value={form.fullName} onChange={(v) => update('fullName', v)} />
              <FormField label="Email" value={form.email} onChange={(v) => update('email', v)} />
              <FormField label="Điện thoại" value={form.phone} onChange={(v) => update('phone', v)} />
            </div>
          </div>

          {/* Org structure */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Cơ cấu tổ chức</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Level 1 (Công ty)" value={form.orgLevel1} onChange={(v) => update('orgLevel1', v)} />
              <FormField label="Level 2 (Khối)" value={form.orgLevel2} onChange={(v) => update('orgLevel2', v)} />
              <FormField label="Level 3 (Phòng)" value={form.orgLevel3} onChange={(v) => update('orgLevel3', v)} />
              <FormField label="Level 4 (Bộ phận)" value={form.orgLevel4} onChange={(v) => update('orgLevel4', v)} />
              <FormField label="Level 5 (Nhóm)" value={form.orgLevel5} onChange={(v) => update('orgLevel5', v)} />
              <FormField label="Phòng ban" value={form.department} onChange={(v) => update('department', v)} />
              <FormField label="Vị trí" value={form.position} onChange={(v) => update('position', v)} />
              <FormField label="Level" value={form.level} onChange={(v) => update('level', v)} />
            </div>
          </div>

          {/* Status & dates */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Trạng thái & Ngày tháng</p>
            <div className="grid grid-cols-2 gap-4">
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
              <FormField label="Ngày onboard" type="date" value={form.onboardDate} onChange={(v) => update('onboardDate', v)} />
              <FormField label="Ngày chính thức" type="date" value={form.officialDate} onChange={(v) => update('officialDate', v)} />
              <FormField label="Ngày nghỉ việc" type="date" value={form.lastWorkingDate} onChange={(v) => update('lastWorkingDate', v)} />
            </div>
          </div>

          {/* Salary & bank */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Lương & Ngân hàng</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Lương cơ bản" type="number" value={String(form.baseSalary)} onChange={(v) => update('baseSalary', Number(v))} />
              <FormField label="Số người phụ thuộc" type="number" value={String(form.dependents)} onChange={(v) => update('dependents', Number(v))} />
              <FormField label="Ngân hàng" value={form.bankName} onChange={(v) => update('bankName', v)} />
              <FormField label="Số tài khoản" value={form.bankAccount} onChange={(v) => update('bankAccount', v)} />
            </div>
          </div>

          {/* Gói lương (Lương TV theo HĐTV, Gói TN theo HĐLĐ) */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Gói lương theo nhân viên</p>
            <p className="text-xs text-slate-500 mb-3">
              Để trống = dùng mặc định công ty (TC ăn trưa: {formatCurrency(grossPackage.lunch)}, HT ĐT: {formatCurrency(grossPackage.phone)})
            </p>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="TC Ăn trưa"
                type="number"
                value={form.lunchAllowance !== undefined && form.lunchAllowance !== null ? String(form.lunchAllowance) : ''}
                onChange={(v) => update('lunchAllowance', v === '' ? undefined : Number(v))}
              />
              <FormField
                label="HT Điện thoại"
                type="number"
                value={form.phoneAllowance !== undefined && form.phoneAllowance !== null ? String(form.phoneAllowance) : ''}
                onChange={(v) => update('phoneAllowance', v === '' ? undefined : Number(v))}
              />
            </div>
          </div>
        </div>
        {saveError && (
          <div className="mx-6 mb-2 px-4 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
            {saveError}
          </div>
        )}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="px-6 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25 disabled:opacity-50"
          >
            {saving ? 'Đang lưu...' : employee ? 'Cập nhật' : 'Thêm mới'}
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
