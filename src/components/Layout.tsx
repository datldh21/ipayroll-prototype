import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Shield,
  Calculator,
  CheckCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeftRight,
  Menu,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users, label: 'Nhân viên' },
  { to: '/timekeeping', icon: CalendarClock, label: 'Chấm công' },
  { to: '/social-insurance', icon: Shield, label: 'Bảo hiểm XH' },
  { to: '/payroll', icon: Calculator, label: 'Bảng lương' },
  { to: '/approval', icon: CheckCircle, label: 'Phê duyệt' },
  { to: '/payslip', icon: FileText, label: 'Phiếu lương' },
];

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentUser, switchUser } = useApp();

  const isManager = currentUser.role === 'manager';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          bg-gradient-to-b from-slate-900 to-slate-800 text-white
          flex flex-col transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[70px]' : 'w-[260px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg shadow-blue-500/30">
            iP
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg leading-none tracking-tight">iPayroll</h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Hệ thống tính lương</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium
                transition-all duration-200
                ${isActive
                  ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <item.icon size={19} className="flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User & Collapse */}
        <div className="border-t border-slate-700/50 p-3">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-3 px-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xs font-bold shadow-md">
                {currentUser.name.charAt(currentUser.name.lastIndexOf(' ') + 1)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400">
                  {isManager ? 'Quản lý' : 'Chuyên viên C&B'}
                </p>
              </div>
              <button
                onClick={switchUser}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                title="Đổi vai trò"
              >
                <ArrowLeftRight size={14} />
              </button>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex w-full items-center justify-center gap-2 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-700/50 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span>Thu gọn</span></>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 shadow-sm">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100"
          >
            <Menu size={20} className="text-slate-600" />
          </button>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Xin chào,</span>
            <span className="font-semibold text-slate-800">{currentUser.name}</span>
            <span className={`
              text-[10px] px-2 py-0.5 rounded-full font-medium
              ${isManager ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}
            `}>
              {isManager ? 'Quản lý' : 'C&B'}
            </span>
          </div>

          <button
            onClick={switchUser}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeftRight size={13} />
            <span>Đổi vai trò</span>
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
