'use client';

import React, { createContext, useContext, useCallback, useReducer, useEffect, ReactNode } from 'react';

// ElectricSQL Shape API Types
export interface ElectricShape<T = any> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  lastUpdated: Date | null;
}

export interface ElectricSubscription {
  id: string;
  table: string;
  where?: string;
  columns?: string[];
  isActive: boolean;
  lastSync: Date | null;
}

interface ElectricState {
  isConnected: boolean;
  subscriptions: Map<string, ElectricSubscription>;
  shapes: Map<string, ElectricShape>;
  config: {
    url: string;
    pollInterval: number;
    retryAttempts: number;
  };
}

type ElectricAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'ADD_SUBSCRIPTION'; payload: ElectricSubscription }
  | { type: 'REMOVE_SUBSCRIPTION'; payload: string }
  | { type: 'UPDATE_SHAPE'; payload: { id: string; shape: ElectricShape } }
  | { type: 'SET_LOADING'; payload: { id: string; loading: boolean } }
  | { type: 'SET_ERROR'; payload: { id: string; error: Error | null } };

const initialState: ElectricState = {
  isConnected: false,
  subscriptions: new Map(),
  shapes: new Map(),
  config: {
    url: process.env.NEXT_PUBLIC_ELECTRIC_URL || 'http://localhost:5133',
    pollInterval: 5000,
    retryAttempts: 3,
  },
};

function electricReducer(state: ElectricState, action: ElectricAction): ElectricState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
      
    case 'ADD_SUBSCRIPTION':
      const newSubscriptions = new Map(state.subscriptions);
      newSubscriptions.set(action.payload.id, action.payload);
      return { ...state, subscriptions: newSubscriptions };
      
    case 'REMOVE_SUBSCRIPTION':
      const updatedSubscriptions = new Map(state.subscriptions);
      updatedSubscriptions.delete(action.payload);
      const updatedShapes = new Map(state.shapes);
      updatedShapes.delete(action.payload);
      return { 
        ...state, 
        subscriptions: updatedSubscriptions, 
        shapes: updatedShapes 
      };
      
    case 'UPDATE_SHAPE':
      const newShapes = new Map(state.shapes);
      newShapes.set(action.payload.id, action.payload.shape);
      return { ...state, shapes: newShapes };
      
    case 'SET_LOADING':
      const loadingShapes = new Map(state.shapes);
      const currentShape = loadingShapes.get(action.payload.id) || {
        data: [],
        isLoading: false,
        error: null,
        lastUpdated: null,
      };
      loadingShapes.set(action.payload.id, {
        ...currentShape,
        isLoading: action.payload.loading,
      });
      return { ...state, shapes: loadingShapes };
      
    case 'SET_ERROR':
      const errorShapes = new Map(state.shapes);
      const errorShape = errorShapes.get(action.payload.id) || {
        data: [],
        isLoading: false,
        error: null,
        lastUpdated: null,
      };
      errorShapes.set(action.payload.id, {
        ...errorShape,
        error: action.payload.error,
        isLoading: false,
      });
      return { ...state, shapes: errorShapes };
      
    default:
      return state;
  }
}

// ElectricSQL API Client
class ElectricClient {
  private baseUrl: string;
  private abortControllers: Map<string, AbortController> = new Map();

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/health`);
      const health = await response.json();
      return health.status === 'active';
    } catch {
      return false;
    }
  }

  async getShape<T = any>(
    table: string, 
    options: { where?: string; columns?: string[]; offset?: string } = {}
  ): Promise<T[]> {
    const params = new URLSearchParams();
    params.set('table', `"${table}"`);
    params.set('offset', options.offset || '-1');
    
    if (options.where) {
      params.set('where', options.where);
    }
    
    if (options.columns) {
      params.set('columns', options.columns.join(','));
    }

    const response = await fetch(`${this.baseUrl}/v1/shape?${params.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to fetch ${table}`);
    }

    const rawData = await response.json();
    
    // Transform ElectricSQL response format
    if (Array.isArray(rawData)) {
      return rawData.map(item => item.value || item);
    }
    
    return rawData;
  }

  subscribeToShape<T = any>(
    subscriptionId: string,
    table: string,
    callback: (data: T[]) => void,
    options: { where?: string; columns?: string[]; pollInterval?: number } = {}
  ): () => void {
    const controller = new AbortController();
    this.abortControllers.set(subscriptionId, controller);
    
    const pollInterval = options.pollInterval || 5000;
    let isActive = true;

    const poll = async () => {
      if (!isActive || controller.signal.aborted) return;

      try {
        const data = await this.getShape<T>(table, {
          where: options.where,
          columns: options.columns,
        });
        
        if (isActive && !controller.signal.aborted) {
          callback(data);
        }
      } catch (error) {
        console.error(`ElectricSQL subscription error for ${table}:`, error);
      }

      if (isActive && !controller.signal.aborted) {
        setTimeout(poll, pollInterval);
      }
    };

    // Initial fetch
    poll();

    // Cleanup function
    return () => {
      isActive = false;
      controller.abort();
      this.abortControllers.delete(subscriptionId);
    };
  }

  cleanup(): void {
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
  }
}

// Context
interface ElectricContextValue {
  state: ElectricState;
  subscribe: <T = any>(
    table: string,
    options?: {
      where?: string;
      columns?: string[];
      pollInterval?: number;
    }
  ) => {
    data: T[];
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
  };
  unsubscribe: (subscriptionId: string) => void;
  isConnected: boolean;
  healthCheck: () => Promise<boolean>;
}

const ElectricContext = createContext<ElectricContextValue | null>(null);

// Provider Props
interface ElectricProviderProps {
  children: ReactNode;
  config?: Partial<ElectricState['config']>;
}

// Provider Component
export function ElectricProvider({ children, config }: ElectricProviderProps) {
  const [state, dispatch] = useReducer(electricReducer, {
    ...initialState,
    config: { ...initialState.config, ...config },
  });

  const client = React.useRef<ElectricClient>(
    new ElectricClient(state.config.url)
  );

  // Health check and connection monitoring
  const healthCheck = useCallback(async (): Promise<boolean> => {
    const isHealthy = await client.current.healthCheck();
    dispatch({ type: 'SET_CONNECTED', payload: isHealthy });
    return isHealthy;
  }, []);

  // Subscribe function
  const subscribe = useCallback(<T = any>(
    table: string,
    options: {
      where?: string;
      columns?: string[];
      pollInterval?: number;
    } = {}
  ) => {
    const subscriptionId = `${table}-${JSON.stringify(options)}`;
    
    const currentShape = state.shapes.get(subscriptionId) || {
      data: [],
      isLoading: true,
      error: null,
      lastUpdated: null,
    };

    // Add subscription if not exists
    if (!state.subscriptions.has(subscriptionId)) {
      const subscription: ElectricSubscription = {
        id: subscriptionId,
        table,
        where: options.where,
        columns: options.columns,
        isActive: true,
        lastSync: null,
      };

      dispatch({ type: 'ADD_SUBSCRIPTION', payload: subscription });
      dispatch({ type: 'SET_LOADING', payload: { id: subscriptionId, loading: true } });

      // Start subscription
      client.current.subscribeToShape<T>(
        subscriptionId,
        table,
        (data) => {
          const shape: ElectricShape<T> = {
            data,
            isLoading: false,
            error: null,
            lastUpdated: new Date(),
          };
          dispatch({ type: 'UPDATE_SHAPE', payload: { id: subscriptionId, shape } });
        },
        {
          ...options,
          pollInterval: options.pollInterval || state.config.pollInterval,
        }
      );
    }

    // Refetch function
    const refetch = async (): Promise<void> => {
      try {
        dispatch({ type: 'SET_LOADING', payload: { id: subscriptionId, loading: true } });
        const data = await client.current.getShape<T>(table, {
          where: options.where,
          columns: options.columns,
        });
        
        const shape: ElectricShape<T> = {
          data,
          isLoading: false,
          error: null,
          lastUpdated: new Date(),
        };
        dispatch({ type: 'UPDATE_SHAPE', payload: { id: subscriptionId, shape } });
      } catch (error) {
        dispatch({ 
          type: 'SET_ERROR', 
          payload: { id: subscriptionId, error: error as Error } 
        });
      }
    };

    return {
      data: currentShape.data as T[],
      isLoading: currentShape.isLoading,
      error: currentShape.error,
      refetch,
    };
  }, [state.shapes, state.subscriptions, state.config.pollInterval]);

  // Unsubscribe function
  const unsubscribe = useCallback((subscriptionId: string) => {
    dispatch({ type: 'REMOVE_SUBSCRIPTION', payload: subscriptionId });
  }, []);

  // Initial health check
  useEffect(() => {
    healthCheck();
    
    // Periodic health check
    const interval = setInterval(healthCheck, 30000); // Every 30 seconds
    
    return () => {
      clearInterval(interval);
      client.current.cleanup();
    };
  }, [healthCheck]);

  const contextValue: ElectricContextValue = {
    state,
    subscribe,
    unsubscribe,
    isConnected: state.isConnected,
    healthCheck,
  };

  return (
    <ElectricContext.Provider value={contextValue}>
      {children}
    </ElectricContext.Provider>
  );
}

// Hook to use Electric context
export function useElectric(): ElectricContextValue {
  const context = useContext(ElectricContext);
  if (!context) {
    throw new Error('useElectric must be used within an ElectricProvider');
  }
  return context;
}

// Export types
export type { ElectricShape, ElectricSubscription };
