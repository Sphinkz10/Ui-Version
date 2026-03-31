import { useState, useEffect } from "react";
import { Toaster, toast } from "sonner@2.0.3";
import { motion } from "motion/react";
import {
  Home, Users, Calendar, BarChart3,
  Dumbbell, Database, FileText, Zap, Activity, Plus
} from "lucide-react";
import { logger } from "./lib/logger";
import { useDecisions } from "./hooks/useDecisions";
import { generateDemoMessages, isFirstRun } from "./utils/demoData";
import { AppProvider, useApp } from "./contexts/AppContext";
import { LoginPage } from "./components/auth/LoginPage";
import { RegisterPage } from "./components/auth/RegisterPage";
import { AthleteApp } from "./components/athlete/AthleteApp";
import { useCreateAthlete } from "./hooks/use-api";
import { mutate } from "swr";

// Tipo local para substituir CalendarEvent (evitar imports quebrados)
interface CalendarEvent {
  id: string;
  title: string;
  athleteIds?: string[];
}

import { lazy, Suspense } from 'react';

// C9 HU-02: Lazy loaded pages to drastically reduce the initial monolithic bundle size
const Dashboard = lazy(() => import("./components/pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Athletes = lazy(() => import("./components/pages/Athletes").then(m => ({ default: m.Athletes })));
const NewAthleteProfile = lazy(() => import("./components/athlete/NewAthleteProfile").then(m => ({ default: m.NewAthleteProfile })));
const Phase5Summary = lazy(() => import("./components/pages/Phase5Summary").then(m => ({ default: m.Phase5Summary })));
const Lab = lazy(() => import("./components/pages/Lab").then(m => ({ default: m.Lab })));
const Labs = lazy(() => import("./components/studio/Labs").then(m => ({ default: m.Labs })));
const ReportBuilderV2 = lazy(() => import("./components/pages/ReportBuilderV2").then(m => ({ default: m.ReportBuilderV2 })));
const DataOS = lazy(() => import("./components/pages/DataOS").then(m => ({ default: m.DataOS })));
const LiveCommand = lazy(() => import("./components/pages/LiveCommand").then(m => ({ default: m.LiveCommand })));
const Messages = lazy(() => import("./components/pages/Messages").then(m => ({ default: m.Messages })));
const FormCenter = lazy(() => import("./components/pages/FormCenter").then(m => ({ default: m.FormCenter })));
const AutomationPage = lazy(() => import("./components/pages/AutomationPage").then(m => ({ default: m.AutomationPage })));
const WorkspaceSettings = lazy(() => import("./components/pages/WorkspaceSettings").then(m => ({ default: m.WorkspaceSettings })));
const FormSubmissionsHistory = lazy(() => import("./components/pages/FormSubmissionsHistory").then(m => ({ default: m.FormSubmissionsHistory })));
const CalendarPage = lazy(() => import("./components/pages/CalendarPage").then(m => ({ default: m.CalendarPage })));
const PrivacyPage = lazy(() => import("./components/pages/PrivacyPage").then(m => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import("./components/pages/TermsPage").then(m => ({ default: m.TermsPage })));
import { FeedbackWidget } from "./components/shared/FeedbackWidget";
import { Header } from "./components/layout/Header";
import { FAB } from "./components/layout/FAB";
import { SearchModal } from "./components/modals/SearchModal";
import { NotificationsModal } from "./components/modals/NotificationsModal";
import { KeyboardShortcutsModal } from "./components/modals/KeyboardShortcutsModal";
import { CreateAthleteModal } from "./components/modals/CreateAthleteModal";
import { SendFormWizard } from "./components/wizards/SendFormWizard";
import { CreateWorkspaceModal } from "./components/modals/CreateWorkspaceModal";
import { CreateWorkoutModal } from "./components/modals/CreateWorkoutModal";
import { ScheduleSessionModal } from "./components/modals/ScheduleSessionModal";
import { CookieConsent } from "./components/shared/CookieConsent";
import { WizardMain } from "./components/dataos/v2/wizard";
import { CreateProjectModal } from "./components/modals/CreateProjectModal";
import { ExecuteSessionModal } from "./components/modals/ExecuteSessionModal";
import { ActiveAthletesModal } from "./components/modals/ActiveAthletesModal";
import { TodaySessionsModal } from "./components/modals/TodaySessionsModal";
import { AlertsModal } from "./components/modals/AlertsModal";
import { TestExecuteSession } from "./TestExecuteSession";

// ============================================
// TYPES & INTERFACES
// ============================================
interface FormSendData {
  formTemplate: string;
  athletes: string[];
  channel: "app" | "email" | "sms";
  schedule: "now" | "scheduled";
  scheduledDate?: string;
  scheduledTime?: string;
  reminder: boolean;
  reminderHours?: number;
  notes?: string;
}

interface WorkspaceData {
  name: string;
  description?: string;
  type: string;
}

interface WorkoutData {
  name: string;
  description?: string;
  type: string;
}

interface SessionData {
  title: string;
  date: string;
  time: string;
  athletes: string[];
}

interface MetricData {
  name: string;
  type: string;
  unit?: string;
}

interface ProjectData {
  name: string;
  description?: string;
  type: string;
}

interface AthleteData {
  name: string;
  email: string;
  phone?: string;
}

type Page = "home" | "athletes" | "athlete-profile" | "calendar" | "lab" | "design-studio" | "report-builder" | "data-os" | "live-command" | "messages" | "form-center" | "automation-center" | "workspace-settings" | "form-submissions-history" | "privacy" | "terms";

function AppContent() {
  // Generate demo data on first run
  useEffect(() => {
    if (isFirstRun()) {
      generateDemoMessages();
    }
  }, []);

  const [currentPage, setCurrentPage] = useState<Page>("home");

  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [keyboardShortcutsOpen, setKeyboardShortcutsOpen] = useState(false);
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("athlete-1"); // ✅ Track selected athlete
  const [createAthleteOpen, setCreateAthleteOpen] = useState(false);
  const [sendFormOpen, setSendFormOpen] = useState(false);
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [workspaceData, setWorkspaceData] = useState<WorkspaceData | null>(null);
  const [createWorkoutOpen, setCreateWorkoutOpen] = useState(false);
  const [workoutData, setWorkoutData] = useState<WorkoutData | null>(null);
  const [scheduleSessionOpen, setScheduleSessionOpen] = useState(false);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [createMetricOpen, setCreateMetricOpen] = useState(false);
  const [metricData, setMetricData] = useState<MetricData | null>(null);
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [executeSessionOpen, setExecuteSessionOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    id: string;
    title: string;
    time: string;
    athletes: number;
    template: string;
  } | null>(null);
  const [activeAthletesOpen, setActiveAthletesOpen] = useState(false);
  const [todaySessionsOpen, setTodaySessionsOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // Workspace management
  const [workspaces, setWorkspaces] = useState([
    { id: "0c5919d8-bec4-465e-ab66-e993a6a4e3e6", name: "Equipa Principal", athletes: 24 },
    { id: "a2b3c4d5-e6f7-8901-2345-67890abcdef1", name: "Atletas Online", athletes: 12 },
    { id: "b2c3d4e5-f6g7-9012-3456-78901abcdef2", name: "Clínica Privada", athletes: 8 },
  ]);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState("0c5919d8-bec4-465e-ab66-e993a6a4e3e6");
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId) || workspaces[0];

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      // Cmd/Ctrl + Shift + K for keyboard shortcuts
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'k') {
        e.preventDefault();
        setKeyboardShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFABAction = (action: string) => {
    if (action === "athlete") {
      setCreateAthleteOpen(true);
    } else if (action === "session") {
      setScheduleSessionOpen(true);
    } else if (action === "workout") {
      setCreateWorkoutOpen(true);
    } else if (action === "form") {
      setSendFormOpen(true);
    } else if (action === "report") {
      toast.success("Criar Relatório - Em desenvolvimento");
    } else if (action === "template") {
      setCurrentPage("design-studio");
      toast.success("Abrir Design Studio");
    }
  };

  const handleViewAthleteProfile = (athleteId: string) => {
    setSelectedAthleteId(athleteId); // ✅ Set selected athlete
    setCurrentPage("athlete-profile");
  };

  const handleSendFormOpen = () => {
    setSendFormOpen(true);
  };

  const handleSendFormComplete = (data: FormSendData) => {
    logger.info('Form sent successfully', {
      module: 'App',
      formTemplate: data.formTemplate,
      athleteCount: data.athletes.length,
      channel: data.channel,
      schedule: data.schedule
    });
    const channel = data.channel === "app" ? "Athlete Portal" : data.channel === "email" ? "Email" : "SMS";
    const schedule = data.schedule === "now" ? "imediatamente" : `em ${data.scheduledDate} às ${data.scheduledTime}`;
    toast.success(`Formulário enviado para ${data.athletes.length} atleta(s) via ${channel} ${schedule}`);
  };

  const { execute: createAthlete } = useCreateAthlete();
  const { workspace } = useApp(); // ou useAppContext, dependendo do teu hook
  const workspaceId = workspace?.id;

  const handleCreateAthleteComplete = async (data: AthleteData) => {
    try {
      if (!workspaceId) {
        toast.error("Workspace não carregado. Faz refresh e tenta de novo.");
        return;
      }

      await createAthlete({
        workspaceId,
        ...data,
      });

      window.dispatchEvent(new Event("athlete-created"));

      toast.success(`Atleta ${data.name} criado com sucesso!`);
    } catch (error) {
      console.error("Failed to create athlete:", error);
      toast.error("Erro ao criar atleta");
    }
  };


  const handleCreateReport = () => {
    toast.success("Criar Relatório - Em desenvolvimento");
  };

  const handleCreateWorkspaceComplete = (data: WorkspaceData) => {
    logger.info('Workspace created', {
      module: 'App',
      name: data.name,
      type: data.type
    });
    toast.success(`Workspace ${data.name} criado com sucesso!`);
  };

  const handleCreateWorkoutComplete = (data: WorkoutData) => {
    logger.info('Workout created', {
      module: 'App',
      name: data.name,
      type: data.type
    });
    toast.success(`Treino ${data.name} criado com sucesso!`);
  };

  const handleScheduleSessionComplete = (data: SessionData) => {
    logger.info('Session scheduled', {
      module: 'App',
      title: data.title,
      date: data.date,
      athleteCount: data.athletes.length
    });
    toast.success(`Sessão agendada com sucesso!`);
  };

  const handleCreateMetricComplete = (metric: Partial<any>) => {
    logger.info('Metric created', {
      module: 'App',
      name: metric.name,
      type: metric.type,
      unit: metric.unit
    });
    toast.success(`Métrica ${metric.name} criada com sucesso!`);
  };

  const handleCreateProjectComplete = (data: ProjectData) => {
    logger.info('Project created', {
      module: 'App',
      name: data.name,
      type: data.type
    });
    toast.success(`Projeto ${data.name} criado com sucesso!`);
  };

  const handleStartLive = (event: CalendarEvent) => {
    logger.info('Starting live session from calendar', {
      module: 'App',
      eventId: event.id,
      title: event.title,
      athleteCount: event.athleteIds?.length || 0
    });

    // Fechar qualquer modal aberto
    setSelectedEvent(null);

    // Abrir Live Command
    setCurrentPage('live-command');

    // Mostrar toast de sucesso
    toast.success(`Sessão Live iniciada: ${event.title}`);
  };

  const navItems = [
    { id: "home" as Page, label: "Home", icon: Home },
    { id: "athletes" as Page, label: "Atletas", icon: Users },
    { id: "calendar" as Page, label: "Calendário", icon: Calendar },
    { id: "lab" as Page, label: "Lab", icon: BarChart3 },
  ];

  // Fetch pending AI decisions for header badge
  const { pending: pendingDecisions } = useDecisions({
    workspaceId: 'workspace-demo',
    status: 'pending',
    limit: 100, // Get all to count
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      {/* Skip Navigation Link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-white focus:text-sky-600 focus:rounded-br-xl focus:shadow-md focus:font-semibold">
        Saltar para o conteúdo principal
      </a>
      {/* Header */}
      <Header
        onSearchOpen={() => setSearchOpen(true)}
        onNotificationsOpen={() => setNotificationsOpen(true)}
        onMessagesOpen={() => setCurrentPage("messages")}
        onWorkspaceSettings={() => {
          console.log('🔧 onWorkspaceSettings called! Changing to workspace-settings');
          setCurrentPage("workspace-settings");
        }}
        onCreateWorkspace={() => setCreateWorkspaceOpen(true)}
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onWorkspaceChange={(id) => {
          setCurrentWorkspaceId(id);
          toast.success(`Mudou para workspace: ${workspaces.find(w => w.id === id)?.name}`);
        }}
        pendingDecisions={pendingDecisions}
        onDataOSOpen={() => setCurrentPage("data-os")}
      />

      {/* Sidebar Navigation (Desktop) */}
      <nav className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-slate-200 z-30 overflow-y-auto">
        <div className="p-4 space-y-2">
          <p className="text-xs font-medium text-slate-500 px-3 mb-3">Menu Principal</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <motion.button
                key={item.id}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentPage(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${isActive
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </motion.button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 px-3 mb-3">Ferramentas</p>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage("design-studio")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${currentPage === "design-studio"
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              <Dumbbell className="h-5 w-5" />
              <span>Design Studio</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage("data-os")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${currentPage === "data-os"
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              <Database className="h-5 w-5" />
              <span>Data OS</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage("form-center")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${currentPage === "form-center"
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              <FileText className="h-5 w-5" />
              <span>Form Center</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage("form-submissions-history")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${currentPage === "form-submissions-history"
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              <FileText className="h-5 w-5" />
              <span>📊 Histórico Forms</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage("automation-center")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${currentPage === "automation-center"
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              <Zap className="h-5 w-5" />
              <span>Automation</span>
            </motion.button>
            <motion.button
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage("live-command")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-sm font-medium ${currentPage === "live-command"
                ? 'bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-700 hover:bg-slate-50'
                }`}
            >
              <Activity className="h-5 w-5" />
              <span>Live Command</span>
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Main Content with proper spacing for desktop sidebar */}
      <main id="main-content" className="pb-20 lg:pb-6 lg:ml-64" tabIndex={-1}>
        <Suspense fallback={
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4" role="status" aria-live="polite" aria-label="A carregar a aplicação">
            <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" aria-hidden="true" />
            <p className="text-slate-500 font-medium">A carregar...</p>
          </div>
        }>
          {currentPage === "home" && (
            <Dashboard
              onCreateWorkout={() => setCreateWorkoutOpen(true)}
              onScheduleSession={() => setScheduleSessionOpen(true)}
              onStartSession={(sessionId) => {
                toast.success("Iniciando Live Command...");
                // Navegar para Live Command
                setCurrentPage("live-command");
              }}
              onViewActiveAthletes={() => setActiveAthletesOpen(true)}
              onViewTodaySessions={() => setTodaySessionsOpen(true)}
              onViewAlerts={() => setAlertsOpen(true)}
              onNavigate={(page) => setCurrentPage(page as Page)}
            />
          )}
          {currentPage === "athletes" && (
            <Athletes
              onViewProfile={handleViewAthleteProfile}
              onSendForm={handleSendFormOpen}
              onCreateReport={handleCreateReport}
              onCreateAthlete={() => setCreateAthleteOpen(true)}
            />
          )}
          {currentPage === "athlete-profile" && <NewAthleteProfile athleteId={selectedAthleteId} onBack={() => setCurrentPage("athletes")} />}
          {currentPage === "calendar" && (
            <CalendarPage
              workspaceId={currentWorkspaceId.toString()}
              onNavigate={(page) => setCurrentPage(page as Page)}
            />
          )}
          {currentPage === "lab" && (
            <Lab onNavigate={(page) => setCurrentPage(page as Page)} />
          )}
          {currentPage === "design-studio" && <Labs />}
          {currentPage === "report-builder" && <ReportBuilderV2 />}
          {currentPage === "data-os" && (
            <DataOS
              onCreateMetric={() => setCreateMetricOpen(true)}
              workspaceId={currentWorkspaceId.toString()}
              workspaceName={currentWorkspace.name}
            />
          )}
          {currentPage === "live-command" && <LiveCommand />}
          {currentPage === "messages" && <Messages />}
          {currentPage === "form-center" && <FormCenter />}
          {currentPage === "form-submissions-history" && <FormSubmissionsHistory onBack={() => setCurrentPage("form-center")} />}
          {currentPage === "automation-center" && <AutomationPage />}
          {currentPage === "workspace-settings" && <WorkspaceSettings />}
          {currentPage === "phase5-summary" && <Phase5Summary />}
          {currentPage === "privacy" && <PrivacyPage onBack={() => setCurrentPage("home")} />}
          {currentPage === "terms" && <TermsPage onBack={() => setCurrentPage("home")} />}
        </Suspense>
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 pb-2">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${isActive
                  ? 'bg-sky-50 text-sky-600'
                  : 'text-slate-600 active:bg-slate-50'
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </motion.button>
            );
          })}

          {/* FAB Button (Centro) */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFabOpen(!fabOpen)}
            className="flex flex-col items-center gap-1 px-2 py-2"
          >
            <div className={`h-12 w-12 -mt-2 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 shadow-lg shadow-sky-500/30 flex items-center justify-center transition-transform ${fabOpen ? 'rotate-45' : ''
              }`}>
              <Plus className="h-6 w-6 text-white" />
            </div>
          </motion.button>

          {navItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage(item.id)}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none ${isActive
                  ? 'bg-sky-50 text-sky-600'
                  : 'text-slate-600 active:bg-slate-50'
                  }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* FAB (Desktop Only) */}
      <div className="hidden lg:block">
        <FAB onAction={handleFABAction} />
      </div>

      {/* Mobile FAB Actions (Bottom Sheet) */}
      {fabOpen && (
        <div className="lg:hidden">
          {/* Backdrop */}
          <div
            onClick={() => setFabOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          {/* Actions Sheet */}
          <motion.div
            initial={{ y: 300 }}
            animate={{ y: 0 }}
            exit={{ y: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 p-6 pb-safe"
          >
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-6" />
            <h3 className="font-semibold text-slate-900 mb-4">Criar Novo</h3>

            <div className="space-y-2">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCreateAthleteOpen(true);
                  setFabOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-slate-900">Novo Atleta</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setScheduleSessionOpen(true);
                  setFabOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-slate-900">Agendar Sessão</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setCreateWorkoutOpen(true);
                  setFabOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center">
                  <Dumbbell className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-slate-900">Criar Template</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSendFormOpen(true);
                  setFabOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-slate-900">Enviar Form</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  toast.success("Criar Relatório - Em desenvolvimento");
                  setFabOpen(false);
                }}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <span className="font-medium text-slate-900">Criar Relatório</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modals */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        workspaceId={`workspace-${currentWorkspace.id}`}
        userId="user-demo"
        onNavigate={(url) => {
          // Parse URL and navigate
          if (url.startsWith('/athlete/')) {
            const athleteId = url.replace('/athlete/', '');
            handleViewAthleteProfile(athleteId);
          } else if (url === '/athletes') {
            setCurrentPage('athletes');
          } else if (url === '/calendar') {
            setCurrentPage('calendar');
          } else if (url === '/form-center') {
            setCurrentPage('form-center');
          }
        }}
      />
      <KeyboardShortcutsModal
        isOpen={keyboardShortcutsOpen}
        onClose={() => setKeyboardShortcutsOpen(false)}
      />
      <CreateAthleteModal
        isOpen={createAthleteOpen}
        onClose={() => setCreateAthleteOpen(false)}
        onComplete={handleCreateAthleteComplete}
      />
      <SendFormWizard
        isOpen={sendFormOpen}
        onClose={() => setSendFormOpen(false)}
        onComplete={handleSendFormComplete}
      />
      <CreateWorkspaceModal
        isOpen={createWorkspaceOpen}
        onClose={() => setCreateWorkspaceOpen(false)}
        onComplete={handleCreateWorkspaceComplete}
      />
      <CreateWorkoutModal
        isOpen={createWorkoutOpen}
        onClose={() => setCreateWorkoutOpen(false)}
        onComplete={handleCreateWorkoutComplete}
      />
      <ScheduleSessionModal
        isOpen={scheduleSessionOpen}
        onClose={() => setScheduleSessionOpen(false)}
        onComplete={handleScheduleSessionComplete}
      />
      <WizardMain
        isOpen={createMetricOpen}
        onClose={() => setCreateMetricOpen(false)}
        onComplete={handleCreateMetricComplete}
        workspaceId="workspace-demo"
      />
      <CreateProjectModal
        isOpen={createProjectOpen}
        onClose={() => setCreateProjectOpen(false)}
        onComplete={handleCreateProjectComplete}
      />
      <ExecuteSessionModal
        isOpen={executeSessionOpen}
        onClose={() => setExecuteSessionOpen(false)}
        sessionData={activeSession || {
          id: "1",
          title: "Sessão de Treino",
          time: "09:00",
          athletes: 0,
          template: "Template Padrão"
        }}
        mode="template"
      />
      <ActiveAthletesModal
        isOpen={activeAthletesOpen}
        onClose={() => setActiveAthletesOpen(false)}
      />
      <TodaySessionsModal
        isOpen={todaySessionsOpen}
        onClose={() => setTodaySessionsOpen(false)}
        onStartSession={(sessionId) => {
          setActiveSession({
            id: sessionId,
            title: "Treino de Força - Grupo A",
            time: "09:00",
            athletes: 8,
            template: "Full Body Strength A"
          });
          setExecuteSessionOpen(true);
        }}
      />
      <AlertsModal
        isOpen={alertsOpen}
        onClose={() => setAlertsOpen(false)}
      />

      {/* Global In-App Feedback Widget */}
      <FeedbackWidget />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '12px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
}

// Main App component
export default function App() {
  // Check if we're on the test page
  if (window.location.pathname === '/test-execute') {
    return <TestExecuteSession />;
  }

  return (
    <AppProvider>
      <AuthenticatedApp />
      <Toaster position="top-right" />
      <CookieConsent />
    </AppProvider>
  );
}

/**
 * Authenticated App Wrapper
 * Handles routing based on authentication state and user role
 */
function AuthenticatedApp() {
  const { isAuthenticated, isCoach, isAthlete, isLoading } = useApp();
  const [showRegister, setShowRegister] = useState(false);
  // CPL-002: pre-auth navigation to policy pages
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Show loading state while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-200 border-t-sky-600 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">A carregar...</p>
        </div>
      </div>
    );
  }

  // Policy pages (accessible before auth)
  if (showPrivacy) {
    return <PrivacyPage onBack={() => setShowPrivacy(false)} />;
  }
  if (showTerms) {
    return <TermsPage onBack={() => setShowTerms(false)} />;
  }

  // Not authenticated → Show Login or Register
  if (!isAuthenticated) {
    if (showRegister) {
      return (
        <RegisterPage
          onLoginClick={() => setShowRegister(false)}
          onPrivacyClick={() => setShowPrivacy(true)}
          onTermsClick={() => setShowTerms(true)}
        />
      );
    }
    return <LoginPage onRegisterClick={() => setShowRegister(true)} />;
  }

  // Authenticated as Coach → Show full Coach App
  if (isCoach) {
    return <AppContent />;
  }

  // Authenticated as Athlete → Show Athlete App
  if (isAthlete) {
    return <AthleteApp />;
  }

  // Fallback
  return <LoginPage onRegisterClick={() => setShowRegister(true)} />;
}