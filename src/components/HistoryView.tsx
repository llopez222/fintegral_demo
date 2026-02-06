import { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Bot,
  User,
  Filter,
  FileText,
  ArrowRight,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { Decision, DecisionType, LoanStatus } from '@/types';

interface HistoryViewProps {
  decisions: Decision[];
}

const decisionConfig: Record<DecisionType, { label: string; icon: any; color: string; bgColor: string }> = {
  approved: { 
    label: 'Approved', 
    icon: CheckCircle2, 
    color: 'text-emerald-700', 
    bgColor: 'bg-emerald-100' 
  },
  denied: { 
    label: 'Denied', 
    icon: XCircle, 
    color: 'text-red-700', 
    bgColor: 'bg-red-100' 
  },
  conditional: { 
    label: 'Conditional', 
    icon: AlertCircle, 
    color: 'text-amber-700', 
    bgColor: 'bg-amber-100' 
  },
  auto_action: { 
    label: 'Auto Action', 
    icon: Bot, 
    color: 'text-blue-700', 
    bgColor: 'bg-blue-100' 
  },
};

const statusConfig: Record<LoanStatus, { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'text-slate-600' },
  submitted: { label: 'Submitted', color: 'text-blue-700' },
  in_review: { label: 'In Review', color: 'text-amber-700' },
  conditions: { label: 'Conditions', color: 'text-orange-700' },
  approved: { label: 'Approved', color: 'text-emerald-700' },
  denied: { label: 'Denied', color: 'text-red-700' },
  closed: { label: 'Closed', color: 'text-slate-600' },
};

export function HistoryView({ decisions }: HistoryViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMadeBy, setFilterMadeBy] = useState<string>('all');
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [expandedDecisions, setExpandedDecisions] = useState<string[]>([]);

  const filteredDecisions = useMemo(() => {
    let filtered = decisions;
    
    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.loanNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.reason.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterType !== 'all') {
      filtered = filtered.filter(d => d.type === filterType);
    }
    
    if (filterMadeBy !== 'all') {
      filtered = filtered.filter(d => 
        filterMadeBy === 'ai_agent' ? d.madeBy === 'ai_agent' : d.madeBy !== 'ai_agent'
      );
    }
    
    return filtered.sort((a, b) => new Date(b.madeAt).getTime() - new Date(a.madeAt).getTime());
  }, [decisions, searchQuery, filterType, filterMadeBy]);

  const toggleExpanded = (decisionId: string) => {
    setExpandedDecisions(prev => 
      prev.includes(decisionId) 
        ? prev.filter(id => id !== decisionId)
        : [...prev, decisionId]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  const DecisionCard = ({ decision }: { decision: Decision }) => {
    const config = decisionConfig[decision.type];
    const StatusIcon = config.icon;
    const isExpanded = expandedDecisions.includes(decision.id);
    const isAutoAction = decision.madeBy === 'ai_agent';
    
    return (
      <Card className="border-blue-100">
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${config.bgColor}`}>
              <StatusIcon className={`w-6 h-6 ${config.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${config.bgColor} ${config.color} border-0`}>
                      {config.label}
                    </Badge>
                    {isAutoAction && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Bot className="w-3 h-3 mr-1" />
                        AI Agent
                      </Badge>
                    )}
                    {decision.autoExecuted && (
                      <Badge className="bg-blue-100 text-blue-700">
                        Auto-Executed
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900">{decision.borrowerName}</h3>
                  <p className="text-sm text-slate-500">{decision.loanNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">{formatRelativeTime(decision.madeAt)}</p>
                  <p className="text-xs text-slate-400">{formatDate(decision.madeAt)}</p>
                </div>
              </div>

              <div className="mt-3">
                <p className="text-sm text-slate-700">{decision.reason}</p>
              </div>

              {/* Status Change */}
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className={`font-medium ${statusConfig[decision.previousStatus].color}`}>
                  {statusConfig[decision.previousStatus].label}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className={`font-medium ${statusConfig[decision.newStatus].color}`}>
                  {statusConfig[decision.newStatus].label}
                </span>
              </div>

              {/* Expandable Details */}
              {(decision.details || decision.conditions) && (
                <Collapsible open={isExpanded} onOpenChange={() => toggleExpanded(decision.id)}>
                  <CollapsibleTrigger asChild>
                    <button className="mt-3 flex items-center gap-1 text-sm text-blue-700 hover:text-blue-800">
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" />
                          Show more details
                        </>
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-3 space-y-3">
                    {decision.details && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs font-medium text-slate-500 mb-1">Details</p>
                        <p className="text-sm text-slate-700">{decision.details}</p>
                      </div>
                    )}
                    {decision.conditions && decision.conditions.length > 0 && (
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <p className="text-xs font-medium text-amber-700 mb-2">Conditions</p>
                        <ul className="space-y-1">
                          {decision.conditions.map((condition, idx) => (
                            <li key={idx} className="text-sm text-amber-700 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                              {condition}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Footer */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    isAutoAction ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    {isAutoAction ? (
                      <Bot className="w-3 h-3 text-blue-700" />
                    ) : (
                      <User className="w-3 h-3 text-slate-600" />
                    )}
                  </div>
                  <span className="text-sm text-slate-600">
                    {isAutoAction ? 'AI Agent' : decision.madeBy}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedDecision(decision)}
                  className="text-blue-700"
                >
                  View Full Details
                </Button>
              </div>
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
          <h1 className="text-2xl font-bold text-blue-900">Decision History</h1>
          <p className="text-slate-500">Track all decisions and actions taken on loans</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by borrower, loan number, or reason..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Decision Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="denied">Denied</SelectItem>
            <SelectItem value="conditional">Conditional</SelectItem>
            <SelectItem value="auto_action">Auto Action</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterMadeBy} onValueChange={setFilterMadeBy}>
          <SelectTrigger className="w-40">
            <User className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Made By" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="ai_agent">AI Agent</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { 
            label: 'Total Decisions', 
            value: decisions.length,
            icon: FileText,
            color: 'bg-blue-100 text-blue-700'
          },
          { 
            label: 'Approved', 
            value: decisions.filter(d => d.type === 'approved').length,
            icon: CheckCircle2,
            color: 'bg-emerald-100 text-emerald-700'
          },
          { 
            label: 'Denied', 
            value: decisions.filter(d => d.type === 'denied').length,
            icon: XCircle,
            color: 'bg-red-100 text-red-700'
          },
          { 
            label: 'AI Agent Actions', 
            value: decisions.filter(d => d.madeBy === 'ai_agent').length,
            icon: Bot,
            color: 'bg-blue-100 text-blue-700'
          },
        ].map((stat) => (
          <Card key={stat.label} className="border-blue-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Decisions List */}
      <div className="space-y-4">
        {filteredDecisions.map(decision => (
          <DecisionCard key={decision.id} decision={decision} />
        ))}
        {filteredDecisions.length === 0 && (
          <div className="p-12 text-center border-2 border-dashed border-blue-200 rounded-lg">
            <FileText className="w-12 h-12 text-blue-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No decisions found</p>
            <p className="text-slate-400 text-sm">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Full Details Dialog */}
      <Dialog open={!!selectedDecision} onOpenChange={() => setSelectedDecision(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-blue-900">Decision Details</DialogTitle>
            <DialogDescription>
              Complete information about this decision
            </DialogDescription>
          </DialogHeader>
          {selectedDecision && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${decisionConfig[selectedDecision.type].bgColor}`}>
                  {(() => {
                    const Icon = decisionConfig[selectedDecision.type].icon;
                    return <Icon className={`w-8 h-8 ${decisionConfig[selectedDecision.type].color}`} />;
                  })()}
                </div>
                <div>
                  <Badge className={`${decisionConfig[selectedDecision.type].bgColor} ${decisionConfig[selectedDecision.type].color} border-0 mb-2`}>
                    {decisionConfig[selectedDecision.type].label}
                  </Badge>
                  <h3 className="font-semibold text-lg text-slate-900">{selectedDecision.borrowerName}</h3>
                  <p className="text-sm text-slate-500">{selectedDecision.loanNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Made By</p>
                  <div className="flex items-center gap-2">
                    {selectedDecision.madeBy === 'ai_agent' ? (
                      <>
                        <Bot className="w-4 h-4 text-blue-700" />
                        <span className="font-medium text-slate-900">AI Agent</span>
                      </>
                    ) : (
                      <>
                        <User className="w-4 h-4 text-blue-700" />
                        <span className="font-medium text-slate-900">{selectedDecision.madeBy}</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Date & Time</p>
                  <p className="font-medium text-slate-900">{formatDate(selectedDecision.madeAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Previous Status</p>
                  <p className={`font-medium ${statusConfig[selectedDecision.previousStatus].color}`}>
                    {statusConfig[selectedDecision.previousStatus].label}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">New Status</p>
                  <p className={`font-medium ${statusConfig[selectedDecision.newStatus].color}`}>
                    {statusConfig[selectedDecision.newStatus].label}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Reason</p>
                <p className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">{selectedDecision.reason}</p>
              </div>

              {selectedDecision.details && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Details</p>
                  <p className="text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">{selectedDecision.details}</p>
                </div>
              )}

              {selectedDecision.conditions && selectedDecision.conditions.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2">Conditions</p>
                  <ul className="space-y-2">
                    {selectedDecision.conditions.map((condition, idx) => (
                      <li key={idx} className="text-sm text-amber-700 flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {condition}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedDecision.autoExecuted && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Bot className="w-5 h-5 text-blue-700" />
                  <span className="text-sm text-blue-700">This action was automatically executed by the AI Agent</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
