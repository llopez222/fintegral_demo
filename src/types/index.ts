export type LoanStatus = 'draft' | 'submitted' | 'in_review' | 'conditions' | 'approved' | 'denied' | 'closed';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'failed';
export type TaskType = 'credit_check' | 'document_review' | 'property_link' | 'distance_check' | 'income_verification' | 'custom';
export type DecisionType = 'approved' | 'denied' | 'conditional' | 'auto_action';
export type PropertyType = 'single_family' | 'condo' | 'townhouse' | 'multi_family' | 'commercial';
export type LoanPurpose = 'purchase' | 'refinance_rate_term' | 'refinance_cash_out' | 'construction' | 'home_equity';
export type OccupancyType = 'primary' | 'secondary' | 'investment';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface Employment {
  employerName: string;
  position: string;
  startDate: string;
  monthlyIncome: number;
  employerAddress?: Address;
  isRemote?: boolean;
}

export interface Liability {
  id: string;
  type: 'mortgage' | 'credit_card' | 'auto_loan' | 'student_loan' | 'other';
  lender: string;
  balance: number;
  monthlyPayment: number;
  propertyId?: string;
}

export interface Property {
  id: string;
  address: Address;
  estimatedValue: number;
  occupancyType: OccupancyType;
  isSubjectProperty: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: 'w2' | 'bank_statement' | 'mortgage_statement' | 'id_document' | 'paystub' | 'tax_return' | 'other';
  status: 'uploaded' | 'processing' | 'verified' | 'rejected';
  uploadDate: string;
  url?: string;
}

export interface Loan {
  id: string;
  loanNumber: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  loanPurpose: LoanPurpose;
  propertyType: PropertyType;
  loanAmount: number;
  estimatedValue: number;
  interestRate?: number;
  term?: number;
  subjectProperty: Address;
  properties: Property[];
  employment: Employment[];
  liabilities: Liability[];
  documents: Document[];
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo?: string;
  notes?: string;
}

export interface Task {
  id: string;
  loanId: string;
  loanNumber: string;
  borrowerName: string;
  type: TaskType;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
  assignedTo?: 'ai_agent' | string;
  result?: string;
  requiresApproval: boolean;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  autoAction?: boolean;
  conditionText?: string;
}

export interface AIGoal {
  id: string;
  loanId: string;
  name: string;
  description: string;
  tasks: TaskDefinition[];
  status: 'active' | 'paused' | 'completed';
  createdAt: string;
}

export interface TaskDefinition {
  id: string;
  type: TaskType;
  title: string;
  description: string;
  autoExecute: boolean;
  condition?: string;
}

export interface Decision {
  id: string;
  loanId: string;
  loanNumber: string;
  borrowerName: string;
  type: DecisionType;
  madeBy: 'ai_agent' | string;
  madeAt: string;
  reason: string;
  details?: string;
  conditions?: string[];
  autoExecuted?: boolean;
  previousStatus: LoanStatus;
  newStatus: LoanStatus;
}

// Goal Template for Goal-Driven Loan Management
export interface GoalTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'verification' | 'comprehensive' | 'custom';
  rules: Array<{
    field: string;
    operator: '>' | '<' | '>=' | '<=' | '==' | 'in';
    value: any;
  }>;
  tasks: TaskDefinition[];
  isActive: boolean;
}

export interface PipelineStats {
  total: number;
  draft: number;
  submitted: number;
  in_review: number;
  conditions: number;
  approved: number;
  denied: number;
  closed: number;
}

export interface TaskStats {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
  requiresApproval: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'loan_officer' | 'processor' | 'underwriter' | 'admin';
  avatar?: string;
}
