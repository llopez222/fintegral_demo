import { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus,
  Home,
  Briefcase,
  CreditCard,
  DollarSign,
  User,
  FileText,
  Upload,
  FileUp,
  Database,
  ArrowRight,
  CheckCircle2,
  X,
  Sparkles,
  File,
  Folder,
  MessageSquare,
  Tag,
  Edit3,
  Trash2,
  GripVertical,
  Play,
  Bot,
  Lightbulb
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import type { Loan, LoanPurpose, PropertyType, OccupancyType, Employment, Liability, Property, TaskType, GoalTemplate } from '@/types';

interface CreateLoanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (loan: Omit<Loan, 'id' | 'loanNumber' | 'createdAt' | 'updatedAt' | 'status'>, selectedAIGoalIds?: string[]) => void;
  availableAIGoals?: GoalTemplate[];
}

// Default AI Goal templates
const defaultAIGoalTemplates: GoalTemplate[] = [
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
      { id: 't1', type: 'credit_check' as TaskType, title: 'Review Credit Report', description: 'Review credit score, history, and recent inquiries', autoExecute: true },
      { id: 't2', type: 'document_review' as TaskType, title: 'Review Income Documents', description: 'Verify W2s, paystubs, and tax returns', autoExecute: true },
      { id: 't3', type: 'property_link' as TaskType, title: 'Link Properties', description: 'Link mortgage liabilities to respective properties', autoExecute: true },
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
      { id: 't4', type: 'distance_check' as TaskType, title: 'Check Distance to Employer', description: 'Calculate distance between subject property and employer address', autoExecute: true, condition: 'If distance > 50 miles, request LOE for remote work' },
      { id: 't5', type: 'income_verification' as TaskType, title: 'Verify Employment', description: 'Contact employer to verify employment status and remote work arrangement', autoExecute: false },
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
      { id: 't6', type: 'credit_check' as TaskType, title: 'Credit Analysis', description: 'Complete credit analysis including inquiries and derogatory items', autoExecute: true },
      { id: 't7', type: 'document_review' as TaskType, title: 'Document Verification', description: 'Verify all required documents are present and valid', autoExecute: true },
      { id: 't8', type: 'income_verification' as TaskType, title: 'Income Calculation', description: 'Calculate qualifying income from all sources', autoExecute: true },
      { id: 't9', type: 'property_link' as TaskType, title: 'Property Analysis', description: 'Analyze all properties and linked liabilities', autoExecute: true },
    ],
    isActive: true
  }
];

const loanPurposes: { value: LoanPurpose; label: string }[] = [
  { value: 'purchase', label: 'Purchase' },
  { value: 'refinance_rate_term', label: 'Refinance (Rate/Term)' },
  { value: 'refinance_cash_out', label: 'Refinance (Cash Out)' },
  { value: 'construction', label: 'Construction' },
  { value: 'home_equity', label: 'Home Equity' },
];

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'single_family', label: 'Single Family' },
  { value: 'condo', label: 'Condominium' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'multi_family', label: 'Multi-Family' },
  { value: 'commercial', label: 'Commercial' },
];

const occupancyTypes: { value: OccupancyType; label: string }[] = [
  { value: 'primary', label: 'Primary Residence' },
  { value: 'secondary', label: 'Secondary Residence' },
  { value: 'investment', label: 'Investment Property' },
];

const liabilityTypes: { value: Liability['type']; label: string }[] = [
  { value: 'mortgage', label: 'Mortgage' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'auto_loan', label: 'Auto Loan' },
  { value: 'student_loan', label: 'Student Loan' },
  { value: 'other', label: 'Other' },
];

// AI Goal Linking Logic - Matches loans to goals based on metadata
interface LoanMetadata {
  purpose: string;
  amount: number;
  propertyType: string;
  estimatedValue: number;
}

function findBestMatchingGoal(metadata: LoanMetadata, goals: GoalTemplate[]): GoalTemplate | null {
  // Rule-based matching logic
  if (metadata.purpose === 'construction' || metadata.purpose === 'home_equity') {
    return goals.find(g => g.id === 'template-full-underwriting') || null;
  }
  if (metadata.amount > 1000000 || metadata.estimatedValue > 1500000) {
    return goals.find(g => g.id === 'template-full-underwriting') || null;
  }
  if (metadata.propertyType === 'investment') {
    return goals.find(g => g.id === 'template-remote-work') || null;
  }
  // Default to Initial Loan Review
  return goals.find(g => g.id === 'template-initial-review') || null;
}

// Extract metadata from uploaded document (simulated)
function extractDocumentMetadata(file: File): LoanMetadata {
  // In production, this would use OCR and AI to extract real data
  // For now, we simulate based on file name patterns
  const fileName = file.name.toLowerCase();
  
  return {
    purpose: fileName.includes('purchase') ? 'purchase' : 
            fileName.includes('refi') ? 'refinance_rate_term' :
            fileName.includes('construction') ? 'construction' : 'purchase',
    amount: 350000,
    propertyType: 'single_family',
    estimatedValue: 500000
  };
}

// Task type for custom tasks
type CustomTask = {id: string; type: TaskType; title: string; description: string; autoExecute: boolean; condition?: string};

// AI Goal Selection Component
interface AIGoalSelectionViewProps {
  uploadedFile: File | null;
  aiGoals: GoalTemplate[];
  selectedTemplateId: string;
  customTasks: CustomTask[];
  onTemplateChange: (templateId: string) => void;
  onTasksChange: (tasks: CustomTask[]) => void;
  onContinue: () => void;
  onBack: () => void;
  onCancel: () => void;
}

function AIGoalSelectionView({
  uploadedFile,
  aiGoals,
  selectedTemplateId,
  customTasks,
  onTemplateChange,
  onTasksChange,
  onContinue,
  onBack,
  onCancel
}: AIGoalSelectionViewProps) {
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState('');

  const selectedTemplate = aiGoals.find(g => g.id === selectedTemplateId) || aiGoals[0];

  const handleAddTask = () => {
    const newTask = {
      id: `custom-${Date.now()}`,
      type: 'custom' as TaskType,
      title: 'New Custom Task',
      description: '',
      autoExecute: false
    };
    onTasksChange([...customTasks, newTask]);
  };

  const handleRemoveTask = (taskId: string) => {
    onTasksChange(customTasks.filter(t => t.id !== taskId));
  };

  const handleEditTask = (taskId: string, newTitle: string) => {
    onTasksChange(customTasks.map(t => 
      t.id === taskId ? { ...t, title: newTitle } : t
    ));
    setEditingTaskId(null);
  };

  const handleToggleAuto = (taskId: string) => {
    onTasksChange(customTasks.map(t => 
      t.id === taskId ? { ...t, autoExecute: !t.autoExecute } : t
    ));
  };

  return (
    <DialogContent className="sm:max-w-5xl max-h-[95vh] overflow-auto p-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Review Document & Configure AI Tasks</h2>
              <p className="text-sm text-slate-500">Verify the imported data and customize automation tasks</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={onContinue} className="bg-blue-800 hover:bg-blue-900">
              <Sparkles className="w-4 h-4 mr-2" />
              Continue with {customTasks.length} Tasks
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-0">
        {/* Left Side - Document Preview */}
        <div className="col-span-5 bg-slate-50 border-r border-slate-200 p-6">
          {/* Document Preview Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* PDF Preview Area */}
            <div className="aspect-[3/4] bg-slate-100 flex items-center justify-center relative">
              <div className="text-center p-8">
                <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-10 h-10 text-red-600" />
                </div>
                <p className="text-slate-500 font-medium">1003 Uniform Residential</p>
                <p className="text-slate-400 text-sm">Loan Application</p>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-3 py-1 rounded-full">
                Page 1 of 4
              </div>
            </div>
            
            {/* Document Info */}
            <div className="p-4 border-t border-slate-100">
              <p className="font-medium text-slate-900 truncate">{uploadedFile?.name || '1003_Application.pdf'}</p>
              <p className="text-sm text-slate-500">{(uploadedFile?.size ? (uploadedFile.size / 1024).toFixed(1) : '245.3')} KB • PDF</p>
            </div>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-2 mt-4">
            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
          </div>
        </div>

        {/* Right Side - Metadata & Tasks */}
        <div className="col-span-7 p-6 space-y-6">
          {/* Document Metadata */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
              <File className="w-4 h-4" />
              <span>Document Details</span>
            </div>

            {/* Document Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Document Name</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={uploadedFile?.name?.replace('.pdf', '') || '1003_Application'}
                  className="bg-slate-50"
                  readOnly
                />
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Edit3 className="w-4 h-4 text-slate-400" />
                </Button>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tags</Label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer">
                  <Tag className="w-3 h-3 mr-1" />1003
                </Badge>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer">
                  <Tag className="w-3 h-3 mr-1" />Application
                </Badge>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200 cursor-pointer">
                  <Tag className="w-3 h-3 mr-1" />Purchase
                </Badge>
                <Button variant="outline" size="sm" className="h-6 text-xs border-dashed">
                  <Plus className="w-3 h-3 mr-1" />Add Tag
                </Button>
              </div>
            </div>

            {/* Folder */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Folder</Label>
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <Folder className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-700">Loans / 2026 / February / Applications</span>
                <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs text-blue-600">Change</Button>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Comments</Label>
              <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-slate-600">Imported from 1003 PDF. Borrower information extracted automatically.</p>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0 h-6 w-6">
                  <Edit3 className="w-3 h-3 text-slate-400" />
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6">
            {/* AI Tasks Section */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">AI Automation Tasks</h3>
                  <p className="text-sm text-slate-500">Tasks the AI Agent will perform on this loan</p>
                </div>
              </div>
              <Badge className="bg-blue-100 text-blue-700">{customTasks.length} tasks</Badge>
            </div>

            {/* Template Selector */}
            <div className="mb-4">
              <Label className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2 block">Template</Label>
              <Select value={selectedTemplateId} onValueChange={onTemplateChange}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiGoals.map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      <div className="flex items-center gap-2">
                        <span>{goal.name}</span>
                        <span className="text-slate-400">({goal.tasks.length} tasks)</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Editable Task List */}
            <div className="space-y-2">
              {customTasks.map((task, idx) => (
                <div 
                  key={task.id} 
                  className="group flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-300 transition-colors"
                >
                  <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                  
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium shrink-0">
                    {idx + 1}
                  </span>
                  
                  {editingTaskId === task.id ? (
                    <Input 
                      value={editTaskTitle}
                      onChange={(e) => setEditTaskTitle(e.target.value)}
                      onBlur={() => handleEditTask(task.id, editTaskTitle)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleEditTask(task.id, editTaskTitle);
                        }
                      }}
                      className="flex-1 h-8"
                      autoFocus
                    />
                  ) : (
                    <span 
                      className="flex-1 text-sm text-slate-700 cursor-pointer"
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setEditTaskTitle(task.title);
                      }}
                    >
                      {task.title}
                    </span>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleAuto(task.id)}
                    className={`h-7 text-xs ${task.autoExecute ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    {task.autoExecute ? 'Auto' : 'Manual'}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveTask(task.id)}
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add Task Button */}
            <Button 
              variant="outline" 
              onClick={handleAddTask}
              className="w-full mt-3 border-dashed border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-300"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Task
            </Button>

            {/* Suggestion Banner */}
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
              <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800">
                  <span className="font-medium">AI Suggestion:</span> Based on this 1003 application, 
                  we recommend the <strong>"{selectedTemplate?.name}"</strong> template. 
                  You can customize tasks above or switch templates.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export function CreateLoanDialog({ open, onOpenChange, onSubmit, availableAIGoals = [] }: CreateLoanDialogProps) {
  const aiGoals = availableAIGoals.length > 0 ? availableAIGoals : defaultAIGoalTemplates;
  
  // Form state
  const [creationMethod, setCreationMethod] = useState<'manual' | 'mismo' | 'pdf' | 'los' | null>(null);
  const [activeTab, setActiveTab] = useState('borrower');
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerEmail, setBorrowerEmail] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [loanPurpose, setLoanPurpose] = useState<LoanPurpose>('purchase');
  const [propertyType, setPropertyType] = useState<PropertyType>('single_family');
  const [loanAmount, setLoanAmount] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [term, setTerm] = useState('30');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  
  // AI Goal Selection state
  const [showAIGoalSelection, setShowAIGoalSelection] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(aiGoals[0]?.id || '');
  const [customTasks, setCustomTasks] = useState(aiGoals[0]?.tasks || []);

  // Property, Employment, Liability state
  const [properties, setProperties] = useState<Property[]>([
    { id: 'temp-1', address: { street: '', city: '', state: '', zipCode: '' }, estimatedValue: 0, occupancyType: 'primary', isSubjectProperty: true },
  ]);
  const [employment, setEmployment] = useState<Employment[]>([
    { employerName: '', position: '', startDate: '', monthlyIncome: 0 },
  ]);
  const [liabilities, setLiabilities] = useState<Liability[]>([]);

  // Update custom tasks when template changes
  useEffect(() => {
    const template = aiGoals.find(g => g.id === selectedTemplateId);
    if (template) {
      setCustomTasks([...template.tasks.map(t => ({ ...t }))]);
    }
  }, [selectedTemplateId, aiGoals]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const addProperty = () => {
    setProperties([...properties, {
      id: `temp-${Date.now()}`,
      address: { street: '', city: '', state: '', zipCode: '' },
      estimatedValue: 0,
      occupancyType: 'investment',
      isSubjectProperty: false,
    }]);
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  const updateProperty = (index: number, updates: Partial<Property>) => {
    setProperties(properties.map((p, i) => i === index ? { ...p, ...updates } : p));
  };

  const addEmployment = () => {
    setEmployment([...employment, { employerName: '', position: '', startDate: '', monthlyIncome: 0 }]);
  };

  const removeEmployment = (index: number) => {
    setEmployment(employment.filter((_, i) => i !== index));
  };

  const updateEmployment = (index: number, updates: Partial<Employment>) => {
    setEmployment(employment.map((e, i) => i === index ? { ...e, ...updates } : e));
  };

  const addLiability = () => {
    setLiabilities([...liabilities, { id: `temp-${Date.now()}`, type: 'credit_card', lender: '', balance: 0, monthlyPayment: 0 }]);
  };

  const removeLiability = (index: number) => {
    setLiabilities(liabilities.filter((_, i) => i !== index));
  };

  const updateLiability = (index: number, updates: Partial<Liability>) => {
    setLiabilities(liabilities.map((l, i) => i === index ? { ...l, ...updates } : l));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      // AI Goal Linking: Extract metadata and find best matching goal
      const metadata = extractDocumentMetadata(file);
      const bestGoal = findBestMatchingGoal(metadata, aiGoals);
      
      if (bestGoal) {
        setSelectedTemplateId(bestGoal.id);
        setCustomTasks([...bestGoal.tasks.map(t => ({ ...t }))]);
      }
    }
  };

  const handleContinueFromAIGoal = () => {
    // Skip manual form - create loan directly with extracted data + selected AI goals
    const subjectProp = properties.find(p => p.isSubjectProperty) || properties[0];
    
    onSubmit({
      borrowerName: borrowerName || 'John Smith',
      borrowerEmail: borrowerEmail || 'john.smith@email.com',
      borrowerPhone: borrowerPhone || '(555) 123-4567',
      loanPurpose: loanPurpose || 'purchase',
      propertyType: propertyType || 'single_family',
      loanAmount: parseFloat(loanAmount) || 350000,
      estimatedValue: parseFloat(estimatedValue) || 500000,
      interestRate: parseFloat(interestRate) || 6.5,
      term: parseInt(term) || 30,
      subjectProperty: subjectProp.address,
      properties: properties.map((p, i) => ({ ...p, id: `prop-${i}` })),
      employment,
      liabilities: liabilities.map((l, i) => ({ ...l, id: `liab-${i}` })),
      documents: uploadedFile ? [{ id: 'doc-1', name: uploadedFile.name, type: 'other', status: 'uploaded', uploadDate: new Date().toISOString() }] : [],
      assignedTo: 'John Smith',
    }, [selectedTemplateId]);
    
    onOpenChange(false);
    resetForm();
  };

  const handleSubmit = () => {
    const subjectProp = properties.find(p => p.isSubjectProperty) || properties[0];
    
    onSubmit({
      borrowerName,
      borrowerEmail,
      borrowerPhone,
      loanPurpose,
      propertyType,
      loanAmount: parseFloat(loanAmount) || 0,
      estimatedValue: parseFloat(estimatedValue) || 0,
      interestRate: parseFloat(interestRate) || undefined,
      term: parseInt(term) || 30,
      subjectProperty: subjectProp.address,
      properties: properties.map((p, i) => ({ ...p, id: `prop-${i}` })),
      employment,
      liabilities: liabilities.map((l, i) => ({ ...l, id: `liab-${i}` })),
      documents: [],
      assignedTo: 'John Smith',
    }, [selectedTemplateId]);
    
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setCreationMethod(null);
    setBorrowerName('');
    setBorrowerEmail('');
    setBorrowerPhone('');
    setLoanAmount('');
    setEstimatedValue('');
    setInterestRate('');
    setTerm('30');
    setUploadedFile(null);
    setShowAIGoalSelection(false);
    setSelectedTemplateId(aiGoals[0]?.id || '');
    setCustomTasks(aiGoals[0]?.tasks || []);
    setProperties([{ id: 'temp-1', address: { street: '', city: '', state: '', zipCode: '' }, estimatedValue: 0, occupancyType: 'primary', isSubjectProperty: true }]);
    setEmployment([{ employerName: '', position: '', startDate: '', monthlyIncome: 0 }]);
    setLiabilities([]);
    setActiveTab('borrower');
  };

  const isValid = borrowerName && loanAmount && estimatedValue && properties[0]?.address.street;

  // AI Goal Selection View
  if (showAIGoalSelection) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <AIGoalSelectionView
          uploadedFile={uploadedFile}
          aiGoals={aiGoals}
          selectedTemplateId={selectedTemplateId}
          customTasks={customTasks}
          onTemplateChange={setSelectedTemplateId}
          onTasksChange={setCustomTasks}
          onContinue={handleContinueFromAIGoal}
          onBack={() => setShowAIGoalSelection(false)}
          onCancel={() => onOpenChange(false)}
        />
      </Dialog>
    );
  }

  // Creation Method Selection View
  if (creationMethod === null) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-blue-950">Create New Loan</DialogTitle>
            <DialogDescription>Choose how you want to create the loan application</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setCreationMethod('mismo')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Upload MISMO</h3>
                <p className="text-sm text-slate-500 mt-1">Import from MISMO XML file</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setCreationMethod('pdf')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileUp className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Upload 1003 PDF</h3>
                <p className="text-sm text-slate-500 mt-1">Import from PDF application</p>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => setCreationMethod('los')}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Database className="w-6 h-6 text-blue-700" />
                </div>
                <h3 className="font-semibold text-slate-900">Get from LOS</h3>
                <p className="text-sm text-slate-500 mt-1">Import from your LOS system</p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => setCreationMethod('manual')}>
              Or create manually <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Upload views
  if (creationMethod === 'mismo' || creationMethod === 'pdf') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCreationMethod(null)} className="mr-2">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Button>
              <div>
                <DialogTitle className="text-blue-950">
                  {creationMethod === 'mismo' ? 'Upload MISMO File' : 'Upload 1003 PDF'}
                </DialogTitle>
                <DialogDescription>
                  {creationMethod === 'mismo' 
                    ? 'Upload a MISMO XML file to import loan data' 
                    : 'Upload a 1003 PDF application form'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {!uploadedFile ? (
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-12 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  {creationMethod === 'mismo' ? <Upload className="w-8 h-8 text-blue-700" /> : <FileUp className="w-8 h-8 text-blue-700" />}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">
                  {creationMethod === 'mismo' ? 'Upload MISMO XML' : 'Upload 1003 PDF'}
                </h3>
                <p className="text-sm text-slate-500 mb-4">Drag and drop your file here, or click to browse</p>
                <Input 
                  type="file" 
                  accept={creationMethod === 'mismo' ? '.xml' : '.pdf'}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  variant="outline" 
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="border-blue-200 text-blue-700"
                >
                  Browse Files
                </Button>
              </div>
            ) : (
              <>
                <div className="p-4 bg-emerald-50 rounded-lg flex items-center justify-between border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{uploadedFile.name}</p>
                      <p className="text-sm text-slate-500">{(uploadedFile.size / 1024).toFixed(1)} KB • Ready for processing</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setUploadedFile(null)}>
                    <X className="w-4 h-4 text-slate-400" />
                  </Button>
                </div>

                {/* AI Analysis Preview */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">AI Document Analysis</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Detected Form:</span>
                      <span className="font-medium text-slate-900">1003 Uniform Residential Loan Application</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Borrower:</span>
                      <span className="font-medium text-slate-900">John Smith (extracted)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Loan Amount:</span>
                      <span className="font-medium text-slate-900">$350,000 (extracted)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Property Value:</span>
                      <span className="font-medium text-slate-900">$500,000 (extracted)</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button 
                    className="bg-blue-800 hover:bg-blue-900"
                    onClick={() => {
                      setBorrowerName('John Smith');
                      setLoanAmount('350000');
                      setEstimatedValue('500000');
                      setShowAIGoalSelection(true);
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Continue to AI Configuration
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // LOS Import View
  if (creationMethod === 'los') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setCreationMethod(null)} className="mr-2">
                <ArrowRight className="w-4 h-4 rotate-180" />
              </Button>
              <div>
                <DialogTitle className="text-blue-950">Import from LOS</DialogTitle>
                <DialogDescription>Select a loan from your Loan Origination System</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {['LOS-2026-001234', 'LOS-2026-001235', 'LOS-2026-001236'].map((loanNum) => (
              <Card 
                key={loanNum}
                className="cursor-pointer hover:border-blue-300 transition-colors"
                onClick={() => {
                  setBorrowerName(`Borrower ${loanNum.split('-')[2]}`);
                  setLoanAmount('350000');
                  setEstimatedValue('500000');
                  setCreationMethod('manual');
                }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Database className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{loanNum}</p>
                      <p className="text-sm text-slate-500">Submitted 2 days ago • Purchase • $350,000</p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Manual Entry Form
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCreationMethod(null)} className="mr-2">
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Button>
            <DialogTitle className="text-blue-950">Create Loan Manually</DialogTitle>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 bg-blue-50">
            <TabsTrigger value="borrower" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white">
              <User className="w-4 h-4 mr-2" />Borrower
            </TabsTrigger>
            <TabsTrigger value="loan" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />Loan
            </TabsTrigger>
            <TabsTrigger value="property" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white">
              <Home className="w-4 h-4 mr-2" />Property
            </TabsTrigger>
            <TabsTrigger value="employment" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white">
              <Briefcase className="w-4 h-4 mr-2" />Employment
            </TabsTrigger>
            <TabsTrigger value="liabilities" className="data-[state=active]:bg-blue-800 data-[state=active]:text-white">
              <CreditCard className="w-4 h-4 mr-2" />Liabilities
            </TabsTrigger>
          </TabsList>

          {/* Borrower Tab */}
          <TabsContent value="borrower" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Borrower Name *</Label>
                <Input value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)} placeholder="Full legal name" />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" value={borrowerEmail} onChange={(e) => setBorrowerEmail(e.target.value)} placeholder="borrower@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={borrowerPhone} onChange={(e) => setBorrowerPhone(e.target.value)} placeholder="(555) 123-4567" />
              </div>
            </div>
          </TabsContent>

          {/* Loan Tab */}
          <TabsContent value="loan" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loan Purpose</Label>
                <Select value={loanPurpose} onValueChange={(v) => setLoanPurpose(v as LoanPurpose)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {loanPurposes.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Property Type</Label>
                <Select value={propertyType} onValueChange={(v) => setPropertyType(v as PropertyType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Loan Amount *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="number" value={loanAmount} onChange={(e) => setLoanAmount(e.target.value)} className="pl-9" placeholder="350000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estimated Property Value *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input type="number" value={estimatedValue} onChange={(e) => setEstimatedValue(e.target.value)} className="pl-9" placeholder="550000" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Interest Rate (%)</Label>
                <Input type="number" step="0.125" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} placeholder="6.5" />
              </div>
              <div className="space-y-2">
                <Label>Loan Term (years)</Label>
                <Select value={term} onValueChange={setTerm}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 years</SelectItem>
                    <SelectItem value="20">20 years</SelectItem>
                    <SelectItem value="30">30 years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* Property Tab */}
          <TabsContent value="property" className="space-y-4 mt-4">
            {properties.map((property, index) => (
              <Card key={property.id} className="border-blue-100">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5 text-blue-700" />
                      <h4 className="font-medium">{property.isSubjectProperty ? 'Subject Property' : `Property ${index + 1}`}</h4>
                      {property.isSubjectProperty && <Badge className="bg-blue-100 text-blue-700">Primary</Badge>}
                    </div>
                    {!property.isSubjectProperty && (
                      <Button variant="ghost" size="sm" onClick={() => removeProperty(index)}><Minus className="w-4 h-4" /></Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 md:col-span-2">
                      <Label>Street Address</Label>
                      <Input 
                        value={property.address.street}
                        onChange={(e) => updateProperty(index, { address: { ...property.address, street: e.target.value } })}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input 
                        value={property.address.city}
                        onChange={(e) => updateProperty(index, { address: { ...property.address, city: e.target.value } })}
                        placeholder="City"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input 
                          value={property.address.state}
                          onChange={(e) => updateProperty(index, { address: { ...property.address, state: e.target.value } })}
                          placeholder="FL" maxLength={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>ZIP</Label>
                        <Input 
                          value={property.address.zipCode}
                          onChange={(e) => updateProperty(index, { address: { ...property.address, zipCode: e.target.value } })}
                          placeholder="12345"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Value</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          type="number"
                          value={property.estimatedValue || ''}
                          onChange={(e) => updateProperty(index, { estimatedValue: parseFloat(e.target.value) || 0 })}
                          className="pl-9" placeholder="500000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Occupancy Type</Label>
                      <Select 
                        value={property.occupancyType} 
                        onValueChange={(v) => updateProperty(index, { occupancyType: v as OccupancyType })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {occupancyTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addProperty} className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
              <Plus className="w-4 h-4 mr-2" />Add Additional Property
            </Button>
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-4 mt-4">
            {employment.map((emp, index) => (
              <Card key={index} className="border-blue-100">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-blue-700" />
                      <h4 className="font-medium">Employment {index + 1}</h4>
                    </div>
                    {employment.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeEmployment(index)}><Minus className="w-4 h-4" /></Button>}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Employer Name</Label>
                      <Input value={emp.employerName} onChange={(e) => updateEmployment(index, { employerName: e.target.value })} placeholder="Company Name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Position/Title</Label>
                      <Input value={emp.position} onChange={(e) => updateEmployment(index, { position: e.target.value })} placeholder="Software Engineer" />
                    </div>
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={emp.startDate} onChange={(e) => updateEmployment(index, { startDate: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Monthly Income</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          type="number" value={emp.monthlyIncome || ''}
                          onChange={(e) => updateEmployment(index, { monthlyIncome: parseFloat(e.target.value) || 0 })}
                          className="pl-9" placeholder="10000"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Button variant="outline" onClick={addEmployment} className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
              <Plus className="w-4 h-4 mr-2" />Add Additional Employment
            </Button>
          </TabsContent>

          {/* Liabilities Tab */}
          <TabsContent value="liabilities" className="space-y-4 mt-4">
            {liabilities.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-blue-200 rounded-lg">
                <CreditCard className="w-12 h-12 text-blue-300 mx-auto mb-4" />
                <p className="text-slate-500">No liabilities added yet</p>
                <p className="text-slate-400 text-sm mb-4">Add mortgages, credit cards, loans, etc.</p>
                <Button variant="outline" onClick={addLiability} className="border-blue-200 text-blue-700">
                  <Plus className="w-4 h-4 mr-2" />Add Liability
                </Button>
              </div>
            ) : (
              <>
                {liabilities.map((liability, index) => (
                  <Card key={liability.id} className="border-blue-100">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-blue-700" />
                          <h4 className="font-medium">Liability {index + 1}</h4>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeLiability(index)}><Minus className="w-4 h-4" /></Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Type</Label>
                          <Select value={liability.type} onValueChange={(v) => updateLiability(index, { type: v as Liability['type'] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {liabilityTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Lender/Creditor</Label>
                          <Input value={liability.lender} onChange={(e) => updateLiability(index, { lender: e.target.value })} placeholder="Bank Name" />
                        </div>
                        <div className="space-y-2">
                          <Label>Current Balance</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                              type="number" value={liability.balance || ''}
                              onChange={(e) => updateLiability(index, { balance: parseFloat(e.target.value) || 0 })}
                              className="pl-9" placeholder="10000"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Monthly Payment</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input 
                              type="number" value={liability.monthlyPayment || ''}
                              onChange={(e) => updateLiability(index, { monthlyPayment: parseFloat(e.target.value) || 0 })}
                              className="pl-9" placeholder="500"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button variant="outline" onClick={addLiability} className="w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Plus className="w-4 h-4 mr-2" />Add Another Liability
                </Button>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="text-sm text-slate-500">* Required fields</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!isValid} className="bg-blue-800 hover:bg-blue-900">
              Create Loan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
