import {
  Employee, Timekeeping, SocialInsurance, VariableIncome, GrossPackage,
  SI_BHXH_RATE, SI_BHYT_RATE, SI_BHTN_RATE, SI_RATE_EMPLOYEE,
  SI_BHXH_EMPLOYER_RATE, SI_BHYT_EMPLOYER_RATE, SI_BHTN_EMPLOYER_RATE, SI_RATE_EMPLOYER,
  UNION_FEE_RATE, SI_MIN_BASE,
} from '../types';

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
    status: 'het_thu_viec',
    onboardDate: '2025-11-10',
    officialDate: '2026-02-10',  // Pass thử việc ngày 10/2 (trước 15 → đóng BH trong tháng)
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
    status: 'nghi_viec_ct',
    onboardDate: '2023-04-01',
    officialDate: '2023-06-01',
    lastWorkingDate: '2026-02-15',
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
      // Nghỉ 15/2 → 10 ngày chính thức
      return { ...base, actualDays: 10, probationDays: 0, officialDays: 10 };
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
export const mockSocialInsurance: SocialInsurance[] = mockEmployees.map((emp) => {
  const siBase = Math.max(emp.baseSalary * 0.5, SI_MIN_BASE);
  const isExempt = emp.status === 'thai_san';

  // Tính chi tiết BH
  const calcSI = (base: number) => ({
    baseSI: base,
    bhxh:         Math.round(base * SI_BHXH_RATE),
    bhyt:         Math.round(base * SI_BHYT_RATE),
    bhtn:         Math.round(base * SI_BHTN_RATE),
    siEmployee:   Math.round(base * SI_RATE_EMPLOYEE),
    bhxhEmployer: Math.round(base * SI_BHXH_EMPLOYER_RATE),
    bhytEmployer: Math.round(base * SI_BHYT_EMPLOYER_RATE),
    bhtnEmployer: Math.round(base * SI_BHTN_EMPLOYER_RATE),
    siEmployer:   Math.round(base * SI_RATE_EMPLOYER),
    unionFee:     Math.round(base * UNION_FEE_RATE),
  });

  const zero = calcSI(0);
  const filled = calcSI(siBase);

  if (isExempt) {
    return {
      employeeId: emp.id, month: 2, year: 2026,
      ...zero, isExempt: true, note: 'Thai sản - Miễn đóng BHXH',
    };
  }

  if (emp.status === 'thu_viec') {
    // Thử việc thuần: chưa pass → chưa đóng BH
    return {
      employeeId: emp.id, month: 2, year: 2026,
      ...zero, isExempt: true, note: 'Đang thử việc - Chưa đóng BHXH',
    };
  }

  return {
    employeeId: emp.id, month: 2, year: 2026,
    ...filled, isExempt: false, note: '',
  };
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
