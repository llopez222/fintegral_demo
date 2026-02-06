import { useState } from 'react';
import { 
  User,
  Home,
  Briefcase,
  CreditCard,
  FileText,
  Bot,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  Calendar,
  Plus,
  MoreHorizontal,
  Play,
  CheckSquare,
  Sparkles,
  ArrowRight,
  History,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Loan, LoanStatus, Task, AIGoal, Decision, TaskType } from '@/types';

interface LoanDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan | null;
  tasks: Task[];
  decisions: Decision[];
  goals: AIGoal[];
  onUpdateStatus: (loanId: string, status: LoanStatus) => void;
  onApproveTask: (taskId: string) => void;
  onRejectTask: (taskId: string) => void;
  onCreateAIGoal: (loanId: string) => void;
}

const statusConfig: Record<LoanStatus, { label: string; color: string; bgColor: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  submitted: { label: 'Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  in_review: { label: 'In Review', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  conditions: { label: 'Conditions', color: 'text-orange-700', bgColor: 'bg-orange-100' },
  approved: { label: 'Approved', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  denied: { label: 'Denied', color: 'text-red-700', bgColor: 'bg-red-100' },
  closed: { label: 'Closed', color: 'text-slate-600', bgColor: 'bg-slate-100' },
};

const taskTypeLabels: Record<TaskType, string> = {
  credit_check: 'Credit Check',
  document_review: 'Document Review',
  property_link: 'Property Link',
  distance_check: 'Distance Check',
  income_verification: 'Income Verification',
  custom: 'Custom Task',
};

const taskStatusConfig: Record<Task['status'], { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-slate-600', bgColor: 'bg-slate-100', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Play },
  completed: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

const decisionTypeConfig: Record<Decision['type'], { label: string; color: string; bgColor: string }> = {
  approved: { label: 'Approved', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  denied: { label: 'Denied', color: 'text-red-700', bgColor: 'bg-red-100' },
  conditional: { label: 'Conditional', color: 'text-amber-700', bgColor: 'bg-amber-100' },
  auto_action: { label: 'Auto Action', color: 'text-blue-700', bgColor: 'bg-blue-100' },
};

const loanPurposeLabels: Record<string, string> = {
  purchase: 'Purchase',
  refinance_rate_term: 'Refinance (Rate/Term)',
  refinance_cash_out: 'Refinance (Cash Out)',
  construction: 'Construction',
  home_equity: 'Home Equity',
};

export function LoanDetailDialog({ 
  open, 
  onOpenChange, 
  loan, 
  tasks, 
  decisions, 
  goals,
  onUpdateStatus,
  onApproveTask,
  onRejectTask,
  onCreateAIGoal
}: LoanDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!loan) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const pendingApprovals = tasks.filter(t => t.requiresApproval && !t.approved);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] overflow-hidden p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-blue-50 to-white">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-slate-500">{loan.loanNumber}</span>
                <Badge className={`${statusConfig[loan.status].bgColor} ${statusConfig[loan.status].color} border-0`}>
                  {statusConfig[loan.status].label}
                </Badge>
                {pendingApprovals.length > 0 && (
                  <Badge className="bg-amber-100 text-amber-700 border-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {pendingApprovals.length} pending
                  </Badge>
                )}
              </div>
              <DialogTitle className="text-2xl text-blue-950">{loan.borrowerName}</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onCreateAIGoal(loan.id)}
                className="text-blue-700 border-blue-200 hover:bg-blue-50"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Goal
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Actions
                    <MoreHorizontal className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onUpdateStatus(loan.id, 'approved')}>
                    <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                    Approve Loan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus(loan.id, 'denied')}>
                    <XCircle className="w-4 h-4 mr-2 text-red-600" />
                    Deny Loan
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onUpdateStatus(loan.id, 'conditions')}>
                    <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
                    Add Conditions
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <div className="flex h-[calc(90vh-140px)]">
            {/* Sidebar */}
            <div className="w-48 border-r bg-slate-50">
              <TabsList className="flex flex-col h-auto bg-transparent p-2 space-y-1">
                <TabsTrigger value="overview" className="justify-start w-full data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="tasks" className="justify-start w-full data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tasks
                  {tasks.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-blue-100 text-blue-700">
                      {tasks.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="ai-goals" className="justify-start w-full data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Goals
                  {goals.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-blue-100 text-blue-700">
                      {goals.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history" className="justify-start w-full data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  <History className="w-4 h-4 mr-2" />
                  History
                  {decisions.length > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-blue-100 text-blue-700">
                      {decisions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="property" className="justify-start w-full data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  <Home className="w-4 h-4 mr-2" />
                  Property
                </TabsTrigger>
                <TabsTrigger value="employment" className="justify-start w-full data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  <Briefcase className="w-4 h-4 mr-2" />
                  Employment
                </TabsTrigger>
                <TabsTrigger value="liabilities" className="justify-start w-full data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Liabilities
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Main Content */}
            <ScrollArea className="flex-1 p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-6">
                {/* Loan Summary */}
                <Card className="border-blue-100">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-950">Loan Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Loan Purpose</p>
                        <p className="font-medium">{loanPurposeLabels[loan.loanPurpose]}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Property Type</p>
                        <p className="font-medium capitalize">{loan.propertyType.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Loan Amount</p>
                        <p className="font-medium">{formatCurrency(loan.loanAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Estimated Value</p>
                        <p className="font-medium">{formatCurrency(loan.estimatedValue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Interest Rate</p>
                        <p className="font-medium">{loan.interestRate ? `${loan.interestRate}%` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Term</p>
                        <p className="font-medium">{loan.term ? `${loan.term} years` : '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">LTV</p>
                        <p className="font-medium">
                          {((loan.loanAmount / loan.estimatedValue) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Created</p>
                        <p className="font-medium">{formatDate(loan.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Borrower Info */}
                <Card className="border-blue-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-950">
                      <User className="w-5 h-5" />
                      Borrower Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-slate-500">Full Name</p>
                        <p className="font-medium">{loan.borrowerName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Email</p>
                        <p className="font-medium">{loan.borrowerEmail || '-'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">Phone</p>
                        <p className="font-medium">{loan.borrowerPhone || '-'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Subject Property */}
                <Card className="border-blue-100">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-blue-950">
                      <MapPin className="w-5 h-5" />
                      Subject Property
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Home className="w-6 h-6 text-blue-700" />
                      </div>
                      <div>
                        <p className="font-medium">{loan.subjectProperty.street}</p>
                        <p className="text-slate-600">
                          {loan.subjectProperty.city}, {loan.subjectProperty.state} {loan.subjectProperty.zipCode}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                {decisions.length > 0 && (
                  <Card className="border-blue-100">
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-950 flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {decisions.slice(0, 3).map((decision) => (
                          <div key={decision.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                            {decision.type === 'approved' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            ) : decision.type === 'denied' ? (
                              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            )}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{decision.reason}</p>
                              <p className="text-xs text-slate-500">
                                {decision.madeBy === 'ai_agent' ? 'AI Agent' : decision.madeBy} • {formatRelativeTime(decision.madeAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {decisions.length > 3 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full text-blue-700"
                            onClick={() => setActiveTab('history')}
                          >
                            View all {decisions.length} decisions
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Tasks Tab */}
              <TabsContent value="tasks" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-950">AI Agent & Manual Tasks</h3>
                  <Button variant="outline" size="sm" onClick={() => onCreateAIGoal(loan.id)} className="border-blue-200 text-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Apply AI Goal
                  </Button>
                </div>

                {tasks.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-blue-200 rounded-lg">
                    <CheckSquare className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                    <p className="text-slate-500">No tasks yet</p>
                    <p className="text-slate-400 text-sm mb-4">Apply an AI Goal to generate tasks</p>
                    <Button onClick={() => onCreateAIGoal(loan.id)} className="bg-blue-800 hover:bg-blue-900">
                      <Bot className="w-4 h-4 mr-2" />
                      Apply AI Goal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => {
                      const statusCfg = taskStatusConfig[task.status];
                      const StatusIcon = statusCfg.icon;
                      const needsApproval = task.requiresApproval && !task.approved && task.status === 'completed';
                      const isAI = task.assignedTo === 'ai_agent';
                      
                      return (
                        <Card key={task.id} className={`border-slate-200 ${needsApproval ? 'border-amber-300 bg-amber-50/30' : ''}`}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isAI ? 'bg-blue-100' : 'bg-slate-100'
                              }`}>
                                {isAI ? (
                                  <Bot className="w-5 h-5 text-blue-700" />
                                ) : (
                                  <User className="w-5 h-5 text-slate-600" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-medium">{task.title}</h4>
                                      {/* AI/Manual Badge */}
                                      {isAI ? (
                                        <Badge className="bg-blue-100 text-blue-700 text-xs">
                                          <Sparkles className="w-3 h-3 mr-1" />
                                          AI
                                        </Badge>
                                      ) : (
                                        <Badge variant="secondary" className="text-xs">
                                          <User className="w-3 h-3 mr-1" />
                                          Manual
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-sm text-slate-500">{taskTypeLabels[task.type]}</p>
                                  </div>
                                  <Badge className={`${statusCfg.bgColor} ${statusCfg.color} border-0`}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusCfg.label}
                                  </Badge>
                                </div>
                                
                                <p className="text-sm text-slate-600 mt-2">{task.description}</p>
                                
                                {task.result && (
                                  <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                                    <p className="text-sm text-slate-700">{task.result}</p>
                                  </div>
                                )}

                                {needsApproval && (
                                  <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <div className="flex items-center gap-2 text-amber-700 mb-2">
                                      <AlertCircle className="w-4 h-4" />
                                      <span className="font-medium">Pending Approval</span>
                                    </div>
                                    {task.conditionText && (
                                      <p className="text-sm text-amber-600 mb-3">{task.conditionText}</p>
                                    )}
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                        onClick={() => onApproveTask(task.id)}
                                      >
                                        <CheckCircle2 className="w-4 h-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        className="border-red-300 text-red-700 hover:bg-red-50"
                                        onClick={() => onRejectTask(task.id)}
                                      >
                                        <XCircle className="w-4 h-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  </div>
                                )}

                                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                  <span>Created {formatDate(task.createdAt)}</span>
                                  {task.completedAt && (
                                    <span>Completed {formatDate(task.completedAt)}</span>
                                  )}
                                  {task.autoAction && (
                                    <Badge className="bg-blue-100 text-blue-700">
                                      Auto-executed
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* AI Goals Tab */}
              <TabsContent value="ai-goals" className="mt-0 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-blue-950">AI Goals Applied to This Loan</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-500">Goals configured from AI Goals page</p>
                    <Button onClick={() => onCreateAIGoal(loan.id)} className="bg-blue-800 hover:bg-blue-900">
                      <Plus className="w-4 h-4 mr-2" />
                      Apply Goal
                    </Button>
                  </div>
                </div>

                {goals.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-blue-200 rounded-lg">
                    <Sparkles className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                    <p className="text-slate-500">No AI Goals applied yet</p>
                    <p className="text-slate-400 text-sm mb-4">Apply a pre-configured AI Goal from the sidebar to automate loan processing tasks</p>
                    <Button onClick={() => onCreateAIGoal(loan.id)} className="bg-blue-800 hover:bg-blue-900">
                      <Sparkles className="w-4 h-4 mr-2" />
                      Apply AI Goal
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => {
                      // Match goal tasks with actual tasks
                      const matchedTasks = goal.tasks.map(goalTask => {
                        const actualTask = tasks.find(t => 
                          t.title === goalTask.title || 
                          (t.type === goalTask.type && t.loanId === loan.id)
                        );
                        return {
                          ...goalTask,
                          actualTask,
                          status: actualTask?.status || 'pending'
                        };
                      });
                      
                      const completedCount = matchedTasks.filter(t => t.status === 'completed').length;
                      const progress = Math.round((completedCount / matchedTasks.length) * 100);
                      
                      return (
                        <Card key={goal.id} className="border-blue-100">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Sparkles className="w-6 h-6 text-blue-700" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-medium text-lg text-blue-950">{goal.name}</h4>
                                    <p className="text-sm text-slate-500">{goal.description}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge 
                                      className={
                                        goal.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                                        goal.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-700'
                                      }
                                    >
                                      {goal.status.charAt(0).toUpperCase() + goal.status.slice(1)}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-4">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-slate-600">Progress</span>
                                    <span className="font-medium text-blue-700">{completedCount}/{matchedTasks.length} tasks</span>
                                  </div>
                                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-blue-600 rounded-full transition-all"
                                      style={{ width: `${progress}%` }}
                                    />
                                  </div>
                                </div>

                                <Separator className="my-4" />

                                <div className="space-y-2">
                                  <p className="text-sm font-medium">Tasks to Complete</p>
                                  <div className="space-y-2">
                                    {matchedTasks.map((task, idx) => (
                                      <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border ${
                                        task.status === 'completed' 
                                          ? 'bg-emerald-50 border-emerald-200' 
                                          : task.status === 'in_progress'
                                          ? 'bg-blue-50 border-blue-200'
                                          : 'bg-slate-50 border-slate-200'
                                      }`}>
                                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                          task.status === 'completed'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : task.status === 'in_progress'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-slate-200 text-slate-600'
                                        }`}>
                                          {task.status === 'completed' ? (
                                            <CheckCircle2 className="w-4 h-4" />
                                          ) : (
                                            idx + 1
                                          )}
                                        </span>
                                        <div className="flex-1">
                                          <p className={`text-sm font-medium ${
                                            task.status === 'completed' ? 'text-emerald-700 line-through' : 'text-slate-900'
                                          }`}>{task.title}</p>
                                          <p className="text-xs text-slate-500">{task.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          {task.autoExecute ? (
                                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                                              <Play className="w-3 h-3 mr-1" />
                                              Auto
                                            </Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-xs">
                                              <User className="w-3 h-3 mr-1" />
                                              Manual
                                            </Badge>
                                          )}
                                          {task.status === 'completed' && (
                                            <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                              Done
                                            </Badge>
                                          )}
                                          {task.status === 'in_progress' && (
                                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                                              <Play className="w-3 h-3 mr-1" />
                                              In Progress
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                                  <Calendar className="w-4 h-4" />
                                  <span>Created {formatDate(goal.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-0 space-y-4">
                <h3 className="font-semibold text-blue-950 flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Decision History
                </h3>
                
                {decisions.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-blue-200 rounded-lg">
                    <History className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                    <p className="text-slate-500">No decisions recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {decisions.map((decision) => (
                      <Card key={decision.id} className="border-blue-100">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${decisionTypeConfig[decision.type].bgColor}`}>
                              {decision.type === 'approved' ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                              ) : decision.type === 'denied' ? (
                                <XCircle className="w-5 h-5 text-red-700" />
                              ) : decision.type === 'conditional' ? (
                                <AlertCircle className="w-5 h-5 text-amber-700" />
                              ) : (
                                <Bot className="w-5 h-5 text-blue-700" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <Badge className={`${decisionTypeConfig[decision.type].bgColor} ${decisionTypeConfig[decision.type].color} border-0 mb-1`}>
                                    {decisionTypeConfig[decision.type].label}
                                  </Badge>
                                  <p className="font-medium">{decision.reason}</p>
                                </div>
                                <span className="text-sm text-slate-500">{formatRelativeTime(decision.madeAt)}</span>
                              </div>
                              
                              {decision.details && (
                                <p className="text-sm text-slate-600 mt-2">{decision.details}</p>
                              )}

                              {/* Status Change */}
                              <div className="mt-2 flex items-center gap-2 text-sm">
                                <span className={`font-medium ${statusConfig[decision.previousStatus].color}`}>
                                  {statusConfig[decision.previousStatus].label}
                                </span>
                                <ArrowRight className="w-4 h-4 text-slate-400" />
                                <span className={`font-medium ${statusConfig[decision.newStatus].color}`}>
                                  {statusConfig[decision.newStatus].label}
                                </span>
                              </div>

                              {/* AI Decision Details */}
                              {decision.madeBy === 'ai_agent' && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                  <p className="text-xs font-medium text-blue-700 mb-2 flex items-center gap-2">
                                    <Bot className="w-4 h-4" />
                                    AI Analysis Details
                                  </p>
                                  <div className="space-y-2">
                                    {decision.type === 'approved' && (
                                      <>
                                        <div className="flex items-center gap-2 text-sm">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          <span className="text-slate-700">Credit score meets minimum requirements</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          <span className="text-slate-700">DTI ratio within acceptable range (&lt;43%)</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          <span className="text-slate-700">LTV ratio acceptable for loan program</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                          <span className="text-slate-700">No derogatory items in last 24 months</span>
                                        </div>
                                      </>
                                    )}
                                    {decision.type === 'denied' && (
                                      <>
                                        <div className="flex items-center gap-2 text-sm">
                                          <XCircle className="w-4 h-4 text-red-600" />
                                          <span className="text-slate-700">Credit score below minimum threshold</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <XCircle className="w-4 h-4 text-red-600" />
                                          <span className="text-slate-700">High DTI ratio exceeds program limits</span>
                                        </div>
                                      </>
                                    )}
                                    {decision.type === 'conditional' && (
                                      <>
                                        <div className="flex items-center gap-2 text-sm">
                                          <AlertCircle className="w-4 h-4 text-amber-600" />
                                          <span className="text-slate-700">Additional documentation required</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                          <AlertCircle className="w-4 h-4 text-amber-600" />
                                          <span className="text-slate-700">Income verification pending</span>
                                        </div>
                                      </>
                                    )}
                                    {decision.type === 'auto_action' && decision.details && (
                                      <p className="text-sm text-slate-700">{decision.details}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              <div className="mt-3 flex items-center gap-2">
                                {decision.madeBy === 'ai_agent' ? (
                                  <>
                                    <Bot className="w-4 h-4 text-blue-700" />
                                    <span className="text-sm text-slate-600">AI Agent</span>
                                  </>
                                ) : (
                                  <>
                                    <User className="w-4 h-4 text-blue-700" />
                                    <span className="text-sm text-slate-600">{decision.madeBy}</span>
                                  </>
                                )}
                                {decision.autoExecuted && (
                                  <Badge className="bg-blue-100 text-blue-700 text-xs">
                                    Auto-executed
                                  </Badge>
                                )}
                              </div>

                              {decision.conditions && decision.conditions.length > 0 && (
                                <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                                  <p className="text-xs font-medium text-amber-700 mb-2">Conditions</p>
                                  <ul className="space-y-1">
                                    {decision.conditions.map((condition, idx) => (
                                      <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                                        <FileCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        {condition}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Property Tab */}
              <TabsContent value="property" className="mt-0 space-y-4">
                <h3 className="font-semibold text-blue-950">Properties</h3>
                <div className="space-y-4">
                  {loan.properties.map((property, index) => (
                    <Card key={property.id} className="border-blue-100">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Home className="w-6 h-6 text-blue-700" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">
                                {property.isSubjectProperty ? 'Subject Property' : `Property ${index + 1}`}
                              </h4>
                              {property.isSubjectProperty && (
                                <Badge className="bg-blue-100 text-blue-700">Primary</Badge>
                              )}
                            </div>
                            <p className="font-medium text-lg">{property.address.street}</p>
                            <p className="text-slate-600">
                              {property.address.city}, {property.address.state} {property.address.zipCode}
                            </p>
                            <div className="mt-3 grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-slate-500">Estimated Value</p>
                                <p className="font-medium">{formatCurrency(property.estimatedValue)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-slate-500">Occupancy</p>
                                <p className="font-medium capitalize">{property.occupancyType.replace('_', ' ')}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Employment Tab */}
              <TabsContent value="employment" className="mt-0 space-y-4">
                <h3 className="font-semibold text-blue-950">Employment Information</h3>
                {loan.employment.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-blue-200 rounded-lg">
                    <Briefcase className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                    <p className="text-slate-500">No employment information</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {loan.employment.map((emp, index) => (
                      <Card key={index} className="border-blue-100">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Briefcase className="w-6 h-6 text-blue-700" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-lg">{emp.employerName}</h4>
                              <p className="text-slate-600">{emp.position}</p>
                              <div className="mt-3 grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-slate-500">Monthly Income</p>
                                  <p className="font-medium">{formatCurrency(emp.monthlyIncome)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-slate-500">Start Date</p>
                                  <p className="font-medium">{emp.startDate ? formatDate(emp.startDate) : '-'}</p>
                                </div>
                              </div>
                              {emp.employerAddress && (
                                <div className="mt-3">
                                  <p className="text-sm text-slate-500">Employer Address</p>
                                  <p className="text-sm">{emp.employerAddress.street}, {emp.employerAddress.city}, {emp.employerAddress.state}</p>
                                </div>
                              )}
                              {emp.isRemote && (
                                <Badge className="mt-3 bg-blue-100 text-blue-700">
                                  Remote Work
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Liabilities Tab */}
              <TabsContent value="liabilities" className="mt-0 space-y-4">
                <h3 className="font-semibold text-blue-950">Liabilities</h3>
                {loan.liabilities.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-blue-200 rounded-lg">
                    <CreditCard className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                    <p className="text-slate-500">No liabilities recorded</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {loan.liabilities.map((liability) => (
                      <Card key={liability.id} className="border-blue-100">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-blue-700" />
                              </div>
                              <div>
                                <p className="font-medium">{liability.lender}</p>
                                <p className="text-sm text-slate-500 capitalize">{liability.type.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{formatCurrency(liability.balance)}</p>
                              <p className="text-sm text-slate-500">{formatCurrency(liability.monthlyPayment)}/mo</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {/* Summary */}
                    <Card className="bg-blue-50 border-blue-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-blue-900">Total Monthly Payments</span>
                          <span className="font-bold text-lg text-blue-900">
                            {formatCurrency(loan.liabilities.reduce((sum, l) => sum + l.monthlyPayment, 0))}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
