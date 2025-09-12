import { ChangeHistoryRepository } from './ChangeHistoryRepository';

/**
 * Instance singleton dari ChangeHistoryRepository
 * Mengikuti pattern yang sama dengan repository lainnya
 */
export const changeHistoryRepository = new ChangeHistoryRepository();

export { ChangeHistoryRepository };