import { BaseService } from "../base/baseService";
import { ValidationService } from "../../lib/validation/validator";
import { ChangeHistoryRepository } from "../../repositories/changeHistory";
import { 
  createChangeHistorySchema, 
  type ChangeHistory, 
  type EnrichedChangeHistory,
  type AuditFilters 
} from "./types";

/**
 * Service untuk manajemen change history operations
 * Menangani logging dan retrieval perubahan data sistem
 * Menggunakan repository pattern untuk akses data
 */
export class ChangeHistoryService extends BaseService {
  constructor(private changeHistoryRepository: ChangeHistoryRepository) {
    super();
  }

  /**
   * Log perubahan data sistem
   * @param data - Data change history yang akan dicatat
   * @returns Promise<ChangeHistory> - Change history yang telah disimpan
   */
  async logChangeHistory(data: unknown): Promise<ChangeHistory> {
    return this.executeWithErrorHandling(
      'log change history',
      async () => {
        const validatedData = ValidationService.validate(createChangeHistorySchema, data);
        return await this.changeHistoryRepository.create(validatedData);
      }
    );
  }

  /**
   * Mendapatkan change history dengan filter
   * @param filters - Filter untuk query
   * @returns Promise<ChangeHistory[]> - Array of change history
   */
  async getChangeHistory(filters: AuditFilters = {}): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling(
      'get change history',
      async () => {
        const changeHistories = await this.changeHistoryRepository.findAll();
        let filteredHistories = changeHistories;

        // Apply filters
        if (filters.userId) {
          filteredHistories = filteredHistories.filter(ch => ch.adminUserId === filters.userId);
        }

        if (filters.startDate) {
          filteredHistories = filteredHistories.filter(ch => 
            ch.createdAt && ch.createdAt >= filters.startDate!
          );
        }

        if (filters.endDate) {
          filteredHistories = filteredHistories.filter(ch => 
            ch.createdAt && ch.createdAt <= filters.endDate!
          );
        }

        // Sort by createdAt descending
        filteredHistories.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });

        // Apply pagination
        const offset = filters.offset || 0;
        const limit = filters.limit || 100;
        return filteredHistories.slice(offset, offset + limit);
      }
    );
  }

  /**
   * Mendapatkan change history berdasarkan admin user ID
   * @param adminUserId - ID admin user
   * @param filters - Filter tambahan
   * @returns Promise<ChangeHistory[]> - Array of change history
   */
  async getChangeHistoryByAdminUserId(adminUserId: number, filters: Omit<AuditFilters, 'userId'> = {}): Promise<ChangeHistory[]> {
    return this.getChangeHistory({ ...filters, userId: adminUserId });
  }

  /**
   * Mendapatkan change history berdasarkan target user ID
   * @param targetUserId - ID target user yang diubah
   * @param filters - Filter tambahan
   * @returns Promise<ChangeHistory[]> - Array of change history
   */
  async getChangeHistoryByTargetUserId(targetUserId: number, filters: AuditFilters = {}): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling(
      'get change history by target user',
      async () => {
        const changeHistories = await this.changeHistoryRepository.findAll();
        let filteredHistories = changeHistories.filter(ch => ch.targetUserId === targetUserId);

        // Apply additional filters
        if (filters.startDate) {
          filteredHistories = filteredHistories.filter(ch => 
            ch.createdAt && ch.createdAt >= filters.startDate!
          );
        }

        if (filters.endDate) {
          filteredHistories = filteredHistories.filter(ch => 
            ch.createdAt && ch.createdAt <= filters.endDate!
          );
        }

        // Sort by createdAt descending
        filteredHistories.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });

        return filteredHistories;
      }
    );
  }

  /**
   * Mendapatkan change history berdasarkan action
   * @param action - Jenis action yang dicari
   * @param filters - Filter tambahan
   * @returns Promise<ChangeHistory[]> - Array of change history
   */
  async getChangeHistoryByAction(action: string, filters: AuditFilters = {}): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling(
      'get change history by action',
      async () => {
        const changeHistories = await this.changeHistoryRepository.findAll();
        let filteredHistories = changeHistories.filter(ch => ch.action === action);

        // Apply additional filters
        if (filters.userId) {
          filteredHistories = filteredHistories.filter(ch => ch.adminUserId === filters.userId);
        }

        if (filters.startDate) {
          filteredHistories = filteredHistories.filter(ch => 
            ch.createdAt && ch.createdAt >= filters.startDate!
          );
        }

        if (filters.endDate) {
          filteredHistories = filteredHistories.filter(ch => 
            ch.createdAt && ch.createdAt <= filters.endDate!
          );
        }

        // Sort by createdAt descending
        filteredHistories.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });

        return filteredHistories;
      }
    );
  }

  /**
   * Mendapatkan statistik change history
   * @param filters - Filter untuk statistik
   * @returns Promise dengan statistik change history
   */
  async getChangeHistoryStats(filters: AuditFilters = {}) {
    return this.executeWithErrorHandling(
      'get change history stats',
      async () => {
        const changeHistories = await this.changeHistoryRepository.findAll();
        let filteredHistories = changeHistories;

        // Apply filters
        if (filters.userId) {
          filteredHistories = filteredHistories.filter(ch => ch.adminUserId === filters.userId);
        }

        if (filters.startDate) {
          filteredHistories = filteredHistories.filter(ch => 
            ch.createdAt && ch.createdAt >= filters.startDate!
          );
        }

        if (filters.endDate) {
          filteredHistories = filteredHistories.filter(ch => 
            ch.createdAt && ch.createdAt <= filters.endDate!
          );
        }

        const totalChanges = filteredHistories.length;
        const uniqueAdmins = new Set(filteredHistories.map(ch => ch.adminUserId)).size;
        const uniqueTargetUsers = new Set(filteredHistories.map(ch => ch.targetUserId)).size;
        
        // Count by action
        const actionCounts = filteredHistories.reduce((acc, ch) => {
          acc[ch.action] = (acc[ch.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        return {
          totalChanges,
          uniqueAdmins,
          uniqueTargetUsers,
          actionBreakdown: actionCounts
        };
      }
    );
  }

  /**
   * Mendapatkan change history terbaru
   * @param limit - Jumlah maksimal record
   * @returns Promise<ChangeHistory[]> - Array of recent change history
   */
  async getRecentChangeHistory(limit: number = 50): Promise<ChangeHistory[]> {
    return this.executeWithErrorHandling(
      'get recent change history',
      async () => {
        const changeHistories = await this.changeHistoryRepository.findAll();
        
        // Sort by createdAt descending
        changeHistories.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.getTime() - a.createdAt.getTime();
        });

        return changeHistories.slice(0, limit);
      }
    );
  }

  /**
   * Mendapatkan change history dalam rentang tanggal
   * @param startDate - Tanggal mulai
   * @param endDate - Tanggal akhir
   * @param additionalFilters - Filter tambahan
   * @returns Promise<ChangeHistory[]> - Array of change history dalam rentang tanggal
   */
  async getChangeHistoryByDateRange(
    startDate: Date, 
    endDate: Date, 
    additionalFilters: Omit<AuditFilters, 'startDate' | 'endDate'> = {}
  ): Promise<ChangeHistory[]> {
    return this.getChangeHistory({
      ...additionalFilters,
      startDate,
      endDate
    });
  }

  /**
   * Mendapatkan admin dengan aktivitas perubahan terbanyak
   * @param limit - Jumlah maksimal admin
   * @param filters - Filter tambahan
   * @returns Promise<object[]> - Array of admin dengan jumlah perubahan
   */
  async getTopActiveAdmins(limit: number = 10, filters: AuditFilters = {}) {
    return this.executeWithErrorHandling(
      'get top active admins',
      async () => {
        const changeHistories = await this.getChangeHistory(filters);
        
        const adminChangeCounts = changeHistories.reduce((acc, ch) => {
          if (ch.adminUserId !== null) {
            acc[ch.adminUserId] = (acc[ch.adminUserId] || 0) + 1;
          }
          return acc;
        }, {} as Record<number, number>);
        
        return Object.entries(adminChangeCounts)
          .map(([adminId, count]) => ({ adminUserId: parseInt(adminId), changeCount: count }))
          .sort((a, b) => b.changeCount - a.changeCount)
          .slice(0, limit);
      }
    );
  }

  /**
   * Mendapatkan enriched change history dengan informasi user
   * @param filters - Filter untuk query
   * @returns Promise<EnrichedChangeHistory[]> - Array of enriched change history
   */
  async getEnrichedChangeHistory(filters: AuditFilters = {}): Promise<EnrichedChangeHistory[]> {
    return this.executeWithErrorHandling(
      'get enriched change history',
      async () => {
        const changeHistories = await this.getChangeHistory(filters);
        
        // For now, return as-is since we don't have user repository integration
        // In a full implementation, this would join with user data
        return changeHistories.map(ch => ({
          ...ch,
          adminUser: undefined, // Would be populated with user data
          targetUser: undefined // Would be populated with user data
        }));
      }
    );
  }
}

// Export instance dengan dependency injection
export const changeHistoryService = new ChangeHistoryService(
  new ChangeHistoryRepository()
);