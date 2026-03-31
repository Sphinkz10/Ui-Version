import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Trash2,
  Eye,
  Edit,
  Send,
  BarChart3,
  Settings,
  Zap,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Layout,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  Radio,
  MapPin,
  Upload,
  Star,
  Pen,
  Mail,
  Phone,
  Link,
  Code,
  List,
  TrendingUp,
  GripVertical,
  Archive,
  Link2
} from "lucide-react";
import { toast } from "sonner";
import { FieldQuickConfigModal } from "../modals/FieldQuickConfigModal";
import { ConditionalLogicModal } from "../modals/ConditionalLogicModal";
import { FormAnalyticsModal } from "../modals/FormAnalyticsModal";
import { EmailTemplateModal } from "../modals/EmailTemplateModal";
import { MetricLinkingPanel } from "../forms/MetricLinkingPanel";
import { MetricLinkBadgeCompact } from "../forms/MetricLinkBadge";
import { SmartMetricSuggestion } from "../forms/SmartMetricSuggestion";
import { LinkedMetricsPreview } from "../forms/LinkedMetricsPreview";
import type { FormField } from "@/types/metrics";
import { mockMetrics } from "@/lib/mockDataSprint0";

interface Form {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published" | "archived";
  responses: number;
  completionRate: number;
  avgTime: string;
  lastEdited: string;
  fields: number;
  category: string;
}

export function FormCenter() {
  const [activeTab, setActiveTab] = useState<"all" | "templates" | "responses">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedForm, setSelectedForm] = useState<Form | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const forms: Form[] = [
    {
      id: "1",
      name: "Avaliação Inicial Completa",
      description: "Formulário completo para novos atletas com histórico médico e objetivos",
      status: "published",
      responses: 245,
      completionRate: 87,
      avgTime: "8m 32s",
      lastEdited: "Há 2 dias",
      fields: 28,
      category: "Avaliação"
    },
    {
      id: "2",
      name: "Check-in Semanal",
      description: "Acompanhamento rápido de progresso e bem-estar",
      status: "published",
      responses: 1205,
      completionRate: 92,
      avgTime: "3m 15s",
      lastEdited: "Há 5 dias",
      fields: 12,
      category: "Follow-up"
    },
    {
      id: "3",
      name: "Feedback Pós-Sessão",
      description: "Avaliação de satisfação e resultados da sessão",
      status: "published",
      responses: 892,
      completionRate: 94,
      avgTime: "2m 45s",
      lastEdited: "Há 1 semana",
      fields: 8,
      category: "Feedback"
    },
    {
      id: "4",
      name: "Termo de Responsabilidade",
      description: "Consentimento e liberação médica com assinatura digital",
      status: "published",
      responses: 178,
      completionRate: 99,
      avgTime: "5m 20s",
      lastEdited: "Há 3 semanas",
      fields: 15,
      category: "Legal"
    },
    {
      id: "5",
      name: "Avaliação Nutricional",
      description: "Análise de hábitos alimentares e necessidades nutricionais",
      status: "draft",
      responses: 0,
      completionRate: 0,
      avgTime: "-",
      lastEdited: "Hoje",
      fields: 22,
      category: "Avaliação"
    }
  ];

  const templates = [
    { id: "t1", name: "Avaliação Inicial", icon: FileText, fields: 25, description: "Completo para novos atletas" },
    { id: "t2", name: "PAR-Q", icon: AlertCircle, fields: 7, description: "Questionário de prontidão" },
    { id: "t3", name: "Satisfação", icon: Star, fields: 10, description: "NPS e feedback" },
    { id: "t4", name: "Medições", icon: Hash, fields: 15, description: "Antropometria completa" },
    { id: "t5", name: "Anamnese", icon: FileText, fields: 30, description: "Histórico médico detalhado" },
    { id: "t6", name: "Consentimento", icon: Pen, fields: 8, description: "Termo com assinatura" }
  ];

  const filteredForms = forms.filter(form => {
    const matchesSearch = form.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         form.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || form.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case "published": return "bg-emerald-100 text-emerald-700";
      case "draft": return "bg-amber-100 text-amber-700";
      case "archived": return "bg-slate-100 text-slate-700";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published": return "Publicado";
      case "draft": return "Rascunho";
      case "archived": return "Arquivado";
      default: return status;
    }
  };

  // Calcular stats aprimoradas
  const totalResponses = forms.reduce((acc, f) => acc + f.responses, 0);
  const avgCompletionRate = Math.round(
    forms.filter(f => f.responses > 0).reduce((acc, f) => acc + f.completionRate, 0) / 
    forms.filter(f => f.responses > 0).length
  );
  const activeForms = forms.filter(f => f.status === "published").length;
  const totalFields = forms.reduce((acc, f) => acc + f.fields, 0);

  if (showBuilder) {
    return <FormBuilder onClose={() => setShowBuilder(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="font-bold text-slate-900 mb-1">📋 Form Center</h1>
            <p className="text-sm text-slate-600">Crie formulários inteligentes com lógica condicional e automações</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowBuilder(true)}
            className="flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:to-sky-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            Criar Formulário
          </motion.button>
        </div>

        {/* Stats Aprimoradas - 5 Cards - ✅ Day 12: Already responsive 2/5 cols */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { 
              label: "Forms Ativos", 
              value: activeForms.toString(), 
              icon: FileText, 
              color: "sky",
              trend: "+2 este mês"
            },
            { 
              label: "Total Respostas", 
              value: totalResponses.toLocaleString(), 
              icon: Users, 
              color: "emerald",
              trend: "↗️ +15%"
            },
            { 
              label: "Taxa Média Conclusão", 
              value: `${avgCompletionRate}%`, 
              icon: CheckCircle, 
              color: "violet",
              trend: "92% média"
            },
            { 
              label: "Tempo Médio", 
              value: "4m 28s", 
              icon: Clock, 
              color: "amber",
              trend: "⬇️ -30s"
            },
            { 
              label: "Total Campos", 
              value: totalFields.toString(), 
              icon: List, 
              color: "rose",
              trend: `${Math.round(totalFields / forms.length)} por form`
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            const colorClasses = {
              sky: { bg: "bg-gradient-to-br from-sky-50/90 to-white/90", icon: "bg-gradient-to-br from-sky-500 to-sky-600" },
              emerald: { bg: "bg-gradient-to-br from-emerald-50/90 to-white/90", icon: "bg-gradient-to-br from-emerald-500 to-emerald-600" },
              violet: { bg: "bg-gradient-to-br from-violet-50/90 to-white/90", icon: "bg-gradient-to-br from-violet-500 to-violet-600" },
              amber: { bg: "bg-gradient-to-br from-amber-50/90 to-white/90", icon: "bg-gradient-to-br from-amber-500 to-amber-600" },
              rose: { bg: "bg-gradient-to-br from-rose-50/90 to-white/90", icon: "bg-gradient-to-br from-rose-500 to-rose-600" }
            }[stat.color];

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-2xl border border-slate-200/80 ${colorClasses.bg} p-4 shadow-sm`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-8 w-8 rounded-xl ${colorClasses.icon} flex items-center justify-center`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                </div>
                <p className="font-semibold text-slate-900 mb-0.5">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.trend}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: "all" as const, label: "Meus Formulários", icon: "📝" },
            { id: "templates" as const, label: "Templates", icon: "📚" },
            { id: "responses" as const, label: "Respostas", icon: "📊" }
          ].map(tab => (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30"
                  : "bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-300"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </motion.button>
          ))}
        </div>

        {activeTab === "all" && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Procurar formulários..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all"
                />
              </div>
              <div className="relative flex-1 sm:flex-none sm:w-40">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white/90 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">Todos</option>
                  <option value="published">Publicados</option>
                  <option value="draft">Rascunhos</option>
                  <option value="archived">Arquivados</option>
                </select>
              </div>
            </div>

            {/* Forms Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
              {filteredForms.map((form, index) => (
                <motion.div
                  key={form.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/50 p-4 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-900">{form.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(form.status)}`}>
                          {form.status === "published" && <CheckCircle className="h-3 w-3" />}
                          {form.status === "draft" && <Clock className="h-3 w-3" />}
                          {getStatusLabel(form.status)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{form.description}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {form.fields} campos
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {form.responses} respostas
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {form.avgTime}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === form.id ? null : form.id);
                        }}
                        className="h-8 w-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
                      >
                        <MoreVertical className="h-4 w-4 text-slate-600" />
                      </button>
                      
                      <AnimatePresence>
                        {openMenuId === form.id && (
                          <>
                            {/* Backdrop */}
                            <div 
                              className="fixed inset-0 z-10"
                              onClick={() => setOpenMenuId(null)}
                            />
                            
                            {/* Menu */}
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-20"
                            >
                              <button 
                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                onClick={() => {
                                  navigator.clipboard.writeText(`https://performtrack.app/forms/${form.id}`);
                                  toast.success("Link copiado!");
                                  setOpenMenuId(null);
                                }}
                              >
                                <Link className="h-4 w-4 text-slate-600" />
                                Copiar Link
                              </button>
                              
                              <button 
                                className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                onClick={() => {
                                  toast.success(`Formulário "${form.name}" duplicado!`);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Copy className="h-4 w-4 text-slate-600" />
                                Duplicar
                              </button>
                              
                              <div className="h-px bg-slate-200 my-1" />
                              
                              <button 
                                className="w-full px-4 py-2 text-left text-sm hover:bg-amber-50 text-amber-700 flex items-center gap-2 transition-colors"
                                onClick={() => {
                                  toast.success(`Formulário "${form.name}" arquivado!`);
                                  setOpenMenuId(null);
                                }}
                              >
                                <Archive className="h-4 w-4" />
                                Arquivar
                              </button>
                              
                              <button 
                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2 transition-colors"
                                onClick={() => {
                                  if (window.confirm(`Tem certeza que deseja deletar "${form.name}"?`)) {
                                    toast.success("Formulário deletado!");
                                    setOpenMenuId(null);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Deletar
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="rounded-lg bg-white border border-slate-200 p-2">
                      <p className="text-xs text-slate-500 mb-0.5">Taxa Conclusão</p>
                      <p className="font-semibold text-slate-900">{form.completionRate}%</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 p-2">
                      <p className="text-xs text-slate-500 mb-0.5">Tempo Médio</p>
                      <p className="font-semibold text-slate-900">{form.avgTime}</p>
                    </div>
                    <div className="rounded-lg bg-white border border-slate-200 p-2">
                      <p className="text-xs text-slate-500 mb-0.5">Última Edição</p>
                      <p className="font-semibold text-slate-900 text-xs">{form.lastEdited}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowBuilder(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Editar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toast.success("Link copiado!")}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      <Send className="h-4 w-4" />
                      Enviar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {activeTab === "templates" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {templates.map((template, index) => {
              const Icon = template.icon;
              return (
                <motion.button
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    toast.success(`Template "${template.name}" selecionado!`);
                    setShowBuilder(true);
                  }}
                  className="group p-4 rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-white hover:border-sky-400 hover:shadow-xl transition-all text-left"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-0.5">{template.name}</h3>
                      <p className="text-xs text-slate-600">{template.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{template.fields} campos</span>
                    <span className="text-sky-600 font-medium">Usar template →</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {activeTab === "responses" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="font-semibold text-slate-900 mb-2">Análise de Respostas</h3>
            <p className="text-sm text-slate-600 mb-4">
              Selecione um formulário para ver analytics detalhadas das respostas
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab("all")}
              className="px-6 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md hover:from-sky-400 hover:to-sky-500 transition-all"
            >
              Ver Formulários
            </motion.button>
          </div>
        )}

      </div>
    </div>
  );
}

// Form Builder Component
function FormBuilder({ onClose }: { onClose: () => void }) {
  const [formName, setFormName] = useState("Novo Formulário");
  const [activeBuilderTab, setActiveBuilderTab] = useState<"build" | "logic" | "metrics" | "settings">("build");
  const [formFields, setFormFields] = useState<Array<{
    id: string;
    type: string;
    name: string;
    label: string;
    icon: any;
    config?: any;
    linkedMetricId?: string; // NEW: Track linked metric
  }>>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [showQuickConfig, setShowQuickConfig] = useState(false);
  const [fieldBeingConfigured, setFieldBeingConfigured] = useState<any>(null);
  const [showConditionalLogic, setShowConditionalLogic] = useState(false);
  const [showFormAnalytics, setShowFormAnalytics] = useState(false);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [metricLinks, setMetricLinks] = useState<Array<{fieldId: string, metricId: string, metricName: string}>>([]);
  const [showSmartSuggestion, setShowSmartSuggestion] = useState<string | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  const fieldTypes = [
    { id: "text", name: "Texto", icon: Type, category: "Básico" },
    { id: "number", name: "Número", icon: Hash, category: "Básico" },
    { id: "email", name: "Email", icon: Mail, category: "Básico" },
    { id: "phone", name: "Telefone", icon: Phone, category: "Básico" },
    { id: "date", name: "Data", icon: Calendar, category: "Básico" },
    { id: "radio", name: "Escolha Única", icon: Radio, category: "Seleção" },
    { id: "checkbox", name: "Múltipla Escolha", icon: CheckSquare, category: "Seleção" },
    { id: "rating", name: "Avaliação", icon: Star, category: "Avançado" },
    { id: "location", name: "Localização", icon: MapPin, category: "Avançado" },
    { id: "upload", name: "Upload", icon: Upload, category: "Avançado" },
    { id: "signature", name: "Assinatura", icon: Pen, category: "Avançado" }
  ];

  const handleAddField = (fieldType: typeof fieldTypes[0]) => {
    const newField = {
      id: `field-${Date.now()}`,
      type: fieldType.id,
      name: fieldType.name,
      label: `${fieldType.name} ${formFields.length + 1}`,
      icon: fieldType.icon,
      order: formFields.length + 1,
      category: fieldType.category,
      config: {
        required: false,
        placeholder: "",
        description: ""
      }
    };
    
    // Adiciona direto ao canvas sem abrir configuração
    setFormFields([...formFields, newField]);
    toast.success(`Campo "${newField.label}" adicionado!`);
    
    // 🔥 SMART SUGGESTION TRIGGER
    // Check if field should trigger smart suggestion
    if (!dismissedSuggestions.has(newField.id)) {
      const shouldSuggest = 
        newField.type === 'number' || 
        newField.type === 'rating' ||
        newField.label.toLowerCase().includes('sleep') ||
        newField.label.toLowerCase().includes('pain') ||
        newField.label.toLowerCase().includes('hrv') ||
        newField.label.toLowerCase().includes('rpe');
      
      if (shouldSuggest) {
        setShowSmartSuggestion(newField.id);
      }
    }
  };

  const handleFieldClick = (field: any) => {
    setFieldBeingConfigured(field);
    setShowQuickConfig(true);
  };

  const handleSaveFieldConfig = (config: any) => {
    if (fieldBeingConfigured.id.startsWith('field-')) {
      // Novo campo
      const configuredField = {
        ...fieldBeingConfigured,
        label: config.label,
        config: config
      };
      setFormFields([...formFields, configuredField]);
      toast.success(`Campo "${config.label}" adicionado!`);
    } else {
      // Editar existente
      setFormFields(
        formFields.map(f => 
          f.id === fieldBeingConfigured.id 
            ? { ...f, label: config.label, config: config }
            : f
        )
      );
      toast.success(`Campo "${config.label}" atualizado!`);
    }
    
    setShowQuickConfig(false);
    setFieldBeingConfigured(null);
  };

  const handleRemoveField = (fieldId: string) => {
    const field = formFields.find(f => f.id === fieldId);
    if (!field) return;
    
    if (window.confirm(`Tem certeza que deseja remover o campo "${field.label}"?`)) {
      setFormFields(formFields.filter(f => f.id !== fieldId));
      if (selectedFieldId === fieldId) {
        setSelectedFieldId(null);
      }
      toast.success(`Campo "${field.label}" removido!`);
    }
  };

  const handleMoveField = (dragIndex: number, hoverIndex: number) => {
    const draggedField = formFields[dragIndex];
    const newFields = [...formFields];
    newFields.splice(dragIndex, 1);
    newFields.splice(hoverIndex, 0, draggedField);
    setFormFields(newFields);
  };

  const handleDuplicateField = (field: any) => {
    const duplicatedField = {
      ...field,
      id: `field-${Date.now()}`,
      label: `${field.label} (Cópia)`,
      order: formFields.length + 1
    };
    setFormFields([...formFields, duplicatedField]);
    toast.success(`Campo "${field.label}" duplicado!`);
  };

  // 🔥 SMART SUGGESTION HANDLERS
  const handleCreateMetricFromSuggestion = (fieldId: string, config: any) => {
    // Create metric from smart suggestion
    const field = formFields.find(f => f.id === fieldId);
    if (!field) return;

    toast.success(`Métrica "${config.name}" criada e linkada ao campo "${field.label}"!`);
    
    // Mark field as linked
    setFormFields(formFields.map(f => 
      f.id === fieldId ? { ...f, linkedMetricId: `metric-${Date.now()}` } : f
    ));
    
    // Hide suggestion
    setShowSmartSuggestion(null);
  };

  const handleUseDuplicateMetric = (fieldId: string, metricId: string) => {
    const field = formFields.find(f => f.id === fieldId);
    if (!field) return;

    toast.success(`Campo "${field.label}" linkado à métrica existente!`);
    
    // Link to existing metric
    setFormFields(formFields.map(f => 
      f.id === fieldId ? { ...f, linkedMetricId: metricId } : f
    ));
    
    // Hide suggestion
    setShowSmartSuggestion(null);
  };

  const handleDismissSmartSuggestion = (fieldId: string) => {
    setDismissedSuggestions(new Set([...dismissedSuggestions, fieldId]));
    setShowSmartSuggestion(null);
  };

  const selectedField = formFields.find(f => f.id === selectedFieldId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white pb-20 sm:pb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="h-9 w-9 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              ←
            </motion.button>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="font-semibold text-slate-900 bg-transparent border-none focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toast.success("Formulário salvo!")}
              className="px-4 py-2 text-sm font-semibold rounded-xl border-2 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all"
            >
              Salvar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toast.success("Formulário publicado!")}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-400 hover:to-emerald-500 transition-all"
            >
              Publicar
            </motion.button>
          </div>
        </div>

        {/* Builder Tabs */}
        <div className="flex gap-2">
          {[
            { id: "build" as const, label: "Construir", icon: Layout },
            { id: "logic" as const, label: "Lógica", icon: Zap },
            { id: "metrics" as const, label: "Métricas", icon: BarChart3 },
            { id: "settings" as const, label: "Configurações", icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveBuilderTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  activeBuilderTab === tab.id
                    ? "bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md"
                    : "bg-white border-2 border-slate-200 text-slate-700 hover:border-sky-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Builder Content */}
        {activeBuilderTab === "build" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          
          {/* Component Library */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4 max-h-[600px] overflow-y-auto">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Componentes</h3>
            <div className="space-y-1">
              {fieldTypes.map(field => {
                const Icon = field.icon;
                return (
                  <motion.button
                    key={field.id}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-left transition-all"
                    onClick={() => handleAddField(field)}
                  >
                    <Icon className="h-4 w-4 text-slate-600" />
                    <span className="text-slate-700">{field.name}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Preview Canvas */}
          <div className="lg:col-span-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 min-h-[600px]">
            {formFields.length === 0 ? (
              <div className="text-center py-20">
                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Layout className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">Canvas do Formulário</h3>
                <p className="text-sm text-slate-600">
                  Clique nos componentes da esquerda para adicionar ao formulário
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {formFields.map((field, index) => {
                  const Icon = field.icon;
                  const isSelected = selectedFieldId === field.id;
                  
                  return (
                    <React.Fragment key={field.id}>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group relative rounded-xl bg-white border-2 p-4 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-sky-400 shadow-md' 
                          : 'border-slate-200 hover:border-sky-300'
                      }`}
                      onClick={() => handleFieldClick(field)}
                    >
                      {/* Drag Handle */}
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
                        <GripVertical className="h-4 w-4 text-slate-400" />
                      </div>

                      <div className="flex items-start gap-3 pl-6">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-sky-500 to-sky-600 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-slate-900 text-sm">
                              {field.label}
                            </span>
                            {field.config?.required && (
                              <span className="text-red-500 text-sm">*</span>
                            )}
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {field.name}
                            </span>
                            
                            {/* 🔗 LINKED METRIC PREVIEW */}
                            {field.linkedMetricId && (() => {
                              const linkedMetric = mockMetrics.find(m => m.id === field.linkedMetricId);
                              if (linkedMetric) {
                                return (
                                  <LinkedMetricsPreview
                                    fieldId={field.id}
                                    metricId={linkedMetric.id}
                                    metricName={linkedMetric.name}
                                    metricCategory={linkedMetric.category}
                                    metricType={linkedMetric.type}
                                    metricUnit={linkedMetric.unit}
                                    onUnlink={() => {
                                      setFormFields(formFields.map(f => 
                                        f.id === field.id ? { ...f, linkedMetricId: undefined } : f
                                      ));
                                      toast.success('Campo desvinculado da métrica!');
                                    }}
                                    onViewDetails={() => setActiveBuilderTab('metrics')}
                                  />
                                );
                              }
                              return null;
                            })()}
                          </div>
                          
                          {/* Field Preview Simples */}
                          <div className="text-sm text-slate-600">
                            {(field.type === 'text' || field.type === 'email' || field.type === 'phone') && (
                              <div className="text-xs text-slate-500">
                                {field.config?.placeholder || "Campo de texto"}
                              </div>
                            )}
                            {field.type === 'radio' && field.config?.options && (
                              <div className="text-xs text-slate-500">
                                {field.config.options.length} opções
                              </div>
                            )}
                            {field.type === 'rating' && (
                              <div className="flex gap-0.5">
                                {Array.from({ length: Math.min(field.config?.ratingScale || 5, 5) }).map((_, i) => (
                                  <span key={i} className="text-amber-400">⭐</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFieldClick(field);
                            }}
                            className="h-7 w-7 rounded hover:bg-sky-50 flex items-center justify-center"
                            title="Configurações"
                          >
                            <Settings className="h-4 w-4 text-sky-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (index > 0) handleMoveField(index, index - 1);
                            }}
                            className="h-7 w-7 rounded hover:bg-slate-100 flex items-center justify-center text-sm disabled:opacity-30"
                            disabled={index === 0}
                            title="Mover para cima"
                          >
                            ↑
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (index < formFields.length - 1) handleMoveField(index, index + 1);
                            }}
                            className="h-7 w-7 rounded hover:bg-slate-100 flex items-center justify-center text-sm disabled:opacity-30"
                            disabled={index === formFields.length - 1}
                            title="Mover para baixo"
                          >
                            ↓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateField(field);
                            }}
                            className="h-7 w-7 rounded hover:bg-emerald-50 flex items-center justify-center"
                            title="Duplicar"
                          >
                            <Copy className="h-4 w-4 text-emerald-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveField(field.id);
                            }}
                            className="h-7 w-7 rounded hover:bg-red-50 flex items-center justify-center text-red-600"
                            title="Remover"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                    
                    {/* 🔥 SMART METRIC SUGGESTION - Render below field */}
                    {showSmartSuggestion === field.id && (
                      <div className="mt-2 pl-6">
                        <SmartMetricSuggestion
                          field={{
                            id: field.id,
                            formId: "form-current",
                            fieldKey: field.type,
                            fieldLabel: field.label,
                            fieldType: field.type === "number" ? "number" : 
                                      field.type === "checkbox" ? "checkbox" :
                                      field.type === "radio" ? "select" :
                                      field.type === "rating" ? "number" : "text",
                            required: field.config?.required || false,
                            order: index + 1,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                          }}
                          existingMetrics={mockMetrics}
                          onCreateMetric={(config) => handleCreateMetricFromSuggestion(field.id, config)}
                          onUseDuplicate={(metricId) => handleUseDuplicateMetric(field.id, metricId)}
                          onDismiss={() => handleDismissSmartSuggestion(field.id)}
                        />
                      </div>
                    )}
                  </React.Fragment>
                  );
                })}</div>
            )}
          </div>

          {/* Properties Panel - Simplificado */}
          <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="font-semibold text-slate-900 mb-3 text-sm">Ações Rápidas</h3>
            <div className="space-y-2">
              {/* Analytics */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const mockForm = {
                    id: "1",
                    name: formName,
                    responses: 245,
                    completionRate: 87,
                    avgTime: "8m 32s",
                    fields: formFields.length
                  };
                  setShowFormAnalytics(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border-2 border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                Ver Analytics
              </motion.button>

              {/* Enviar Email */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowEmailTemplate(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border-2 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all"
              >
                <Mail className="h-4 w-4" />
                Enviar por Email
              </motion.button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-3 text-sm">Dicas</h3>
              <div className="space-y-3 text-xs text-slate-600">
                <p className="flex items-start gap-2">
                  <span className="text-sky-500 shrink-0">💡</span>
                  <span>Clique em <Settings className="inline h-3 w-3" /> para editar configurações</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-emerald-500 shrink-0">⚡</span>
                  <span>Arraste <GripVertical className="inline h-3 w-3" /> para reordenar campos</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-amber-500 shrink-0">🎯</span>
                  <span>Use a tab Lógica para regras condicionais</span>
                </p>
                {formFields.length > 0 && (
                  <div className="pt-3 border-t border-slate-200">
                    <p className="font-medium text-slate-900 mb-1">Resumo</p>
                    <p>{formFields.length} campo{formFields.length !== 1 ? 's' : ''}</p>
                    <p>{formFields.filter(f => f.config?.required).length} obrigatório{formFields.filter(f => f.config?.required).length !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Logic Tab Content */}
        {activeBuilderTab === "logic" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8">
            <div className="text-center max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-violet-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Lógica Condicional</h3>
              <p className="text-sm text-slate-600 mb-6">
                Configure regras para mostrar/esconder campos baseado nas respostas
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowConditionalLogic(true)}
                className="px-6 py-3 bg-gradient-to-r from-violet-500 to-violet-600 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Configurar Regras
              </motion.button>
              {formFields.length === 0 && (
                <p className="text-xs text-amber-600 mt-4">
                  ️ Adicione campos primeiro para criar regras
                </p>
              )}
            </div>
          </div>
        )}

        {/* Metrics Tab Content */}
        {activeBuilderTab === "metrics" && (
          <div className="h-[calc(100vh-280px)]">
            <MetricLinkingPanel
              formId="form-current"
              fields={formFields.map(f => ({
                id: f.id,
                formId: "form-current",
                fieldKey: f.type,
                fieldLabel: f.label,
                fieldType: f.type === "number" ? "number" : 
                          f.type === "checkbox" ? "checkbox" :
                          f.type === "radio" ? "select" :
                          f.type === "date" ? "date" : "text",
                required: f.config?.required || false,
                order: formFields.indexOf(f) + 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }))}
              workspaceId="workspace-demo"
              onLinkCreated={(link) => {
                toast.success(`Link criado: Field "${link.fieldName}" → Metric "${link.metric.name}"`);
              }}
              onLinkRemoved={(linkId) => {
                toast.success("Link removido com sucesso!");
              }}
              onMetricCreated={(metric) => {
                toast.success(`Métrica "${metric.name}" criada e linkada!`);
              }}
            />
          </div>
        )}

        {/* Settings Tab Content */}
        {activeBuilderTab === "settings" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900 mb-6">Configurações do Formulário</h3>
            
            <div className="space-y-6 max-w-2xl">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Nome do Formulário
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Descrição
                </label>
                <textarea
                  className="w-full px-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/30 resize-none"
                  rows={3}
                  placeholder="Descreva o objetivo deste formulário..."
                />
              </div>

              {/* Opções */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Opções Avançadas
                </label>
                
                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Permitir múltiplas respostas</p>
                    <p className="text-xs text-slate-500">Mesmo usuário pode responder várias vezes</p>
                  </div>
                  <input type="checkbox" className="rounded text-sky-500" />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Salvar progresso automaticamente</p>
                    <p className="text-xs text-slate-500">Usuário pode continuar de onde parou</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-sky-500" />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Mostrar barra de progresso</p>
                    <p className="text-xs text-slate-500">Exibir % de completamento</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded text-sky-500" />
                </label>

                <label className="flex items-center justify-between p-4 bg-slate-50 rounded-lg cursor-pointer">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Notificar após cada resposta</p>
                    <p className="text-xs text-slate-500">Receber email quando alguém responder</p>
                  </div>
                  <input type="checkbox" className="rounded text-sky-500" />
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEmailTemplate(true)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl shadow-md"
                >
                  <Send className="h-4 w-4" />
                  Enviar Formulário
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toast.success("Link copiado!")}
                  className="px-4 py-3 border-2 border-sky-200 bg-sky-50 text-sky-700 font-semibold rounded-xl hover:bg-sky-100 transition-all"
                >
                  <Link className="h-4 w-4" />
                </motion.button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Quick Config Modal */}
      {showQuickConfig && fieldBeingConfigured && (
        <FieldQuickConfigModal
          field={fieldBeingConfigured}
          initialConfig={fieldBeingConfigured.config}
          onSave={handleSaveFieldConfig}
          onClose={() => {
            setShowQuickConfig(false);
            setFieldBeingConfigured(null);
          }}
        />
      )}
      {/* Conditional Logic Modal */}
      {showConditionalLogic && (
        <ConditionalLogicModal
          formFields={formFields}
          rules={[]}
          onSave={(rules) => {
            setShowConditionalLogic(false);
          }}
          onClose={() => setShowConditionalLogic(false)}
        />
      )}
      {/* Form Analytics Modal */}
      {showFormAnalytics && (
        <FormAnalyticsModal
          form={{
            id: "1",
            name: formName,
            responses: 245,
            completionRate: 87,
            avgTime: "8m 32s",
            fields: formFields.length
          }}
          onClose={() => setShowFormAnalytics(false)}
        />
      )}
      {/* Email Template Modal */}
      {showEmailTemplate && (
        <EmailTemplateModal
          form={{
            id: "1",
            name: formName,
            avgTime: "8m 32s"
          }}
          onClose={() => setShowEmailTemplate(false)}
          onSend={(config) => {
            setShowEmailTemplate(false);
          }}
        />
      )}
    </div>
  );
}