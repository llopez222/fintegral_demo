import { useState, useCallback, useMemo } from 'react';
import type { Loan, LoanStatus, PipelineStats } from '@/types';

const generateLoanNumber = () => {
  const prefix = 'FINTEGRAL';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

const initialLoans: Loan[] = [
  {
    id: '1',
    loanNumber: 'FINTEGRAL-284756-421',
    borrowerName: 'Andy America',
    borrowerEmail: 'andy.america@email.com',
    borrowerPhone: '(555) 123-4567',
    loanPurpose: 'refinance_rate_term',
    propertyType: 'single_family',
    loanAmount: 350000,
    estimatedValue: 550000,
    interestRate: 6.5,
    term: 30,
    subjectProperty: {
      street: '123 Bay Street',
      city: 'Saint Petersburg',
      state: 'FL',
      zipCode: '33701'
    },
    properties: [
      {
        id: 'p1',
        address: {
          street: '123 Bay Street',
          city: 'Saint Petersburg',
          state: 'FL',
          zipCode: '33701'
        },
        estimatedValue: 550000,
        occupancyType: 'primary',
        isSubjectProperty: true
      },
      {
        id: 'p2',
        address: {
          street: '456 Lake Ave',
          city: 'Baton Rouge',
          state: 'LA',
          zipCode: '70801'
        },
        estimatedValue: 320000,
        occupancyType: 'investment',
        isSubjectProperty: false
      }
    ],
    employment: [
      {
        employerName: 'Testa Corporation',
        position: 'Software Engineer',
        startDate: '2020-01-15',
        monthlyIncome: 15000,
        employerAddress: {
          street: '789 Tech Blvd',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701'
        },
        isRemote: true
      }
    ],
    liabilities: [
      {
        id: 'l1',
        type: 'mortgage',
        lender: 'First National Bank',
        balance: 280000,
        monthlyPayment: 1800,
        propertyId: 'p1'
      },
      {
        id: 'l2',
        type: 'mortgage',
        lender: 'Southern Mortgage Co',
        balance: 150000,
        monthlyPayment: 950,
        propertyId: 'p2'
      },
      {
        id: 'l3',
        type: 'credit_card',
        lender: 'Visa',
        balance: 8500,
        monthlyPayment: 250
      }
    ],
    documents: [],
    status: 'in_review',
    createdAt: '2026-02-01T10:00:00Z',
    updatedAt: '2026-02-05T15:30:00Z',
    assignedTo: 'John Smith'
  },
  {
    id: '2',
    loanNumber: 'FINTEGRAL-284761-892',
    borrowerName: 'Sarah Johnson',
    borrowerEmail: 'sarah.j@email.com',
    borrowerPhone: '(555) 987-6543',
    loanPurpose: 'purchase',
    propertyType: 'condo',
    loanAmount: 425000,
    estimatedValue: 500000,
    interestRate: 7.0,
    term: 30,
    subjectProperty: {
      street: '789 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      zipCode: '33139'
    },
    properties: [
      {
        id: 'p3',
        address: {
          street: '789 Ocean Drive',
          city: 'Miami',
          state: 'FL',
          zipCode: '33139'
        },
        estimatedValue: 500000,
        occupancyType: 'primary',
        isSubjectProperty: true
      }
    ],
    employment: [
      {
        employerName: 'Miami Tech Solutions',
        position: 'Product Manager',
        startDate: '2019-06-01',
        monthlyIncome: 12000,
        employerAddress: {
          street: '100 Brickell Ave',
          city: 'Miami',
          state: 'FL',
          zipCode: '33131'
        },
        isRemote: false
      }
    ],
    liabilities: [
      {
        id: 'l4',
        type: 'student_loan',
        lender: 'Federal Student Aid',
        balance: 45000,
        monthlyPayment: 350
      },
      {
        id: 'l5',
        type: 'credit_card',
        lender: 'Amex',
        balance: 3200,
        monthlyPayment: 150
      }
    ],
    documents: [],
    status: 'submitted',
    createdAt: '2026-02-03T14:20:00Z',
    updatedAt: '2026-02-04T09:15:00Z',
    assignedTo: 'John Smith'
  },
  {
    id: '3',
    loanNumber: 'FINTEGRAL-284765-103',
    borrowerName: 'Michael Chen',
    borrowerEmail: 'mchen@email.com',
    borrowerPhone: '(555) 456-7890',
    loanPurpose: 'refinance_cash_out',
    propertyType: 'single_family',
    loanAmount: 600000,
    estimatedValue: 850000,
    interestRate: 6.75,
    term: 15,
    subjectProperty: {
      street: '456 Mountain View',
      city: 'Denver',
      state: 'CO',
      zipCode: '80202'
    },
    properties: [
      {
        id: 'p4',
        address: {
          street: '456 Mountain View',
          city: 'Denver',
          state: 'CO',
          zipCode: '80202'
        },
        estimatedValue: 850000,
        occupancyType: 'primary',
        isSubjectProperty: true
      }
    ],
    employment: [
      {
        employerName: 'Denver Financial Group',
        position: 'Financial Analyst',
        startDate: '2018-03-10',
        monthlyIncome: 18000,
        employerAddress: {
          street: '200 Finance St',
          city: 'Denver',
          state: 'CO',
          zipCode: '80205'
        },
        isRemote: false
      }
    ],
    liabilities: [
      {
        id: 'l6',
        type: 'mortgage',
        lender: 'Wells Fargo',
        balance: 420000,
        monthlyPayment: 2800,
        propertyId: 'p4'
      },
      {
        id: 'l7',
        type: 'auto_loan',
        lender: 'Toyota Financial',
        balance: 28000,
        monthlyPayment: 450
      }
    ],
    documents: [],
    status: 'approved',
    createdAt: '2026-01-28T11:00:00Z',
    updatedAt: '2026-02-02T16:45:00Z',
    assignedTo: 'Jane Doe'
  },
  {
    id: '4',
    loanNumber: 'FINTEGRAL-284770-554',
    borrowerName: 'Emily Rodriguez',
    borrowerEmail: 'emily.r@email.com',
    borrowerPhone: '(555) 234-5678',
    loanPurpose: 'purchase',
    propertyType: 'townhouse',
    loanAmount: 380000,
    estimatedValue: 420000,
    interestRate: 7.25,
    term: 30,
    subjectProperty: {
      street: '321 Park Lane',
      city: 'Austin',
      state: 'TX',
      zipCode: '78701'
    },
    properties: [
      {
        id: 'p5',
        address: {
          street: '321 Park Lane',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701'
        },
        estimatedValue: 420000,
        occupancyType: 'primary',
        isSubjectProperty: true
      }
    ],
    employment: [
      {
        employerName: 'Austin Startups Inc',
        position: 'Marketing Director',
        startDate: '2021-02-15',
        monthlyIncome: 9500,
        employerAddress: {
          street: '50 Startup Way',
          city: 'Austin',
          state: 'TX',
          zipCode: '78702'
        },
        isRemote: true
      }
    ],
    liabilities: [
      {
        id: 'l8',
        type: 'credit_card',
        lender: 'Discover',
        balance: 5200,
        monthlyPayment: 200
      }
    ],
    documents: [],
    status: 'conditions',
    createdAt: '2026-02-02T09:30:00Z',
    updatedAt: '2026-02-05T11:20:00Z',
    assignedTo: 'John Smith'
  },
  {
    id: '5',
    loanNumber: 'FINTEGRAL-284775-667',
    borrowerName: 'David Williams',
    borrowerEmail: 'dwilliams@email.com',
    borrowerPhone: '(555) 876-5432',
    loanPurpose: 'home_equity',
    propertyType: 'single_family',
    loanAmount: 150000,
    estimatedValue: 650000,
    interestRate: 8.0,
    term: 20,
    subjectProperty: {
      street: '555 Suburban Dr',
      city: 'Phoenix',
      state: 'AZ',
      zipCode: '85001'
    },
    properties: [
      {
        id: 'p6',
        address: {
          street: '555 Suburban Dr',
          city: 'Phoenix',
          state: 'AZ',
          zipCode: '85001'
        },
        estimatedValue: 650000,
        occupancyType: 'primary',
        isSubjectProperty: true
      }
    ],
    employment: [
      {
        employerName: 'Phoenix Healthcare',
        position: 'Nurse Practitioner',
        startDate: '2017-08-20',
        monthlyIncome: 11000,
        employerAddress: {
          street: '300 Hospital Blvd',
          city: 'Phoenix',
          state: 'AZ',
          zipCode: '85004'
        },
        isRemote: false
      }
    ],
    liabilities: [
      {
        id: 'l9',
        type: 'mortgage',
        lender: 'Chase Bank',
        balance: 320000,
        monthlyPayment: 1900,
        propertyId: 'p6'
      }
    ],
    documents: [],
    status: 'denied',
    createdAt: '2026-01-25T13:45:00Z',
    updatedAt: '2026-01-30T10:00:00Z',
    assignedTo: 'Jane Doe'
  }
];

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>(initialLoans);

  const addLoan = useCallback((loanData: Omit<Loan, 'id' | 'loanNumber' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newLoan: Loan = {
      ...loanData,
      id: Math.random().toString(36).substr(2, 9),
      loanNumber: generateLoanNumber(),
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLoans(prev => [newLoan, ...prev]);
    return newLoan;
  }, []);

  const updateLoan = useCallback((id: string, updates: Partial<Loan>) => {
    setLoans(prev => prev.map(loan => 
      loan.id === id 
        ? { ...loan, ...updates, updatedAt: new Date().toISOString() }
        : loan
    ));
  }, []);

  const updateLoanStatus = useCallback((id: string, status: LoanStatus, notes?: string) => {
    setLoans(prev => prev.map(loan => 
      loan.id === id 
        ? { ...loan, status, notes: notes || loan.notes, updatedAt: new Date().toISOString() }
        : loan
    ));
  }, []);

  const deleteLoan = useCallback((id: string) => {
    setLoans(prev => prev.filter(loan => loan.id !== id));
  }, []);

  const getLoanById = useCallback((id: string) => {
    return loans.find(loan => loan.id === id);
  }, [loans]);

  const bulkUpdateStatus = useCallback((ids: string[], status: LoanStatus) => {
    setLoans(prev => prev.map(loan => 
      ids.includes(loan.id)
        ? { ...loan, status, updatedAt: new Date().toISOString() }
        : loan
    ));
  }, []);

  const bulkDelete = useCallback((ids: string[]) => {
    setLoans(prev => prev.filter(loan => !ids.includes(loan.id)));
  }, []);

  const bulkAssign = useCallback((ids: string[], assignedTo: string) => {
    setLoans(prev => prev.map(loan => 
      ids.includes(loan.id)
        ? { ...loan, assignedTo, updatedAt: new Date().toISOString() }
        : loan
    ));
  }, []);

  const stats: PipelineStats = useMemo(() => {
    return loans.reduce((acc, loan) => {
      acc.total++;
      acc[loan.status]++;
      return acc;
    }, {
      total: 0,
      draft: 0,
      submitted: 0,
      in_review: 0,
      conditions: 0,
      approved: 0,
      denied: 0,
      closed: 0
    } as PipelineStats);
  }, [loans]);

  const getLoansByStatus = useCallback((status: LoanStatus) => {
    return loans.filter(loan => loan.status === status);
  }, [loans]);

  return {
    loans,
    stats,
    addLoan,
    updateLoan,
    updateLoanStatus,
    deleteLoan,
    getLoanById,
    bulkUpdateStatus,
    bulkDelete,
    bulkAssign,
    getLoansByStatus
  };
}
