import { useState } from 'react';
import { 
  Bot, 
  Plus, 
  Play,
  CheckCircle2,
  Search,
  TrendingUp,
  Zap,
  Target,
  Sparkles,
  Settings,
  Edit3,
  Trash2,
  Copy,
  ChevronRight,
  CreditCard,
  FileText,
  MapPin,
  Briefcase,
  X,
  User,
  Save,
  Wand2,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import type { AIGoal, Loan, TaskType } from '@/types';

interface AIGoalsViewProps {
  goals: AIGoal[];
  loans: Loan[];
  onCreateAIGoal: (loanId: string) => void;
}

const taskTypeOptions: { value: TaskType; label: string; icon: any; description: string }[] = [
  { 
    value: 'credit_check', 
    label: 'Credit Check', 
    icon: CreditCard,
    description: 'Review credit report and inquiries'
  },
  { 
    value: 'document_review', 
    label: 'Document Review', 
    icon: FileText,
    description: 'Review and verify uploaded documents'
  },
  { 
    value: 'property_link', 
    label: 'Property Link', 
    icon: MapPin,
    description: 'Link mortgages to properties'
  },
  { 
    value: 'distance_check', 
    label: 'Distance Check', 
    icon: MapPin,
    description: 'Verify distance between property and employer'
  },
  { 
    value: 'income_verification', 
    label: 'Income Verification', 
    icon: Briefcase,
    description: 'Verify employment and income'
  },
  { 
    value: 'custom', 
    label: 'Custom Task', 
    icon: Settings,
    description: 'Create a custom task for the AI Agent'
  },
];

const presetTemplates = [
  {
    id: 'initial-review',
    name: 'Initial Loan Review',
    description: 'Complete initial review of loan application including credit check, document review, and property verification.',
    tasks: [
      { type: 'credit_check' as TaskType, title: 'Review Credit Report', description: 'Review credit score, history, and recent inquiries', autoExecute: true },
      { type: 'document_review' as TaskType, title: 'Review Income Documents', description: 'Verify W2s, paystubs, and tax returns', autoExecute: true },
      { type: 'property_link' as TaskType, title: 'Link Properties', description: 'Link mortgage liabilities to respective properties', autoExecute: true },
    ],
    icon: Target,
    color: 'bg-blue-100 text-blue-700'
  },
  {
    id: 'remote-work',
    name: 'Remote Work Verification',
    description: 'Verify remote work arrangement and distance to employer.',
    tasks: [
      { type: 'distance_check' as TaskType, title: 'Check Distance to Employer', description: 'Calculate distance between subject property and employer address', autoExecute: true, condition: 'If distance > 50 miles, request LOE for remote work' },
      { type: 'income_verification' as TaskType, title: 'Verify Employment', description: 'Contact employer to verify employment status and remote work arrangement', autoExecute: false },
    ],
    icon: Zap,
    color: 'bg-amber-100 text-amber-700'
  },
  {
    id: 'full-underwriting',
    name: 'Full Underwriting Review',
    description: 'Complete comprehensive underwriting review of all loan aspects.',
    tasks: [
      { type: 'credit_check' as TaskType, title: 'Credit Analysis', description: 'Complete credit analysis including inquiries and derogatory items', autoExecute: true },
      { type: 'document_review' as TaskType, title: 'Document Verification', description: 'Verify all required documents are present and valid', autoExecute: true },
      { type: 'income_verification' as TaskType, title: 'Income Calculation', description: 'Calculate qualifying income from all sources', autoExecute: true },
      { type: 'property_link' as TaskType, title: 'Property Analysis', description: 'Analyze all properties and linked liabilities', autoExecute: true },
    ],
    icon: TrendingUp,
    color: 'bg-emerald-100 text-emerald-700'
  }
];

// Template storage in memory (would be backend in production)
let savedTemplates: AIGoal[] = [];

export function AIGoalsView({ goals, loans, onCreateAIGoal }: AIGoalsViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<AIGoal | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [tasks, setTasks] = useState<{ type: TaskType; title: string; description: string; autoExecute: boolean; condition?: string }[]>([]);
  const [localTemplates, setLocalTemplates] = useState<AIGoal[]>(savedTemplates);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

  // Combine API goals with local templates
  const allTemplates = [...localTemplates];

  const filteredTemplates = allTemplates.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const stats = {
    total: allTemplates.length,
    active: allTemplates.filter(g => g.status === 'active').length,
    applied: goals.length,
    totalTasks: allTemplates.reduce((sum, g) => sum + g.tasks.length, 0)
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const loadTemplate = (templateId: string) => {
    const template = presetTemplates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setGoalName(template.name);
      setGoalDescription(template.description);
      setTasks(template.tasks.map(t => ({ ...t })));
    }
  };

  const loadGoalForEdit = (goal: AIGoal) => {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalDescription(goal.description);
    setTasks(goal.tasks.map(t => ({ 
      type: t.type, 
      title: t.title, 
      description: t.description, 
      autoExecute: t.autoExecute,
      condition: t.condition
    })));
    setEditDialogOpen(true);
  };

  const addTask = () => {
    setTasks([...tasks, { type: 'custom', title: '', description: '', autoExecute: false }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, updates: Partial<typeof tasks[0]>) => {
    setTasks(tasks.map((t, i) => i === index ? { ...t, ...updates } : t));
  };

  const resetForm = () => {
    setSelectedTemplate(null);
    setGoalName('');
    setGoalDescription('');
    setTasks([]);
    setEditingGoal(null);
  };

  const handleSaveTemplate = () => {
    if (goalName && tasks.length > 0) {
      const newTemplate: AIGoal = {
        id: `template-${Date.now()}`,
        loanId: '',
        name: goalName,
        description: goalDescription,
        tasks: tasks.map((t, i) => ({
          id: `tt-${Date.now()}-${i}`,
          ...t
        })),
        status: 'active',
        createdAt: new Date().toISOString()
      };
      savedTemplates = [newTemplate, ...savedTemplates];
      setLocalTemplates(savedTemplates);
      setCreateDialogOpen(false);
      resetForm();
    }
  };

  const handleUpdateTemplate = () => {
    if (editingGoal && goalName && tasks.length > 0) {
      const updatedTemplates = localTemplates.map(t => 
        t.id === editingGoal.id 
          ? { 
              ...t, 
              name: goalName, 
              description: goalDescription,
              tasks: tasks.map((task, i) => ({
                id: task.type + i,
                type: task.type,
                title: task.title,
                description: task.description,
                autoExecute: task.autoExecute,
                condition: task.condition
              }))
            }
          : t
      );
      savedTemplates = updatedTemplates;
      setLocalTemplates(updatedTemplates);
      setEditDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = localTemplates.filter(t => t.id !== templateId);
    savedTemplates = updatedTemplates;
    setLocalTemplates(updatedTemplates);
  };

  const handleDuplicateTemplate = (template: AIGoal) => {
    const duplicated: AIGoal = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString()
    };
    savedTemplates = [duplicated, ...savedTemplates];
    setLocalTemplates(savedTemplates);
  };

  // AI Task Generation
  const generateTasksWithAI = async () => {
    if (!goalDescription) return;
    
    setIsGeneratingTasks(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate tasks based on description keywords
    const description = goalDescription.toLowerCase();
    const generatedTasks: { type: TaskType; title: string; description: string; autoExecute: boolean; condition?: string }[] = [];
    
    if (description.includes('credit') || description.includes('initial') || description.includes('review')) {
      generatedTasks.push({
        type: 'credit_check',
        title: 'Review Credit Report',
        description: 'Analyze credit score, history, and recent inquiries',
        autoExecute: true
      });
    }
    
    if (description.includes('document') || description.includes('income') || description.includes('initial') || description.includes('review')) {
      generatedTasks.push({
        type: 'document_review',
        title: 'Review Income Documents',
        description: 'Verify W2s, paystubs, tax returns, and other income documentation',
        autoExecute: true
      });
    }
    
    if (description.includes('property') || description.includes('link') || description.includes('initial')) {
      generatedTasks.push({
        type: 'property_link',
        title: 'Link Mortgage to Properties',
        description: 'Associate mortgage liabilities with respective subject and investment properties',
        autoExecute: true
      });
    }
    
    if (description.includes('distance') || description.includes('remote') || description.includes('work')) {
      generatedTasks.push({
        type: 'distance_check',
        title: 'Check Distance to Employer',
        description: 'Calculate distance between subject property and employer address',
        autoExecute: true,
        condition: 'If distance > 50 miles, request Letter of Explanation for remote work arrangement'
      });
    }
    
    if (description.includes('employment') || description.includes('income') || description.includes('verify')) {
      generatedTasks.push({
        type: 'income_verification',
        title: 'Verify Employment',
        description: 'Contact employer to verify employment status, position, and income',
        autoExecute: false
      });
    }
    
    if (description.includes('underwriting') || description.includes('comprehensive') || description.includes('full')) {
      generatedTasks.push(
        {
          type: 'credit_check',
          title: 'Complete Credit Analysis',
          description: 'Deep analysis of credit profile including inquiries, derogatory items, and score factors',
          autoExecute: true
        },
        {
          type: 'document_review',
          title: 'Document Verification',
          description: 'Verify all required documents are present, valid, and consistent',
          autoExecute: true
        },
        {
          type: 'income_verification',
          title: 'Income Calculation',
          description: 'Calculate qualifying income from all sources including base, overtime, bonuses, and other income',
          autoExecute: true
        },
        {
          type: 'property_link',
          title: 'Property Analysis',
          description: 'Analyze all properties and linked liabilities for complete picture',
          autoExecute: true
        }
      );
    }
    
    // If no specific keywords matched, add a generic task
    if (generatedTasks.length === 0) {
      generatedTasks.push({
        type: 'custom',
        title: 'Review Loan Application',
        description: 'Complete review of loan application based on goal requirements',
        autoExecute: false
      });
    }
    
    setTasks(generatedTasks);
    setIsGeneratingTasks(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-blue-950">AI Goals</h1>
          <p className="text-slate-500">Configure AI Agent automation templates - apply them to loans from Pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-48"
            />
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-blue-800 hover:bg-blue-900">
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-800 to-blue-950 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-blue-200" />
              <span className="text-xs text-blue-200">Total Templates</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Play className="w-4 h-4 text-blue-700" />
              <span className="text-xs text-slate-500">Active</span>
            </div>
            <p className="text-xl font-bold text-blue-950">{stats.active}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-slate-500">Applied to Loans</span>
            </div>
            <p className="text-xl font-bold text-emerald-700">{stats.applied}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-500">Total Tasks</span>
            </div>
            <p className="text-xl font-bold text-slate-700">{stats.totalTasks}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Start Templates */}
      <div>
        <h2 className="text-lg font-semibold text-blue-950 mb-4">Quick Start Presets</h2>
        <p className="text-sm text-slate-500 mb-4">Pre-configured AI Goal templates. Click to customize and save as your own.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {presetTemplates.map((template) => (
            <Card key={template.id} className="border-blue-100 hover:border-blue-300 transition-colors cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${template.color}`}>
                    <template.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                      {template.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">{template.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge variant="secondary" className="text-xs">
                        {template.tasks.length} tasks
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-6 text-xs text-blue-700 hover:text-blue-800"
                        onClick={() => {
                          loadTemplate(template.id);
                          setCreateDialogOpen(true);
                        }}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Use as Template
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Saved Templates */}
      <div>
        <h2 className="text-lg font-semibold text-blue-950 mb-4">Saved Goal Templates</h2>
        {filteredTemplates.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-blue-200 rounded-lg">
            <Bot className="w-12 h-12 text-blue-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No saved templates yet</p>
            <p className="text-slate-400 text-sm mb-4">Create templates here, then apply them to loans from the Pipeline</p>
            <Button 
              onClick={() => setCreateDialogOpen(true)}
              className="bg-blue-800 hover:bg-blue-900"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="border-blue-100">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 text-blue-700" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg text-blue-950">{template.name}</h3>
                            <Badge className="bg-blue-100 text-blue-700">Active</Badge>
                          </div>
                          <p className="text-sm text-slate-500">{template.description}</p>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Tasks</p>
                          <p className="font-medium">{template.tasks.length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Auto-execute</p>
                          <p className="font-medium">{template.tasks.filter(t => t.autoExecute).length}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Created</p>
                          <p className="font-medium">{formatDate(template.createdAt)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Status</p>
                          <Badge className="bg-emerald-100 text-emerald-700 text-xs">Active</Badge>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <p className="text-sm font-medium text-slate-700 mb-2">Task Breakdown</p>
                        <div className="space-y-2">
                          {template.tasks.map((task, idx) => (
                            <div key={task.id} className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg">
                              <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
                                {idx + 1}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{task.title}</p>
                                <p className="text-xs text-slate-500">{task.description}</p>
                              </div>
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
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        {loans.length > 0 && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onCreateAIGoal(loans[0].id)}
                          >
                            <ChevronRight className="w-4 h-4 mr-2" />
                            Apply to Loan
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => loadGoalForEdit(template)}
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleDuplicateTemplate(template)}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteTemplate(template.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-900">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-700" />
              </div>
              Create AI Goal Template
            </DialogTitle>
            <DialogDescription>
              Define a reusable AI Goal template. Apply it to loans from the Pipeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Presets */}
            <div>
              <Label className="mb-2 block">Quick Start from Preset</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {presetTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplate(template.id)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedTemplate === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center ${template.color}`}>
                        <template.icon className="w-3 h-3" />
                      </div>
                      <p className="font-medium text-sm text-slate-900">{template.name}</p>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2">{template.description}</p>
                    <p className="text-xs text-blue-600 mt-2">{template.tasks.length} tasks</p>
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Goal Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="goalName">Goal Name *</Label>
                <Input 
                  id="goalName"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g., Initial Loan Review"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="goalDescription">Description</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateTasksWithAI}
                    disabled={!goalDescription || isGeneratingTasks}
                    className="text-blue-700 border-blue-200 hover:bg-blue-50"
                  >
                    {isGeneratingTasks ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Tasks with AI
                      </>
                    )}
                  </Button>
                </div>
                <Input 
                  id="goalDescription"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Describe what this AI goal should accomplish... (e.g., 'Complete initial review including credit check, document verification, and property analysis')"
                />
                <p className="text-xs text-slate-500">
                  The AI will analyze your description and suggest appropriate tasks automatically.
                </p>
              </div>
            </div>

            <Separator />

            {/* Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tasks *</Label>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">{tasks.length} tasks</Badge>
              </div>

              <div className="space-y-4">
                {tasks.map((task, index) => {
                  const taskType = taskTypeOptions.find(t => t.value === task.type);
                  const Icon = taskType?.icon || Settings;
                  
                  return (
                    <Card key={index} className="border-blue-100">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Icon className="w-4 h-4 text-blue-700" />
                            </div>
                            <span className="font-medium text-sm">Task {index + 1}</span>
                          </div>
                          {tasks.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeTask(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Task Type</Label>
                            <Select 
                              value={task.type} 
                              onValueChange={(v) => updateTask(index, { type: v as TaskType })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {taskTypeOptions.map(t => (
                                  <SelectItem key={t.value} value={t.value}>
                                    <div className="flex items-center gap-2">
                                      <t.icon className="w-4 h-4" />
                                      {t.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Task Title *</Label>
                            <Input 
                              value={task.title}
                              onChange={(e) => updateTask(index, { title: e.target.value })}
                              placeholder="e.g., Review Credit Report"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input 
                            value={task.description}
                            onChange={(e) => updateTask(index, { description: e.target.value })}
                            placeholder="Describe what the AI should do..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Condition (Optional)</Label>
                          <Input 
                            value={task.condition || ''}
                            onChange={(e) => updateTask(index, { condition: e.target.value })}
                            placeholder="e.g., If distance > 50 miles, create condition"
                          />
                          <p className="text-xs text-slate-500">
                            Define when this task should trigger additional actions
                          </p>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <Checkbox 
                            id={`autoExecute-${index}`}
                            checked={task.autoExecute}
                            onCheckedChange={(checked) => updateTask(index, { autoExecute: checked as boolean })}
                          />
                          <Label htmlFor={`autoExecute-${index}`} className="text-sm cursor-pointer">
                            Auto-execute this task
                          </Label>
                          {task.autoExecute ? (
                            <Badge className="ml-auto bg-blue-100 text-blue-700">
                              <Play className="w-3 h-3 mr-1" />
                              Auto
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="ml-auto">
                              <User className="w-3 h-3 mr-1" />
                              Manual
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button variant="outline" onClick={addTask} className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-slate-500">
                * Required fields
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setCreateDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveTemplate}
                  disabled={!goalName || tasks.length === 0 || tasks.some(t => !t.title || !t.description)}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Template Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-900">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-blue-700" />
              </div>
              Edit AI Goal Template
            </DialogTitle>
            <DialogDescription>
              Update your AI Goal template.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Goal Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editGoalName">Goal Name *</Label>
                <Input 
                  id="editGoalName"
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  placeholder="e.g., Initial Loan Review"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editGoalDescription">Description</Label>
                <Input 
                  id="editGoalDescription"
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Describe what this AI goal should accomplish..."
                />
              </div>
            </div>

            <Separator />

            {/* Tasks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tasks *</Label>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">{tasks.length} tasks</Badge>
              </div>

              <div className="space-y-4">
                {tasks.map((task, index) => {
                  const taskType = taskTypeOptions.find(t => t.value === task.type);
                  const Icon = taskType?.icon || Settings;
                  
                  return (
                    <Card key={index} className="border-blue-100">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Icon className="w-4 h-4 text-blue-700" />
                            </div>
                            <span className="font-medium text-sm">Task {index + 1}</span>
                          </div>
                          {tasks.length > 1 && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeTask(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Task Type</Label>
                            <Select 
                              value={task.type} 
                              onValueChange={(v) => updateTask(index, { type: v as TaskType })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {taskTypeOptions.map(t => (
                                  <SelectItem key={t.value} value={t.value}>
                                    <div className="flex items-center gap-2">
                                      <t.icon className="w-4 h-4" />
                                      {t.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Task Title *</Label>
                            <Input 
                              value={task.title}
                              onChange={(e) => updateTask(index, { title: e.target.value })}
                              placeholder="e.g., Review Credit Report"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Input 
                            value={task.description}
                            onChange={(e) => updateTask(index, { description: e.target.value })}
                            placeholder="Describe what the AI should do..."
                          />
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                          <Checkbox 
                            id={`editAutoExecute-${index}`}
                            checked={task.autoExecute}
                            onCheckedChange={(checked) => updateTask(index, { autoExecute: checked as boolean })}
                          />
                          <Label htmlFor={`editAutoExecute-${index}`} className="text-sm cursor-pointer">
                            Auto-execute this task
                          </Label>
                          {task.autoExecute ? (
                            <Badge className="ml-auto bg-blue-100 text-blue-700">
                              <Play className="w-3 h-3 mr-1" />
                              Auto
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="ml-auto">
                              <User className="w-3 h-3 mr-1" />
                              Manual
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Button variant="outline" onClick={addTask} className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                <Plus className="w-4 h-4 mr-2" />
                Add Task
              </Button>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-slate-500">
                * Required fields
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setEditDialogOpen(false);
                  resetForm();
                }}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleUpdateTemplate}
                  disabled={!goalName || tasks.length === 0 || tasks.some(t => !t.title || !t.description)}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Update Template
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
