import { useState } from 'react';
import {
  Users,
  DollarSign,
  Calculator,
  FileCheck,
  ArrowUpRight,
  Utensils,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency } from '../utils/payrollCalculator';

type DeptPeriod = 'month' | 'quarter' | 'half' | 'year';

const DEPT_PERIOD_LABELS: Record<DeptPeriod, string> = {
  month: 'Tháng',
  quarter: 'Quý',
  half: '6 tháng',
  year: 'Năm',
};

const DEPT_PERIOD_MONTHS: Record<DeptPeriod, number> = {
  month: 1,
  quarter: 3,
  half: 6,
  year: 12,
};

export default function Dashboard() {
  const { employees, payrollBatches } = useApp();
  const [deptPeriod, setDeptPeriod] = useState<DeptPeriod>('month');

  const latestBatch = payrollBatches.length > 0
    ? payrollBatches[payrollBatches.length - 1]
    : null;

  // ── Stats ──
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e =>
    !['nghi_viec_ct', 'nghi_viec_tv'].includes(e.status)
  ).length;

  const totalLunch = latestBatch
    ? latestBatch.records.reduce((s, r) => s + r.totalLunchActual, 0)
    : 0;
  const totalSalaryNoLunch = latestBatch ? latestBatch.totalGross - totalLunch : 0;
  const totalBHXH = latestBatch
    ? latestBatch.records.reduce((s, r) => s + r.siEmployee, 0)
    : 0;

  const stats = [
    {
      label: 'Tổng nhân viên',
      value: String(totalEmployees),
      sub: `${activeEmployees} đang hoạt động`,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'Tổng lương',
      value: latestBatch ? formatCurrency(totalSalaryNoLunch) : '—',
      sub: latestBatch ? `T${latestBatch.month}/${latestBatch.year} · không tính ăn trưa` : 'Chưa có dữ liệu',
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'Trợ cấp ăn trưa',
      value: latestBatch ? formatCurrency(totalLunch) : '—',
      sub: latestBatch ? `${latestBatch.totalEmployees} nhân viên` : '—',
      icon: Utensils,
      color: 'from-orange-500 to-orange-600',
    },
    {
      label: 'Bảo hiểm xã hội',
      value: latestBatch ? formatCurrency(totalBHXH) : '—',
      sub: 'Phần NLĐ đóng (10.5%)',
      icon: ShieldCheck,
      color: 'from-violet-500 to-violet-600',
    },
    {
      label: 'Thuế TNCN',
      value: latestBatch ? formatCurrency(latestBatch.totalTax) : '—',
      sub: latestBatch ? `T${latestBatch.month}/${latestBatch.year}` : '—',
      icon: Calculator,
      color: 'from-amber-500 to-amber-600',
    },
  ];

  // ── Dept bar chart (period-filtered) ──
  const sortedBatches = [...payrollBatches].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );
  const periodBatches = sortedBatches.slice(-DEPT_PERIOD_MONTHS[deptPeriod]);
  const deptBarData = (() => {
    const map: Record<string, number> = {};
    periodBatches.forEach(batch => {
      batch.records.forEach(r => {
        map[r.department] = (map[r.department] || 0) + r.grossSalary;
      });
    });
    return Object.entries(map).map(([dept, total]) => ({
      name: dept.replace('Phòng ', ''),
      salary: total,
    }));
  })();

  // ── Cost structure pie chart ──
  const COST_COLORS = ['#3b82f6', '#a855f7', '#f97316', '#22c55e', '#eab308'];
  const costStructureData = latestBatch ? (() => {
    const recs = latestBatch.records;
    const luong  = recs.reduce((s, r) => s + r.officialBaseSalary + r.probationBaseSalary, 0);
    const bhxh   = recs.reduce((s, r) => s + r.siBhxh, 0);
    const trocap = recs.reduce((s, r) => s + r.totalLunchActual + r.totalPhoneActual + r.otherAllowance, 0);
    const thuong = recs.reduce((s, r) => s + r.bonus + r.commission, 0);
    const congdoan = recs.reduce((s, r) => s + r.employerUnionFee, 0);
    return [
      { name: 'Lương',        value: luong    },
      { name: 'BHXH (8%)',    value: bhxh     },
      { name: 'Trợ cấp',      value: trocap   },
      { name: 'Thưởng',       value: thuong   },
      { name: 'Công đoàn',    value: congdoan },
    ].filter(d => d.value > 0);
  })() : [];

  // ── Monthly trend data ──
  const monthlyTrendData = sortedBatches.map(b => ({
    name: `T${b.month}/${b.year}`,
    gross: b.totalGross,
    net: b.totalNet,
    employerCost: b.totalEmployerCost,
  }));

  const emptyChart = (
    <div className="flex items-center justify-center h-56 text-slate-400">
      <p className="text-sm">Chưa có dữ liệu lương</p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Tổng quan hệ thống tính lương iPayroll</p>
      </div>

      {/* Stats — 5 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{stat.label}</p>
                <p className="text-lg font-bold text-slate-800 mt-2 leading-tight truncate">{stat.value}</p>
                <p className="text-xs text-slate-400 mt-1 truncate">{stat.sub}</p>
              </div>
              <div className={`w-10 h-10 shrink-0 rounded-xl bg-linear-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon size={18} className="text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row: Dept bar + Cost structure pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart — salary by dept with period filter */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-4 gap-3">
            <h3 className="font-semibold text-slate-700 shrink-0">Phân bổ lương theo phòng ban</h3>
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {(Object.keys(DEPT_PERIOD_LABELS) as DeptPeriod[]).map(p => (
                <button
                  key={p}
                  onClick={() => setDeptPeriod(p)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    deptPeriod === p
                      ? 'bg-white text-blue-600 font-semibold shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {DEPT_PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
          {deptBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={deptBarData}>
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
          ) : emptyChart}
        </div>

        {/* Pie chart — cost structure */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4">Cơ cấu chi phí lương</h3>
          {costStructureData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={costStructureData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {costStructureData.map((_, i) => (
                    <Cell key={i} fill={COST_COLORS[i % COST_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number) + ' VNĐ', '']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : emptyChart}
        </div>
      </div>

      {/* Bottom row: Quick Actions + 2 monthly trend charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4">Thao tác nhanh</h3>
          <div className="space-y-3">
            {[
              { label: 'Tính lương tháng mới',  icon: Calculator,   href: '/payroll',   color: 'text-blue-600 bg-blue-50'    },
              { label: 'Xem duyệt bảng lương',   icon: FileCheck,    href: '/approval',  color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Gửi phiếu lương',         icon: ArrowUpRight, href: '/payslip',   color: 'text-violet-600 bg-violet-50' },
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

        {/* Chi phí lương theo tháng */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-4">Chi phí lương theo tháng</h3>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number) + ' VNĐ', 'Tổng Gross']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="gross" name="Chi phí lương" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : emptyChart}
        </div>

        {/* Thực lĩnh và chi phí nhân viên theo tháng */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-700 mb-3">Thực lĩnh &amp; chi phí nhân viên</h3>
          {monthlyTrendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                <Tooltip
                  formatter={(value, name) => [
                    formatCurrency(value as number) + ' VNĐ',
                    name === 'net' ? 'Thực lĩnh' : 'Chi phí NV',
                  ]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend
                  formatter={(value) => value === 'net' ? 'Thực lĩnh' : 'Chi phí NV'}
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="net" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="employerCost" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : emptyChart}
        </div>
      </div>
    </div>
  );
}
