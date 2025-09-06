'use client';

import React from 'react';
import { 
  useVillas, 
  useVillaStats, 
  useElectricStatus,
  useElectricData 
} from '@/lib/electric/hooks';

interface ElectricStatusIndicatorProps {
  className?: string;
}

function ElectricStatusIndicator({ className }: ElectricStatusIndicatorProps) {
  const { isConnected, lastHealthCheck, isChecking, checkHealth } = useElectricStatus();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium">
          ElectricSQL: {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
      
      {lastHealthCheck && (
        <span className="text-xs text-gray-500">
          Last check: {lastHealthCheck.toLocaleTimeString()}
        </span>
      )}
      
      <button
        onClick={checkHealth}
        disabled={isChecking}
        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
      >
        {isChecking ? 'Checking...' : 'Check'}
      </button>
    </div>
  );
}

interface VillaStatsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  isLoading?: boolean;
}

function VillaStatsCard({ title, value, subtitle, isLoading }: VillaStatsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-8 bg-gray-200 rounded mb-1"></div>
        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
}

function VillasList() {
  const { data: villas, isLoading, error, refetch } = useVillas({
    isActive: true,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-lg border animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-3 bg-gray-200 rounded w-32"></div>
              </div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-red-800">Failed to load villas</h3>
            <p className="text-sm text-red-600 mt-1">{error.message}</p>
          </div>
          <button
            onClick={refetch}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Active Villas ({villas.length})</h3>
        <button
          onClick={refetch}
          className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>
      
      {villas.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No active villas found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {villas.map((villa) => (
            <div key={villa.id} className="bg-white p-4 rounded-lg border hover:shadow-sm transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium text-gray-900">{villa.villaName}</h4>
                  <p className="text-sm text-gray-600">
                    {villa.villaCode} • {villa.city}, {villa.country}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {villa.bedrooms} bed, {villa.bathrooms} bath • up to {villa.maxGuests} guests
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  villa.status === 'ACTIVE' 
                    ? 'bg-green-100 text-green-800'
                    : villa.status === 'DRAFT'
                    ? 'bg-gray-100 text-gray-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {villa.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RealtimeOnboardingUpdates() {
  const { data: sessions, isLoading } = useElectricData('OnboardingSession', {
    pollInterval: 3000, // Check every 3 seconds for active onboarding
  });

  const activeSessions = sessions?.filter(s => !s.isCompleted) || [];

  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg border animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-3"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-3">
        Active Onboarding Sessions ({activeSessions.length})
      </h3>
      
      {activeSessions.length === 0 ? (
        <p className="text-gray-500 text-sm">No active onboarding sessions</p>
      ) : (
        <div className="space-y-3">
          {activeSessions.map((session) => {
            const completion = session.totalFields > 0 
              ? Math.round((session.fieldsCompleted / session.totalFields) * 100)
              : 0;
              
            return (
              <div key={session.id} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="text-sm">
                    <span className="font-medium">Villa ID:</span> {session.villaId.slice(-8)}...
                  </div>
                  <span className="text-xs text-gray-500">
                    Step {session.currentStep}/{session.totalSteps}
                  </span>
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{completion}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>
                
                <div className="text-xs text-gray-500">
                  Last activity: {new Date(session.lastActivityAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ElectricDashboard() {
  const { data: stats, isLoading: statsLoading } = useVillaStats();

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white p-4 rounded-lg border">
        <ElectricStatusIndicator />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <VillaStatsCard
          title="Total Villas"
          value={stats?.total || 0}
          isLoading={statsLoading}
        />
        <VillaStatsCard
          title="Active Villas"
          value={stats?.active || 0}
          subtitle="Currently live"
          isLoading={statsLoading}
        />
        <VillaStatsCard
          title="Average Bedrooms"
          value={stats?.averageBedrooms ? stats.averageBedrooms.toFixed(1) : 0}
          isLoading={statsLoading}
        />
        <VillaStatsCard
          title="Average Capacity"
          value={stats?.averageGuests ? Math.round(stats.averageGuests) : 0}
          subtitle="guests"
          isLoading={statsLoading}
        />
      </div>

      {/* Real-time Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VillasList />
        <RealtimeOnboardingUpdates />
      </div>

      {/* Location Distribution */}
      {stats?.byLocation && Object.keys(stats.byLocation).length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4">Villas by Location</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(stats.byLocation).map(([location, count]) => (
              <div key={location} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{count}</div>
                <div className="text-sm text-gray-600">{location}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="text-center text-sm text-gray-500 py-4">
        <p>✨ This dashboard updates in real-time via ElectricSQL</p>
        <p>Try making changes to villa data and watch the updates appear automatically!</p>
      </div>
    </div>
  );
}
