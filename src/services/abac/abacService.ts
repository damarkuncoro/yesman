/**
 * ABAC Service - Backward Compatibility Layer
 * 
 * File ini telah di-refactor menjadi re-export dari folder abac.
 * Semua fungsionalitas ABAC sekarang dipecah menjadi service-service kecil
 * yang mengikuti Single Responsibility Principle (SRP) dan Domain-Driven Design (DDD).
 * 
 * Service yang tersedia:
 * - PolicyEvaluationService: Evaluasi policies berdasarkan user attributes
 * - PolicyManagementService: CRUD operations untuk policies
 * - UserAttributeService: Mengelola user ABAC attributes
 * - PolicyComparisonService: Logic perbandingan values dan operators
 * 
 * @deprecated Gunakan service individual dari folder abac untuk implementasi baru
 */

// Re-export semua dari index
export * from './index';

// Import untuk backward compatibility
import { abacService } from './index';

// Export default instance untuk backward compatibility
export { abacService as default };

// Export AbacService class untuk backward compatibility
export { AbacService } from './index';