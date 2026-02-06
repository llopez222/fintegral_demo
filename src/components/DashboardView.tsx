import { useState, useMemo } from 'react';
import { 
  MoreHorizontal, 
  Filter, 
  CheckSquare, 
  User,
  Calendar,
  DollarSign,
  MapPin,
  ChevronRight,
  Bot,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Plus,
  LayoutGrid,
  List,
  Search,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { Loan, LoanStatus, Task, TaskStatus } from '@/types';

interface DashboardViewProps {
  loans: Loan[];
  tasks: Task[];
  stats: {
    total: number;
    draft: number;
    submitted: number;
    in_review: number;
    conditions: number;
    approved: number;
    denied: number;
    closed: number;
  };
  taskStats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    failed: number;
    requiresApproval: number;
  };
  onLoanClick: (loan: Loan) => void;
  onBulkAction: (action: string, loanIds: string[]) => void;
  onUpdateStatus: (loanId: string, status: LoanStatus) => void;
  onApproveTask: (taskId: string) => void;
  onRejectTask: (taskId: string) => void;
  onCreateAIGoal: (loanId: string) => void;
}

const statusConfig: Record<LoanStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-200' },
  submitted: { label: 'Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' },
  in_review: { label: 'In Review', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-200' },
  conditions: { label: 'Conditions', color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' },
  approved: { label: 'Approved', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200' },
  denied: { label: 'Denied', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-200' },
  closed: { label: 'Closed', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-200' },
};

const taskStatusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: 'Pending', color: 'text-slate-600', bgColor: 'bg-slate-100', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-700', bgColor: 'bg-blue-100', icon: Play },
  completed: { label: 'Completed', color: 'text-emerald-700', bgColor: 'bg-emerald-100', icon: CheckCircle2 },
  failed: { label: 'Failed', color: 'text-red-700', bgColor: 'bg-red-100', icon: XCircle },
};

const loanPurposeLabels: Record<string, string> = {
  purchase: 'Purchase',
  refinance_rate_term: 'Refinance (Rate/Term)',
  refinance_cash_out: 'Refinance (Cash Out)',
  construction: 'Construction',
  home_equity: 'Home Equity',
};

export function DashboardView({ 
  loans, 
  tasks, 
  stats, 
  taskStats,
  onLoanClick, 
  onBulkAction, 
  onUpdateStatus,
  onApproveTask,
  onRejectTask,
  onCreateAIGoal
}: DashboardViewProps) {
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoanForActions, setSelectedLoanForActions] = useState<Loan | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const filteredLoans = useMemo(() => {
    let filtered = loans;
    if (filterStatus !== 'all') {
      filtered = filtered.filter(loan => loan.status === filterStatus);
    }
    if (searchQuery) {
      filtered = filtered.filter(loan => 
        loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loan.loanNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  }, [loans, filterStatus, searchQuery]);

  const loansByStatus = useMemo(() => {
    const grouped: Record<string, Loan[]> = {
      draft: [],
      submitted: [],
      in_review: [],
      conditions: [],
      approved: [],
      denied: [],
      closed: [],
    };
    filteredLoans.forEach(loan => {
      grouped[loan.status].push(loan);
    });
    return grouped;
  }, [filteredLoans]);

  const pendingTasks = tasks.filter(t => t.requiresApproval && !t.approved);
  const recentTasks = tasks.slice(0, 5);

  const toggleSelectAll = () => {
    if (selectedLoans.length === filteredLoans.length) {
      setSelectedLoans([]);
    } else {
      setSelectedLoans(filteredLoans.map(l => l.id));
    }
  };

  const toggleSelectLoan = (loanId: string) => {
    setSelectedLoans(prev => 
      prev.includes(loanId) 
        ? prev.filter(id => id !== loanId)
        : [...prev, loanId]
    );
  };

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
    });
  };

  const LoanCard = ({ loan }: { loan: Loan }) => {
    const loanTasks = tasks.filter(t => t.loanId === loan.id);
    const pendingLoanTasks = loanTasks.filter(t => t.requiresApproval && !t.approved);
    
    return (
      <Card 
        className="cursor-pointer hover:shadow-lg transition-all border-slate-200 hover:border-blue-300"
        onClick={() => onLoanClick(loan)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedLoans.includes(loan.id)}
                onCheckedChange={() => toggleSelectLoan(loan.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="text-xs font-medium text-slate-500">{loan.loanNumber}</span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1 hover:bg-slate-100 rounded">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onLoanClick(loan)}>View Details</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedLoanForActions(loan)}>Quick Actions</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(loan.id, 'approved')}>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                  Approve
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateStatus(loan.id, 'denied')} className="text-red-600">
                  <XCircle className="w-4 h-4 mr-2" />
                  Deny
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <h3 className="font-semibold text-slate-900 mb-1">{loan.borrowerName}</h3>
          
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="secondary" className="text-xs bg-slate-100">
              {loanPurposeLabels[loan.loanPurpose]}
            </Badge>
            {pendingLoanTasks.length > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
                <AlertCircle className="w-3 h-3 mr-1" />
                {pendingLoanTasks.length} tasks
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <DollarSign className="w-4 h-4 text-slate-400" />
              <span className="font-medium">{formatCurrency(loan.loanAmount)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="truncate">{loan.subjectProperty.city}, {loan.subjectProperty.state}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{formatDate(loan.createdAt)}</span>
            </div>
          </div>

          {loanTasks.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-slate-600">{loanTasks.length} AI tasks</span>
                {loanTasks.some(t => t.status === 'completed') && (
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const statusConfig = taskStatusConfig[task.status];
    const StatusIcon = statusConfig.icon;
    const needsApproval = task.requiresApproval && !task.approved && task.status === 'completed';
    
    return (
      <Card className={`border-slate-200 ${needsApproval ? 'border-amber-300 bg-amber-50/30' : ''}`}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              task.assignedTo === 'ai_agent' ? 'bg-blue-100' : 'bg-slate-100'
            }`}>
              {task.assignedTo === 'ai_agent' ? (
                <Bot className="w-4 h-4 text-blue-700" />
              ) : (
                <User className="w-4 h-4 text-slate-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{task.title}</p>
                <Badge className={`${statusConfig.bgColor} ${statusConfig.color} text-xs border-0`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">{task.borrowerName} • {task.loanNumber}</p>
              
              {needsApproval && (
                <div className="mt-2 flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    onClick={() => onApproveTask(task.id)}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-50"
                    onClick={() => onRejectTask(task.id)}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Manage loans and AI tasks in one place</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search loans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="conditions">Conditions</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="denied">Denied</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { key: 'total', label: 'Total', value: stats.total },
          { key: 'draft', label: 'Draft', value: stats.draft },
          { key: 'submitted', label: 'Submitted', value: stats.submitted },
          { key: 'in_review', label: 'In Review', value: stats.in_review },
          { key: 'conditions', label: 'Conditions', value: stats.conditions },
          { key: 'approved', label: 'Approved', value: stats.approved },
          { key: 'denied', label: 'Denied', value: stats.denied },
          { key: 'pending_tasks', label: 'Pending Tasks', value: taskStats.requiresApproval, highlight: true },
        ].map((stat) => (
          <button
            key={stat.key}
            onClick={() => stat.key === 'pending_tasks' ? setActiveTab('tasks') : setFilterStatus(stat.key === 'total' ? 'all' : stat.key)}
            className={`p-3 rounded-lg border text-left transition-colors ${
              (stat.key === 'total' && filterStatus === 'all') || filterStatus === stat.key
                ? 'border-blue-500 bg-blue-50'
                : stat.highlight 
                  ? 'border-amber-300 bg-amber-50'
                  : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <p className={`text-2xl font-bold ${stat.highlight ? 'text-amber-700' : 'text-slate-900'}`}>{stat.value}</p>
            <p className={`text-xs ${stat.highlight ? 'text-amber-600' : 'text-slate-500'}`}>{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selectedLoans.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-700" />
            <span className="font-medium text-blue-900">{selectedLoans.length} selected</span>
          </div>
          <div className="flex-1" />
          <Select onValueChange={(value) => onBulkAction(value, selectedLoans)}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Bulk Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="deny">Deny</SelectItem>
              <SelectItem value="assign">Assign To...</SelectItem>
              <SelectItem value="status">Change Status</SelectItem>
              <SelectItem value="delete" className="text-red-600">Delete</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setSelectedLoans([])}>
            Clear
          </Button>
        </div>
      )}

      {/* Main Content - Loans + Tasks Side by Side */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Loans Section */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Loan Pipeline</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {filteredLoans.length} loans
            </Badge>
          </div>

          {viewMode === 'kanban' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(loansByStatus).map(([status, statusLoans]) => {
                if (statusLoans.length === 0 && filterStatus !== 'all' && filterStatus !== status) return null;
                const config = statusConfig[status as LoanStatus];
                return (
                  <div key={status} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{config.label}</h3>
                        <Badge className={`${config.bgColor} ${config.color} border-0`}>
                          {statusLoans.length}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {statusLoans.map(loan => (
                        <LoanCard key={loan.id} loan={loan} />
                      ))}
                      {statusLoans.length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                          <p className="text-slate-400 text-sm">No loans</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left">
                        <Checkbox 
                          checked={selectedLoans.length === filteredLoans.length && filteredLoans.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Loan Number</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Borrower</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Amount</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Tasks</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredLoans.map((loan) => {
                      const loanTasks = tasks.filter(t => t.loanId === loan.id);
                      return (
                        <tr 
                          key={loan.id} 
                          className="hover:bg-slate-50 cursor-pointer"
                          onClick={() => onLoanClick(loan)}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <Checkbox 
                              checked={selectedLoans.includes(loan.id)}
                              onCheckedChange={() => toggleSelectLoan(loan.id)}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{loan.loanNumber}</td>
                          <td className="px-4 py-3 text-sm text-slate-700">{loan.borrowerName}</td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrency(loan.loanAmount)}</td>
                          <td className="px-4 py-3">
                            <Badge className={`${statusConfig[loan.status].bgColor} ${statusConfig[loan.status].color} border-0`}>
                              {statusConfig[loan.status].label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {loanTasks.length > 0 ? (
                              <div className="flex items-center gap-1">
                                <Bot className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">{loanTasks.length}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1 hover:bg-slate-100 rounded">
                                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onLoanClick(loan)}>View Details</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateStatus(loan.id, 'approved')}>Approve</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onUpdateStatus(loan.id, 'denied')} className="text-red-600">Deny</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        {/* Tasks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">AI Tasks</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {taskStats.requiresApproval} pending
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="pending" className="flex-1">
                Pending
                {taskStats.requiresApproval > 0 && (
                  <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 rounded">{taskStats.requiresApproval}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex-1">AI</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-3">
            {activeTab === 'all' && recentTasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
            
            {activeTab === 'pending' && pendingTasks.length > 0 ? (
              pendingTasks.map(task => (
                <TaskCard key={task.id} task={task} />
              ))
            ) : activeTab === 'pending' ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-4" />
                <p className="text-slate-500 font-medium">No pending tasks</p>
                <p className="text-slate-400 text-sm">All tasks have been reviewed</p>
              </div>
            ) : null}
            
            {activeTab === 'ai' && tasks.filter(t => t.assignedTo === 'ai_agent').map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-blue-700 to-blue-900 text-white">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AI Assistant</h3>
                  <p className="text-sm text-blue-200">Automate your workflow</p>
                </div>
              </div>
              <Button 
                variant="secondary" 
                className="w-full bg-white text-blue-700 hover:bg-blue-50"
                onClick={() => loans.length > 0 && onCreateAIGoal(loans[0].id)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create AI Goal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions Dialog */}
      <Dialog open={!!selectedLoanForActions} onOpenChange={() => setSelectedLoanForActions(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Actions</DialogTitle>
          </DialogHeader>
          {selectedLoanForActions && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="font-medium text-slate-900">{selectedLoanForActions.borrowerName}</p>
                <p className="text-sm text-slate-500">{selectedLoanForActions.loanNumber}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    onUpdateStatus(selectedLoanForActions.id, 'approved');
                    setSelectedLoanForActions(null);
                  }}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                  Approve Loan
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    onUpdateStatus(selectedLoanForActions.id, 'denied');
                    setSelectedLoanForActions(null);
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                  Deny Loan
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    onCreateAIGoal(selectedLoanForActions.id);
                    setSelectedLoanForActions(null);
                  }}
                >
                  <Bot className="w-4 h-4 mr-2 text-blue-600" />
                  AI Goal
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    onLoanClick(selectedLoanForActions);
                    setSelectedLoanForActions(null);
                  }}
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
