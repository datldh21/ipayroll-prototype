import {
  Employee,
  Timekeeping,
  SocialInsurance,
  VariableIncome,
  GrossPackage,
  PayrollRecord,
  TAX_BRACKETS,
  PERSONAL_DEDUCTION,
  DEPENDENT_DEDUCTION,
  FLAT_TAX_RATE,
  EmployeeStatus,
  SI_BHXH_EMPLOYER_RATE,
  SI_BHYT_EMPLOYER_RATE,
  SI_BHTN_EMPLOYER_RATE,
  SI_RATE_EMPLOYER,
  UNION_FEE_RATE,
} from '../types';

// ════════════════════════════════════════════════════
// Xác định phương thức tính thuế dựa trên trạng thái NV
// ════════════════════════════════════════════════════
// Lũy tiến (LT): Chính thức, Thai sản, Hết thử việc trong tháng
// Flat 10%:       Thử việc, Nghỉ việc chính thức, Nghỉ việc thử việc
function getTaxMethod(status: EmployeeStatus): 'progressive' | 'flat' {
  if (['chinh_thuc', 'het_thu_viec', 'thai_san'].includes(status)) {
    return 'progressive';
  }
  return 'flat';
}

// ════════════════════════════════════════════════════
// Tính thuế TNCN theo biểu lũy tiến 7 bậc
// ════════════════════════════════════════════════════
function calculateProgressiveTax(taxAssessableIncome: number): number {
  if (taxAssessableIncome <= 0) return 0;

  let remaining = taxAssessableIncome;
  let tax = 0;

  for (const bracket of TAX_BRACKETS) {
    const bracketSize = bracket.max - bracket.min;
    const taxableInBracket = Math.min(remaining, bracketSize);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    if (remaining <= 0) break;
  }

  return Math.round(tax);
}

// ════════════════════════════════════════════════════
// Prorate 1 khoản thu nhập theo ngày công
// Công thức: (Khoản thu nhập trong gói HĐ / Công chuẩn) × Số ngày thực tế
// ════════════════════════════════════════════════════
function prorate(packageAmount: number, standardDays: number, actualDays: number): number {
  if (standardDays <= 0 || actualDays <= 0) return 0;
  return Math.round((packageAmount / standardDays) * actualDays);
}

// ════════════════════════════════════════════════════
// HÀM CHÍNH: Tính toán bản ghi lương cho 1 nhân viên
// Theo đúng 7 nhóm logic trong RULE.md
// ════════════════════════════════════════════════════
export function calculatePayrollRecord(
  employee: Employee,
  timekeeping: Timekeeping,
  socialInsurance: SocialInsurance,
  variableIncome: VariableIncome,
  grossPackage: GrossPackage,
  retroDeduction: number = 0,
  retroAddition: number = 0,
): PayrollRecord {
  const std = timekeeping.standardDays;
  const probDays = timekeeping.probationDays;
  const offDays  = timekeeping.officialDays;

  // Gói thu nhập HĐ (lấy baseSalary từ Employee nếu package = 0)
  const pkgBase  = grossPackage.baseSalary || employee.baseSalary;
  const pkgLunch = grossPackage.lunch;
  const pkgPhone = grossPackage.phone;
  const pkgPerf  = grossPackage.performanceBonus;
  const pkgOther = grossPackage.otherPackage;

  // ═══ NHÓM 1: THU NHẬP THEO NGÀY CÔNG (PRORATED) ═══
  // Chia 2 giai đoạn: Thử việc và Chính thức

  // Giai đoạn Thử việc
  const probBaseSalary = prorate(pkgBase, std, probDays);
  const probLunch      = prorate(pkgLunch, std, probDays);
  const probPhone      = prorate(pkgPhone, std, probDays);
  const probPerfBonus  = prorate(pkgPerf, std, probDays);
  const probOther      = prorate(pkgOther, std, probDays);
  const probationTotal = probBaseSalary + probLunch + probPhone + probPerfBonus + probOther;

  // Giai đoạn Chính thức
  const offBaseSalary = prorate(pkgBase, std, offDays);
  const offLunch      = prorate(pkgLunch, std, offDays);
  const offPhone      = prorate(pkgPhone, std, offDays);
  const offPerfBonus  = prorate(pkgPerf, std, offDays);
  const offOther      = prorate(pkgOther, std, offDays);
  const officialTotal = offBaseSalary + offLunch + offPhone + offPerfBonus + offOther;

  // Tổng phụ cấp thực tế (ăn trưa + điện thoại) — cần cho tính thu nhập chịu thuế
  const totalLunchActual = probLunch + offLunch;
  const totalPhoneActual = probPhone + offPhone;

  // ═══ NHÓM 2: THU NHẬP KHÁC & TỔNG THU NHẬP (GROSS) ═══
  const totalVariableIncome =
    variableIncome.commission +
    variableIncome.bonus +
    variableIncome.otherIncome +
    variableIncome.otherAllowance;

  // Gross = Thu nhập ngày công TV + Thu nhập ngày công CT + Thu nhập khác
  const grossSalary = probationTotal + officialTotal + totalVariableIncome;

  // ═══ NHÓM 3: THU NHẬP CHỊU THUẾ ═══
  // = Gross - Trợ cấp ăn trưa thực tế - Hỗ trợ điện thoại thực tế
  // (Hai khoản này được cấu hình là KHÔNG chịu thuế)
  const nonTaxableLunch = totalLunchActual;
  const nonTaxablePhone = totalPhoneActual;
  const taxableIncome = grossSalary - nonTaxableLunch - nonTaxablePhone;

  // ═══ NHÓM 4: KHẤU TRỪ BẢO HIỂM & GIẢM TRỪ ═══
  const siBase     = socialInsurance.baseSI;
  const siBhxh     = socialInsurance.bhxh;
  const siBhyt     = socialInsurance.bhyt;
  const siBhtn     = socialInsurance.bhtn;
  const siEmployee = socialInsurance.siEmployee; // Cộng 10.5%

  // ═══ NHÓM 5: TÍNH THUẾ TNCN ═══
  const taxMethod = getTaxMethod(employee.status);

  let pit = 0;
  let personalDeduction = 0;
  let dependentDeduction = 0;
  let taxAssessableIncome = 0;

  if (taxMethod === 'progressive') {
    // ── Nhánh 1: Thuế Lũy tiến ──
    // Thu nhập tính thuế = Thu nhập chịu thuế - (BH 10.5% + Giảm trừ bản thân + Giảm trừ NPT)
    personalDeduction = PERSONAL_DEDUCTION;
    dependentDeduction = employee.dependents * DEPENDENT_DEDUCTION;

    taxAssessableIncome = taxableIncome - siEmployee - personalDeduction - dependentDeduction;
    // Nếu < 0 thì mặc định = 0
    taxAssessableIncome = Math.max(0, taxAssessableIncome);

    pit = calculateProgressiveTax(taxAssessableIncome);
  } else {
    // ── Nhánh 2: Thuế 10% flat ──
    // Thu nhập tính thuế = Thu nhập chịu thuế (TUYỆT ĐỐI KHÔNG trừ giảm trừ)
    taxAssessableIncome = taxableIncome;
    pit = Math.round(taxableIncome * FLAT_TAX_RATE);
  }

  // ═══ NHÓM 6: KHẤU TRỪ THỰC TẾ & NET PAY ═══
  // Khoản trừ vào lương = Thuế TNCN + BH 10.5% + Truy thu sau thuế
  // LƯU Ý: Đoàn phí 2% KHÔNG CỘNG vào khấu trừ (Cty đóng thay)
  const totalDeduction = pit + siEmployee + retroDeduction;
  const unionFee = socialInsurance.unionFee;

  // Thực lĩnh = Gross - Khoản trừ + Cộng thêm sau thuế
  const netSalary = grossSalary - totalDeduction + retroAddition;

  // ═══ NHÓM 7: CHI PHÍ CÔNG TY TRẢ ═══
  const siEmployerBhxh = socialInsurance.bhxhEmployer;
  const siEmployerBhyt = socialInsurance.bhytEmployer;
  const siEmployerBhtn = socialInsurance.bhtnEmployer;
  const siEmployer     = socialInsurance.siEmployer;
  const employerUnionFee = unionFee;
  // Tổng chi phí Cty = Lương thực lĩnh + BH Cty đóng + Đoàn phí Cty
  const totalEmployerCost = netSalary + siEmployer + employerUnionFee;

  return {
    id: `PR-${employee.id}-${timekeeping.month}-${timekeeping.year}`,
    employeeId: employee.id,
    employeeName: employee.fullName,
    department: employee.department,
    status: employee.status,
    month: timekeeping.month,
    year: timekeeping.year,

    // Nhóm 1
    baseSalary: employee.baseSalary,
    standardDays: std,
    actualDays: timekeeping.actualDays,
    probationDays: probDays,
    officialDays: offDays,

    probationBaseSalary: probBaseSalary,
    probationLunch: probLunch,
    probationPhone: probPhone,
    probationPerfBonus: probPerfBonus,
    probationTotal,

    officialBaseSalary: offBaseSalary,
    officialLunch: offLunch,
    officialPhone: offPhone,
    officialPerfBonus: offPerfBonus,
    officialTotal,

    totalLunchActual,
    totalPhoneActual,

    // Nhóm 2
    commission: variableIncome.commission,
    bonus: variableIncome.bonus,
    otherIncome: variableIncome.otherIncome,
    otherAllowance: variableIncome.otherAllowance,
    totalVariableIncome,
    grossSalary,

    // Nhóm 3
    nonTaxableLunch,
    nonTaxablePhone,
    taxableIncome,

    // Nhóm 4
    siBase,
    siBhxh,
    siBhyt,
    siBhtn,
    siEmployee,
    personalDeduction,
    dependentDeduction,

    // Nhóm 5
    taxMethod,
    taxAssessableIncome,
    pit,

    // Nhóm 6
    unionFee,
    retroDeduction,
    retroAddition,
    totalDeduction,
    netSalary,

    // Nhóm 7
    siEmployerBhxh,
    siEmployerBhyt,
    siEmployerBhtn,
    siEmployer,
    employerUnionFee,
    totalEmployerCost,
  };
}

// ════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════

/** Format số tiền VND */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format ngày tháng */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
