import { useState } from "react";
import { Search, MessageSquare, ChevronDown, Settings, Brain, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { NotificationBell } from "../notifications/NotificationBell";
import { useMessages } from "../../hooks/useMessages";
import { useApp } from "../../contexts/AppContext";

interface HeaderProps {
  onSearchOpen: () => void;
  onNotificationsOpen: () => void;
  onMessagesOpen: () => void;
  onWorkspaceSettings: () => void;
  onCreateWorkspace: () => void;
  currentWorkspace: { id: number; name: string; athletes: number };
  workspaces: Array<{ id: number; name: string; athletes: number }>;
  onWorkspaceChange: (workspaceId: number) => void;
  pendingDecisions?: number; // NEW: Count of pending AI decisions
  onDataOSOpen?: () => void; // NEW: Navigate to Data OS
}

export function Header({ onSearchOpen, onNotificationsOpen, onMessagesOpen, onWorkspaceSettings, onCreateWorkspace, currentWorkspace, workspaces, onWorkspaceChange, pendingDecisions = 0, onDataOSOpen }: HeaderProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { totalUnreadCount } = useMessages();
  const { user, logout } = useApp();

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200/80 backdrop-blur-sm bg-white/95">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo + Workspace */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="relative flex items-center gap-2">
            <motion.button
              aria-label="Abrir menu do utilizador"
              aria-expanded={userMenuOpen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-8 w-8 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shadow-md hover:shadow-lg transition-all ring-2 ring-white"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || 'User'}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-semibold text-xs">{getInitials(user?.name || 'U')}</span>
              )}
            </motion.button>

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {userMenuOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />

                  {/* Menu */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50"
                  >
                    {/* User Info */}
                    <div className="p-4 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center text-white font-bold shadow-md">
                          {user?.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name || 'User'}
                              className="h-full w-full rounded-full object-cover"
                            />
                          ) : (
                            <span>{getInitials(user?.name || 'U')}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">
                            {user?.name}
                          </h4>
                          <p className="text-sm text-slate-600 truncate">
                            {user?.email}
                          </p>
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                            {user?.role === 'coach' ? 'Treinador' : 'Atleta'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          onWorkspaceSettings();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-all font-medium"
                      >
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Settings className="h-4 w-4 text-slate-600" />
                        </div>
                        <span>Configurações da Conta</span>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-700 hover:bg-red-50 rounded-lg transition-all font-medium mt-1"
                      >
                        <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                          <LogOut className="h-4 w-4 text-red-600" />
                        </div>
                        <span>Terminar Sessão</span>
                      </motion.button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <span className="hidden sm:inline font-semibold text-slate-900 text-sm">PerformTrack</span>
          </div>
          
          {/* Workspace Dropdown */}
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setWorkspaceOpen(!workspaceOpen)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white hover:border-sky-300 transition-all shadow-sm"
            >
              <div className="h-2 w-2 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 animate-pulse" />
              <span className="hidden sm:inline text-slate-900 font-semibold">{currentWorkspace.name}</span>
              <span className="sm:hidden text-slate-900 font-semibold text-xs">{currentWorkspace.name.split(' ')[0]}</span>
              <span className="hidden sm:inline text-xs px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 font-medium">
                {currentWorkspace.athletes} atletas
              </span>
              <ChevronDown className={`h-3 w-3 text-sky-600 transition-transform ${workspaceOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
              {workspaceOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setWorkspaceOpen(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50"
                  >
                    <div className="p-2">
                      <p className="text-xs font-medium text-slate-500 px-3 py-2">Workspaces</p>
                      {workspaces.map((ws) => (
                        <button
                          key={ws.id}
                          onClick={() => {
                            onWorkspaceChange(ws.id);
                            setWorkspaceOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                            ws.id === currentWorkspace.id
                              ? 'bg-sky-50 text-sky-700 font-medium'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span>{ws.name}</span>
                          <span className="text-xs text-slate-500">{ws.athletes}</span>
                        </button>
                      ))}
                    </div>
                    <div className="border-t border-slate-200 p-2">
                      <button 
                        onClick={() => {
                          onWorkspaceSettings();
                          setWorkspaceOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left font-medium"
                      >
                        <Settings className="h-4 w-4" />
                        Configurações
                      </button>
                      <button 
                        onClick={() => {
                          onCreateWorkspace();
                          setWorkspaceOpen(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-sky-600 hover:bg-sky-50 rounded-lg transition-colors text-left font-medium"
                      >
                        + Criar Workspace
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <button
            onClick={onSearchOpen}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-all"
          >
            <Search className="h-4 w-4" />
            <span>Procurar...</span>
            <span className="ml-auto text-xs bg-white px-2 py-0.5 rounded border border-slate-200">⌘K</span>
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            aria-label="Pesquisar"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onSearchOpen}
            className="sm:hidden h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <Search className="h-4 w-4 text-slate-600" />
          </motion.button>

          {/* AI Decisions Badge - NEW */}
          {pendingDecisions > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDataOSOpen}
              className="relative h-9 px-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 flex items-center gap-2 hover:from-violet-400 hover:to-violet-500 transition-all shadow-md"
              title="Decisões AI Pendentes"
            >
              <Brain className="h-4 w-4 text-white" />
              <span className="text-xs font-bold text-white">{pendingDecisions}</span>
              <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse ring-2 ring-white" />
            </motion.button>
          )}

          {/* Notification Bell */}
          <NotificationBell
            workspaceId={`workspace-${currentWorkspace.id}`}
            userId="user-demo"
            onNotificationClick={(id) => {
              onNotificationsOpen();
            }}
          />

          <motion.button
            aria-label="Ver mensagens"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMessagesOpen}
            className="relative h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <MessageSquare className="h-4 w-4 text-slate-600" />
            {totalUnreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-emerald-500 rounded-full ring-2 ring-white" />
            )}
          </motion.button>

          <motion.button
            aria-label="Configurações gerais"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              onWorkspaceSettings();
            }}
            className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <Settings className="h-4 w-4 text-slate-600" />
          </motion.button>
        </div>
      </div>
    </header>
  );
}