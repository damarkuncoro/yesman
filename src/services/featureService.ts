/**
 * Main FeatureService - Orchestrator untuk semua feature operations
 * Menggunakan facade pattern untuk menyediakan interface tunggal
 * ke semua operasi feature yang tersedia
 * 
 * Refactored dari monolitik ke modular structure untuk menerapkan:
 * - Single Responsibility Principle (SRP)
 * - Open/Closed Principle (OCP) 
 * - Dependency Inversion Principle (DIP)
 * - DRY (Don't Repeat Yourself)
 */

// Import orchestrator dari direktori feature
export { FeatureService, featureService } from './feature/featureService';

// Export individual services untuk advanced usage
export {
  FeatureCrudService,
  FeatureSearchService,
  FeatureValidationService,
  FeatureBulkService,
  featureCrudService,
  featureSearchService,
  featureValidationService,
  featureBulkService
} from './feature';

// Export types
export type { Feature, NewFeature } from '../db/schema';
export type { PaginatedResponse } from '../lib/types';

// Default export untuk backward compatibility
export { featureService as default } from './feature/featureService';