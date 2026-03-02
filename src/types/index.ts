// ==================== EMPLOYEE STATUS ====================
export type EmployeeStatus =
  | 'chinh_thuc'        // Chính thức
  | 'thai_san'          // Thai sản
  | 'nghi_viec_ct'      // Nghỉ việc chính thức
  | 'het_thu_viec'      // Hết thử việc trong tháng
  | 'thu_viec'          // Thử việc
  | 'nghi_viec_tv';     // Nghỉ việc thử việc

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  chinh_thuc: 'Chính thức',
  thai_san: 'Thai sản',
  nghi_viec_ct: 'Nghỉ việc chính thức',
  het_thu_viec: 'Hết thử việc trong tháng',
  thu_viec: 'Thử việc',
  nghi_viec_tv: 'Nghỉ việc thử việc',
};

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  chinh_thuc: 'bg-green-100 text-green-800',
  thai_san: 'bg-purple-100 text-purple-800',
  nghi_viec_ct: 'bg-red-100 text-red-800',
  het_thu_viec: 'bg-blue-100 text-blue-800',
  thu_viec: 'bg-yellow-100 text-yellow-800',
  nghi_viec_tv: 'bg-orange-100 text-orange-800',
};

// ==================== EMPLOYEE ====================
export interface Employee {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  bankAccount: string;
  bankName: string;
  department: string;
  position: string;
  level: string;
  status: EmployeeStatus;
  onboardDate: string;     // Ngày bắt đầu thử việc
  officialDate: string;    // Ngày chính thức
  lastWorkingDate: string; // Ngày nghỉ việc
  dependents: number;      // Số người phụ thuộc
  baseSalary: number;      // Lương cơ bản
  avatar?: string;
}

// ==================== TIMEKEEPING ====================
export interface Timekeeping {
  employeeId: string;
  month: number;
  year: number;
  standardDays: number;    // Công chuẩn
  actualDays: number;      // Công thực tế (tổng)
  probationDays: number;   // Ngày công giai đoạn Thử việc
  officialDays: number;    // Ngày công giai đoạn Chính thức
  remainingLeave: number;  // Phép dư
  unpaidLeave: number;     // Nghỉ không lương
}

// ==================== SOCIAL INSURANCE ====================
export interface SocialInsurance {
  employeeId: string;
  month: number;
  year: number;
  baseSI: number;          // Mức đóng bảo hiểm (Căn cứ đóng)
  // Phần NLĐ đóng
  bhxh: number;            // BHXH 8%
  bhyt: number;            // BHYT 1.5%
  bhtn: number;            // BHTN 1%
  siEmployee: number;      // Cộng BH bắt buộc NLĐ 10.5%
  // Phần Công ty đóng
  bhxhEmployer: number;    // BHXH Cty 17.5%
  bhytEmployer: number;    // BHYT Cty 3%
  bhtnEmployer: number;    // BHTN Cty 1%
  siEmployer: number;      // Cộng BH bắt buộc Cty 21.5%
  // Đoàn phí
  unionFee: number;        // Đoàn phí 2% (Cty đóng thay, KHÔNG trừ NLĐ)
  isExempt: boolean;       // Miễn đóng (thai sản)
  note: string;
}

// ==================== VARIABLE INCOMES ====================
export interface VariableIncome {
  employeeId: string;
  month: number;
  year: number;
  commission: number;      // Hoa hồng
  bonus: number;           // Thưởng khác (lễ tết, thâm niên)
  otherIncome: number;     // Thu nhập khác (L&D)
  otherAllowance: number;  // Trợ cấp khác (OT, đi lại)
}

// ==================== GÓI THU NHẬP THEO HỢP ĐỒNG (GROSS PACKAGE) ====================
// Các khoản trong gói HĐ được prorate theo ngày công
export interface GrossPackage {
  baseSalary: number;        // Lương cơ bản
  lunch: number;             // Trợ cấp ăn trưa
  phone: number;             // Hỗ trợ điện thoại
  performanceBonus: number;  // Thưởng hiệu quả CV
  otherPackage: number;      // Trợ cấp khác trong gói HĐ
}

// ==================== PAYROLL RECORD ====================
export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  status: EmployeeStatus;
  month: number;
  year: number;

  // ═══ NHÓM 1: THU NHẬP THEO NGÀY CÔNG (PRORATED) ═══
  baseSalary: number;        // Gói lương CB hợp đồng
  standardDays: number;
  actualDays: number;
  probationDays: number;     // Ngày công giai đoạn TV
  officialDays: number;      // Ngày công giai đoạn CT

  // Gói thu nhập prorated cho giai đoạn Thử việc
  probationBaseSalary: number;
  probationLunch: number;
  probationPhone: number;
  probationPerfBonus: number;
  probationTotal: number;    // Cộng thu nhập giai đoạn TV

  // Gói thu nhập prorated cho giai đoạn Chính thức
  officialBaseSalary: number;
  officialLunch: number;
  officialPhone: number;
  officialPerfBonus: number;
  officialTotal: number;     // Cộng thu nhập giai đoạn CT

  // Tổng phụ cấp thực tế (để tính thu nhập chịu thuế)
  totalLunchActual: number;  // Trợ cấp ăn trưa thực tế
  totalPhoneActual: number;  // Hỗ trợ ĐT thực tế

  // ═══ NHÓM 2: THU NHẬP KHÁC & TỔNG THU NHẬP ═══
  commission: number;        // Hoa hồng
  bonus: number;             // Thưởng khác
  otherIncome: number;       // Thu nhập khác (L&D)
  otherAllowance: number;    // Trợ cấp khác (OT, đi lại)
  totalVariableIncome: number; // Cộng thu nhập khác

  grossSalary: number;       // Tổng thu nhập (Gross)

  // ═══ NHÓM 3: THU NHẬP CHỊU THUẾ ═══
  // = Gross - Ăn trưa TT - ĐT TT
  nonTaxableLunch: number;   // Ăn trưa (không chịu thuế)
  nonTaxablePhone: number;   // ĐT (không chịu thuế)
  taxableIncome: number;     // Thu nhập chịu thuế

  // ═══ NHÓM 4: KHẤU TRỪ BH & GIẢM TRỪ ═══
  siBase: number;
  siBhxh: number;            // BHXH NLĐ 8%
  siBhyt: number;            // BHYT NLĐ 1.5%
  siBhtn: number;            // BHTN NLĐ 1%
  siEmployee: number;        // Cộng BH NLĐ 10.5%
  personalDeduction: number; // Giảm trừ bản thân 15.500.000
  dependentDeduction: number;// Giảm trừ NPT × 6.200.000

  // ═══ NHÓM 5: THUẾ TNCN ═══
  taxMethod: 'progressive' | 'flat';
  taxAssessableIncome: number; // Thu nhập tính thuế
  pit: number;               // Thuế TNCN final

  // ═══ NHÓM 6: KHẤU TRỪ THỰC TẾ & NET ═══
  unionFee: number;          // Đoàn phí 2% (hiển thị, KHÔNG trừ NLĐ)
  retroDeduction: number;    // Truy thu sau thuế
  retroAddition: number;     // Cộng thêm sau thuế
  totalDeduction: number;    // = Thuế + BH 10.5% + Truy thu
  netSalary: number;         // = Gross - totalDeduction + Cộng thêm

  // ═══ NHÓM 7: CHI PHÍ CÔNG TY ═══
  siEmployerBhxh: number;   // BHXH Cty 17.5%
  siEmployerBhyt: number;   // BHYT Cty 3%
  siEmployerBhtn: number;   // BHTN Cty 1%
  siEmployer: number;        // Cộng BH Cty 21.5%
  employerUnionFee: number;  // Đoàn phí Cty 2%
  totalEmployerCost: number; // Tổng chi phí Cty
}

// ==================== PAYROLL BATCH ====================
export type PayrollBatchStatus = 'draft' | 'pending_approval' | 'approved' | 'paid';

export interface PayrollBatch {
  id: string;
  month: number;
  year: number;
  status: PayrollBatchStatus;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  totalEmployees: number;
  totalGross: number;
  totalNet: number;
  totalTax: number;
  totalSI: number;
  totalEmployerCost: number;
  records: PayrollRecord[];
}

// ==================== PROGRESSIVE TAX BRACKETS ====================
// Biểu thuế lũy tiến từng phần (7 bậc)
export const TAX_BRACKETS = [
  { min: 0,          max: 5_000_000,  rate: 0.05 },
  { min: 5_000_000,  max: 10_000_000, rate: 0.10 },
  { min: 10_000_000, max: 18_000_000, rate: 0.15 },
  { min: 18_000_000, max: 32_000_000, rate: 0.20 },
  { min: 32_000_000, max: 52_000_000, rate: 0.25 },
  { min: 52_000_000, max: 80_000_000, rate: 0.30 },
  { min: 80_000_000, max: Infinity,   rate: 0.35 },
];

// ==================== CONSTANTS (theo RULE.md demo) ====================
export const PERSONAL_DEDUCTION  = 15_500_000;  // Giảm trừ bản thân
export const DEPENDENT_DEDUCTION =  6_200_000;  // Giảm trừ mỗi người phụ thuộc

// BH bắt buộc phần NLĐ đóng
export const SI_BHXH_RATE     = 0.08;   // BHXH 8%
export const SI_BHYT_RATE     = 0.015;  // BHYT 1.5%
export const SI_BHTN_RATE     = 0.01;   // BHTN 1%
export const SI_RATE_EMPLOYEE = 0.105;  // Cộng 10.5%

// BH bắt buộc phần Công ty đóng
export const SI_BHXH_EMPLOYER_RATE = 0.175; // BHXH Cty 17.5%
export const SI_BHYT_EMPLOYER_RATE = 0.03;  // BHYT Cty 3%
export const SI_BHTN_EMPLOYER_RATE = 0.01;  // BHTN Cty 1%
export const SI_RATE_EMPLOYER      = 0.215; // Cộng 21.5%

export const UNION_FEE_RATE  = 0.02;        // Đoàn phí 2%
export const SI_MIN_BASE     = 5_310_000;   // Mức lương đóng BH tối thiểu
export const FLAT_TAX_RATE   = 0.10;        // Thuế TNCN flat 10%

export type UserRole = 'cb_specialist' | 'manager';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
