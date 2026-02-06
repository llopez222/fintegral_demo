import { useState, useCallback, useMemo } from 'react';
import type { Task, TaskStatus, TaskStats, TaskType, AIGoal, Decision, GoalTemplate } from '@/types';

// AI Goal Templates for Goal-Driven Loan Management
const aiGoalTemplates: GoalTemplate[] = [
  {
    id: 'template-initial-review',
    name: 'Initial Loan Review',
    description: 'Complete initial review of loan application including credit check, document review, and property verification.',
    category: 'standard',
    rules: [
      { field: 'loanAmount', operator: '<=', value: 1000000 },
      { field: 'propertyType', operator: 'in', value: ['single_family', 'condo', 'townhouse'] }
    ],
    tasks: [
      { id: 'tt1', type: 'credit_check' as TaskType, title: 'Review Credit Report', description: 'Review credit score, history, and recent inquiries', autoExecute: true },
      { id: 'tt2', type: 'document_review' as TaskType, title: 'Review Income Documents', description: 'Verify W2s, paystubs, and tax returns', autoExecute: true },
      { id: 'tt3', type: 'property_link' as TaskType, title: 'Link Properties', description: 'Link mortgage liabilities to respective properties', autoExecute: true },
    ],
    isActive: true
  },
  {
    id: 'template-remote-work',
    name: 'Remote Work Verification',
    description: 'Verify remote work arrangement and distance to employer.',
    category: 'verification',
    rules: [
      { field: 'propertyType', operator: 'in', value: ['investment', 'secondary'] }
    ],
    tasks: [
      { id: 'tt4', type: 'distance_check' as TaskType, title: 'Check Distance to Employer', description: 'Calculate distance between subject property and employer address', autoExecute: true, condition: 'If distance > 50 miles, request LOE for remote work' },
      { id: 'tt5', type: 'income_verification' as TaskType, title: 'Verify Employment', description: 'Contact employer to verify employment status and remote work arrangement', autoExecute: false },
    ],
    isActive: true
  },
  {
    id: 'template-full-underwriting',
    name: 'Full Underwriting Review',
    description: 'Complete comprehensive underwriting review of all loan aspects.',
    category: 'comprehensive',
    rules: [
      { field: 'loanAmount', operator: '>', value: 1000000 }
    ],
    tasks: [
      { id: 'tt6', type: 'credit_check' as TaskType, title: 'Credit Analysis', description: 'Complete credit analysis including inquiries and derogatory items', autoExecute: true },
      { id: 'tt7', type: 'document_review' as TaskType, title: 'Document Verification', description: 'Verify all required documents are present and valid', autoExecute: true },
      { id: 'tt8', type: 'income_verification' as TaskType, title: 'Income Calculation', description: 'Calculate qualifying income from all sources', autoExecute: true },
      { id: 'tt9', type: 'property_link' as TaskType, title: 'Property Analysis', description: 'Analyze all properties and linked liabilities', autoExecute: true },
    ],
    isActive: true
  }
];

const initialTasks: Task[] = [
  {
    id: 't1',
    loanId: '1',
    loanNumber: 'FINTEGRAL-284756-421',
    borrowerName: 'Andy America',
    type: 'credit_check',
    title: 'Credit Inquiries Review',
    description: 'Review credit inquiries in the last 90 days',
    status: 'completed',
    createdAt: '2026-02-05T10:00:00Z',
    completedAt: '2026-02-05T10:15:00Z',
    assignedTo: 'ai_agent',
    result: 'Found 2 credit inquiries: Capital One (01/15/26) and Auto Loan Inquiry (01/22/26). Both require explanation letters.',
    requiresApproval: true,
    approved: true,
    approvedBy: 'John Smith',
    approvedAt: '2026-02-05T10:30:00Z'
  },
  {
    id: 't2',
    loanId: '1',
    loanNumber: 'FINTEGRAL-284756-421',
    borrowerName: 'Andy America',
    type: 'property_link',
    title: 'Link Mortgage to Property (Lake Ave)',
    description: 'Link mortgage liability to the Baton Rouge property',
    status: 'completed',
    createdAt: '2026-02-05T10:00:00Z',
    completedAt: '2026-02-05T10:05:00Z',
    assignedTo: 'ai_agent',
    result: 'Successfully linked mortgage liability L2 to property P2 (456 Lake Ave, Baton Rouge, LA)',
    requiresApproval: false,
    autoAction: true
  },
  {
    id: 't3',
    loanId: '1',
    loanNumber: 'FINTEGRAL-284756-421',
    borrowerName: 'Andy America',
    type: 'property_link',
    title: 'Link Mortgage to Property (Bay Street)',
    description: 'Link mortgage liability to the subject property',
    status: 'completed',
    createdAt: '2026-02-05T10:00:00Z',
    completedAt: '2026-02-05T10:06:00Z',
    assignedTo: 'ai_agent',
    result: 'Successfully linked mortgage liability L1 to subject property P1 (123 Bay Street, Saint Petersburg, FL)',
    requiresApproval: false,
    autoAction: true
  },
  {
    id: 't4',
    loanId: '1',
    loanNumber: 'FINTEGRAL-284756-421',
    borrowerName: 'Andy America',
    type: 'distance_check',
    title: 'Distance to Employer Check',
    description: 'Verify distance between subject property and employer address',
    status: 'completed',
    createdAt: '2026-02-05T10:00:00Z',
    completedAt: '2026-02-05T10:10:00Z',
    assignedTo: 'ai_agent',
    result: 'Distance from subject property (Saint Petersburg, FL) to employer (Austin, TX) is 1,247 miles. Exceeds 50-mile threshold.',
    requiresApproval: true,
    approved: true,
    approvedBy: 'John Smith',
    approvedAt: '2026-02-05T10:35:00Z',
    conditionText: 'Letter of Explanation required: Distance to employer (1,247 miles) exceeds 50-mile threshold. Please provide explanation for remote work arrangement.'
  },
  {
    id: 't5',
    loanId: '2',
    loanNumber: 'FINTEGRAL-284761-892',
    borrowerName: 'Sarah Johnson',
    type: 'income_verification',
    title: 'Income Verification',
    description: 'Verify employment and income with employer',
    status: 'in_progress',
    createdAt: '2026-02-04T09:00:00Z',
    assignedTo: 'ai_agent',
    requiresApproval: false
  },
  {
    id: 't6',
    loanId: '2',
    loanNumber: 'FINTEGRAL-284761-892',
    borrowerName: 'Sarah Johnson',
    type: 'document_review',
    title: 'Review Bank Statements',
    description: 'Review and verify 2 months of bank statements',
    status: 'pending',
    createdAt: '2026-02-04T09:00:00Z',
    assignedTo: 'ai_agent',
    requiresApproval: false
  },
  {
    id: 't7',
    loanId: '4',
    loanNumber: 'FINTEGRAL-284770-554',
    borrowerName: 'Emily Rodriguez',
    type: 'document_review',
    title: 'Review Tax Returns',
    description: 'Review 2 years of tax returns for self-employment income',
    status: 'completed',
    createdAt: '2026-02-03T14:00:00Z',
    completedAt: '2026-02-05T11:00:00Z',
    assignedTo: 'ai_agent',
    result: 'Tax returns reviewed. Self-employment income verified. Additional documentation needed for business bank statements.',
    requiresApproval: true,
    approved: false,
    conditionText: 'Please provide 3 months of business bank statements to verify self-employment income stability.'
  }
];

const initialGoals: AIGoal[] = [
  {
    id: 'g1',
    loanId: '1',
    name: 'AI Agent Demo - Andy America',
    description: 'Complete initial review of refinance application',
    tasks: [
      {
        id: 'gt1',
        type: 'credit_check',
        title: 'Credit Inquiries Review',
        description: 'Review credit inquiries in the last 90 days',
        autoExecute: true
      },
      {
        id: 'gt2',
        type: 'property_link',
        title: 'Link Mortgage to Property (Lake Ave)',
        description: 'Link mortgage liability to the Baton Rouge property',
        autoExecute: true
      },
      {
        id: 'gt3',
        type: 'property_link',
        title: 'Link Mortgage to Property (Bay Street)',
        description: 'Link mortgage liability to the subject property',
        autoExecute: true
      },
      {
        id: 'gt4',
        type: 'distance_check',
        title: 'Distance to Employer Check',
        description: 'Verify distance between subject property and employer address',
        autoExecute: true,
        condition: 'If distance > 50 miles, create condition for LOE'
      }
    ],
    status: 'completed',
    createdAt: '2026-02-05T10:00:00Z'
  }
];

const initialDecisions: Decision[] = [
  {
    id: 'd1',
    loanId: '1',
    loanNumber: 'FINTEGRAL-284756-421',
    borrowerName: 'Andy America',
    type: 'conditional',
    madeBy: 'ai_agent',
    madeAt: '2026-02-05T10:10:00Z',
    reason: 'Distance to employer exceeds 50-mile threshold',
    details: 'AI Agent detected that the distance from subject property (Saint Petersburg, FL) to employer (Austin, TX) is 1,247 miles, which exceeds the 50-mile threshold for primary residence.',
    conditions: ['Letter of Explanation required for remote work arrangement'],
    autoExecuted: true,
    previousStatus: 'in_review',
    newStatus: 'conditions'
  },
  {
    id: 'd2',
    loanId: '1',
    loanNumber: 'FINTEGRAL-284756-421',
    borrowerName: 'Andy America',
    type: 'approved',
    madeBy: 'John Smith',
    madeAt: '2026-02-05T10:35:00Z',
    reason: 'AI Agent tasks completed and approved',
    details: 'All AI Agent tasks reviewed and approved. Distance condition accepted - borrower works remotely.',
    previousStatus: 'in_review',
    newStatus: 'in_review'
  },
  {
    id: 'd3',
    loanId: '3',
    loanNumber: 'FINTEGRAL-284765-103',
    borrowerName: 'Michael Chen',
    type: 'approved',
    madeBy: 'Jane Doe',
    madeAt: '2026-02-02T16:45:00Z',
    reason: 'All conditions met. Strong credit profile and debt-to-income ratio.',
    details: 'Loan approved with standard conditions. DTI: 28%, LTV: 71%, Credit Score: 780.',
    previousStatus: 'in_review',
    newStatus: 'approved'
  },
  {
    id: 'd4',
    loanId: '5',
    loanNumber: 'FINTEGRAL-284775-667',
    borrowerName: 'David Williams',
    type: 'denied',
    madeBy: 'Jane Doe',
    madeAt: '2026-01-30T10:00:00Z',
    reason: 'Insufficient credit score and high debt-to-income ratio',
    details: 'Credit score below minimum requirement (580). DTI exceeds maximum threshold (52%).',
    previousStatus: 'in_review',
    newStatus: 'denied'
  }
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [goals, setGoals] = useState<AIGoal[]>(initialGoals);
  const [decisions, setDecisions] = useState<Decision[]>(initialDecisions);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask;
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { ...task, ...updates }
        : task
    ));
  }, []);

  const updateTaskStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { 
            ...task, 
            status,
            ...(status === 'completed' ? { completedAt: new Date().toISOString() } : {})
          }
        : task
    ));
  }, []);

  const completeTask = useCallback((id: string, result: string, autoAction?: boolean) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { 
            ...task, 
            status: 'completed' as TaskStatus, 
            completedAt: new Date().toISOString(),
            result,
            autoAction
          }
        : task
    ));
  }, []);

  const approveTask = useCallback((id: string, approvedBy: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { 
            ...task, 
            approved: true,
            approvedBy,
            approvedAt: new Date().toISOString()
          }
        : task
    ));
  }, []);

  const rejectTask = useCallback((id: string, reason?: string) => {
    setTasks(prev => prev.map(task => 
      task.id === id 
        ? { 
            ...task, 
            status: 'failed' as TaskStatus,
            result: reason || 'Task rejected'
          }
        : task
    ));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const createAIGoal = useCallback((loanId: string, loanNumber: string, name: string, description: string, taskDefinitions: { type: TaskType; title: string; description: string; autoExecute: boolean; condition?: string }[]) => {
    const newGoal: AIGoal = {
      id: Math.random().toString(36).substr(2, 9),
      loanId,
      name,
      description,
      tasks: taskDefinitions.map((td, i) => ({
        id: `gt${Date.now()}${i}`,
        ...td
      })),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    setGoals(prev => [newGoal, ...prev]);

    // Create actual tasks from goal
    taskDefinitions.forEach(td => {
      addTask({
        loanId,
        loanNumber,
        borrowerName: '', // Will be filled when loan is fetched
        type: td.type,
        title: td.title,
        description: td.description,
        status: td.autoExecute ? 'in_progress' : 'pending',
        assignedTo: td.autoExecute ? 'ai_agent' : undefined,
        requiresApproval: !td.autoExecute,
        autoAction: td.autoExecute
      });
    });

    return newGoal;
  }, [addTask]);

  // Apply an existing AI Goal template to a loan
  const applyAIGoalTemplate = useCallback((loanId: string, loanNumber: string, borrowerName: string, templateId: string) => {
    const template = aiGoalTemplates.find(t => t.id === templateId);
    if (!template) return null;

    const newGoal: AIGoal = {
      id: Math.random().toString(36).substr(2, 9),
      loanId,
      name: template.name,
      description: template.description,
      tasks: template.tasks.map((td, i) => ({
        id: `gt${Date.now()}${i}`,
        type: td.type,
        title: td.title,
        description: td.description,
        autoExecute: td.autoExecute,
        condition: td.condition
      })),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    setGoals(prev => [newGoal, ...prev]);

    // Create actual tasks from template
    template.tasks.forEach(td => {
      addTask({
        loanId,
        loanNumber,
        borrowerName,
        type: td.type,
        title: td.title,
        description: td.description,
        status: td.autoExecute ? 'in_progress' : 'pending',
        assignedTo: td.autoExecute ? 'ai_agent' : undefined,
        requiresApproval: !td.autoExecute,
        autoAction: td.autoExecute
      });
    });

    return newGoal;
  }, [addTask, aiGoalTemplates]);

  const addDecision = useCallback((decision: Omit<Decision, 'id' | 'madeAt'>) => {
    const newDecision: Decision = {
      ...decision,
      id: Math.random().toString(36).substr(2, 9),
      madeAt: new Date().toISOString(),
    };
    setDecisions(prev => [newDecision, ...prev]);
    return newDecision;
  }, []);

  const bulkApproveTasks = useCallback((ids: string[], approvedBy: string) => {
    setTasks(prev => prev.map(task => 
      ids.includes(task.id)
        ? { 
            ...task, 
            approved: true,
            approvedBy,
            approvedAt: new Date().toISOString()
          }
        : task
    ));
  }, []);

  const bulkCompleteTasks = useCallback((ids: string[], result: string) => {
    setTasks(prev => prev.map(task => 
      ids.includes(task.id)
        ? { 
            ...task, 
            status: 'completed' as TaskStatus,
            completedAt: new Date().toISOString(),
            result
          }
        : task
    ));
  }, []);

  const bulkDeleteTasks = useCallback((ids: string[]) => {
    setTasks(prev => prev.filter(task => !ids.includes(task.id)));
  }, []);

  const stats: TaskStats = useMemo(() => {
    return tasks.reduce((acc, task) => {
      acc.total++;
      acc[task.status]++;
      if (task.requiresApproval && !task.approved) {
        acc.requiresApproval++;
      }
      return acc;
    }, {
      total: 0,
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
      requiresApproval: 0
    } as TaskStats);
  }, [tasks]);

  const getTasksByLoan = useCallback((loanId: string) => {
    return tasks.filter(task => task.loanId === loanId);
  }, [tasks]);

  const getDecisionsByLoan = useCallback((loanId: string) => {
    return decisions.filter(decision => decision.loanId === loanId);
  }, [decisions]);

  const getGoalsByLoan = useCallback((loanId: string) => {
    return goals.filter(goal => goal.loanId === loanId);
  }, [goals]);

  return {
    tasks,
    goals,
    decisions,
    aiGoalTemplates,
    stats,
    addTask,
    updateTask,
    updateTaskStatus,
    completeTask,
    approveTask,
    rejectTask,
    deleteTask,
    createAIGoal,
    applyAIGoalTemplate,
    addDecision,
    bulkApproveTasks,
    bulkCompleteTasks,
    bulkDeleteTasks,
    getTasksByLoan,
    getDecisionsByLoan,
    getGoalsByLoan
  };
}
