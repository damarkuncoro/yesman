import { PolicyViolationRepository } from './PolicyViolationRepository';

/**
 * Instance singleton dari PolicyViolationRepository
 * Mengikuti pattern yang sama dengan repository lainnya
 */
export const policyViolationRepository = new PolicyViolationRepository('PolicyViolationRepository');

export { PolicyViolationRepository };