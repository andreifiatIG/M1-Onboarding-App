import { useEffect, useState, useMemo } from 'react';
import { useElectric } from './ElectricProvider';

// Type definitions for villa management system
export interface Villa {
  id: string;
  villaCode: string;
  villaName: string;
  location: string;
  address: string;
  city: string;
  country: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'ACTIVE' | 'INACTIVE';
  isActive: boolean;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  villaId: string;
  category: string;
  fileName: string;
  fileUrl: string;
  thumbnailUrl?: string;
  isMain: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Document {
  id: string;
  villaId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  sharePointFileId?: string;
  createdAt: string;
}

export interface OnboardingSession {
  id: string;
  villaId: string;
  userId: string;
  currentStep: number;
  totalSteps: number;
  stepsCompleted: number;
  fieldsCompleted: number;
  totalFields: number;
  isCompleted: boolean;
  lastActivityAt: string;
  createdAt: string;
}

// Generic hook for any table subscription
export function useElectricData<T = any>(
  table: string,
  options?: {
    where?: string;
    columns?: string[];
    pollInterval?: number;
    enabled?: boolean;
  }
) {
  const { subscribe } = useElectric();
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  
  const enabled = options?.enabled !== false;
  
  const result = useMemo(() => {
    if (!enabled) {
      return {
        data: [] as T[],
        isLoading: false,
        error: null,
        refetch: async () => {},
      };
    }
    
    return subscribe<T>(table, {
      where: options?.where,
      columns: options?.columns,
      pollInterval: options?.pollInterval,
    });
  }, [subscribe, table, options?.where, options?.columns, options?.pollInterval, enabled]);

  useEffect(() => {
    if (enabled) {
      const id = `${table}-${JSON.stringify(options)}`;
      setSubscriptionId(id);
    } else {
      setSubscriptionId(null);
    }
  }, [table, options, enabled]);

  return result;
}

// Hook specifically for villa data
export function useVillas(options?: {
  status?: Villa['status'];
  location?: string;
  isActive?: boolean;
}) {
  const whereConditions: string[] = [];
  
  if (options?.status) {
    whereConditions.push(`"status" = '${options.status}'`);
  }
  
  if (options?.location) {
    whereConditions.push(`"location" = '${options.location}'`);
  }
  
  if (options?.isActive !== undefined) {
    whereConditions.push(`"isActive" = ${options.isActive}`);
  }

  return useElectricData<Villa>('Villa', {
    where: whereConditions.length > 0 ? whereConditions.join(' AND ') : undefined,
  });
}

// Hook for single villa by ID
export function useVilla(villaId: string, enabled = true) {
  return useElectricData<Villa>('Villa', {
    where: `"id" = '${villaId}'`,
    enabled: enabled && !!villaId,
  });
}

// Hook for villa photos
export function useVillaPhotos(
  villaId: string, 
  options?: { 
    category?: string; 
    mainOnly?: boolean;
    enabled?: boolean;
  }
) {
  const whereConditions = [`"villaId" = '${villaId}'`];
  
  if (options?.category) {
    whereConditions.push(`"category" = '${options.category}'`);
  }
  
  if (options?.mainOnly) {
    whereConditions.push(`"isMain" = true`);
  }

  return useElectricData<Photo>('Photo', {
    where: whereConditions.join(' AND '),
    enabled: options?.enabled !== false && !!villaId,
  });
}

// Hook for villa documents
export function useVillaDocuments(
  villaId: string,
  options?: {
    documentType?: string;
    enabled?: boolean;
  }
) {
  const whereConditions = [`"villaId" = '${villaId}'`];
  
  if (options?.documentType) {
    whereConditions.push(`"documentType" = '${options.documentType}'`);
  }

  return useElectricData<Document>('Document', {
    where: whereConditions.join(' AND '),
    enabled: options?.enabled !== false && !!villaId,
  });
}

// Hook for onboarding session
export function useOnboardingSession(
  villaId: string,
  userId?: string,
  enabled = true
) {
  const whereConditions = [`"villaId" = '${villaId}'`];
  
  if (userId) {
    whereConditions.push(`"userId" = '${userId}'`);
  }

  return useElectricData<OnboardingSession>('OnboardingSession', {
    where: whereConditions.join(' AND '),
    enabled: enabled && !!villaId,
  });
}

// Hook for real-time onboarding progress
export function useOnboardingProgress(
  villaId: string,
  enabled = true
) {
  const { data: sessions } = useElectricData<OnboardingSession>('OnboardingSession', {
    where: `"villaId" = '${villaId}'`,
    enabled: enabled && !!villaId,
  });

  const session = sessions?.[0];
  
  const progressData = useMemo(() => {
    if (!session) return null;
    
    const completionPercentage = session.totalFields > 0 
      ? Math.round((session.fieldsCompleted / session.totalFields) * 100)
      : 0;
      
    const stepCompletionPercentage = session.totalSteps > 0
      ? Math.round((session.stepsCompleted / session.totalSteps) * 100)
      : 0;

    return {
      ...session,
      completionPercentage,
      stepCompletionPercentage,
      isInProgress: !session.isCompleted && session.stepsCompleted > 0,
      nextStep: session.isCompleted ? null : session.currentStep,
    };
  }, [session]);

  return {
    data: progressData,
    isLoading: !session && enabled,
    session,
  };
}

// Hook for step field progress (high-frequency updates)
export function useStepFieldProgress(
  villaId: string,
  stepNumber?: number,
  enabled = true
) {
  const whereConditions = [`"stepProgressId" IN (
    SELECT id FROM "OnboardingStepProgress" 
    WHERE "villaId" = '${villaId}'
    ${stepNumber ? `AND "stepNumber" = ${stepNumber}` : ''}
  )`];

  return useElectricData('StepFieldProgress', {
    where: whereConditions.join(' AND '),
    enabled: enabled && !!villaId,
    pollInterval: 2000, // More frequent updates for active editing
  });
}

// Hook for villa statistics (aggregated data)
export function useVillaStats() {
  const { data: villas, isLoading } = useElectricData<Villa>('Villa');
  
  const stats = useMemo(() => {
    if (!villas?.length) return null;
    
    const total = villas.length;
    const active = villas.filter(v => v.isActive).length;
    const byStatus = villas.reduce((acc, villa) => {
      acc[villa.status] = (acc[villa.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const byLocation = villas.reduce((acc, villa) => {
      if (villa.location) {
        acc[villa.location] = (acc[villa.location] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      active,
      inactive: total - active,
      byStatus,
      byLocation,
      averageBedrooms: total > 0 ? villas.reduce((sum, v) => sum + (v.bedrooms || 0), 0) / total : 0,
      averageGuests: total > 0 ? villas.reduce((sum, v) => sum + (v.maxGuests || 0), 0) / total : 0,
    };
  }, [villas]);

  return {
    data: stats,
    isLoading,
    total: stats?.total || 0,
  };
}

// Hook for connection status and health monitoring
export function useElectricStatus() {
  const { isConnected, healthCheck } = useElectric();
  const [lastHealthCheck, setLastHealthCheck] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkHealth = async () => {
    setIsChecking(true);
    try {
      await healthCheck();
      setLastHealthCheck(new Date());
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isConnected,
    lastHealthCheck,
    isChecking,
    checkHealth,
  };
}

// Custom hook for optimistic updates (for better UX)
export function useOptimisticUpdate<T>(
  data: T[],
  isLoading: boolean
) {
  const [optimisticData, setOptimisticData] = useState<T[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isLoading) {
      setOptimisticData(data);
    }
  }, [data, isLoading]);

  const addOptimisticUpdate = (item: T, id: string) => {
    setOptimisticData(prev => [...prev, item]);
    setPendingUpdates(prev => new Set([...prev, id]));
  };

  const removeOptimisticUpdate = (id: string) => {
    setPendingUpdates(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  return {
    data: optimisticData,
    addOptimisticUpdate,
    removeOptimisticUpdate,
    hasPendingUpdates: pendingUpdates.size > 0,
    pendingCount: pendingUpdates.size,
  };
}
