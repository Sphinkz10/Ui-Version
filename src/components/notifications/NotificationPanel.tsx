/**
 * NOTIFICATION PANEL COMPONENT
 * 
 * Dropdown panel with list of notifications
 * Shows recent notifications with filtering
 * 
 * @created 18 Janeiro 2026
 * @version 1.0.0
 */

import { motion } from 'motion/react';
import { 
  X, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  FileText,
  Activity,
  Brain,
  Heart,
  Award,
  Circle,
  Settings,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import type { Notification, NotificationCategory } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';
import { useState } from 'react';

interface NotificationPanelProps {
  workspaceId: string;
  userId?: string;
  onClose: () => void;
  onNotificationClick?: (notificationId: string) => void;
}

export function NotificationPanel({
  workspaceId,
  userId,
  onClose,
  onNotificationClick,
}: NotificationPanelProps) {
  const [showPreferences, setShowPreferences] = useState(false);
  
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications({
    workspaceId,
    userId,
    limit: 10,
    enabled: true,
  });

  // ============================================
  // ICON MAPPING
  // ============================================

  const getNotificationIcon = (category: NotificationCategory, type: string) => {
    const iconMap = {
      pain: AlertCircle,
      session: Activity,
      form: FileText,
      athlete: Users,
      calendar: Calendar,
      decision: Brain,
      metric: TrendingUp,
      injury: Heart,
      record: Award,
      system: Info,
    };

    const Icon = iconMap[category] || Info;
    return Icon;
  };

  const getNotificationColors = (type: string) => {
    const colorMap = {
      alert: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        iconBg: 'bg-red-100',
      },
      success: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: 'text-emerald-600',
        iconBg: 'bg-emerald-100',
      },
      warning: {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        iconBg: 'bg-amber-100',
      },
      info: {
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        icon: 'text-sky-600',
        iconBg: 'bg-sky-100',
      },
    };

    return colorMap[type as keyof typeof colorMap] || colorMap.info;
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate if has action URL
    if (notification.actionUrl) {
      onNotificationClick?.(notification.id);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-900">Notificações</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">
              {unreadCount}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-medium text-sky-600 hover:text-sky-700 transition-colors"
            >
              Marcar todas lidas
            </button>
          )}
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[480px] overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 rounded-full border-4 border-slate-200 border-t-sky-500 animate-spin" />
            <p className="mt-2 text-sm text-slate-500">Carregando...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="inline-flex h-12 w-12 rounded-full bg-slate-100 items-center justify-center mb-3">
              <CheckCircle className="h-6 w-6 text-slate-400" />
            </div>
            <p className="font-medium text-slate-900">Sem notificações</p>
            <p className="text-sm text-slate-500 mt-1">
              Você está em dia! 🎉
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.category, notification.type);
              const colors = getNotificationColors(notification.type);
              const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
                addSuffix: true,
                locale: pt,
              });

              return (
                <motion.button
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full p-4 text-left hover:bg-slate-50 transition-all relative ${
                    !notification.read ? 'bg-sky-50/30' : ''
                  }`}
                >
                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-sky-500" />
                  )}

                  <div className="flex gap-3 pl-3">
                    {/* Icon */}
                    <div className={`shrink-0 h-10 w-10 rounded-xl ${colors.iconBg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${colors.icon}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className={`font-semibold text-sm ${!notification.read ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notification.title}
                        </h4>
                        {notification.priority === 'urgent' && (
                          <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white uppercase">
                            Urgente
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-500">
                          {timeAgo}
                        </span>
                        {notification.actionLabel && (
                          <span className="text-xs font-medium text-sky-600">
                            {notification.actionLabel} →
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            onClick={() => setShowPreferences(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-sky-600 hover:bg-white rounded-lg transition-colors"
          >
            <Settings className="h-4 w-4" />
            Preferências
          </button>
          <button
            onClick={onClose}
            className="flex-1 text-sm font-medium text-sky-600 hover:text-sky-700 transition-colors"
          >
            Ver todas
          </button>
        </div>
      )}

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        workspaceId={workspaceId}
        userId={userId || 'user-demo'}
      />
    </motion.div>
  );
}