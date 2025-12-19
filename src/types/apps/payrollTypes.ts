export type PayrollStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED'

export type PayrollRecord = {
  id: string
  employeeId: string
  employeeName: string
  role: string
  baseSalary: number
  bonus: number
  deductions: number
  netSalary: number
  month: string
  year: number
  status: PayrollStatus
  paidDate?: string
}

export const mockPayroll: PayrollRecord[] = [
  {
    id: '1',
    employeeId: 'EMP001',
    employeeName: 'John Smith',
    role: 'Manager',
    baseSalary: 5000,
    bonus: 500,
    deductions: 300,
    netSalary: 5200,
    month: 'November',
    year: 2024,
    status: 'PAID',
    paidDate: '2024-11-01'
  },
  {
    id: '2',
    employeeId: 'EMP002',
    employeeName: 'Sarah Johnson',
    role: 'Trainer',
    baseSalary: 3500,
    bonus: 200,
    deductions: 150,
    netSalary: 3550,
    month: 'November',
    year: 2024,
    status: 'PAID',
    paidDate: '2024-11-01'
  },
  {
    id: '3',
    employeeId: 'EMP003',
    employeeName: 'Mike Williams',
    role: 'Receptionist',
    baseSalary: 2500,
    bonus: 0,
    deductions: 100,
    netSalary: 2400,
    month: 'November',
    year: 2024,
    status: 'PROCESSING'
  }
]
