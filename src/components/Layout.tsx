import { useState } from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Settings, 
  Plus,
  Bell,
  Search,
  Menu,
  X,
  User,
  LogOut,
  MessageCircle,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  onCreateLoan: () => void;
  onToggleChatbot: () => void;
  pendingTasks: number;
  chatbotOpen: boolean;
}

const navItems = [
  { id: 'pipeline', label: 'Pipeline', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'ai-goals', label: 'AI Goals', icon: Sparkles },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export function Layout({ 
  children, 
  currentView, 
  onViewChange, 
  onCreateLoan, 
  onToggleChatbot,
  pendingTasks,
  chatbotOpen 
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-800 to-blue-950 rounded-lg flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 40 40" className="w-7 h-7">
                  <path d="M8 8 L20 4 L32 8 L32 24 L20 28 L8 24 Z" fill="none" stroke="white" strokeWidth="2"/>
                  <path d="M8 8 L20 12 L20 28" fill="none" stroke="white" strokeWidth="2"/>
                  <path d="M20 12 L32 8" fill="none" stroke="white" strokeWidth="2"/>
                  <path d="M14 18 L14 22 M14 20 L18 20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-bold text-xl text-blue-950">Fintegral</span>
            </div>
            <button 
              className="lg:hidden ml-auto text-slate-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Create Loan Button */}
          <div className="p-4">
            <Button 
              onClick={onCreateLoan}
              className="w-full bg-blue-800 hover:bg-blue-900 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Loan
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-blue-50 text-blue-800' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-slate-500'}`} />
                  {item.label}
                  {item.id === 'tasks' && pendingTasks > 0 && (
                    <Badge variant="secondary" className="ml-auto bg-amber-100 text-amber-700 text-xs">
                      {pendingTasks}
                    </Badge>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-slate-200">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-800 to-blue-950 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-slate-900">John Smith</p>
                    <p className="text-xs text-slate-500">Loan Officer</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-500"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search loans, borrowers..."
                className="pl-9 w-64 lg:w-80"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              {pendingTasks > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 lg:p-8 pb-24">
          {children}
        </main>
      </div>

      {/* Chatbot Toggle Button */}
      {!chatbotOpen && (
        <button
          onClick={onToggleChatbot}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-800 to-blue-950 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <MessageCircle className="w-5 h-5" />
          <span className="font-medium">Ask AI</span>
          {pendingTasks > 0 && (
            <span className="w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {pendingTasks}
            </span>
          )}
        </button>
      )}

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
