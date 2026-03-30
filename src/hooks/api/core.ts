import apiClient from '@/lib/api-client';

// ============================================================================
// TYPES
// ============================================================================

interface UseApiOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
}

interface ApiResponse<T> {
  data: T | null;
  error: any;
  isLoading: boolean;
  mutate: () => void;
}

interface MutationResponse<T> {
  data: T | null;
  error: any;
  isLoading: boolean;
  execute: (body?: any) => Promise<T>;
}

// ============================================================================
// FETCHER
// ============================================================================

const fetcher = async (url: string) => {
  return await apiClient(url);
};

/**
 * Custom fetcher that proxies API calls directly to Supabase client
 * This bypasses the need for server-side API routes in Vite
 */
const supabaseApiFetcher = async (url: string) => {
  const { supabase } = await import('@/lib/supabase/client');
  const [path, queryString] = url.split('?');
  const params = new URLSearchParams(queryString);

  // Handle /api/athletes
  if (path === '/api/athletes') {
    const workspaceId = params.get('workspaceId');
    const search = params.get('search');
    const team = params.get('team');

    if (!workspaceId) throw new Error('Workspace ID required');

    let query = supabase
      .from('athletes')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'active') // Default filter
      .order('created_at', { ascending: false });

    if (search) {
      query = query.ilike('name', `%${search}%`); // Should ideally use FTS or checking specific columns
    }

    // Check if 'sport' column exists widely or if logic differs
    if (team && team !== 'all') {
      query = query.eq('sport', team);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Return structure expected by UI { athletes: [], count: 0 }
    return {
      athletes: data || [],
      count: data?.length || 0
    };
  }

  throw new Error(`Endpoint not implemented in supabaseApiFetcher: ${path}`);
};


export { fetcher, supabaseApiFetcher };
