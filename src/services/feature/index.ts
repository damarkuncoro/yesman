/**
 * Index file untuk feature services
 * Menyediakan exports untuk semua service dan backward compatibility
 */

// Export individual services
export { FeatureCrudService, featureCrudService } from './featureCrudService';
export { FeatureSearchService, featureSearchService } from './featureSearchService';
export { FeatureValidationService, featureValidationService } from './featureValidationService';
export { FeatureBulkService, featureBulkService } from './featureBulkService';
export { FeatureService, featureService } from './featureService';

// Export main service sebagai default untuk backward compatibility
export { featureService as default } from './featureService';

// Re-export types yang mungkin dibutuhkan
export type { Feature, NewFeature } from '../../db/schema';
export type { PaginatedResponse } from '../../lib/types';

/**
 * Backward compatibility exports
 * Untuk memastikan kode yang sudah ada tetap berfungsi
 */
import { featureService } from './featureService';
export const FeatureServiceLegacy = featureService;