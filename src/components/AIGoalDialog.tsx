import { useState } from 'react';
import { 
  Bot, 
  Plus, 
  Minus,
  AlertCircle,
  MapPin,
  FileText,
  CreditCard,
  Briefcase,
  Settings,
  Play,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type { TaskType, Loan } from '@/types';

interface AIGoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan | null;
  onCreateGoal: (loanId: string, loanNumber: string, name: string, description: string, tasks: { type: TaskType; title: string; description: string; autoExecute: boolean; condition?: string }[]) => void;
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

const presetGoals = [
  {
    name: 'Initial Loan Review',
    description: 'Complete initial review of loan application including credit check, document review, and property verification.',
    tasks: [
      { type: 'credit_check' as TaskType, title: 'Review Credit Report', description: 'Review credit score, history, and recent inquiries', autoExecute: true },
      { type: 'document_review' as TaskType, title: 'Review Income Documents', description: 'Verify W2s, paystubs, and tax returns', autoExecute: true },
      { type: 'property_link' as TaskType, title: 'Link Properties', description: 'Link mortgage liabilities to respective properties', autoExecute: true },
    ]
  },
  {
    name: 'Remote Work Verification',
    description: 'Verify remote work arrangement and distance to employer.',
    tasks: [
      { type: 'distance_check' as TaskType, title: 'Check Distance to Employer', description: 'Calculate distance between subject property and employer address', autoExecute: true, condition: 'If distance > 50 miles, request LOE for remote work' },
      { type: 'income_verification' as TaskType, title: 'Verify Employment', description: 'Contact employer to verify employment status and remote work arrangement', autoExecute: false },
    ]
  },
  {
    name: 'Full Underwriting Review',
    description: 'Complete comprehensive underwriting review of all loan aspects.',
    tasks: [
      { type: 'credit_check' as TaskType, title: 'Credit Analysis', description: 'Complete credit analysis including inquiries and derogatory items', autoExecute: true },
      { type: 'document_review' as TaskType, title: 'Document Verification', description: 'Verify all required documents are present and valid', autoExecute: true },
      { type: 'income_verification' as TaskType, title: 'Income Calculation', description: 'Calculate qualifying income from all sources', autoExecute: true },
      { type: 'property_link' as TaskType, title: 'Property Analysis', description: 'Analyze all properties and linked liabilities', autoExecute: true },
    ]
  }
];

export function AIGoalDialog({ open, onOpenChange, loan, onCreateGoal }: AIGoalDialogProps) {
  const [goalName, setGoalName] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [tasks, setTasks] = useState<{ type: TaskType; title: string; description: string; autoExecute: boolean; condition?: string }[]>([
    { type: 'credit_check', title: '', description: '', autoExecute: true }
  ]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const addTask = () => {
    setTasks([...tasks, { type: 'custom', title: '', description: '', autoExecute: false }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, updates: Partial<typeof tasks[0]>) => {
    setTasks(tasks.map((t, i) => i === index ? { ...t, ...updates } : t));
  };

  const loadPreset = (presetIndex: number) => {
    const preset = presetGoals[presetIndex];
    setGoalName(preset.name);
    setGoalDescription(preset.description);
    setTasks(preset.tasks.map(t => ({ ...t })));
    setSelectedPreset(presetIndex.toString());
  };

  const handleSubmit = () => {
    if (loan && goalName && tasks.length > 0) {
      onCreateGoal(loan.id, loan.loanNumber, goalName, goalDescription, tasks);
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setGoalName('');
    setGoalDescription('');
    setTasks([{ type: 'credit_check', title: '', description: '', autoExecute: true }]);
    setSelectedPreset(null);
  };

  const isValid = goalName && tasks.every(t => t.title && t.description);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-900">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-700" />
            </div>
            Create AI Agent Goal
          </DialogTitle>
          <DialogDescription>
            {loan ? (
              <>
                Define tasks for the AI Agent to complete for loan{' '}
                <span className="font-medium text-blue-700">{loan.loanNumber}</span>
                {' '}({loan.borrowerName})
              </>
            ) : (
              'Select a loan first to create an AI Agent goal'
            )}
          </DialogDescription>
        </DialogHeader>

        {loan ? (
          <div className="space-y-6">
            {/* Presets */}
            <div>
              <Label className="mb-2 block">Quick Start Presets</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {presetGoals.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => loadPreset(index)}
                    className={`p-3 text-left border rounded-lg transition-colors ${
                      selectedPreset === index.toString()
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <p className="font-medium text-sm text-slate-900">{preset.name}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{preset.description}</p>
                    <p className="text-xs text-blue-600 mt-2">{preset.tasks.length} tasks</p>
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
                <Label htmlFor="goalDescription">Description</Label>
                <Input 
                  id="goalDescription"
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
                              <Minus className="w-4 h-4" />
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

            {/* Summary */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Goal Summary
              </h4>
              <div className="space-y-1 text-sm">
                <p className="text-blue-700">
                  <span className="font-medium">Goal:</span> {goalName || '(Not set)'}
                </p>
                <p className="text-blue-700">
                  <span className="font-medium">Tasks:</span> {tasks.length}
                </p>
                <p className="text-blue-700">
                  <span className="font-medium">Auto-execute:</span>{' '}
                  {tasks.filter(t => t.autoExecute).length} of {tasks.length} tasks
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-slate-500">
                * Required fields
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={!isValid}
                  className="bg-blue-700 hover:bg-blue-800"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Create AI Goal
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No loan selected</p>
            <p className="text-slate-400 text-sm">Please select a loan first to create an AI Agent goal</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
