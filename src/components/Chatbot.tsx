import { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  User, 
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  ClipboardList,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Loan, Task } from '@/types';

interface ChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  loans: Loan[];
  tasks: Task[];
  onCreateAIGoal: (loanId: string) => void;
  onViewLoan: (loanId: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: { label: string; action: string; data?: any }[];
}

const quickActions = [
  { label: 'Create AI Goal', icon: Sparkles },
  { label: 'View Pending Tasks', icon: CheckCircle2 },
  { label: 'Check Loan Status', icon: FileText },
  { label: 'Approve Tasks', icon: AlertCircle },
  { label: 'Scenario Desk', icon: ClipboardList },
  { label: 'Guidelines', icon: BookOpen },
];

export function Chatbot({ isOpen, onClose, loans, tasks, onCreateAIGoal, onViewLoan }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your Fintegral AI Assistant. I can help you manage loans, create AI goals, review tasks, and answer questions about your pipeline. How can I help you today?",
      timestamp: new Date(),
      actions: quickActions.map(a => ({ label: a.label, action: a.label })),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateResponse(input, loans, tasks);
      setMessages(prev => [...prev, response]);
      setIsTyping(false);
    }, 1000);
  };

  const handleAction = (action: string, data?: any) => {
    switch (action) {
      case 'Create AI Goal':
        if (loans.length > 0) {
          onCreateAIGoal(loans[0].id);
          addMessage('assistant', `I've opened the AI Goal creator for loan ${loans[0].loanNumber}. You can now define tasks for the AI Agent to complete.`);
        }
        break;
      case 'View Pending Tasks':
        const pendingTasks = tasks.filter(t => t.requiresApproval && !t.approved);
        if (pendingTasks.length > 0) {
          addMessage('assistant', `You have ${pendingTasks.length} tasks pending approval:\n\n${pendingTasks.map(t => `• ${t.title} - ${t.borrowerName}`).join('\n')}`,
            pendingTasks.map(t => ({ label: `View ${t.loanNumber}`, action: 'view_loan', data: t.loanId }))
          );
        } else {
          addMessage('assistant', 'Great news! You have no tasks pending approval. All AI Agent tasks have been reviewed.');
        }
        break;
      case 'Check Loan Status':
        const statusCounts = loans.reduce((acc, loan) => {
          acc[loan.status] = (acc[loan.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        addMessage('assistant', `Here's your current pipeline status:\n\n` +
          Object.entries(statusCounts).map(([status, count]) => `• ${status.replace('_', ' ')}: ${count}`).join('\n') +
          `\n\nTotal: ${loans.length} loans`
        );
        break;
      case 'Approve Tasks':
        const toApprove = tasks.filter(t => t.requiresApproval && !t.approved);
        if (toApprove.length > 0) {
          addMessage('assistant', `I can help you approve tasks. You have ${toApprove.length} tasks waiting for approval.`,
            toApprove.map(t => ({ label: `Approve: ${t.title}`, action: 'approve_task', data: t.id }))
          );
        } else {
          addMessage('assistant', 'No tasks are currently waiting for approval.');
        }
        break;
      case 'view_loan':
        onViewLoan(data);
        addMessage('assistant', 'Opening the loan details for you.');
        break;
      case 'Scenario Desk':
        addMessage('assistant', `📋 **Scenario Desk - Common Loan Scenarios**

**First-Time Homebuyer**
• Max DTI: 43% | Min Credit: 620
• Down payment: 3-5% options available
• Consider: FHA, conventional 97%

**Self-Employed Borrower**
• Requires 2 years tax returns
• Average net income used for qualifying
• Bank statement programs available

**Investment Property**
• Min down payment: 15-25%
• Rates typically 0.5-1% higher
• Rental income can offset payment

**Jumbo Loan (> $766,550)**
• Min credit: 700
• Reserves: 6-12 months required
• Full documentation required

**VA Loan (Veterans)**
• No down payment required
• No PMI | Competitive rates
• Funding fee may apply

Need help with a specific scenario? Just ask!`, [
          { label: 'FHA Guidelines', action: 'Guidelines' },
          { label: 'Conventional Guidelines', action: 'Guidelines' },
        ]);
        break;
      case 'Guidelines':
        addMessage('assistant', `📚 **Underwriting Guidelines Quick Reference**

**Conventional Loans (Fannie/Freddie)**
• Max LTV: 97% (first-time buyers)
• Min Credit: 620
• Max DTI: 36-50% depending on factors
• PMI required if LTV > 80%

**FHA Loans**
• Max LTV: 96.5%
• Min Credit: 580 (500-579 requires 10% down)
• Upfront MIP: 1.75% | Annual MIP: 0.55-0.75%
• Max DTI: 43% (up to 50% with compensating factors)

**VA Loans**
• Max LTV: 100%
• No minimum credit score (lender overlay applies)
• Funding Fee: 1.25-3.3% (varies by usage/down payment)
• No DTI cap (residual income test applies)

**USDA Loans**
• Max LTV: 100%
• Income limits apply by area
• Property must be in eligible rural area
• Guarantee fee: 1% upfront, 0.35% annual

**General Requirements**
• 2-year employment history
• Sourced and seasoned funds for down payment
• Clear CAIVRS (no federal delinquencies)
• Property must meet appraisal requirements`, [
          { label: 'DTI Calculator', action: 'dti_calculator' },
          { label: 'View Full Guidelines', action: 'full_guidelines' },
        ]);
        break;
      case 'dti_calculator':
        addMessage('assistant', `🧮 **DTI Calculator**

**Monthly Income:** $8,500
**Monthly Debts:** $3,200
**New PITI:** $2,400

**Front-end DTI:** 28.2% ✓ (Max 31% for FHA)
**Back-end DTI:** 65.9% ✗ (Exceeds 43% limit)

**Recommendation:** Consider paying down credit cards or increasing down payment to reduce PITI.

Would you like me to run scenarios with different loan amounts?`);
        break;
      case 'full_guidelines':
        addMessage('assistant', 'Opening the full guidelines portal in a new tab. You can access detailed documentation for all loan programs there.');
        break;
      default:
        break;
    }
  };

  const addMessage = (role: 'user' | 'assistant', content: string, actions?: { label: string; action: string; data?: any }[]) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
      actions,
    }]);
  };

  const generateResponse = (input: string, loans: Loan[], tasks: Task[]): Message => {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('loan') && lowerInput.includes('status')) {
      const statusCounts = loans.reduce((acc, loan) => {
        acc[loan.status] = (acc[loan.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Here's your current pipeline status:\n\n` +
          Object.entries(statusCounts).map(([status, count]) => `• ${status.replace('_', ' ')}: ${count}`).join('\n') +
          `\n\nTotal: ${loans.length} loans`,
        timestamp: new Date(),
      };
    }

    if (lowerInput.includes('task') || lowerInput.includes('pending')) {
      const pendingTasks = tasks.filter(t => t.requiresApproval && !t.approved);
      if (pendingTasks.length > 0) {
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: `You have ${pendingTasks.length} tasks pending approval:\n\n${pendingTasks.map(t => `• ${t.title} - ${t.borrowerName}`).join('\n')}`,
          timestamp: new Date(),
          actions: pendingTasks.map(t => ({ label: `View ${t.loanNumber}`, action: 'view_loan', data: t.loanId })),
        };
      }
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Great news! You have no tasks pending approval. All AI Agent tasks have been reviewed.',
        timestamp: new Date(),
      };
    }

    if (lowerInput.includes('create') || lowerInput.includes('goal') || lowerInput.includes('ai')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I can help you create an AI Goal for automated loan processing. Which loan would you like to create a goal for?',
        timestamp: new Date(),
        actions: loans.slice(0, 3).map(l => ({ label: `${l.loanNumber} - ${l.borrowerName}`, action: 'create_goal', data: l.id })),
      };
    }

    if (lowerInput.includes('approve')) {
      const toApprove = tasks.filter(t => t.requiresApproval && !t.approved);
      if (toApprove.length > 0) {
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: `I found ${toApprove.length} tasks waiting for approval. Which ones would you like to approve?`,
          timestamp: new Date(),
          actions: toApprove.map(t => ({ label: `Approve: ${t.title}`, action: 'approve_task', data: t.id })),
        };
      }
    }

    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Hello! I'm here to help you with your loan pipeline. I can:\n\n• Check loan statuses\n• Show pending tasks\n• Create AI goals\n• Help approve tasks\n• Provide scenario desk info\n• Answer guideline questions\n\nWhat would you like to do?",
        timestamp: new Date(),
        actions: quickActions.map(a => ({ label: a.label, action: a.label })),
      };
    }

    if (lowerInput.includes('scenario') || lowerInput.includes('desk')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📋 **Scenario Desk - Common Loan Scenarios**

**First-Time Homebuyer**
• Max DTI: 43% | Min Credit: 620
• Down payment: 3-5% options available
• Consider: FHA, conventional 97%

**Self-Employed Borrower**
• Requires 2 years tax returns
• Average net income used for qualifying
• Bank statement programs available

**Investment Property**
• Min down payment: 15-25%
• Rates typically 0.5-1% higher
• Rental income can offset payment

**Jumbo Loan (> $766,550)**
• Min credit: 700
• Reserves: 6-12 months required
• Full documentation required

**VA Loan (Veterans)**
• No down payment required
• No PMI | Competitive rates
• Funding fee may apply

Need help with a specific scenario? Just ask!`,
        timestamp: new Date(),
        actions: [
          { label: 'FHA Guidelines', action: 'Guidelines' },
          { label: 'Conventional Guidelines', action: 'Guidelines' },
        ],
      };
    }

    if (lowerInput.includes('guideline') || lowerInput.includes('requirements') || lowerInput.includes('dti') || lowerInput.includes('ltv')) {
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `📚 **Underwriting Guidelines Quick Reference**

**Conventional Loans (Fannie/Freddie)**
• Max LTV: 97% (first-time buyers)
• Min Credit: 620
• Max DTI: 36-50% depending on factors
• PMI required if LTV > 80%

**FHA Loans**
• Max LTV: 96.5%
• Min Credit: 580 (500-579 requires 10% down)
• Upfront MIP: 1.75% | Annual MIP: 0.55-0.75%
• Max DTI: 43% (up to 50% with compensating factors)

**VA Loans**
• Max LTV: 100%
• No minimum credit score (lender overlay applies)
• Funding Fee: 1.25-3.3% (varies by usage/down payment)
• No DTI cap (residual income test applies)

**USDA Loans**
• Max LTV: 100%
• Income limits apply by area
• Property must be in eligible rural area
• Guarantee fee: 1% upfront, 0.35% annual

Need more details on a specific program?`,
        timestamp: new Date(),
        actions: [
          { label: 'DTI Calculator', action: 'dti_calculator' },
          { label: 'View Full Guidelines', action: 'full_guidelines' },
        ],
      };
    }

    return {
      id: Date.now().toString(),
      role: 'assistant',
      content: "I'm not sure I understand. I can help you with:\n\n• Checking loan statuses\n• Viewing pending tasks\n• Creating AI goals\n• Approving tasks\n\nWhat would you like to do?",
      timestamp: new Date(),
      actions: quickActions.map(a => ({ label: a.label, action: a.label })),
    };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-4 bottom-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Fintegral AI</h3>
            <p className="text-xs text-blue-200">Your loan assistant</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-blue-100' 
                  : 'bg-gradient-to-br from-blue-700 to-blue-900'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-blue-700" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-4 py-2 rounded-2xl text-sm whitespace-pre-line ${
                  message.role === 'user'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {message.content}
                </div>
                {message.actions && message.actions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {message.actions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAction(action.action, action.data)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-100 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-100 px-4 py-2 rounded-2xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-slate-500">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-slate-100">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => handleAction(action.label)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-full hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap"
            >
              <action.icon className="w-3 h-3" />
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="bg-blue-700 hover:bg-blue-800"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
