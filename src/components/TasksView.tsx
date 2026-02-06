import { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Bot,
  User,
  Filter,
  CheckSquare,
  MoreHorizontal,
  Play,
  ChevronRight,
  FileText,
  RotateCcw,
  LayoutGrid,
  List,
  Search,
  TrendingUp,
  FileCheck,
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
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import type { Task, TaskStatus, TaskType } from '@/types';

interface TasksViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onApproveTask: (taskId: string) => void;
  onRejectTask: (taskId: string) => void;
  onBulkAction: (action: string, taskIds: string[]) => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskStatus) => void;
}

const statusConfig: Record<TaskStatus, { label: string; icon: any; color: string; bgColor: string; borderColor: string }> = {
  pending: { 
    label: 'Pending', 
    icon: Clock, 
    color: 'text-slate-600', 
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-200'
  },
  in_progress: { 
    label: 'In Progress', 
    icon: Play, 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200'
  },
  completed: { 
    label: 'Completed', 
    icon: CheckCircle2, 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200'
  },
  failed: { 
    label: 'Failed', 
    icon: XCircle, 
    color: 'text-red-700', 
    bgColor: 'bg-red-100',
    borderColor: 'border-red-200'
  },
};

const taskTypeLabels: Record<TaskType, string> = {
  credit_check: 'Credit Check',
  document_review: 'Document Review',
  property_link: 'Property Link',
  distance_check: 'Distance Check',
  income_verification: 'Income Verification',
  custom: 'Custom Task',
};

export function TasksView({ tasks, onTaskClick, onApproveTask, onRejectTask, onBulkAction, onUpdateTaskStatus }: TasksViewProps) {
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskForActions, setSelectedTaskForActions] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [activeTab, setActiveTab] = useState('all');
  const [activeStatFilter, setActiveStatFilter] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    if (activeTab === 'pending_approval') {
      filtered = filtered.filter(t => t.requiresApproval && !t.approved);
    } else if (activeTab === 'ai_agent') {
      filtered = filtered.filter(t => t.assignedTo === 'ai_agent');
    } else if (activeTab === 'manual') {
      filtered = filtered.filter(t => t.assignedTo !== 'ai_agent');
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(t => 
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.loanNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [tasks, filterType, searchQuery, activeTab]);

  // Task stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const pendingApproval = tasks.filter(t => t.requiresApproval && !t.approved).length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const aiTasks = tasks.filter(t => t.assignedTo === 'ai_agent').length;
    const manualTasks = tasks.filter(t => t.assignedTo !== 'ai_agent').length;
    const inProgress = tasks.filter(t => t.status === 'in_progress').length;

    return {
      total,
      pendingApproval,
      completed,
      aiTasks,
      manualTasks,
      inProgress
    };
  }, [tasks]);

  const toggleSelectTask = (taskId: string) => {
    setSelectedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleStatClick = (statType: string) => {
    if (activeStatFilter === statType) {
      setActiveStatFilter(null);
      setActiveTab('all');
    } else {
      setActiveStatFilter(statType);
      switch (statType) {
        case 'pendingApproval':
          setActiveTab('pending_approval');
          break;
        case 'completed':
          setActiveTab('all');
          break;
        case 'aiTasks':
          setActiveTab('ai_agent');
          break;
        case 'manualTasks':
          setActiveTab('manual');
          break;
        default:
          setActiveTab('all');
      }
    }
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    if (onUpdateTaskStatus) {
      onUpdateTaskStatus(taskId, newStatus);
    }
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const StatusIcon = statusConfig[task.status].icon;
    const needsApproval = task.requiresApproval && !task.approved && task.status === 'completed';
    const isAI = task.assignedTo === 'ai_agent';
    
    return (
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow border-slate-200 ${
          needsApproval ? 'border-amber-300 bg-amber-50/30' : ''
        }`}
        onClick={() => onTaskClick(task)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Checkbox 
                checked={selectedTasks.includes(task.id)}
                onCheckedChange={() => toggleSelectTask(task.id)}
                onClick={(e) => e.stopPropagation()}
              />
              <Badge className={`${statusConfig[task.status].bgColor} ${statusConfig[task.status].color} border-0`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig[task.status].label}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <button className="p-1 hover:bg-slate-100 rounded">
                  <MoreHorizontal className="w-4 h-4 text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onTaskClick(task)}>View Details</DropdownMenuItem>
                {needsApproval && (
                  <>
                    <DropdownMenuItem onClick={() => onApproveTask(task.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                      Approve
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRejectTask(task.id)}>
                      <XCircle className="w-4 h-4 mr-2 text-red-600" />
                      Reject
                    </DropdownMenuItem>
                  </>
                )}
                {/* Status Change Options */}
                <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'pending')}>
                  <Clock className="w-4 h-4 mr-2 text-slate-600" />
                  Mark Pending
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                  <Play className="w-4 h-4 mr-2 text-blue-600" />
                  Mark In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'completed')}>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedTaskForActions(task)}>
                  Quick Actions
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-start gap-3 mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isAI ? 'bg-blue-100' : 'bg-slate-100'
            }`}>
              {isAI ? (
                <Bot className="w-5 h-5 text-blue-700" />
              ) : (
                <User className="w-5 h-5 text-slate-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm line-clamp-2">{task.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-xs text-slate-500">{taskTypeLabels[task.type]}</p>
                {/* AI/Manual Badge */}
                {isAI ? (
                  <Badge className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    <User className="w-3 h-3 mr-1" />
                    Manual
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{task.description}</p>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2 text-slate-500">
              <FileText className="w-3.5 h-3.5" />
              <span className="font-medium">{task.loanNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <User className="w-3.5 h-3.5" />
              <span>{task.borrowerName}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Created {formatDate(task.createdAt)}</span>
            </div>
          </div>

          {needsApproval && (
            <div className="mt-3 pt-3 border-t border-amber-200">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs font-medium">Pending Approval</span>
              </div>
              {task.conditionText && (
                <p className="text-xs text-amber-600 mt-1 line-clamp-2">{task.conditionText}</p>
              )}
            </div>
          )}

          {task.result && task.status === 'completed' && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-600 line-clamp-3">{task.result}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-950">Tasks</h1>
          <p className="text-slate-500">Manage AI Agent and manual tasks</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit_check">Credit Check</SelectItem>
              <SelectItem value="document_review">Document Review</SelectItem>
              <SelectItem value="property_link">Property Link</SelectItem>
              <SelectItem value="distance_check">Distance Check</SelectItem>
              <SelectItem value="income_verification">Income Verification</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
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
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs text-blue-200">Total Tasks</span>
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
        </button>

        <button 
          onClick={() => handleStatClick('pendingApproval')}
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
            activeStatFilter === 'pendingApproval' 
              ? 'border-amber-500 bg-amber-50' 
              : 'border-amber-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-slate-500">Pending Approval</span>
          </div>
          <p className="text-xl font-bold text-amber-700">{stats.pendingApproval}</p>
        </button>

        <button 
          onClick={() => handleStatClick('completed')}
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
            activeStatFilter === 'completed' 
              ? 'border-emerald-500 bg-emerald-50' 
              : 'border-emerald-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs text-slate-500">Completed</span>
          </div>
          <p className="text-xl font-bold text-emerald-700">{stats.completed}</p>
        </button>

        <button 
          onClick={() => handleStatClick('aiTasks')}
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
            activeStatFilter === 'aiTasks' 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-blue-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-blue-700" />
            </div>
            <span className="text-xs text-slate-500">AI Tasks</span>
          </div>
          <p className="text-xl font-bold text-blue-950">{stats.aiTasks}</p>
        </button>

        <button 
          onClick={() => handleStatClick('manualTasks')}
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
            activeStatFilter === 'manualTasks' 
              ? 'border-slate-500 bg-slate-50' 
              : 'border-slate-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-xs text-slate-500">Manual Tasks</span>
          </div>
          <p className="text-xl font-bold text-slate-700">{stats.manualTasks}</p>
        </button>

        <button 
          onClick={() => handleStatClick('inProgress')}
          className={`text-left rounded-xl p-4 border-2 transition-all hover:shadow-lg hover:scale-[1.02] ${
            activeStatFilter === 'inProgress' 
              ? 'border-purple-500 bg-purple-50' 
              : 'border-purple-200 bg-white'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs text-slate-500">In Progress</span>
          </div>
          <p className="text-xl font-bold text-purple-700">{stats.inProgress}</p>
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="pending_approval">
            Pending Approval
            {stats.pendingApproval > 0 && (
              <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {stats.pendingApproval}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai_agent">AI Agent</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Bulk Actions */}
      {selectedTasks.length > 0 && (
        <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-700" />
            <span className="font-medium text-blue-900">{selectedTasks.length} selected</span>
          </div>
          <div className="flex-1" />
          <Select onValueChange={(value) => onBulkAction(value, selectedTasks)}>
            <SelectTrigger className="w-40 bg-white">
              <SelectValue placeholder="Bulk Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="complete">Mark Complete</SelectItem>
              <SelectItem value="reassign">Reassign</SelectItem>
              <SelectItem value="restart">Restart</SelectItem>
              <SelectItem value="delete" className="text-red-600">Delete</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setSelectedTasks([])}>
            Clear
          </Button>
        </div>
      )}

      {/* Tasks View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
          {filteredTasks.length === 0 && (
            <div className="col-span-full p-12 text-center border-2 border-dashed border-slate-200 rounded-lg">
              <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No tasks found</p>
              <p className="text-slate-400 text-sm">Try adjusting your filters</p>
            </div>
          )}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox 
                      checked={selectedTasks.length === filteredTasks.length && filteredTasks.length > 0}
                      onCheckedChange={() => {
                        if (selectedTasks.length === filteredTasks.length) {
                          setSelectedTasks([]);
                        } else {
                          setSelectedTasks(filteredTasks.map(t => t.id));
                        }
                      }}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Task</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Loan</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Assigned</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTasks.map((task) => (
                  <tr 
                    key={task.id} 
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => onTaskClick(task)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox 
                        checked={selectedTasks.includes(task.id)}
                        onCheckedChange={() => toggleSelectTask(task.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{taskTypeLabels[task.type]}</td>
                    <td className="px-4 py-3 text-sm">
                      <p className="font-medium">{task.loanNumber}</p>
                      <p className="text-xs text-slate-500">{task.borrowerName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${statusConfig[task.status].bgColor} ${statusConfig[task.status].color} border-0`}>
                        {statusConfig[task.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {task.assignedTo === 'ai_agent' ? (
                          <>
                            <Bot className="w-4 h-4 text-blue-700" />
                            <Badge className="bg-blue-100 text-blue-700 text-xs">
                              <Sparkles className="w-3 h-3 mr-1" />
                              AI
                            </Badge>
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4 text-slate-500" />
                            <Badge variant="secondary" className="text-xs">
                              <User className="w-3 h-3 mr-1" />
                              Manual
                            </Badge>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">{formatDate(task.createdAt)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1 hover:bg-slate-100 rounded">
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onTaskClick(task)}>View Details</DropdownMenuItem>
                          {task.requiresApproval && !task.approved && (
                            <>
                              <DropdownMenuItem onClick={() => onApproveTask(task.id)}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => onRejectTask(task.id)}>
                                <XCircle className="w-4 h-4 mr-2 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'pending')}>
                            <Clock className="w-4 h-4 mr-2 text-slate-600" />
                            Mark Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'in_progress')}>
                            <Play className="w-4 h-4 mr-2 text-blue-600" />
                            Mark In Progress
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'completed')}>
                            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                            Mark Complete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Quick Actions Dialog */}
      <Dialog open={!!selectedTaskForActions} onOpenChange={() => setSelectedTaskForActions(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Task Actions</DialogTitle>
            <DialogDescription>
              {selectedTaskForActions?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedTaskForActions && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {selectedTaskForActions.assignedTo === 'ai_agent' ? (
                    <Badge className="bg-blue-100 text-blue-700">
                      <Sparkles className="w-3 h-3 mr-1" />
                      AI Agent
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <User className="w-3 h-3 mr-1" />
                      Manual
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600">{selectedTaskForActions.description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{selectedTaskForActions.loanNumber}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {selectedTaskForActions.requiresApproval && !selectedTaskForActions.approved && (
                  <>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => {
                        onApproveTask(selectedTaskForActions.id);
                        setSelectedTaskForActions(null);
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => {
                        onRejectTask(selectedTaskForActions.id);
                        setSelectedTaskForActions(null);
                      }}
                    >
                      <XCircle className="w-4 h-4 mr-2 text-red-600" />
                      Reject
                    </Button>
                  </>
                )}
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    onTaskClick(selectedTaskForActions);
                    setSelectedTaskForActions(null);
                  }}
                >
                  <ChevronRight className="w-4 h-4 mr-2" />
                  View Details
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => {
                    onBulkAction('restart', [selectedTaskForActions.id]);
                    setSelectedTaskForActions(null);
                  }}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restart
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
