import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Sparkles,
  TrendingUp,
  Users,
  BarChart3,
  Target,
  Shield,
  Zap,
  Clock,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  MessageCircle,
  Download,
  Share2,
  Eye,
  Settings,
  X,
  Plus,
  Trash2,
  Copy,
  AlertCircle,
  Award,
  Activity,
  LineChart,
  PieChart,
  Dumbbell,
  Calendar,
  Filter,
  BarChart2,
  TrendingDown,
  Maximize2,
  RefreshCw,
  Send,
  Star,
  Heart,
  Brain,
  Flame,
  Trophy
} from "lucide-react";
import { toast } from "sonner";

import { Breadcrumbs } from "../layout/Breadcrumbs";
import { AIAssistantModal } from "../modals/AIAssistantModal";
import { ContextSelectionModal } from "../modals/ContextSelectionModal";
import { GamificationOverlay } from "../overlays/GamificationOverlay";
import { ReportHeader } from "./ReportBuilder/ReportHeader";
import { ReportFilters } from "./ReportBuilder/ReportFilters";
import { ReportChartsArea } from "./ReportBuilder/ReportChartsArea";

// ===== INTERFACES =====
interface SmartQuestion {
  id: string;
  question: string;
  description: string;
  icon: any;
  color: string;
  reportType: string;
  popular?: boolean;
  estimatedTime?: string;
}

interface QuickReport {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  clicks: number;
  estimatedTime: string;
}

export interface ChartConfig {
  id: string;
  type: "line" | "bar" | "area" | "pie" | "metric" | "radar";
  title: string;
  data: any[];
  insight?: string;
  suggestion?: string;
  alert?: string;
  confidence?: number;
}

interface Topic {
  id: string;
  label: string;
  icon: any;
  count: number;
  color: string;
}

type ViewMode = "home" | "building" | "preview" | "assistant";
type InteractionMode = "quick" | "deep" | "story";

// ===== SMART QUESTIONS (EXPANDIDO) =====
const smartQuestions: SmartQuestion[] = [
  {
    id: "q1",
    question: "Meu atleta está progredindo?",
    description: "Análise de evolução e tendências",
    icon: TrendingUp,
    color: "emerald",
    reportType: "progress",
    popular: true
  },
  {
    id: "q2",
    question: "A carga de treino está adequada?",
    description: "ACWR e monitorização de risco",
    icon: Shield,
    color: "amber",
    reportType: "load",
    popular: true
  },
  {
    id: "q3",
    question: "Como comparar dois atletas?",
    description: "Análise comparativa detalhada",
    icon: Users,
    color: "sky",
    reportType: "comparison"
  },
  {
    id: "q4",
    question: "O que mudou na última semana?",
    description: "Mudanças e variações recentes",
    icon: Clock,
    color: "violet",
    reportType: "changes"
  },
  {
    id: "q5",
    question: "Estamos prontos para a competição?",
    description: "Check-up pré-competição completo",
    icon: Target,
    color: "red",
    reportType: "competition",
    popular: true
  },
  {
    id: "q6",
    question: "Qual atleta tem melhor aderência?",
    description: "Ranking de consistência",
    icon: Award,
    color: "violet",
    reportType: "adherence"
  },
  {
    id: "q7",
    question: "Recuperação está adequada?",
    description: "Wellness score e fatiga",
    icon: Heart,
    color: "red",
    reportType: "recovery"
  },
  {
    id: "q8",
    question: "Onde estão os pontos fracos?",
    description: "Identificar gaps de performance",
    icon: AlertCircle,
    color: "amber",
    reportType: "weaknesses"
  }
];

// ===== QUICK REPORTS (EXPANDIDO) =====
const quickReports: QuickReport[] = [
  {
    id: "weekly",
    name: "Relatório da Semana Atual",
    description: "Volume, aderência e destaques",
    icon: Calendar,
    color: "emerald",
    clicks: 2,
    estimatedTime: "30 seg"
  },
  {
    id: "compare",
    name: "Comparar com Mês Passado",
    description: "Evolução mês a mês",
    icon: BarChart3,
    color: "sky",
    clicks: 2,
    estimatedTime: "45 seg"
  },
  {
    id: "recovery",
    name: "Check-up de Recuperação",
    description: "Wellness e readiness",
    icon: Activity,
    color: "violet",
    clicks: 2,
    estimatedTime: "20 seg"
  },
  {
    id: "performance",
    name: "Top Performances",
    description: "Recordes e picos recentes",
    icon: Award,
    color: "amber",
    clicks: 3,
    estimatedTime: "1 min"
  },
  {
    id: "team",
    name: "Visão Geral da Equipa",
    description: "Métricas agregadas do grupo",
    icon: Users,
    color: "red",
    clicks: 3,
    estimatedTime: "1 min"
  }
];

// ===== TOPICS =====
const topics: Topic[] = [
  { id: "progression", label: "Progressão", icon: TrendingUp, count: 12, color: "emerald" },
  { id: "risk", label: "Risco", icon: Shield, count: 5, color: "red" },
  { id: "comparison", label: "Comparação", icon: Users, count: 8, color: "sky" },
  { id: "efficiency", label: "Eficiência", icon: Zap, count: 6, color: "amber" },
  { id: "consistency", label: "Consistência", icon: CheckCircle, count: 7, color: "violet" },
  { id: "preparation", label: "Preparação", icon: Target, count: 4, color: "red" }
];

// ===== MOCK DATA GENERATORS (EXPANDIDOS) =====
const generateProgressData = () => {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun"];
  return months.map((month, i) => ({
    name: month,
    value: 80 + i * 8 + Math.random() * 5,
    target: 85 + i * 7,
    label: month
  }));
};

const generateComparisonData = () => {
  return [
    { name: "João", força: 85, velocidade: 72, resistência: 78, potência: 80 },
    { name: "Maria", força: 78, velocidade: 88, resistência: 82, potência: 85 }
  ];
};

const generateRadarData = () => {
  return [
    { subject: 'Força', A: 85, B: 78, fullMark: 100 },
    { subject: 'Velocidade', A: 72, B: 88, fullMark: 100 },
    { subject: 'Resistência', A: 78, B: 82, fullMark: 100 },
    { subject: 'Potência', A: 80, B: 85, fullMark: 100 },
    { subject: 'Flexibilidade', A: 70, B: 75, fullMark: 100 }
  ];
};

const generateLoadData = () => {
  const weeks = ["S1", "S2", "S3", "S4"];
  return weeks.map((week, i) => ({
    name: week,
    carga: 800 + i * 150 + Math.random() * 100,
    ideal: 900,
    critico: 1200
  }));
};

// ===== RECENT REPORTS =====
const recentReports = [
  { id: "r1", name: "Progressão João - Dez", date: "Há 2 dias", views: 12 },
  { id: "r2", name: "Comparativo Equipa A", date: "Há 5 dias", views: 8 },
  { id: "r3", name: "ACWR Mensal", date: "Há 1 semana", views: 15 }
];

// ===== MAIN COMPONENT =====
export function ReportBuilderV2() {
  const [viewMode, setViewMode] = useState<ViewMode>("home");
  const [interactionMode, setInteractionMode] = useState<InteractionMode>("quick");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<SmartQuestion | null>(null);
  const [generatedCharts, setGeneratedCharts] = useState<ChartConfig[]>([]);
  const [reportTitle, setReportTitle] = useState("");
  const [showAssistant, setShowAssistant] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showContextModal, setShowContextModal] = useState(false);
  const [showGamification, setShowGamification] = useState(false);

  // ===== HANDLERS =====
  const handleQuestionClick = (question: SmartQuestion) => {
    setSelectedQuestion(question);
    setShowContextModal(true);
  };

  const handleContextGenerate = (context: any) => {
    if (!selectedQuestion) return;
    
    setReportTitle(selectedQuestion.question);
    toast.success("🔍 Analisando dados com contexto personalizado...");
    
    setTimeout(() => {
      generateSmartReport(selectedQuestion.reportType);
      setViewMode("preview");
      toast.success("✨ Relatório gerado com insights automáticos!");
    }, 1500);
  };

  const generateSmartReport = (reportType: string) => {
    let charts: ChartConfig[] = [];
    
    switch (reportType) {
      case "progress":
        charts = [
          {
            id: "c1",
            type: "line",
            title: "Evolução de Força - Agachamento Livre",
            data: generateProgressData(),
            insight: "📈 Progressão consistente de 8.2% nos últimos 3 meses",
            suggestion: "💡 Ritmo ideal detectado - manter carga atual e padrão de treino",
            alert: "⚠️ Último mês: Plateau detectado - considerar mudança de estímulo (excêntrico/isométrico)",
            confidence: 87
          },
          {
            id: "c2",
            type: "metric",
            title: "Estado Atual vs Objetivo",
            data: [{ value: 92, target: 100 }],
            insight: "🎯 92% do objetivo alcançado - excelente progresso",
            suggestion: "💡 Faltam 8% - previsão de atingir em 3 semanas mantendo ritmo atual",
            confidence: 92
          },
          {
            id: "c3",
            type: "bar",
            title: "Comparação com Objetivo por Métrica",
            data: generateComparisonData(),
            insight: "💪 Força acima do esperado (+15%), velocidade em desenvolvimento",
            suggestion: "💡 Adicionar trabalho específico de velocidade nas próximas 2 semanas"
          }
        ];
        break;
      
      case "comparison":
        charts = [
          {
            id: "c4",
            type: "radar",
            title: "Perfil Comparativo - João vs Maria",
            data: generateRadarData(),
            insight: "🔍 João: +15% força, Maria: +20% velocidade - perfis complementares",
            suggestion: "💡 Considerar treino cruzado para equilibrar capacidades"
          },
          {
            id: "c5",
            type: "bar",
            title: "Métricas Comparativas",
            data: generateComparisonData(),
            insight: "📊 Ambos acima da média do grupo em 3/4 métricas",
            suggestion: "💡 João: trabalhar velocidade | Maria: trabalhar força"
          }
        ];
        break;
      
      case "load":
        charts = [
          {
            id: "c6",
            type: "area",
            title: "Carga Semanal (AU) com Zonas de Risco",
            data: generateLoadData(),
            insight: "✅ ACWR: 1.2 - Dentro da zona ideal (0.8-1.3) - risco baixo de lesão",
            suggestion: "💡 Carga otimizada - manter volume atual com possibilidade de aumento de 5-10% na próxima semana",
            alert: "🟢 Risco de lesão: Baixo - todas as métricas dentro dos parâmetros seguros",
            confidence: 94
          }
        ];
        break;
      
      case "recovery":
        charts = [
          {
            id: "c7",
            type: "line",
            title: "Wellness Score - Últimos 14 dias",
            data: generateProgressData(),
            insight: "😴 Tendência de melhoria +12% na qualidade do sono",
            suggestion: "💡 Recuperação adequada - ok para manter intensidade",
            alert: "⚠️ Atenção: Stress aumentou 15% nos últimos 3 dias"
          }
        ];
        break;
      
      default:
        charts = [
          {
            id: "c8",
            type: "line",
            title: "Análise Geral de Performance",
            data: generateProgressData(),
            insight: "📊 Tendência positiva detectada em múltiplas métricas",
            confidence: 85
          }
        ];
    }
    
    setGeneratedCharts(charts);
  };

  const handleQuickReport = (report: QuickReport) => {
    toast.success(`⚡ Gerando "${report.name}"...`);
    setReportTitle(report.name);
    
    setTimeout(() => {
      generateSmartReport("progress");
      setViewMode("preview");
      toast.success(`✅ Relatório gerado em ${report.estimatedTime}!`);
    }, 1000);
  };

  const handleStartFromScratch = () => {
    setViewMode("building");
    setReportTitle("Novo Relatório Personalizado");
    toast.info("🔧 Modo de construção avançada ativado");
  };

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(topicId);
    toast.info(`Filtrando por: ${topics.find(t => t.id === topicId)?.label}`);
  };

  // ===== RENDER MODALS =====
  const renderModals = () => (
    <>
      <AIAssistantModal
        isOpen={showAssistant}
        onClose={() => setShowAssistant(false)}
        onGenerateReport={(config) => {
          generateSmartReport("progress");
          setViewMode("preview");
          setReportTitle("Relatório Sugerido pela IA");
        }}
      />

      <ContextSelectionModal
        isOpen={showContextModal}
        onClose={() => setShowContextModal(false)}
        question={selectedQuestion?.question || ""}
        onGenerate={handleContextGenerate}
      />

      <GamificationOverlay
        isOpen={showGamification}
        onClose={() => setShowGamification(false)}
      />
    </>
  );

  const filteredQuestions = selectedTopic
    ? smartQuestions.filter(q => {
        // Lógica simples de filtro baseado no tópico
        const topicMap: Record<string, string[]> = {
          progression: ["progress"],
          risk: ["load"],
          comparison: ["comparison"],
          consistency: ["adherence"],
          preparation: ["competition"]
        };
        return topicMap[selectedTopic]?.includes(q.reportType);
      })
    : smartQuestions;

  // ===== HOME VIEW =====
  if (viewMode === "home") {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50 via-slate-50 to-emerald-50/30 pb-20 sm:pb-0 relative overflow-hidden">
        {/* Abstract Background Orbs for Deep Glassmorphism Effect */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5 relative z-10">
          
          {/* Breadcrumbs */}
          <Breadcrumbs items={[
            { label: "Lab", onClick: () => {} },
            { label: "Report Builder" }
          ]} />

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 py-6 sm:py-10"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-sky-50 to-emerald-50 border-2 border-sky-200/50"
            >
              <Sparkles className="h-4 w-4 text-sky-600" />
              <span className="text-sm font-semibold text-sky-700">Sistema de Clareza Inteligente</span>
            </motion.div>
            
            <motion.h1 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-3xl sm:text-5xl font-bold text-slate-900"
            >
              🤔 O que você quer <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-emerald-500">descobrir</span> hoje?
            </motion.h1>
            
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto"
            >
              Faça perguntas, não configurações. Encontre <span className="font-semibold text-slate-900">respostas</span>, não apenas gráficos.
            </motion.p>

            {/* Search Bar */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="max-w-2xl mx-auto relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Ex: 'progressão do João' ou 'comparar atletas'..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-base border border-white/60 bg-white/60 backdrop-blur-xl rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:bg-white/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]"
              />
              {searchQuery && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center"
                >
                  <X className="h-3 w-3 text-slate-600" />
                </motion.button>
              )}
            </motion.div>
          </motion.div>

          {/* Stats Overview with Gamification */}
          <div className="relative">
            <motion.button
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowGamification(true)}
              className="absolute -top-2 -right-2 z-10 h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
            >
              <Trophy className="h-5 w-5 text-white" />
            </motion.button>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {[
                { label: "Relatórios Criados", value: "47", icon: BarChart3, color: "sky" },
                { label: "Insights Gerados", value: "124", icon: Sparkles, color: "emerald" },
                { label: "Tempo Economizado", value: "28h", icon: Clock, color: "violet" },
                { label: "Decisões Influenciadas", value: "31", icon: Target, color: "amber" }
              ].map((stat, index) => {
                const Icon = stat.icon;
                const colorClasses = {
                  sky: "from-sky-500 to-sky-600",
                  emerald: "from-emerald-500 to-emerald-600",
                  violet: "from-violet-500 to-violet-600",
                  amber: "from-amber-500 to-amber-600"
                }[stat.color];

                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setShowGamification(true)}
                    className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 backdrop-blur-xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:bg-white/90 transition-all cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <Icon className="h-16 w-16" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${colorClasses} flex items-center justify-center`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                    </div>
                    <p className="font-bold text-slate-900 text-xl">{stat.value}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>

          {/* Interaction Modes */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-2 overflow-x-auto pb-2"
          >
            {[
              { id: "quick" as const, label: "Rápido", icon: Zap, desc: "Decisões imediatas" },
              { id: "deep" as const, label: "Profundo", icon: Brain, desc: "Análise detalhada" },
              { id: "story" as const, label: "História", icon: MessageCircle, desc: "Para partilhar" }
            ].map(mode => {
              const Icon = mode.icon;
              return (
                <motion.button
                  key={mode.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setInteractionMode(mode.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all whitespace-nowrap backdrop-blur-md ${
                    interactionMode === mode.id
                      ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 border-transparent"
                      : "bg-white/60 border border-white/50 text-slate-700 hover:bg-white/90 hover:shadow-sm"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">{mode.label}</p>
                    <p className="text-xs opacity-80">{mode.desc}</p>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          {/* Topics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-violet-500" />
                <h2 className="font-semibold text-slate-900">Tópicos de Análise</h2>
              </div>
              {selectedTopic && (
                <button
                  onClick={() => setSelectedTopic(null)}
                  className="text-xs text-sky-600 hover:text-sky-700 font-medium"
                >
                  Limpar filtro
                </button>
              )}
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {topics.map((topic) => {
                const Icon = topic.icon;
                const colorClasses = {
                  emerald: "border-emerald-200 hover:border-emerald-400 text-emerald-700",
                  sky: "border-sky-200 hover:border-sky-400 text-sky-700",
                  violet: "border-violet-200 hover:border-violet-400 text-violet-700",
                  amber: "border-amber-200 hover:border-amber-400 text-amber-700",
                  red: "border-red-200 hover:border-red-400 text-red-700"
                }[topic.color];

                return (
                  <motion.button
                    key={topic.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTopicClick(topic.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 bg-white transition-all whitespace-nowrap ${
                      selectedTopic === topic.id
                        ? "border-sky-400 bg-sky-50"
                        : colorClasses
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-semibold">{topic.label}</span>
                    <span className="text-xs opacity-60">({topic.count})</span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Smart Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-amber-500" />
              <h2 className="font-semibold text-slate-900">
                {interactionMode === "quick" && "Perguntas Frequentes"}
                {interactionMode === "deep" && "Análises Profundas"}
                {interactionMode === "story" && "Histórias de Sucesso"}
              </h2>
              <span className="text-xs text-slate-500">({filteredQuestions.length} disponíveis)</span>
            </div>
            
            {/* MODO RÁPIDO - Quick Decisions */}
            {interactionMode === "quick" && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {filteredQuestions.slice(0, 6).map((q, index) => {
                    const Icon = q.icon;
                    const colorClasses = {
                      emerald: { bg: "from-emerald-500 to-emerald-600", border: "border-emerald-200", hover: "hover:border-emerald-400" },
                      sky: { bg: "from-sky-500 to-sky-600", border: "border-sky-200", hover: "hover:border-sky-400" },
                      violet: { bg: "from-violet-500 to-violet-600", border: "border-violet-200", hover: "hover:border-violet-400" },
                      amber: { bg: "from-amber-500 to-amber-600", border: "border-amber-200", hover: "hover:border-amber-400" },
                      red: { bg: "from-red-500 to-red-600", border: "border-red-200", hover: "hover:border-red-400" }
                    }[q.color] || { bg: "from-slate-500 to-slate-600", border: "border-slate-200", hover: "hover:border-slate-400" };

                    return (
                      <motion.button
                        key={q.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.0 + index * 0.05 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleQuestionClick(q)}
                        className={`group p-4 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl hover:bg-white/90 shadow-[0_4px_20px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all text-left relative overflow-hidden`}
                      >
                        {q.popular && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-xs font-bold flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            Popular
                          </div>
                        )}
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colorClasses.bg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-md`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1 text-sm pr-16">{q.question}</h3>
                            <p className="text-xs text-slate-600">{q.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-1 text-xs font-medium text-slate-600 group-hover:text-sky-600 transition-colors">
                          <Sparkles className="h-3 w-3" />
                          <span>Gerar análise</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {filteredQuestions.length > 6 && (
                  <button className="w-full py-3 text-sm font-medium text-sky-600 hover:text-sky-700 flex items-center justify-center gap-2">
                    Ver todas as {filteredQuestions.length} perguntas
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {/* MODO PROFUNDO - Deep Analysis */}
            {interactionMode === "deep" && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                    <Brain className="h-48 w-48 text-sky-600" />
                  </div>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shrink-0">
                      <Brain className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-2">Modo Análise Profunda</h3>
                      <p className="text-sm text-slate-600">
                        Explore dados complexos com múltiplas variáveis, correlações avançadas e análise estatística detalhada. Ideal para planeamento estratégico e tomada de decisões críticas.
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        title: "Análise Correlacional Completa",
                        desc: "Identifique relações entre 5+ variáveis",
                        icon: Activity,
                        color: "sky"
                      },
                      {
                        title: "Progressão Multi-Atleta",
                        desc: "Compare evolução de todo o grupo",
                        icon: Users,
                        color: "emerald"
                      },
                      {
                        title: "Predição de Performance",
                        desc: "Modelos estatísticos para próximos 30 dias",
                        icon: TrendingUp,
                        color: "violet"
                      },
                      {
                        title: "Análise de Risco Avançada",
                        desc: "ACWR + Monitorização de fadiga + Padrões",
                        icon: Shield,
                        color: "red"
                      }
                    ].map((item, idx) => {
                      const Icon = item.icon;
                      const colorClasses = {
                        sky: { bg: "from-sky-500 to-sky-600", border: "border-sky-200" },
                        emerald: { bg: "from-emerald-500 to-emerald-600", border: "border-emerald-200" },
                        violet: { bg: "from-violet-500 to-violet-600", border: "border-violet-200" },
                        red: { bg: "from-red-500 to-red-600", border: "border-red-200" }
                      }[item.color] || { bg: "from-slate-500 to-slate-600", border: "border-slate-200" };

                      return (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setSelectedQuestion({ 
                              id: `deep-${idx}`, 
                              question: item.title,
                              reportType: "progress",
                              icon: Icon,
                              color: item.color as any,
                              description: item.desc,
                              estimatedTime: "8-12 min"
                            });
                            setShowContextModal(true);
                          }}
                          className={`p-4 rounded-xl border-2 ${colorClasses.border} bg-white hover:shadow-lg transition-all text-left`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${colorClasses.bg} flex items-center justify-center shrink-0`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 text-sm mb-1">{item.title}</h4>
                              <p className="text-xs text-slate-600">{item.desc}</p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-slate-400 shrink-0" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* MODO HISTÓRIA - Storytelling */}
            {interactionMode === "story" && (
              <div className="space-y-4">
                <div className="p-6 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 opacity-5 pointer-events-none">
                    <MessageCircle className="h-48 w-48 text-violet-600" />
                  </div>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shrink-0">
                      <MessageCircle className="h-7 w-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 mb-2">Modo História</h3>
                      <p className="text-sm text-slate-600">
                        Crie narrativas visuais envolventes para apresentar a atletas, staff ou diretores. Dados transformados em histórias inspiradoras com foco em conquistas e evolução.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      {
                        title: "Jornada do Atleta",
                        desc: "Do início até agora - Uma história de superação",
                        icon: Star,
                        badge: "🏆 Inspirador"
                      },
                      {
                        title: "Evolução da Equipa",
                        desc: "Como crescemos juntos este ano",
                        icon: Users,
                        badge: "👥 Coletivo"
                      },
                      {
                        title: "Caminho para o Objetivo",
                        desc: "Onde estávamos, onde estamos, onde vamos",
                        icon: Target,
                        badge: "🎯 Motivacional"
                      },
                      {
                        title: "Conquistas e Recordes",
                        desc: "Celebrar os momentos de glória",
                        icon: Award,
                        badge: "⭐ Celebração"
                      }
                    ].map((story, idx) => {
                      const Icon = story.icon;
                      return (
                        <motion.button
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => {
                            setSelectedQuestion({ 
                              id: `story-${idx}`, 
                              question: story.title,
                              reportType: "progress",
                              icon: Icon,
                              color: "violet",
                              description: story.desc,
                              estimatedTime: "5 min"
                            });
                            setShowContextModal(true);
                          }}
                          className="w-full p-4 rounded-xl border-2 border-violet-200 bg-white hover:border-violet-400 hover:shadow-lg transition-all text-left group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                              <Icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 mb-1">{story.title}</h4>
                              <p className="text-xs text-slate-600">{story.desc}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-xs font-medium px-2 py-1 rounded-full bg-violet-100 text-violet-700">
                                {story.badge}
                              </span>
                              <ArrowRight className="h-4 w-4 text-violet-600" />
                            </div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Quick Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-sky-500" />
              <h2 className="font-semibold text-slate-900">Ações Rápidas</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                ⚡ 2-3 cliques
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {quickReports.map((report, index) => {
                const Icon = report.icon;
                const colorClasses = {
                  emerald: "from-emerald-500 to-emerald-600",
                  sky: "from-sky-500 to-sky-600",
                  violet: "from-violet-500 to-violet-600",
                  amber: "from-amber-500 to-amber-600",
                  red: "from-red-500 to-red-600"
                }[report.color];

                return (
                  <motion.button
                    key={report.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.2 + index * 0.05 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleQuickReport(report)}
                    className="p-4 rounded-2xl border border-white/60 bg-white/60 backdrop-blur-xl hover:bg-white/90 hover:border-sky-300 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all text-left group"
                  >
                    <div className="flex flex-col gap-3">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${colorClasses} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-md`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1 text-sm">{report.name}</h3>
                        <p className="text-xs text-slate-600 mb-2">{report.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs font-medium text-sky-600">
                            <Clock className="h-3 w-3" />
                            <span>{report.estimatedTime}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
                            <Zap className="h-3 w-3" />
                            <span>{report.clicks} cliques</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Reports */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" />
              <h2 className="font-semibold text-slate-900">Relatórios Recentes</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {recentReports.map((report, index) => (
                <motion.button
                  key={report.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.4 + index * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-3 rounded-xl border border-slate-200 bg-white hover:border-sky-300 hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-sm text-slate-900">{report.name}</p>
                    <Eye className="h-4 w-4 text-slate-400 group-hover:text-sky-500 transition-colors" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{report.date}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {report.views}
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Advanced Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="pt-4 border-t"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-slate-600 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Precisa de mais controlo?
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartFromScratch}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-sky-300 transition-all group"
              >
                <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                Construir do Zero (Avançado)
              </motion.button>
            </div>
          </motion.div>

          {/* AI Assistant FAB */}
          <AnimatePresence>
            {!showAssistant && (
              <motion.button
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAssistant(true)}
                className="fixed bottom-20 sm:bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-br from-sky-500 to-sky-600 text-white shadow-2xl flex items-center justify-center hover:shadow-sky-500/50 transition-all z-50 group"
              >
                <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
                <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-xs font-bold animate-pulse">
                  AI
                </div>
              </motion.button>
            )}
          </AnimatePresence>

          {/* Modals */}
          {renderModals()}
        </div>
      </div>
    );
  }

  // ===== PREVIEW VIEW ===== 
  // (Continue com o mesmo código do PREVIEW VIEW que já estava implementado)
  // (Vou manter o código existente intacto)

  if (viewMode === "preview") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pb-20 sm:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
          
          {/* Header */}
          <ReportHeader
            onBack={() => setViewMode("home")}
            reportTitle={reportTitle}
            setReportTitle={setReportTitle}
            chartsCount={generatedCharts.length}
          />

          <ReportChartsArea reportTitle={reportTitle} generatedCharts={generatedCharts} setGeneratedCharts={setGeneratedCharts} />

          {/* Modals */}
          {renderModals()}
        </div>
      </div>
    );
  }

  // ===== BUILDING VIEW (Advanced Mode) =====
  if (viewMode === "building") {
    return (
      <>
        {renderModals()}
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pb-20 sm:pb-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("home")}
                  className="h-10 w-10 rounded-lg border-2 border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
                >
                  <ArrowRight className="h-4 w-4 text-slate-600 rotate-180" />
                </motion.button>
                <div>
                  <h1 className="font-bold text-slate-900">Construir Relatório Personalizado</h1>
                  <p className="text-sm text-slate-600">Controlo total sobre cada elemento</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  generateSmartReport("progress");
                  setViewMode("preview");
                  toast.success("Relatório criado manualmente!");
                }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold shadow-lg"
              >
                <CheckCircle className="h-4 w-4" />
                Gerar Relatório
              </motion.button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Panel - Configuration */}
              <div className="lg:col-span-1 space-y-4">
                {/* Data Source */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-sky-600" />
                    Fonte de Dados
                  </h3>
                  <div className="space-y-2">
                    {["Exercícios", "Sessões", "Wellness", "Testes"].map((source) => (
                      <button
                        key={source}
                        className="w-full p-3 rounded-lg border-2 border-slate-200 hover:border-sky-300 bg-white hover:bg-sky-50 text-left text-sm font-medium text-slate-700 transition-all"
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                </motion.div>

                {/* Chart Type */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <PieChart className="h-4 w-4 text-emerald-600" />
                    Tipo de Gráfico
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: "Linha", icon: LineChart },
                      { type: "Barras", icon: BarChart2 },
                      { type: "Área", icon: Activity },
                      { type: "Radar", icon: Target }
                    ].map((chart) => {
                      const Icon = chart.icon;
                      return (
                        <button
                          key={chart.type}
                          className="p-3 rounded-lg border-2 border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 flex flex-col items-center gap-2 text-sm font-medium text-slate-700 transition-all"
                        >
                          <Icon className="h-5 w-5" />
                          {chart.type}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Filters */}
                <ReportFilters />
              </div>

              {/* Right Panel - Preview */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 min-h-[600px]"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-slate-900">Preview em Tempo Real</h3>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                        <RefreshCw className="h-4 w-4 text-slate-600" />
                      </button>
                      <button className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50">
                        <Maximize2 className="h-4 w-4 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* Preview Content */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center min-h-[500px] bg-slate-50/50">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                      className="h-16 w-16 rounded-full border-4 border-sky-200 border-t-sky-600 mb-4"
                    />
                    <h4 className="font-semibold text-slate-900 mb-2">Configure e Visualize</h4>
                    <p className="text-sm text-slate-600 text-center max-w-md">
                      Selecione a fonte de dados, tipo de gráfico e filtros à esquerda para ver uma preview em tempo real aqui.
                    </p>
                    <div className="mt-6 flex gap-2">
                      <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse delay-75" />
                      <div className="h-2 w-2 rounded-full bg-violet-500 animate-pulse delay-150" />
                    </div>
                  </div>

                  {/* Quick Tips */}
                  <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <Lightbulb className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-amber-900 text-sm mb-1">Dica Rápida</h4>
                        <p className="text-xs text-amber-800">
                          Experimente o modo inteligente para gerar relatórios automaticamente em poucos cliques. Este modo avançado é ideal quando precisa de controlo granular.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Default return with modals
  return (
    <>
      {renderModals()}
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Report Builder</h2>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    </>
  );
}

