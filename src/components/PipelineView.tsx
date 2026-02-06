import { useState, useMemo } from 'react';
import { 
  MoreHorizontal, 
  Filter, 
  CheckSquare, 
  DollarSign,
  ChevronRight,
  Bot,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  FileCheck,
  ArrowUpRight,
  Home,
  Users,
  Target,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
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
import type { Loan, LoanStatus, Task, AIGoal } from '@/types';

interface PipelineViewProps {
  loans: Loan[];
  tasks: Task[];
  goals: AIGoal[];
  onLoanClick: (loan: Loan) => void;
  onBulkAction: (action: string, loanIds: string[], data?: any) => void;
  onUpdateStatus: (loanId: string, status: LoanStatus) => void;
  onCreateAIGoal: (loanId: string) => void;
  onAssignLoan?: (loanId: string, userId: string) => void;
}

// Mock users for assignment
const USERS = [
  { id: 'user-1', name: 'John Smith', role: 'Loan Officer', avatar: 'JS' },
  { id: 'user-2', name: 'Sarah Johnson', role: 'Loan Officer', avatar: 'SJ' },
  { id: 'user-3', name: 'Mike Chen', role: 'Processor', avatar: 'MC' },
  { id: 'user-4', name: 'Emily Davis', role: 'Underwriter', avatar: 'ED' },
  { id: 'user-5', name: 'AI Agent', role: 'AI Assistant', avatar: 'AI' },
];

const statusConfig: Record<LoanStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-200' },
  submitted: { label: 'Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-200' },
  in_review: { label: 'In Review', color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-200' },
  conditions: { label: 'Conditions', color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-200' },
  approved: { label: 'Approved', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-200' },
  denied: { label: 'Denied', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-200' },
  closed: { label: 'Closed', color: 'text-slate-600', bgColor: 'bg-slate-100', borderColor: 'border-slate-200' },
};

const loanPurposeLabels: Record<string, string> = {
  purchase: 'Purchase',
  refinance_rate_term: 'Refinance (Rate/Term)',
  refinance_cash_out: 'Refinance (Cash Out)',
  construction: 'Construction',
  home_equity: 'Home Equity',
};

export function PipelineView({ 
  loans, 
  tasks,
  goals,
  onLoanClick, 
  onBulkAction, 
  onUpdateStatus,
  onCreateAIGoal,
  onAssignLoan
}: PipelineViewProps) {
  const [selectedLoans, setSelectedLoans] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLoanForActions, setSelectedLoanForActions] = useState<Loan | null>(null);
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

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

  // Get template info for a loan
  const getLoanTemplateInfo = (loanId: string) => {
    const loanGoals = goals.filter(g => g.loanId === loanId);
    if (loanGoals.length === 0) return null;
    
    const completedTasks = tasks.filter(t => t.loanId === loanId && t.status === 'completed').length;
    const totalTasks = tasks.filter(t => t.loanId === loanId).length;
    
    return {
      templateName: loanGoals[0]?.name || 'AI Goal',
      completedTasks,
      totalTasks,
      isComplete: completedTasks === totalTasks && totalTasks > 0
    };
  };

  // Mortgage-specific stats
  const stats = useMemo(() => {
    const totalVolume = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    const activeLoans = loans.filter(l => ['submitted', 'in_review', 'conditions'].includes(l.status)).length;
    const openTasks = tasks.filter(t => t.requiresApproval && !t.approved).length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const slaAtRisk = loans.filter(l => {
      const daysSinceCreated = Math.floor((Date.now() - new Date(l.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      return l.status === 'in_review' && daysSinceCreated > 14;
    }).length;

    return {
      total: loans.length,
      volume: totalVolume,
      active: activeLoans,
      openTasks,
      completedTasks,
      slaAtRisk
    };
  }, [loans, tasks]);

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

  const handleStatClick = (statType: string) => {
    if (activeStatFilter === statType) {
      setActiveStatFilter(null);
      setFilterStatus('all');
    } else {
      setActiveStatFilter(statType);
      switch (statType) {
        case 'active':
          setFilterStatus('in_review');
          break;
        case 'openTasks':
          // Filter loans with open tasks
          break;
        case 'completed':
          setFilterStatus('approved');
          break;
        case 'slaAtRisk':
          setFilterStatus('in_review');
          break;
        default:
          setFilterStatus('all');
      }
    }
  };

  const handleAssignUser = (userId: string) => {
    if (onAssignLoan) {
      selectedLoans.forEach(loanId => onAssignLoan(loanId, userId));
    }
    onBulkAction('assign', selectedLoans, { userId });
    setAssignDialogOpen(false);
    setSelectedLoans([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-950">Pipeline</h1>
          <p className="text-slate-500">Manage and track all your loan applications</p>
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
        </div>
      </div>

      {/* Stats Cards - Redesigned with Click to Filter */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button 
          onClick={() => handleStatClick('total')}
          className={`text-left rounded-xl p-4 transition-all ${
            activeStatFilter === 'total' 
              ? 'bg-blue-900 ring-2 ring-blue-400 ring-offset-2' 
              : 'bg-gradient-to-br from-blue-800 to-blue-950 hover:shadow-lg hover:scale-[1.02]'
          } text-white`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Home className="w-4 h-4" />
            </div>
            <span className="text-xs text-blue-200">Total Loans</span>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
        </button>

        <button 
          onClick={() => handleStatClick('volume')}
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
            activeStatFilter === 'volume' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-blue-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-xs text-slate-500">Volume</span>
          </div>
          <p className="text-xl font-bold text-blue-950">{formatCurrency(stats.volume)}</p>
        </button>

        <button 
          onClick={() => handleStatClick('active')}
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
            activeStatFilter === 'active' 
              ? 'border-emerald-500 bg-emerald-50' 
              : 'border-emerald-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs text-slate-500">Active</span>
          </div>
          <p className="text-xl font-bold text-emerald-700">{stats.active}</p>
        </button>

        <button 
          onClick={() => handleStatClick('openTasks')}
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
            activeStatFilter === 'openTasks' 
              ? 'border-amber-500 bg-amber-50' 
              : 'border-amber-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-slate-500">Open Tasks</span>
          </div>
          <p className="text-xl font-bold text-amber-700">{stats.openTasks}</p>
        </button>

        <button 
          onClick={() => handleStatClick('completed')}
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
            activeStatFilter === 'completed' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-blue-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-xs text-slate-500">Completed</span>
          </div>
          <p className="text-xl font-bold text-blue-950">{stats.completedTasks}</p>
        </button>

        <button 
          onClick={() => handleStatClick('slaAtRisk')}
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
            stats.slaAtRisk > 0 
              ? activeStatFilter === 'slaAtRisk' ? 'border-red-500 bg-red-50' : 'border-red-200 bg-red-50'
              : activeStatFilter === 'slaAtRisk' ? 'border-slate-500 bg-slate-50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.slaAtRisk > 0 ? 'bg-red-100' : 'bg-slate-100'}`}>
              <Clock className={`w-4 h-4 ${stats.slaAtRisk > 0 ? 'text-red-600' : 'text-slate-500'}`} />
            </div>
            <span className="text-xs text-slate-500">SLA At Risk</span>
          </div>
          <p className={`text-xl font-bold ${stats.slaAtRisk > 0 ? 'text-red-700' : 'text-slate-700'}`}>{stats.slaAtRisk}</p>
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedLoans.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-700" />
            <span className="font-medium text-blue-900">{selectedLoans.length} selected</span>
          </div>
          <div className="flex-1" />
          <Select onValueChange={(value) => {
            if (value === 'assign') {
              setAssignDialogOpen(true);
            } else {
              onBulkAction(value, selectedLoans);
            }
          }}>
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

      {/* Loans List View */}
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
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Purpose</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Template</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Tasks</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredLoans.map((loan) => {
                const loanTasks = tasks.filter(t => t.loanId === loan.id);
                const templateInfo = getLoanTemplateInfo(loan.id);
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
                    <td className="px-4 py-3 text-sm text-slate-600">{loanPurposeLabels[loan.loanPurpose]}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{formatCurrency(loan.loanAmount)}</td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusConfig[loan.status].bgColor} ${statusConfig[loan.status].color} border-0`}>
                        {statusConfig[loan.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {templateInfo ? (
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${templateInfo.isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}
                        >
                          <Target className="w-3 h-3 mr-1" />
                          {templateInfo.isComplete ? templateInfo.templateName : `${templateInfo.completedTasks}/${templateInfo.totalTasks}`}
                        </Badge>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {loanTasks.length > 0 ? (
                        <div className="flex items-center gap-1">
                          <Bot className="w-4 h-4 text-blue-700" />
                          <span className="text-sm">{loanTasks.length}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(loan.createdAt)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-slate-100 rounded">
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onLoanClick(loan)}>View Details</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Assign To</DropdownMenuLabel>
                          {USERS.map(user => (
                            <DropdownMenuItem 
                              key={user.id} 
                              onClick={() => onAssignLoan?.(loan.id, user.id)}
                            >
                              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mr-2 text-xs">
                                {user.avatar}
                              </div>
                              {user.name}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
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
                  <Bot className="w-4 h-4 mr-2 text-blue-700" />
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

      {/* Assign User Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-700" />
              Assign Loans to User
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Assign {selectedLoans.length} selected loan{selectedLoans.length > 1 ? 's' : ''} to:
            </p>
            <div className="space-y-2">
              {USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleAssignUser(user.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-700">{user.avatar}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.role}</p>
                  </div>
                  <Check className="w-5 h-5 text-slate-300" />
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
