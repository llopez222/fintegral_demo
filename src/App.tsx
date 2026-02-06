import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { Layout } from '@/components/Layout';
import { PipelineView } from '@/components/PipelineView';
import { TasksView } from '@/components/TasksView';
import { AIGoalsView } from '@/components/AIGoalsView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { CreateLoanDialog } from '@/components/CreateLoanDialog';
import { AIGoalDialog } from '@/components/AIGoalDialog';
import { LoanDetailDialog } from '@/components/LoanDetailDialog';
import { Chatbot } from '@/components/Chatbot';
import { useLoans } from '@/hooks/useLoans';
import { useTasks } from '@/hooks/useTasks';
import type { Loan, LoanStatus, Task } from '@/types';

function App() {
  const [currentView, setCurrentView] = useState('pipeline');
  const [createLoanOpen, setCreateLoanOpen] = useState(false);
  const [aiGoalOpen, setAiGoalOpen] = useState(false);
  const [aiGoalLoanId, setAiGoalLoanId] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loanDetailOpen, setLoanDetailOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const { 
    loans, 
    addLoan, 
    updateLoanStatus, 
    bulkUpdateStatus, 
    bulkDelete, 
    bulkAssign,
    getLoanById 
  } = useLoans();

  const { 
    tasks, 
    goals,
    decisions,
    aiGoalTemplates,
    stats: taskStats,
    addTask,
    updateTaskStatus,
    completeTask,
    approveTask,
    rejectTask,
    createAIGoal,
    applyAIGoalTemplate,
    addDecision,
    getTasksByLoan,
    getDecisionsByLoan,
    getGoalsByLoan
  } = useTasks();

  const handleCreateLoan = useCallback((loanData: Omit<Loan, 'id' | 'loanNumber' | 'createdAt' | 'updatedAt' | 'status'>, selectedAIGoalIds?: string[]) => {
    const newLoan = addLoan(loanData);
    
    // If AI Goals were selected, apply them to the new loan
    if (selectedAIGoalIds && selectedAIGoalIds.length > 0) {
      selectedAIGoalIds.forEach(goalId => {
        applyAIGoalTemplate(newLoan.id, newLoan.loanNumber, newLoan.borrowerName, goalId);
      });
      toast.success('Loan created with AI automation', {
        description: `${newLoan.loanNumber} - ${newLoan.borrowerName} (${selectedAIGoalIds.length} AI Goal${selectedAIGoalIds.length > 1 ? 's' : ''} applied)`,
      });
    } else {
      toast.success('Loan created successfully', {
        description: `${newLoan.loanNumber} - ${newLoan.borrowerName}`,
      });
    }
  }, [addLoan, applyAIGoalTemplate]);

  const handleUpdateLoanStatus = useCallback((loanId: string, status: LoanStatus) => {
    const loan = getLoanById(loanId);
    if (loan) {
      const previousStatus = loan.status;
      updateLoanStatus(loanId, status);
      
      const decisionType = status === 'approved' ? 'approved' : 
                          status === 'denied' ? 'denied' : 
                          status === 'conditions' ? 'conditional' : 'auto_action';
      
      addDecision({
        loanId,
        loanNumber: loan.loanNumber,
        borrowerName: loan.borrowerName,
        type: decisionType as any,
        madeBy: 'John Smith',
        reason: `Loan status changed to ${status.replace('_', ' ')}`,
        previousStatus,
        newStatus: status,
      });

      toast.success(`Loan ${status.replace('_', ' ')}`, {
        description: `${loan.loanNumber} - ${loan.borrowerName}`,
      });
    }
  }, [updateLoanStatus, addDecision, getLoanById]);

  const handleBulkAction = useCallback((action: string, loanIds: string[]) => {
    switch (action) {
      case 'approve':
        bulkUpdateStatus(loanIds, 'approved');
        toast.success(`${loanIds.length} loans approved`);
        break;
      case 'deny':
        bulkUpdateStatus(loanIds, 'denied');
        toast.success(`${loanIds.length} loans denied`);
        break;
      case 'delete':
        bulkDelete(loanIds);
        toast.success(`${loanIds.length} loans deleted`);
        break;
      case 'assign':
        bulkAssign(loanIds, 'Jane Doe');
        toast.success(`${loanIds.length} loans assigned to Jane Doe`);
        break;
      default:
        break;
    }
  }, [bulkUpdateStatus, bulkDelete, bulkAssign]);

  const handleLoanClick = useCallback((loan: Loan) => {
    setSelectedLoan(loan);
    setLoanDetailOpen(true);
  }, []);

  const handleCreateAIGoal = useCallback((loanId: string) => {
    setAiGoalLoanId(loanId);
    setAiGoalOpen(true);
  }, []);

  const handleSubmitAIGoal = useCallback((loanId: string, loanNumber: string, name: string, description: string, taskDefinitions: { type: Task['type']; title: string; description: string; autoExecute: boolean; condition?: string }[]) => {
    const loan = getLoanById(loanId);
    if (loan) {
      createAIGoal(loanId, loanNumber, name, description, taskDefinitions);
      
      // Simulate AI completing auto-execute tasks
      taskDefinitions.forEach((taskDef, index) => {
        if (taskDef.autoExecute) {
          setTimeout(() => {
            const newTaskId = `task-${Date.now()}-${index}`;
            addTask({
              loanId,
              loanNumber: loan.loanNumber,
              borrowerName: loan.borrowerName,
              type: taskDef.type,
              title: taskDef.title,
              description: taskDef.description,
              status: 'in_progress',
              assignedTo: 'ai_agent',
              requiresApproval: false,
              autoAction: true,
            });

            // Simulate task completion
            setTimeout(() => {
              completeTask(newTaskId, `AI Agent completed ${taskDef.title}. ${taskDef.condition || ''}`, true);
              
              if (taskDef.condition) {
                addDecision({
                  loanId,
                  loanNumber: loan.loanNumber,
                  borrowerName: loan.borrowerName,
                  type: 'auto_action',
                  madeBy: 'ai_agent',
                  reason: taskDef.title,
                  details: taskDef.condition,
                  autoExecuted: true,
                  previousStatus: loan.status,
                  newStatus: taskDef.condition.includes('condition') ? 'conditions' : loan.status,
                });
                
                if (taskDef.condition.includes('condition')) {
                  updateLoanStatus(loanId, 'conditions');
                }
              }
            }, 2000 + index * 1000);
          }, 500);
        }
      });

      toast.success('AI Goal created', {
        description: `${name} - ${taskDefinitions.length} tasks created`,
      });
    }
  }, [createAIGoal, addTask, completeTask, addDecision, updateLoanStatus, getLoanById]);

  const handleApproveTask = useCallback((taskId: string) => {
    approveTask(taskId, 'John Smith');
    toast.success('Task approved');
  }, [approveTask]);

  const handleRejectTask = useCallback((taskId: string) => {
    rejectTask(taskId, 'Task rejected by loan officer');
    toast.error('Task rejected');
  }, [rejectTask]);

  const handleTaskBulkAction = useCallback((action: string, taskIds: string[]) => {
    // Bulk actions for tasks
    toast.success(`${action} action applied to ${taskIds.length} tasks`);
  }, []);

  const handleUpdateTaskStatus = useCallback((taskId: string, status: Task['status']) => {
    updateTaskStatus(taskId, status);
    toast.success(`Task status updated to ${status.replace('_', ' ')}`);
  }, [updateTaskStatus]);

  const aiGoalLoan = aiGoalLoanId ? (getLoanById(aiGoalLoanId) || null) : null;

  return (
    <Layout 
      currentView={currentView}
      onViewChange={setCurrentView}
      onCreateLoan={() => setCreateLoanOpen(true)}
      onToggleChatbot={() => setChatbotOpen(!chatbotOpen)}
      pendingTasks={taskStats.requiresApproval}
      chatbotOpen={chatbotOpen}
    >
      {currentView === 'pipeline' && (
        <PipelineView
          loans={loans}
          tasks={tasks}
          goals={goals}
          onLoanClick={handleLoanClick}
          onBulkAction={handleBulkAction}
          onUpdateStatus={handleUpdateLoanStatus}
          onCreateAIGoal={handleCreateAIGoal}
        />
      )}
      
      {currentView === 'tasks' && (
        <TasksView
          tasks={tasks}
          onTaskClick={(task) => {
            const loan = getLoanById(task.loanId);
            if (loan) {
              setSelectedLoan(loan);
              setLoanDetailOpen(true);
            }
          }}
          onApproveTask={handleApproveTask}
          onRejectTask={handleRejectTask}
          onBulkAction={handleTaskBulkAction}
          onUpdateTaskStatus={handleUpdateTaskStatus}
        />
      )}

      {currentView === 'ai-goals' && (
        <AIGoalsView
          goals={goals}
          loans={loans}
          onCreateAIGoal={handleCreateAIGoal}
        />
      )}

      {currentView === 'analytics' && (
        <AnalyticsView
          loans={loans}
          tasks={tasks}
          decisions={decisions}
        />
      )}

      <CreateLoanDialog
        open={createLoanOpen}
        onOpenChange={setCreateLoanOpen}
        onSubmit={handleCreateLoan}
        availableAIGoals={aiGoalTemplates}
      />

      <AIGoalDialog
        open={aiGoalOpen}
        onOpenChange={setAiGoalOpen}
        loan={aiGoalLoan}
        onCreateGoal={handleSubmitAIGoal}
      />

      <LoanDetailDialog
        open={loanDetailOpen}
        onOpenChange={setLoanDetailOpen}
        loan={selectedLoan}
        tasks={selectedLoan ? getTasksByLoan(selectedLoan.id) : []}
        decisions={selectedLoan ? getDecisionsByLoan(selectedLoan.id) : []}
        goals={selectedLoan ? getGoalsByLoan(selectedLoan.id) : []}
        onUpdateStatus={handleUpdateLoanStatus}
        onApproveTask={handleApproveTask}
        onRejectTask={handleRejectTask}
        onCreateAIGoal={handleCreateAIGoal}
      />

      <Chatbot
        isOpen={chatbotOpen}
        onClose={() => setChatbotOpen(false)}
        loans={loans}
        tasks={tasks}
        onCreateAIGoal={handleCreateAIGoal}
        onViewLoan={(loanId) => {
          const loan = getLoanById(loanId);
          if (loan) {
            setSelectedLoan(loan);
            setLoanDetailOpen(true);
          }
        }}
      />
    </Layout>
  );
}

export default App;
