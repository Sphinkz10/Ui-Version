import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { toast } from 'sonner@2.0.3';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'coach' | 'athlete';
  avatarUrl?: string;
}

interface Workspace {
  id: string;
  name: string;
  type: 'gym' | 'team' | 'personal';
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  workspace: Workspace | null;
  setWorkspace: (workspace: Workspace | null) => void;
  isAuthenticated: boolean;
  isCoach: boolean;
  isAthlete: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  workspaceId: string;
  userId: string;
  userRole: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'coach' | 'athlete';
  workspaceName?: string;
  coachId?: string;
}


export function AppProvider({ children }: AppProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const mountedRef = useRef(true);
  const loadingProfileRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured. Application requires Supabase credentials (.env) to function securely.');
    }
  }, []);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const safeSetLoading = (value: boolean) => {
    if (mountedRef.current) setIsLoading(value);
  };

  const loadUserProfile = async (supabaseUser: SupabaseUser, throwIfNotFound = false) => {
    if (loadingProfileRef.current) {
      console.log('[Auth] Profile load already in progress, skipping duplicate call');
      return;
    }

    loadingProfileRef.current = true;

    try {
      console.log('[Auth] Loading profile for', supabaseUser.id);

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      console.log('[Auth] Users query finished');

      if (profileError) throw profileError;

      let finalProfile = profile;

      const INVALID_WORKSPACE_IDS = new Set([
        '00000000-0000-0000-0000-000000000000',
        '00000000-0000-0000-0000-000000000001',
      ]);

      if (finalProfile?.workspace_id && INVALID_WORKSPACE_IDS.has(finalProfile.workspace_id)) {
        console.warn('[Auth] Invalid placeholder workspace detected. Ignoring workspace_id:', finalProfile.workspace_id);
        finalProfile = {
          ...finalProfile,
          workspace_id: null,
        };
      }

      if (!finalProfile) {
        console.warn('[Auth] User authenticated but profile not found. Creating profile...');

        const { data: createdProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.name || 'Novo Utilizador',
            role: (supabaseUser.user_metadata?.role || 'athlete') as 'coach' | 'athlete',
            workspace_id: null,
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${supabaseUser.email || supabaseUser.id}`,
          })
          .select('*')
          .single();

        if (createError) throw createError;
        finalProfile = createdProfile;
      }

      let workspaceData = null;

      if (finalProfile?.workspace_id) {
        const { data: ws, error: wsError } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', finalProfile.workspace_id)
          .maybeSingle();

        console.log('[Auth] Workspace query finished');

        if (wsError) throw wsError;
        workspaceData = ws;
      }

      if (!mountedRef.current) return;

      setUser({
        id: finalProfile.id,
        name: finalProfile.name || 'Utilizador',
        email: finalProfile.email || supabaseUser.email || '',
        role: (finalProfile.role || 'athlete') as 'admin' | 'coach' | 'athlete',
        avatarUrl: finalProfile.avatar_url || undefined,
      });

      setWorkspace(
        workspaceData
          ? {
            id: workspaceData.id,
            name: workspaceData.name,
            type: (workspaceData.type || 'personal') as 'gym' | 'team' | 'personal',
          }
          : null
      );

      console.log('[Auth] Profile loaded successfully');
    } catch (error) {
      console.error('[Auth] Failed to load user profile:', error);

      if (mountedRef.current) {
        setUser(null);
        setWorkspace(null);
      }

      if (throwIfNotFound) {
        toast.error('Erro ao carregar perfil');
        throw error;
      }
    } finally {
      loadingProfileRef.current = false;
      safeSetLoading(false);
    }
  };

  useEffect(() => {
    let subscription: any = null;

    async function initAuth() {
      try {
        console.log('[Auth] Starting initialization...');
        safeSetLoading(true);

        console.log('[Auth] Checking session...');
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (!mountedRef.current) return;

        if (session?.user) {
          console.log('[Auth] Found existing session:', session.user.id);
          await loadUserProfile(session.user);
        } else {
          console.log('[Auth] No session found.');
          setUser(null);
          setWorkspace(null);
          safeSetLoading(false);
        }
      } catch (error) {
        console.error('[Auth] Failed to initialize:', error);
        if (mountedRef.current) {
          setUser(null);
          setWorkspace(null);
          setIsLoading(false);
        }
      } finally {
        initializedRef.current = true;
      }
    }

    initAuth();

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!mountedRef.current) return;

        console.log('[Auth] State change:', event);

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setWorkspace(null);
          setIsLoading(false);
          localStorage.removeItem('sb-oauth-token');
          return;
        }

        if (!session?.user) return;

        // Evita duplicar com a inicialização
        if (!initializedRef.current) {
          console.log('[Auth] Init still running, skipping auth state profile load');
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          safeSetLoading(true);

          // IMPORTANT: não await direto dentro do callback
          setTimeout(() => {
            loadUserProfile(session.user).catch((err) => {
              console.error('[Auth] onAuthStateChange profile load failed:', err);
              safeSetLoading(false);
            });
          }, 0);
        }
      });
      subscription = data.subscription;

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('[Auth] Attempting login with:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('[Auth] Login response:', { data, error });

      if (error) throw error;

      if (data.user) {
        console.log('[Auth] Login successful. User:', data.user.id);
        toast.success('Bem-vindo!');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Erro ao fazer login');
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setWorkspace(null);
      toast.success('Sessão terminada');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error('Erro ao terminar sessão');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            role: data.role,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      if (authData.user && !authData.session) {
        throw new Error('Conta criada! Por favor verifica o teu email para ativar a conta.');
      }

      let workspaceId = data.coachId || null;

      if (data.role === 'coach') {
        const { data: workspaceData, error: workspaceError } = await supabase
          .from('workspaces')
          .insert({
            name: data.workspaceName || 'Meu Workspace',
            type: 'gym',
          })
          .select()
          .single();

        if (workspaceError) throw workspaceError;
        workspaceId = workspaceData.id;
      }

      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: data.email,
          name: data.name,
          role: data.role,
          workspace_id: workspaceId,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
        });

      if (profileError) throw profileError;

      if (workspaceId) {
        const { error: membershipError } = await supabase
          .from('workspace_members')
          .insert({
            workspace_id: workspaceId,
            user_id: authData.user.id,
            role: data.role,
          });

        if (membershipError) {
          console.warn('Workspace membership insert warning:', membershipError);
        }
      }

      if (data.role === 'athlete') {
        const { error: athleteError } = await supabase
          .from('athletes')
          .insert({
            workspace_id: workspaceId,
            user_id: authData.user.id,
            name: data.name,
            email: data.email,
          });

        if (athleteError) throw athleteError;
      }

      await loadUserProfile(authData.user, true);

      toast.success(`Conta criada com sucesso! Bem-vindo, ${data.name}!`);
    } catch (error: any) {
      console.error('Register error:', error);

      let message = error.message || 'Erro ao criar conta';

      if (message.includes('rate limit') || error.status === 429) {
        message = 'Muitas tentativas. Por favor aguarda 1 minuto antes de tentar novamente.';
      } else if (message.includes('security policy') || error.code === '42501') {
        message = 'Erro de permissões. Por favor contacta o suporte (RLS Policy).';
      } else if (message.includes('already registered')) {
        message = 'Este email já está registado.';
      }

      throw new Error(message);
    }
  };

  const value: AppContextType = {
    user,
    setUser,
    workspace,
    setWorkspace,
    isAuthenticated: !!user,
    isCoach: user?.role === 'coach',
    isAthlete: user?.role === 'athlete',
    isLoading,
    login,
    logout,
    register,
    workspaceId: workspace?.id || '',
    userId: user?.id || '',
    userRole: user?.role || '',
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function useWorkspace() {
  const { workspace, workspaceId } = useApp();
  return { workspace, workspaceId };
}

export function useUser() {
  const { user, userId, userRole } = useApp();
  return { user, userId, userRole };
}