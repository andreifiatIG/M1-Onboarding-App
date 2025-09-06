// ElectricSQL Provider and Context
export { ElectricProvider, useElectric } from './ElectricProvider';
export type { ElectricShape, ElectricSubscription } from './ElectricProvider';

// ElectricSQL Hooks
export {
  useElectricData,
  useVillas,
  useVilla,
  useVillaPhotos,
  useVillaDocuments,
  useOnboardingSession,
  useOnboardingProgress,
  useStepFieldProgress,
  useVillaStats,
  useElectricStatus,
  useOptimisticUpdate,
} from './hooks';

// TypeScript interfaces
export type {
  Villa,
  Photo,
  Document,
  OnboardingSession,
} from './hooks';
