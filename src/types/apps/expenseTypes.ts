export type ExpenseCategory = 'RENT' | 'UTILITIES' | 'EQUIPMENT' | 'MAINTENANCE' | 'MARKETING' | 'SUPPLIES' | 'OTHER'
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type Expense = {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  submittedBy: string
  approvedBy?: string
  status: ExpenseStatus
  receipt?: string
  branchName: string
}

export const mockExpenses: Expense[] = [
  {
    id: '1',
    category: 'EQUIPMENT',
    description: 'New treadmill for cardio zone',
    amount: 2500,
    date: '2024-11-15',
    submittedBy: 'John Smith',
    approvedBy: 'Admin',
    status: 'APPROVED',
    branchName: 'Downtown'
  },
  {
    id: '2',
    category: 'UTILITIES',
    description: 'Electricity bill - November',
    amount: 1200,
    date: '2024-11-10',
    submittedBy: 'Sarah Johnson',
    status: 'PENDING',
    branchName: 'Westside'
  },
  {
    id: '3',
    category: 'MARKETING',
    description: 'Social media advertising campaign',
    amount: 800,
    date: '2024-11-12',
    submittedBy: 'Mike Williams',
    approvedBy: 'Admin',
    status: 'APPROVED',
    branchName: 'North'
  },
  {
    id: '4',
    category: 'MAINTENANCE',
    description: 'AC repair',
    amount: 450,
    date: '2024-11-18',
    submittedBy: 'Emily Davis',
    status: 'PENDING',
    branchName: 'South'
  }
]
