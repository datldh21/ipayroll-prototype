import {
  Users,
  DollarSign,
  TrendingUp,
  Calculator,
  FileCheck,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/payrollCalculator';
import { EMPLOYEE_STATUS_LABELS } from '../types';

export default function Dashboard() {
  const { employees, payrollBatches } = useApp();

  const latestBatch = payrollBatches.length > 0
    ? payrollBatches[payrollBatches.length - 1]
    : null;

  // Stats
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e =>
    !['nghi_viec_ct', 'nghi_viec_tv'].includes(e.status)
  ).length;

  // Employee status distribution
  const statusCounts = employees.reduce<Record<string, number>>((acc, emp) => {
    acc[emp.status] = (acc[emp.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([status, count]) => ({
    name: EMPLOYEE_STATUS_LABELS[status as keyof typeof EMPLOYEE_STATUS_LABELS],
    value: count,
  }));

  const COLORS = ['#22c55e', '#a855f7', '#ef4444', '#3b82f6', '#eab308', '#f97316'];

  // Salary by department
  const deptData = employees.reduce<Record<string, number>>((acc, emp) => {
    acc[emp.department] = (acc[emp.department] || 0) + emp.baseSalary;
    return acc;
  }, {});

  const barData = Object.entries(deptData).map(([dept, total]) => ({
    name: dept.replace('Phòng ', ''),
    salary: total,
  }));

  const stats = [
    {
      label: 'Tổng nhân viên',
      value: totalEmployees,
      sub: `${activeEmployees} đang hoạt động`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Tổng Gross',
      value: latestBatch ? formatCurrency(latestBatch.totalGross) : '—',
      sub: latestBatch ? `T${latestBatch.month}/${latestBatch.year}` : 'Chưa có dữ liệu',
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Tổng Net',
      value: latestBatch ? formatCurrency(latestBatch.totalNet) : '—',
      sub: latestBatch ? `${latestBatch.totalEmployees} nhân viên` : 'Chưa tính lương',
      icon: TrendingUp,
      color: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
    },
    {
      label: 'Thuế TNCN',
      value: latestBatch ? formatCurrency(latestBatch.totalTax) : '—',
      sub: latestBatch ? `BHXH: ${formatCurrency(latestBatch.totalSI)}` : '—',
      icon: Calculator,
      color: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Tổng quan hệ thống tính lương iPayroll</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-800 mt-2">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon size={18} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Salary by Department */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4">Lương cơ bản theo phòng ban</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
              <Tooltip
                formatter={(value) => [formatCurrency(value as number) + ' VNĐ', 'Tổng lương']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
              />
              <Bar dataKey="salary" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart: Status distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4">Phân bố trạng thái nhân viên</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions & Recent */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4">Thao tác nhanh</h3>
          <div className="space-y-3">
            {[
              { label: 'Tính lương tháng mới', icon: Calculator, href: '/payroll', color: 'text-blue-600 bg-blue-50' },
              { label: 'Xem duyệt bảng lương', icon: FileCheck, href: '/approval', color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Gửi phiếu lương', icon: ArrowUpRight, href: '/payslip', color: 'text-violet-600 bg-violet-50' },
            ].map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-lg ${a.color} flex items-center justify-center`}>
                  <a.icon size={16} />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{a.label}</span>
                <ArrowUpRight size={14} className="ml-auto text-slate-400 group-hover:text-slate-600" />
              </a>
            ))}
          </div>
        </div>

        {/* Recent Batches */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4">Bảng lương gần đây</h3>
          {payrollBatches.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Clock size={40} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">Chưa có bảng lương nào được tạo</p>
              <p className="text-xs mt-1">Vào mục "Bảng lương" để bắt đầu tính lương</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                    <th className="pb-3 font-medium">Kỳ lương</th>
                    <th className="pb-3 font-medium">Trạng thái</th>
                    <th className="pb-3 font-medium text-right">Tổng Gross</th>
                    <th className="pb-3 font-medium text-right">Tổng Net</th>
                    <th className="pb-3 font-medium">Người tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {payrollBatches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3 font-medium text-slate-700">T{b.month}/{b.year}</td>
                      <td className="py-3">
                        <span className={`
                          text-xs px-2 py-0.5 rounded-full font-medium
                          ${b.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                            b.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                            b.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'}
                        `}>
                          {b.status === 'draft' ? 'Nháp' :
                           b.status === 'pending_approval' ? 'Chờ duyệt' :
                           b.status === 'approved' ? 'Đã duyệt' : 'Đã chi'}
                        </span>
                      </td>
                      <td className="py-3 text-right font-medium">{formatCurrency(b.totalGross)}</td>
                      <td className="py-3 text-right font-medium text-emerald-600">{formatCurrency(b.totalNet)}</td>
                      <td className="py-3 text-slate-500">{b.createdBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
