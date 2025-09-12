import { BaseService } from "../base/baseService";
import { ValidationService } from "../../lib/validation/validator";
import { ErrorHandler, NotFoundError } from "../../lib/errors/errorHandler";
import { UserRepository } from "../../repositories/user/userRepository";
import {
  User,
  UserAttributesUpdateInput,
  ValidatedUserAttributesUpdateInput,
  updateUserAttributesSchema,
  UserAttribute
} from "./types";

/**
 * Service untuk mengelola user ABAC attributes
 * Bertanggung jawab untuk update dan validasi user attributes yang digunakan dalam ABAC
 */
export class UserAttributeService extends BaseService {
  constructor(
    private userRepository: UserRepository,
    private validationService: ValidationService,
    private errorHandler: ErrorHandler
  ) {
    super();
  }

  /**
   * Update user ABAC attributes
   * @param userId - ID user
   * @param attributes - Object dengan department, region, level
   * @returns Promise<User> - User yang diupdate
   */
  async updateUserAttributes(
    userId: number,
    attributes: UserAttributesUpdateInput
  ): Promise<User> {
    return this.executeWithErrorHandling(
      'update user ABAC attributes',
      async () => {
        // Validasi input
        const validatedData = this.validateInput(updateUserAttributesSchema, attributes);
        
        // Cek apakah user ada
        const existingUser = await this.userRepository.findById(userId);
        if (!existingUser) {
          throw new NotFoundError('User', userId);
        }
        
        // Update user attributes
        const updatedUser = await this.userRepository.update(userId, validatedData);
        
        if (!updatedUser) {
          throw new Error('Failed to update user attributes');
        }
        
        return updatedUser;
      }
    );
  }

  /**
   * Update single user attribute
   * @param userId - ID user
   * @param attribute - Nama attribute (department, region, level)
   * @param value - Nilai attribute
   * @returns Promise<User> - User yang diupdate
   */
  async updateSingleAttribute(
    userId: number,
    attribute: string,
    value: string | number
  ): Promise<User> {
    return this.executeWithErrorHandling(
      'update single user attribute',
      async () => {
        // Validasi attribute name
        if (!this.isValidAttribute(attribute)) {
          throw new Error(
            `Invalid attribute: ${attribute}. ` +
            `Valid attributes: ${this.getSupportedAttributes().join(', ')}`
          );
        }

        // Buat object update berdasarkan attribute
        const updateData: UserAttributesUpdateInput = {};
        
        switch (attribute) {
          case UserAttribute.DEPARTMENT:
            if (typeof value !== 'string') {
              throw new Error('Department must be a string');
            }
            updateData.department = value;
            break;
          case UserAttribute.REGION:
            if (typeof value !== 'string') {
              throw new Error('Region must be a string');
            }
            updateData.region = value;
            break;
          case UserAttribute.LEVEL:
            if (typeof value !== 'number') {
              throw new Error('Level must be a number');
            }
            updateData.level = value;
            break;
        }

        return await this.updateUserAttributes(userId, updateData);
      }
    );
  }

  /**
   * Get user attributes untuk ABAC evaluation
   * @param userId - ID user
   * @returns Promise<object> - Object dengan ABAC attributes
   */
  async getUserAttributes(userId: number): Promise<{
    department: string | null;
    region: string | null;
    level: number | null;
  }> {
    return this.executeWithErrorHandling(
      'get user ABAC attributes',
      async () => {
        const user = await this.userRepository.findById(userId);
        if (!user) {
          throw new NotFoundError('User', userId);
        }

        return {
          department: user.department,
          region: user.region,
          level: user.level
        };
      }
    );
  }

  /**
   * Batch update attributes untuk multiple users
   * @param updates - Array object dengan userId dan attributes
   * @returns Promise<User[]> - Array users yang diupdate
   */
  async batchUpdateAttributes(
    updates: Array<{
      userId: number;
      attributes: UserAttributesUpdateInput;
    }>
  ): Promise<User[]> {
    return this.executeWithErrorHandling(
      'batch update user attributes',
      async () => {
        const updatedUsers: User[] = [];
        
        for (const update of updates) {
          try {
            const updatedUser = await this.updateUserAttributes(
              update.userId,
              update.attributes
            );
            updatedUsers.push(updatedUser);
          } catch (error) {
            console.error(
              `Failed to update attributes for user ${update.userId}:`,
              error
            );
            // Continue dengan user lainnya
          }
        }
        
        return updatedUsers;
      }
    );
  }

  /**
   * Reset user attributes ke default values
   * @param userId - ID user
   * @returns Promise<User> - User yang direset
   */
  async resetUserAttributes(userId: number): Promise<User> {
    return this.executeWithErrorHandling(
      'reset user ABAC attributes',
      async () => {
        const resetData: UserAttributesUpdateInput = {
          department: undefined,
          region: undefined,
          level: undefined
        };
        
        return await this.updateUserAttributes(userId, resetData);
      }
    );
  }

  /**
   * Cari users berdasarkan attribute values
   * @param attribute - Nama attribute
   * @param value - Nilai attribute
   * @returns Promise<User[]> - Array users yang memiliki attribute value tersebut
   */
  async findUsersByAttribute(
    attribute: string,
    value: string | number
  ): Promise<User[]> {
    return this.executeWithErrorHandling(
      'find users by attribute',
      async () => {
        if (!this.isValidAttribute(attribute)) {
          throw new Error(`Invalid attribute: ${attribute}`);
        }

        // Ambil semua users dan filter berdasarkan attribute
        const allUsers = await this.userRepository.findAll();
        
        return allUsers.filter(user => {
          switch (attribute) {
            case UserAttribute.DEPARTMENT:
              return user.department === value;
            case UserAttribute.REGION:
              return user.region === value;
            case UserAttribute.LEVEL:
              return user.level === value;
            default:
              return false;
          }
        });
      }
    );
  }

  /**
   * Get statistik distribusi user attributes
   * @returns Promise<object> - Statistik distribusi attributes
   */
  async getAttributeStatistics(): Promise<{
    departmentDistribution: Record<string, number>;
    regionDistribution: Record<string, number>;
    levelDistribution: Record<number, number>;
    usersWithoutAttributes: {
      withoutDepartment: number;
      withoutRegion: number;
      withoutLevel: number;
    };
  }> {
    return this.executeWithErrorHandling(
      'get attribute statistics',
      async () => {
        const allUsers = await this.userRepository.findAll();
        
        const departmentDistribution: Record<string, number> = {};
        const regionDistribution: Record<string, number> = {};
        const levelDistribution: Record<number, number> = {};
        
        let withoutDepartment = 0;
        let withoutRegion = 0;
        let withoutLevel = 0;
        
        for (const user of allUsers) {
          // Count department distribution
          if (user.department) {
            departmentDistribution[user.department] = 
              (departmentDistribution[user.department] || 0) + 1;
          } else {
            withoutDepartment++;
          }
          
          // Count region distribution
          if (user.region) {
            regionDistribution[user.region] = 
              (regionDistribution[user.region] || 0) + 1;
          } else {
            withoutRegion++;
          }
          
          // Count level distribution
          if (user.level !== null && user.level !== undefined) {
            levelDistribution[user.level] = 
              (levelDistribution[user.level] || 0) + 1;
          } else {
            withoutLevel++;
          }
        }
        
        return {
          departmentDistribution,
          regionDistribution,
          levelDistribution,
          usersWithoutAttributes: {
            withoutDepartment,
            withoutRegion,
            withoutLevel
          }
        };
      }
    );
  }

  /**
   * Validasi apakah attribute yang diberikan valid
   * @param attribute - Attribute yang akan divalidasi
   * @returns boolean - true jika attribute valid
   */
  private isValidAttribute(attribute: string): boolean {
    return Object.values(UserAttribute).includes(attribute as UserAttribute);
  }

  /**
   * Get daftar semua attribute yang didukung
   * @returns string[] - Array attribute yang didukung
   */
  private getSupportedAttributes(): string[] {
    return Object.values(UserAttribute);
  }

  /**
   * Validasi nilai attribute berdasarkan tipe
   * @param attribute - Nama attribute
   * @param value - Nilai attribute
   * @returns boolean - true jika nilai valid
   */
  validateAttributeValue(attribute: string, value: any): boolean {
    switch (attribute) {
      case UserAttribute.DEPARTMENT:
      case UserAttribute.REGION:
        return typeof value === 'string' && value.length > 0;
      case UserAttribute.LEVEL:
        return typeof value === 'number' && value >= 1 && value <= 10;
      default:
        return false;
    }
  }

  /**
   * Get default value untuk attribute
   * @param attribute - Nama attribute
   * @returns any - Default value untuk attribute
   */
  getDefaultAttributeValue(attribute: string): any {
    switch (attribute) {
      case UserAttribute.DEPARTMENT:
        return 'General';
      case UserAttribute.REGION:
        return 'Default';
      case UserAttribute.LEVEL:
        return 1;
      default:
        return null;
    }
  }
}

// Export instance untuk digunakan di service lain
export const userAttributeService = new UserAttributeService(
  new UserRepository(),
  new ValidationService(),
  new ErrorHandler()
);