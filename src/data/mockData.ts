import {
  Employee, Timekeeping, SocialInsurance, VariableIncome, GrossPackage,
  PayrollBatch, PayrollRecord, Proposal,
  SI_BHXH_RATE, SI_BHYT_RATE, SI_BHTN_RATE, SI_RATE_EMPLOYEE,
  SI_BHXH_EMPLOYER_RATE, SI_BHYT_EMPLOYER_RATE, SI_BHTN_EMPLOYER_RATE, SI_RATE_EMPLOYER,
  UNION_FEE_RATE, SI_MIN_BASE,
} from '../types';
import { calculatePayrollRecord } from '../utils/payrollCalculator';

// ═══ GÓI THU NHẬP THEO HỢP ĐỒNG (mặc định) ═══
// Mỗi khoản sẽ được prorate theo (khoản / công chuẩn) * số ngày thực tế
export const defaultGrossPackage: GrossPackage = {
  baseSalary: 0,            // Sẽ lấy từ Employee.baseSalary
  lunch: 730_000,           // Trợ cấp ăn trưa
  phone: 500_000,           // Hỗ trợ điện thoại
  performanceBonus: 0,      // Thưởng hiệu quả CV (cấu hình theo NV)
  otherPackage: 0,          // Trợ cấp khác trong gói HĐ
};

export const mockEmployees: Employee[] = [
  {
    id: 'EMP001',
    fullName: 'Nguyễn Văn An',
    email: 'an.nguyen@company.vn',
    phone: '0901234567',
    bankAccount: '1234567890',
    bankName: 'Vietcombank',
    department: 'Phòng Kinh doanh',
    position: 'Chuyên viên Kinh doanh',
    level: 'Senior',
    orgLevel1: 'Công ty ABC',
    orgLevel2: 'Khối Kinh doanh',
    orgLevel3: 'Phòng Kinh doanh',
    orgLevel4: 'BP Khách hàng DN',
    orgLevel5: 'Nhóm KD Miền Nam',
    status: 'chinh_thuc',
    onboardDate: '2022-03-01',
    officialDate: '2022-05-01',
    lastWorkingDate: '',
    dependents: 2,
    baseSalary: 25_000_000,
  },
  {
    id: 'EMP002',
    fullName: 'Trần Thị Bích',
    email: 'bich.tran@company.vn',
    phone: '0901234568',
    bankAccount: '2345678901',
    bankName: 'Techcombank',
    department: 'Phòng Marketing',
    position: 'Trưởng phòng Marketing',
    level: 'Manager',
    orgLevel1: 'Công ty ABC',
    orgLevel2: 'Khối Kinh doanh',
    orgLevel3: 'Phòng Marketing',
    orgLevel4: 'BP Truyền thông',
    orgLevel5: 'Nhóm Digital',
    status: 'chinh_thuc',
    onboardDate: '2021-06-15',
    officialDate: '2021-08-15',
    lastWorkingDate: '',
    dependents: 1,
    baseSalary: 35_000_000,
  },
  {
    id: 'EMP003',
    fullName: 'Lê Hoàng Cường',
    email: 'cuong.le@company.vn',
    phone: '0901234569',
    bankAccount: '3456789012',
    bankName: 'BIDV',
    department: 'Phòng Kỹ thuật',
    position: 'Lập trình viên',
    level: 'Junior',
    orgLevel1: 'Công ty ABC',
    orgLevel2: 'Khối Công nghệ',
    orgLevel3: 'Phòng Kỹ thuật',
    orgLevel4: 'BP Phát triển SP',
    orgLevel5: 'Nhóm Backend',
    status: 'thu_viec',
    onboardDate: '2026-01-10',
    officialDate: '',
    lastWorkingDate: '',
    dependents: 0,
    baseSalary: 15_000_000,
  },
  {
    id: 'EMP004',
    fullName: 'Phạm Minh Dũng',
    email: 'dung.pham@company.vn',
    phone: '0901234570',
    bankAccount: '4567890123',
    bankName: 'ACB',
    department: 'Phòng Kỹ thuật',
    position: 'Kỹ sư DevOps',
    level: 'Mid',
    orgLevel1: 'Công ty ABC',
    orgLevel2: 'Khối Công nghệ',
    orgLevel3: 'Phòng Kỹ thuật',
    orgLevel4: 'BP Hạ tầng',
    orgLevel5: 'Nhóm DevOps',
    status: 'het_thu_viec',
    onboardDate: '2025-11-10',
    officialDate: '2026-02-10',
    lastWorkingDate: '',
    dependents: 0,
    baseSalary: 20_000_000,
  },
  {
    id: 'EMP005',
    fullName: 'Hoàng Thị Lan',
    email: 'lan.hoang@company.vn',
    phone: '0901234571',
    bankAccount: '5678901234',
    bankName: 'Vietcombank',
    department: 'Phòng Nhân sự',
    position: 'Chuyên viên C&B',
    level: 'Senior',
    orgLevel1: 'Công ty ABC',
    orgLevel2: 'Khối Vận hành',
    orgLevel3: 'Phòng Nhân sự',
    orgLevel4: 'BP C&B',
    orgLevel5: 'Nhóm Lương & Phúc lợi',
    status: 'thai_san',
    onboardDate: '2020-01-15',
    officialDate: '2020-03-15',
    lastWorkingDate: '',
    dependents: 1,
    baseSalary: 22_000_000,
  },
  {
    id: 'EMP006',
    fullName: 'Vũ Đức Minh',
    email: 'minh.vu@company.vn',
    phone: '0901234572',
    bankAccount: '6789012345',
    bankName: 'MB Bank',
    department: 'Phòng Kinh doanh',
    position: 'Chuyên viên Kinh doanh',
    level: 'Mid',
    orgLevel1: 'Công ty ABC',
    orgLevel2: 'Khối Kinh doanh',
    orgLevel3: 'Phòng Kinh doanh',
    orgLevel4: 'BP Khách hàng CN',
    orgLevel5: 'Nhóm KD Miền Bắc',
    status: 'nghi_viec_ct',
    onboardDate: '2023-04-01',
    officialDate: '2023-06-01',
    lastWorkingDate: '2026-02-03',
    dependents: 0,
    baseSalary: 18_000_000,
  },
  {
    id: 'EMP007',
    fullName: 'Đỗ Thị Mai',
    email: 'mai.do@company.vn',
    phone: '0901234573',
    bankAccount: '7890123456',
    bankName: 'Sacombank',
    department: 'Phòng Tài chính',
    position: 'Kế toán viên',
    level: 'Senior',
    orgLevel1: 'Công ty ABC',
    orgLevel2: 'Khối Vận hành',
    orgLevel3: 'Phòng Tài chính',
    orgLevel4: 'BP Kế toán',
    orgLevel5: 'Nhóm KT Tổng hợp',
    status: 'chinh_thuc',
    onboardDate: '2021-09-01',
    officialDate: '2021-11-01',
    lastWorkingDate: '',
    dependents: 2,
    baseSalary: 28_000_000,
  },
  {
    id: 'EMP008',
    fullName: 'Bùi Quang Huy',
    email: 'huy.bui@company.vn',
    phone: '0901234574',
    bankAccount: '8901234567',
    bankName: 'VPBank',
    department: 'Phòng Kỹ thuật',
    position: 'QA Engineer',
    level: 'Junior',
    orgLevel1: 'Công ty ABC',
    orgLevel2: 'Khối Công nghệ',
    orgLevel3: 'Phòng Kỹ thuật',
    orgLevel4: 'BP Đảm bảo CL',
    orgLevel5: 'Nhóm QA',
    status: 'nghi_viec_tv',
    onboardDate: '2026-01-05',
    officialDate: '',
    lastWorkingDate: '2026-02-05',
    dependents: 0,
    baseSalary: 12_000_000,
  },
  {
    id: 'EMP009',
    fullName: 'Nguyễn Thị Hương',
    email: 'huong.nguyen@company.vn',
    phone: '0901234575',
    bankAccount: '9012345678',
    bankName: 'Techcombank',
    department: 'Phòng Marketing',
    position: 'Content Creator',
    level: 'Mid',
    orgLevel1: 'Công ty ABC',
    orgLevel2: 'Khối Kinh doanh',
    orgLevel3: 'Phòng Marketing',
    orgLevel4: 'BP Truyền thông',
    orgLevel5: 'Nhóm Content',
    status: 'chinh_thuc',
    onboardDate: '2023-07-01',
    officialDate: '2023-09-01',
    lastWorkingDate: '',
    dependents: 0,
    baseSalary: 16_000_000,
  },
  {
    id: 'EMP010',
    fullName: 'Trịnh Văn Phú',
    email: 'phu.trinh@company.vn',
    phone: '0901234576',
    bankAccount: '0123456789',
    bankName: 'BIDV',
    department: 'Phòng Kinh doanh',
    position: 'Giám đốc Kinh doanh',
    level: 'Director',
    orgLevel1: 'Công ty ABC',
    orgLevel2: 'Khối Kinh doanh',
    orgLevel3: 'Phòng Kinh doanh',
    orgLevel4: 'Ban Giám đốc',
    orgLevel5: '',
    status: 'chinh_thuc',
    onboardDate: '2019-01-15',
    officialDate: '2019-03-15',
    lastWorkingDate: '',
    dependents: 3,
    baseSalary: 50_000_000,
  },
];

// ═══ Gói thưởng hiệu quả CV theo nhân viên (nếu có) ═══
export const employeePackageOverrides: Record<string, Partial<GrossPackage>> = {
  'EMP001': { performanceBonus: 3_000_000 },
  'EMP002': { performanceBonus: 5_000_000 },
  'EMP004': { performanceBonus: 2_000_000 },
  'EMP007': { performanceBonus: 3_500_000 },
  'EMP009': { performanceBonus: 1_500_000 },
  'EMP010': { performanceBonus: 8_000_000 },
};

// ═══ CHẤM CÔNG ═══
// Với het_thu_viec: chia ngày công thành 2 giai đoạn (Thử việc + Chính thức)
export const mockTimekeeping: Timekeeping[] = mockEmployees.map((emp) => {
  const base = {
    employeeId: emp.id,
    month: 2,
    year: 2026,
    standardDays: 20,
    remainingLeave: emp.status === 'thu_viec' || emp.status === 'nghi_viec_tv' ? 0 : 3,
    unpaidLeave: emp.status === 'thu_viec' ? 2 : 0,
  };

  switch (emp.status) {
    case 'het_thu_viec':
      // EMP004: Chính thức từ 10/2 → 7 ngày TV + 13 ngày CT = 20 ngày
      return { ...base, actualDays: 20, probationDays: 7, officialDays: 13 };
    case 'thu_viec':
      return { ...base, actualDays: 18, probationDays: 18, officialDays: 0 };
    case 'nghi_viec_ct':
      // Nghỉ 3/2 → 3 ngày CT, 17 ngày không lương (>14 → chỉ đóng BHYT)
      return { ...base, actualDays: 3, probationDays: 0, officialDays: 3, unpaidLeave: 17 };
    case 'nghi_viec_tv':
      // Nghỉ 5/2 → 3 ngày thử việc
      return { ...base, actualDays: 3, probationDays: 3, officialDays: 0 };
    case 'thai_san':
      return { ...base, actualDays: 0, probationDays: 0, officialDays: 0 };
    default:
      // Chính thức thuần
      return { ...base, actualDays: 20, probationDays: 0, officialDays: 20 };
  }
});

// ═══ BẢO HIỂM XÃ HỘI ═══
// Sử dụng buildSIForEmployee (khai báo bên dưới) với unpaidLeave từ timekeeping
export const mockSocialInsurance: SocialInsurance[] = mockEmployees.map((emp) => {
  const tk = mockTimekeeping.find(t => t.employeeId === emp.id);
  return buildSIForEmployee(emp, 2, 2026, tk?.unpaidLeave ?? 0);
});

// ═══ THU NHẬP KHÁC (nhập tay) ═══
export const mockVariableIncomes: VariableIncome[] = [
  { employeeId: 'EMP001', month: 2, year: 2026, commission: 5_000_000, bonus: 2_000_000, otherIncome: 0, otherAllowance: 1_000_000 },
  { employeeId: 'EMP002', month: 2, year: 2026, commission: 0, bonus: 3_000_000, otherIncome: 500_000, otherAllowance: 0 },
  { employeeId: 'EMP003', month: 2, year: 2026, commission: 0, bonus: 0, otherIncome: 0, otherAllowance: 500_000 },
  { employeeId: 'EMP004', month: 2, year: 2026, commission: 0, bonus: 1_000_000, otherIncome: 0, otherAllowance: 0 },
  { employeeId: 'EMP005', month: 2, year: 2026, commission: 0, bonus: 0, otherIncome: 0, otherAllowance: 0 },
  { employeeId: 'EMP006', month: 2, year: 2026, commission: 3_000_000, bonus: 0, otherIncome: 0, otherAllowance: 0 },
  { employeeId: 'EMP007', month: 2, year: 2026, commission: 0, bonus: 1_500_000, otherIncome: 1_000_000, otherAllowance: 500_000 },
  { employeeId: 'EMP008', month: 2, year: 2026, commission: 0, bonus: 0, otherIncome: 0, otherAllowance: 0 },
  { employeeId: 'EMP009', month: 2, year: 2026, commission: 0, bonus: 500_000, otherIncome: 200_000, otherAllowance: 0 },
  { employeeId: 'EMP010', month: 2, year: 2026, commission: 10_000_000, bonus: 5_000_000, otherIncome: 0, otherAllowance: 2_000_000 },
];

// ═══ MOCK PAYROLL BATCHES (5 tháng: T10/2025 → T2/2026) ═══
// Sử dụng calculatePayrollRecord thực tế để đảm bảo con số nhất quán

const MOCK_MONTHS: { month: number; year: number }[] = [
  { month: 10, year: 2025 },
  { month: 11, year: 2025 },
  { month: 12, year: 2025 },
  { month: 1,  year: 2026 },
  { month: 2,  year: 2026 },
];

const VARIABLE_MULTIPLIERS: Record<number, number> = {
  10: 0.8,
  11: 0.9,
  12: 1.5, // Tháng 12 thưởng cuối năm
  1:  0.7,
  2:  1.0,
};

function buildSIForEmployee(emp: Employee, month: number, year: number, unpaidLeave: number = 0): SocialInsurance {
  const siBase = Math.max(emp.baseSalary * 0.5, SI_MIN_BASE);
  const isExempt = emp.status === 'thai_san' || emp.status === 'thu_viec' || emp.status === 'nghi_viec_tv';

  const zero = {
    baseSI: 0, bhxh: 0, bhyt: 0, bhtn: 0, siEmployee: 0,
    bhxhEmployer: 0, bhytEmployer: 0, bhtnEmployer: 0, siEmployer: 0, unionFee: 0,
  };

  if (isExempt) {
    const note = emp.status === 'thai_san' ? 'Thai sản - Miễn đóng'
      : emp.status === 'thu_viec' ? 'Thử việc - Chưa đóng'
      : 'Nghỉ việc TV - Không đóng';
    return { employeeId: emp.id, month, year, ...zero, isExempt: true, note };
  }

  // Nghỉ việc CT: >14 ngày không lương → chỉ đóng BHYT
  if (emp.status === 'nghi_viec_ct' && unpaidLeave > 14) {
    const bhytEmp = Math.round(siBase * SI_BHYT_RATE);
    const bhytEr  = Math.round(siBase * SI_BHYT_EMPLOYER_RATE);
    return {
      employeeId: emp.id, month, year,
      baseSI: siBase,
      bhxh: 0, bhyt: bhytEmp, bhtn: 0, siEmployee: bhytEmp,
      bhxhEmployer: 0, bhytEmployer: bhytEr, bhtnEmployer: 0, siEmployer: bhytEr,
      unionFee: 0,
      isExempt: false,
      note: 'Nghỉ việc >14 ngày KL → chỉ BHYT',
    };
  }

  return {
    employeeId: emp.id, month, year,
    baseSI: siBase,
    bhxh:         Math.round(siBase * SI_BHXH_RATE),
    bhyt:         Math.round(siBase * SI_BHYT_RATE),
    bhtn:         Math.round(siBase * SI_BHTN_RATE),
    siEmployee:   Math.round(siBase * SI_RATE_EMPLOYEE),
    bhxhEmployer: Math.round(siBase * SI_BHXH_EMPLOYER_RATE),
    bhytEmployer: Math.round(siBase * SI_BHYT_EMPLOYER_RATE),
    bhtnEmployer: Math.round(siBase * SI_BHTN_EMPLOYER_RATE),
    siEmployer:   Math.round(siBase * SI_RATE_EMPLOYER),
    unionFee:     Math.round(siBase * UNION_FEE_RATE),
    isExempt: false,
    note: '',
  };
}

function buildTimekeepingForMonth(emp: Employee, month: number, year: number): Timekeeping {
  const std = [10, 12].includes(month) ? 22 : 20;

  if (emp.status === 'thai_san') {
    return { employeeId: emp.id, month, year, standardDays: std, actualDays: 0, probationDays: 0, officialDays: 0, remainingLeave: 3, unpaidLeave: 0 };
  }
  if (emp.status === 'nghi_viec_tv') {
    return { employeeId: emp.id, month, year, standardDays: std, actualDays: 3, probationDays: 3, officialDays: 0, remainingLeave: 0, unpaidLeave: 0 };
  }
  if (emp.status === 'nghi_viec_ct') {
    return { employeeId: emp.id, month, year, standardDays: std, actualDays: 3, probationDays: 0, officialDays: 3, remainingLeave: 0, unpaidLeave: 17 };
  }

  // het_thu_viec: chỉ tháng 2/2026 mới split, các tháng trước là thử việc thuần
  if (emp.status === 'het_thu_viec') {
    if (month === 2 && year === 2026) {
      return { employeeId: emp.id, month, year, standardDays: std, actualDays: 20, probationDays: 7, officialDays: 13, remainingLeave: 0, unpaidLeave: 0 };
    }
    return { employeeId: emp.id, month, year, standardDays: std, actualDays: std, probationDays: std, officialDays: 0, remainingLeave: 0, unpaidLeave: 0 };
  }

  if (emp.status === 'thu_viec') {
    return { employeeId: emp.id, month, year, standardDays: std, actualDays: std - 2, probationDays: std - 2, officialDays: 0, remainingLeave: 0, unpaidLeave: 2 };
  }

  // chinh_thuc
  return { employeeId: emp.id, month, year, standardDays: std, actualDays: std, probationDays: 0, officialDays: std, remainingLeave: 3, unpaidLeave: 0 };
}

function buildVariableForMonth(emp: Employee, month: number, year: number): VariableIncome {
  const orig = mockVariableIncomes.find(v => v.employeeId === emp.id);
  const mult = VARIABLE_MULTIPLIERS[month] ?? 1;
  if (!orig) {
    return { employeeId: emp.id, month, year, commission: 0, bonus: 0, otherIncome: 0, otherAllowance: 0 };
  }
  return {
    employeeId: emp.id, month, year,
    commission:     Math.round(orig.commission * mult),
    bonus:          Math.round(orig.bonus * mult),
    otherIncome:    Math.round(orig.otherIncome * mult),
    otherAllowance: Math.round(orig.otherAllowance * mult),
  };
}

function generateMockBatches(): PayrollBatch[] {
  return MOCK_MONTHS.map(({ month, year }) => {
    const records: PayrollRecord[] = mockEmployees.map((emp) => {
      const tk = buildTimekeepingForMonth(emp, month, year);
      const si = buildSIForEmployee(emp, month, year, tk.unpaidLeave);
      const vi = buildVariableForMonth(emp, month, year);

      const empPkg: GrossPackage = {
        ...defaultGrossPackage,
        baseSalary: emp.baseSalary,
        ...(employeePackageOverrides[emp.id] || {}),
      };

      return calculatePayrollRecord(emp, tk, si, vi, empPkg);
    });

    return {
      id: `BATCH-${month}-${year}`,
      month,
      year,
      status: month === 2 && year === 2026 ? 'draft' : 'approved',
      createdBy: 'Nguyễn Thị Hiền',
      createdAt: new Date(year, month - 1, 25).toISOString(),
      approvedBy: month === 2 && year === 2026 ? undefined : 'Trần Thị Nguyệt',
      approvedAt: month === 2 && year === 2026 ? undefined : new Date(year, month - 1, 27).toISOString(),
      totalEmployees: records.length,
      totalGross: records.reduce((s, r) => s + r.grossSalary, 0),
      totalNet: records.reduce((s, r) => s + r.netSalary, 0),
      totalTax: records.reduce((s, r) => s + r.pit, 0),
      totalSI: records.reduce((s, r) => s + r.siEmployee, 0),
      totalEmployerCost: records.reduce((s, r) => s + r.totalEmployerCost, 0),
      records,
    } satisfies PayrollBatch;
  });
}

export const mockPayrollBatches: PayrollBatch[] = generateMockBatches();

// ═══ ĐỀ XUẤT MẪU ═══
export const mockProposals: Proposal[] = [
  {
    id: 'PRP-001',
    employeeId: 'EMP001',
    employeeName: 'Nguyễn Văn An',
    department: 'Phòng Kinh doanh',
    type: 'timekeeping',
    month: 2,
    year: 2026,
    subject: 'Thiếu ngày công',
    description: 'Tháng 2 em đi công tác 2 ngày (10-11/2) nhưng trên bảng công chưa được cập nhật. Em có xác nhận từ trưởng phòng.',
    status: 'pending',
    createdAt: '2026-02-28T09:30:00.000Z',
  },
  {
    id: 'PRP-002',
    employeeId: 'EMP009',
    employeeName: 'Nguyễn Thị Hương',
    department: 'Phòng Marketing',
    type: 'payroll',
    month: 1,
    year: 2026,
    subject: 'Sai khoản thưởng tháng 1',
    description: 'Thưởng dự án năm mới của em là 800.000đ nhưng trên phiếu lương chỉ ghi 350.000đ. Em gửi kèm email xác nhận từ quản lý.',
    status: 'processing',
    createdAt: '2026-02-25T14:15:00.000Z',
    respondedBy: 'Nguyễn Thị Hiền',
    respondedAt: '2026-02-26T08:00:00.000Z',
    response: 'Em gửi chị email xác nhận từ quản lý nhé, chị sẽ kiểm tra và cập nhật.',
  },
  {
    id: 'PRP-003',
    employeeId: 'EMP004',
    employeeName: 'Phạm Minh Dũng',
    department: 'Phòng Kỹ thuật',
    type: 'payroll',
    month: 2,
    year: 2026,
    subject: 'Hỏi về mức đóng BHXH',
    description: 'Em vừa chuyển chính thức từ 10/2, em muốn hỏi mức đóng BHXH của em được tính từ tháng nào?',
    status: 'resolved',
    createdAt: '2026-02-20T10:00:00.000Z',
    respondedBy: 'Nguyễn Thị Hiền',
    respondedAt: '2026-02-20T15:30:00.000Z',
    response: 'Em chuyển chính thức trước ngày 15 nên em sẽ đóng BHXH từ tháng 2 luôn nhé. Chi tiết em xem ở mục BHXH.',
  },
  {
    id: 'PRP-004',
    employeeId: 'EMP007',
    employeeName: 'Đỗ Thị Mai',
    department: 'Phòng Tài chính',
    type: 'timekeeping',
    month: 1,
    year: 2026,
    subject: 'Nghỉ phép chưa được trừ đúng',
    description: 'Tháng 1 em nghỉ phép 1 ngày (15/1) nhưng hệ thống vẫn ghi phép dư = 3 ngày, đúng ra phải là 2 ngày.',
    status: 'rejected',
    createdAt: '2026-02-10T08:45:00.000Z',
    respondedBy: 'Nguyễn Thị Hiền',
    respondedAt: '2026-02-11T09:00:00.000Z',
    response: 'Chị kiểm tra lại hệ thống iCheck, phép dư T1 của em đúng là 3 ngày vì phép năm mới đã được cộng vào đầu năm.',
  },
];
