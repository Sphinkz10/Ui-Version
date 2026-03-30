/**
 * Login Page - PerformTrack Authentication
 * 
 * Features:
 * - Email + Password login
 * - Form validation
 * - Loading states
 * - Error handling
 * - Link to registration
 * 
 * Design System: 100% compliant with Guidelines.md
 * 
 * @author PerformTrack Team
 * @since Athlete Portal - Authentication System
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, Dumbbell, ArrowRight } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useApp } from '../../contexts/AppContext';

interface LoginPageProps {
  onRegisterClick: () => void;
}

export function LoginPage({ onRegisterClick }: LoginPageProps) {
  const { login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }

    if (!email.includes('@')) {
      toast.error('Email inválido');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      // Success toast is handled in AppContext
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.5 }}
            className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 mb-4"
          >
            <Dumbbell className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">PerformTrack</h1>
          <p className="text-sm text-slate-600">
            Gestão de treino desportivo de alto desempenho
          </p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        >
          <h2 className="text-xl font-bold text-slate-900 mb-6">Entrar na conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-10 pr-12 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-sky-600 hover:text-sky-700 font-medium transition-colors"
                disabled={isLoading}
              >
                Esqueci a password
              </button>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-lg shadow-sky-500/30 hover:from-sky-400 hover:to-sky-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>A entrar...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>



          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-600">
              Não tens conta?{' '}
              <button
                type="button"
                onClick={onRegisterClick}
                className="text-sky-600 hover:text-sky-700 font-semibold transition-colors"
                disabled={isLoading}
              >
                Criar conta
              </button>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-center text-xs text-slate-500"
        >
          © 2024 PerformTrack. Todos os direitos reservados.
        </motion.div>
      </motion.div>
    </div>
  );
}
