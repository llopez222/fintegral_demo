import { useMemo } from 'react';
import { 
  DollarSign,
  Home,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Bot,
  FileText,
  Target,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import type { Loan, Task, Decision } from '@/types';

interface AnalyticsViewProps {
  loans: Loan[];
  tasks: Task[];
  decisions: Decision[];
}

const STATUS_COLORS = {
  draft: '#94a3b8',
  submitted: '#3b82f6',
  in_review: '#f59e0b',
  conditions: '#f97316',
  approved: '#10b981',
  denied: '#ef4444',
  closed: '#64748b'
};

export function AnalyticsView({ loans, tasks, decisions }: AnalyticsViewProps) {
  
  // KPI Calculations
  const kpis = useMemo(() => {
    const totalVolume = loans.reduce((sum, loan) => sum + loan.loanAmount, 0);
    const avgLoanAmount = loans.length > 0 ? totalVolume / loans.length : 0;
    const approvedLoans = loans.filter(l => l.status === 'approved').length;
    const deniedLoans = loans.filter(l => l.status === 'denied').length;
    const approvalRate = loans.length > 0 ? (approvedLoans / (approvedLoans + deniedLoans)) * 100 : 0;
    
    const activeLoans = loans.filter(l => ['submitted', 'in_review', 'conditions'].includes(l.status)).length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.requiresApproval && !t.approved).length;
    const aiTasks = tasks.filter(t => t.assignedTo === 'ai_agent').length;
    
    // Avg processing time (days from created to approved/denied)
    const completedLoans = loans.filter(l => ['approved', 'denied', 'closed'].includes(l.status));
    const avgProcessingDays = completedLoans.length > 0 
      ? completedLoans.reduce((sum, loan) => {
          const created = new Date(loan.createdAt).getTime();
          const updated = new Date(loan.updatedAt || loan.createdAt).getTime();
          return sum + (updated - created) / (1000 * 60 * 60 * 24);
        }, 0) / completedLoans.length
      : 0;

    return {
      totalLoans: loans.length,
      totalVolume,
      avgLoanAmount,
      approvalRate,
      activeLoans,
      completedTasks,
      pendingTasks,
      aiTasks,
      avgProcessingDays: Math.round(avgProcessingDays)
    };
  }, [loans, tasks]);

  // Pipeline Status Distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    loans.forEach(loan => {
      counts[loan.status] = (counts[loan.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: status.replace('_', ' ').toUpperCase(),
      value: count,
      color: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#94a3b8'
    }));
  }, [loans]);

  // Volume by Month
  const volumeByMonth = useMemo(() => {
    const months: Record<string, number> = {};
    loans.forEach(loan => {
      const month = new Date(loan.createdAt).toLocaleString('en-US', { month: 'short', year: '2-digit' });
      months[month] = (months[month] || 0) + loan.loanAmount;
    });
    return Object.entries(months)
      .map(([month, volume]) => ({ month, volume: volume / 1000000 }))
      .slice(-6);
  }, [loans]);

  // Loans by Purpose
  const purposeData = useMemo(() => {
    const counts: Record<string, number> = {};
    loans.forEach(loan => {
      const purpose = loan.loanPurpose.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      counts[purpose] = (counts[purpose] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [loans]);

  // Task Completion Trend
  const taskTrendData = useMemo(() => {
    const days: Record<string, { completed: number; created: number }> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    });
    
    last7Days.forEach(day => {
      days[day] = { completed: 0, created: 0 };
    });

    tasks.forEach(task => {
      const day = new Date(task.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
      if (days[day]) {
        days[day].created++;
        if (task.status === 'completed') {
          days[day].completed++;
        }
      }
    });

    return Object.entries(days).map(([day, data]) => ({ day, ...data }));
  }, [tasks]);

  // AI vs Manual Tasks
  const taskTypeData = useMemo(() => {
    const ai = tasks.filter(t => t.assignedTo === 'ai_agent').length;
    const manual = tasks.filter(t => t.assignedTo !== 'ai_agent').length;
    return [
      { name: 'AI Agent', value: ai, color: '#3b82f6' },
      { name: 'Manual', value: manual, color: '#94a3b8' }
    ];
  }, [tasks]);

  // Decision History
  const decisionStats = useMemo(() => {
    const approve = decisions.filter(d => d.type === 'approved').length;
    const deny = decisions.filter(d => d.type === 'denied').length;
    const conditional = decisions.filter(d => d.type === 'conditional').length;
    const autoAction = decisions.filter(d => d.type === 'auto_action').length;
    return [
      { name: 'Approved', value: approve, color: '#10b981' },
      { name: 'Denied', value: deny, color: '#ef4444' },
      { name: 'Conditional', value: conditional, color: '#f59e0b' },
      { name: 'Auto Action', value: autoAction, color: '#3b82f6' }
    ];
  }, [decisions]);

  // Top Loan Officers (mock data)
  const officerPerformance = [
    { name: 'John Smith', loans: 12, volume: 4200000, approvalRate: 85 },
    { name: 'Sarah Johnson', loans: 8, volume: 2800000, approvalRate: 92 },
    { name: 'Mike Chen', loans: 6, volume: 2100000, approvalRate: 78 },
    { name: 'Emily Davis', loans: 5, volume: 1750000, approvalRate: 88 },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-950">Analytics Dashboard</h1>
        <p className="text-slate-500">Track your loan pipeline performance and metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <Card className="bg-gradient-to-br from-blue-800 to-blue-950 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-4 h-4 text-blue-200" />
              <span className="text-xs text-blue-200">Total Loans</span>
            </div>
            <p className="text-2xl font-bold">{kpis.totalLoans}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-blue-700" />
              <span className="text-xs text-slate-500">Total Volume</span>
            </div>
            <p className="text-lg font-bold text-blue-950">{formatCurrency(kpis.totalVolume)}</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs text-slate-500">Approval Rate</span>
            </div>
            <p className="text-lg font-bold text-emerald-700">{kpis.approvalRate.toFixed(0)}%</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-slate-500">Active Loans</span>
            </div>
            <p className="text-lg font-bold text-amber-700">{kpis.activeLoans}</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Bot className="w-4 h-4 text-blue-700" />
              <span className="text-xs text-slate-500">AI Tasks</span>
            </div>
            <p className="text-lg font-bold text-blue-950">{kpis.aiTasks}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-4 h-4 text-slate-600" />
              <span className="text-xs text-slate-500">Tasks Done</span>
            </div>
            <p className="text-lg font-bold text-slate-700">{kpis.completedTasks}</p>
          </CardContent>
        </Card>

        <Card className="border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-xs text-slate-500">Pending Approval</span>
            </div>
            <p className="text-lg font-bold text-amber-700">{kpis.pendingTasks}</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="text-xs text-slate-500">Avg Days</span>
            </div>
            <p className="text-lg font-bold text-purple-700">{kpis.avgProcessingDays}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-blue-700" />
              Pipeline Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Volume by Month */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-700" />
              Loan Volume by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `$${value.toFixed(1)}M`} />
                  <Bar dataKey="volume" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-700" />
              Task Activity (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={taskTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="created" 
                    stackId="1" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.6}
                    name="Tasks Created"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="completed" 
                    stackId="1" 
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                    name="Tasks Completed"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* AI vs Manual */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-700" />
              AI vs Manual Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={taskTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {taskTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Purpose */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-700" />
              Loans by Purpose
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={purposeData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Decision History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-700" />
              Decision Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={decisionStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {decisionStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-700" />
            Loan Officer Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Officer</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Loans</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Volume</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Approval Rate</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {officerPerformance.map((officer, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-700">
                            {officer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-medium text-slate-900">{officer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{officer.loans}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {formatCurrency(officer.volume)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${officer.approvalRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-slate-600">{officer.approvalRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {officer.approvalRate >= 85 ? (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <ArrowUpRight className="w-3 h-3 mr-1" />
                          Good
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-100 text-amber-700">
                          <ArrowDownRight className="w-3 h-3 mr-1" />
                          Review
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
