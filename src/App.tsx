import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Timekeeping from './pages/Timekeeping';
import SocialInsurance from './pages/SocialInsurance';
import Payroll from './pages/Payroll';
import Approval from './pages/Approval';
import Payslip from './pages/Payslip';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/timekeeping" element={<Timekeeping />} />
        <Route path="/social-insurance" element={<SocialInsurance />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/approval" element={<Approval />} />
        <Route path="/payslip" element={<Payslip />} />
      </Route>
    </Routes>
  );
}
