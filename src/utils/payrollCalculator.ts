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
} from '../types';

function getTaxMethod(status: EmployeeStatus): 'progressive' | 'flat' {
  if (['chinh_thuc', 'het_thu_viec', 'thai_san'].includes(status)) {
    return 'progressive';
  }
  return 'flat';
}

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

function prorate(packageAmount: number, standardDays: number, actualDays: number): number {
  if (standardDays <= 0 || actualDays <= 0) return 0;
  return Math.round((packageAmount / standardDays) * actualDays);
}

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
  const leaveDays = timekeeping.remainingLeave;

  const pkgBase  = grossPackage.baseSalary || employee.baseSalary;
  const pkgLunch = employee.lunchAllowance ?? grossPackage.lunch;
  const pkgPhone = employee.phoneAllowance ?? grossPackage.phone;

  // Thưởng HQCV tự tính từ gói HĐ
  const probPkgPerf = pkgBase - pkgLunch;              // HĐTV: base - lunch
  const pkgPerf     = pkgBase - pkgLunch - pkgPhone;   // HĐLĐ: base - lunch - phone

  // Contract-level package totals (không có TC khác)
  const packageTotal     = pkgBase + pkgLunch + pkgPhone + pkgPerf;
  const probPackageTotal = pkgBase + pkgLunch + probPkgPerf;

  // ═══ NHÓM 1: THU NHẬP THEO NGÀY CÔNG (PRORATED) ═══
  // Lương CB = LươngTV/std*NC_TV + LươngCB/std*NC_CT + LươngCB/std*Phép_dư
  const proratedBaseSalary =
    prorate(pkgBase, std, probDays) +
    prorate(pkgBase, std, offDays) +
    prorate(pkgBase, std, leaveDays);

  // TC Ăn trưa = TC_TV/std*NC_TV + TC_LD/std*NC_CT + TC_LD/std*Phép_dư
  const totalLunchActual =
    prorate(pkgLunch, std, probDays) +
    prorate(pkgLunch, std, offDays) +
    prorate(pkgLunch, std, leaveDays);

  // HT ĐT = gói HĐLĐ (không prorate)
  const totalPhoneActual = pkgPhone;

  // Thưởng HQCV = HQCV_TV/std*NC_TV + HQCV_LD/std*NC_CT + HQCV_LD/std*Phép_dư
  const proratedPerfBonus =
    prorate(probPkgPerf, std, probDays) +
    prorate(pkgPerf, std, offDays) +
    prorate(pkgPerf, std, leaveDays);

  const proratedTotal = proratedBaseSalary + totalLunchActual + totalPhoneActual + proratedPerfBonus;

  // ═══ NHÓM 2: THU NHẬP KHÁC & TỔNG THU NHẬP (GROSS) ═══
  const totalVariableIncome =
    variableIncome.commission +
    variableIncome.bonus +
    variableIncome.otherIncome +
    variableIncome.otherAllowance;

  const grossSalary = proratedTotal + totalVariableIncome;

  // ═══ NHÓM 3: THU NHẬP CHỊU THUẾ ═══
  const nonTaxableLunch = totalLunchActual;
  const nonTaxablePhone = totalPhoneActual;
  const taxableIncome = grossSalary - nonTaxableLunch - nonTaxablePhone;

  // ═══ NHÓM 4: KHẤU TRỪ BẢO HIỂM & GIẢM TRỪ ═══
  const siBase     = socialInsurance.baseSI;
  const siBhxh     = socialInsurance.bhxh;
  const siBhyt     = socialInsurance.bhyt;
  const siBhtn     = socialInsurance.bhtn;
  const siEmployee = socialInsurance.siEmployee;

  // ═══ NHÓM 5: TÍNH THUẾ TNCN ═══
  const taxMethod = getTaxMethod(employee.status);

  let pit = 0;
  let personalDeduction = 0;
  let dependentDeduction = 0;
  let taxAssessableIncome = 0;

  if (taxMethod === 'progressive') {
    personalDeduction = PERSONAL_DEDUCTION;
    dependentDeduction = employee.dependents * DEPENDENT_DEDUCTION;

    taxAssessableIncome = taxableIncome - siEmployee - personalDeduction - dependentDeduction;
    taxAssessableIncome = Math.max(0, taxAssessableIncome);

    pit = calculateProgressiveTax(taxAssessableIncome);
  } else {
    taxAssessableIncome = taxableIncome;
    pit = Math.round(taxableIncome * FLAT_TAX_RATE);
  }

  // ═══ NHÓM 6: KHẤU TRỪ THỰC TẾ & NET PAY ═══
  const totalDeduction = pit + siEmployee + retroDeduction;
  const unionFee = socialInsurance.unionFee;
  const netSalary = grossSalary - totalDeduction + retroAddition;

  // ═══ NHÓM 7: CHI PHÍ CÔNG TY TRẢ ═══
  const siEmployerBhxh = socialInsurance.bhxhEmployer;
  const siEmployerBhyt = socialInsurance.bhytEmployer;
  const siEmployerBhtn = socialInsurance.bhtnEmployer;
  const siEmployer     = socialInsurance.siEmployer;
  const employerUnionFee = unionFee;
  const totalEmployerCost = netSalary + siEmployer + employerUnionFee;

  return {
    id: `PR-${employee.id}-${timekeeping.month}-${timekeeping.year}`,
    employeeId: employee.id,
    employeeName: employee.fullName,
    department: employee.department,
    status: employee.status,
    month: timekeeping.month,
    year: timekeeping.year,

    email: employee.email,
    bankAccount: employee.bankAccount,
    bankName: employee.bankName,
    dependents: employee.dependents,
    costAccount: employee.costAccount,
    remainingLeave: timekeeping.remainingLeave,

    // Gói TN theo HĐLĐ
    packageBaseSalary: pkgBase,
    packageLunch: pkgLunch,
    packagePhone: pkgPhone,
    packagePerfBonus: pkgPerf,
    packageTotal,

    // Lương TV theo HĐTV (không có ĐT)
    probPackageBaseSalary: pkgBase,
    probPackageLunch: pkgLunch,
    probPackagePerfBonus: probPkgPerf,
    probPackageTotal,

    // Nhóm 1: TN theo ngày công
    baseSalary: employee.baseSalary,
    standardDays: std,
    actualDays: timekeeping.actualDays,
    probationDays: probDays,
    officialDays: offDays,
    unpaidLeaveProbation: timekeeping.unpaidLeaveProbation,
    unpaidLeaveOfficial: timekeeping.unpaidLeaveOfficial,

    proratedBaseSalary,
    proratedPerfBonus,
    proratedTotal,
    totalLunchActual,
    totalPhoneActual,

    // Nhóm 2
    commission: variableIncome.commission,
    commissionDetail: variableIncome.commissionDetail,
    bonus: variableIncome.bonus,
    bonusDetail: variableIncome.bonusDetail,
    otherIncome: variableIncome.otherIncome,
    otherIncomeDetail: variableIncome.otherIncomeDetail,
    otherAllowance: variableIncome.otherAllowance,
    otherAllowanceDetail: variableIncome.otherAllowanceDetail,
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
    dependentCount: employee.dependents,
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

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
