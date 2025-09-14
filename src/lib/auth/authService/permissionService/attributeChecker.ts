import { User, DepartmentAccess, RegionAccess, AttributeCheckContext } from './types';

/**
 * AttributeChecker
 * Menangani Attribute-Based Access Control (ABAC)
 * Mengecek level, department, dan region user
 * Mengikuti Single Responsibility Principle (SRP)
 */
export class AttributeChecker {
  /**
   * Check apakah user memiliki level minimum yang dibutuhkan
   * @param user - User object
   * @param minimumLevel - Level minimum yang dibutuhkan
   * @returns true jika user memiliki level yang cukup
   */
  hasMinimumLevel(user: User, minimumLevel: number): boolean {
    try {
      const userLevel = user.level;
      
      // Jika user tidak memiliki level, anggap level 0
      if (userLevel === null || userLevel === undefined) {
        return minimumLevel <= 0;
      }

      return userLevel >= minimumLevel;
    } catch (error) {
      console.error('❌ Level check failed:', error);
      return false;
    }
  }

  /**
   * Check apakah user berada di department yang diizinkan
   * @param user - User object
   * @param allowedDepartments - Department atau array department yang diizinkan
   * @returns true jika user berada di department yang diizinkan
   */
  hasAllowedDepartment(user: User, allowedDepartments: DepartmentAccess): boolean {
    try {
      const userDepartment = user.department;
      
      if (!userDepartment) {
        return false;
      }

      const departments = Array.isArray(allowedDepartments) 
        ? allowedDepartments 
        : [allowedDepartments];
      
      return departments.includes(userDepartment);
    } catch (error) {
      console.error('❌ Department check failed:', error);
      return false;
    }
  }

  /**
   * Check apakah user berada di region yang diizinkan
   * @param user - User object
   * @param allowedRegions - Region atau array region yang diizinkan
   * @returns true jika user berada di region yang diizinkan
   */
  hasAllowedRegion(user: User, allowedRegions: RegionAccess): boolean {
    try {
      const userRegion = user.region;
      
      if (!userRegion) {
        return false;
      }

      const regions = Array.isArray(allowedRegions) 
        ? allowedRegions 
        : [allowedRegions];
      
      return regions.includes(userRegion);
    } catch (error) {
      console.error('❌ Region check failed:', error);
      return false;
    }
  }

  /**
   * Check apakah user memiliki level exact (bukan minimum)
   * @param user - User object
   * @param exactLevel - Level yang harus sama persis
   * @returns true jika user memiliki level yang sama persis
   */
  hasExactLevel(user: User, exactLevel: number): boolean {
    return user.level === exactLevel;
  }

  /**
   * Check apakah user memiliki level dalam range tertentu
   * @param user - User object
   * @param minLevel - Level minimum
   * @param maxLevel - Level maximum
   * @returns true jika user level berada dalam range
   */
  hasLevelInRange(user: User, minLevel: number, maxLevel: number): boolean {
    const userLevel = user.level;
    
    if (userLevel === null || userLevel === undefined) {
      return minLevel <= 0 && maxLevel >= 0;
    }

    return userLevel >= minLevel && userLevel <= maxLevel;
  }

  /**
   * Check multiple attributes dengan AND logic
   * @param user - User object
   * @param criteria - Object berisi kriteria yang harus dipenuhi
   * @returns true jika semua kriteria terpenuhi
   */
  checkAllAttributes(
    user: User,
    criteria: {
      minimumLevel?: number;
      departments?: DepartmentAccess;
      regions?: RegionAccess;
    }
  ): boolean {
    // Check level jika ada
    if (criteria.minimumLevel !== undefined) {
      if (!this.hasMinimumLevel(user, criteria.minimumLevel)) {
        return false;
      }
    }

    // Check department jika ada
    if (criteria.departments !== undefined) {
      if (!this.hasAllowedDepartment(user, criteria.departments)) {
        return false;
      }
    }

    // Check region jika ada
    if (criteria.regions !== undefined) {
      if (!this.hasAllowedRegion(user, criteria.regions)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check multiple attributes dengan OR logic
   * @param user - User object
   * @param criteria - Object berisi kriteria, salah satu harus terpenuhi
   * @returns true jika minimal satu kriteria terpenuhi
   */
  checkAnyAttribute(
    user: User,
    criteria: {
      minimumLevel?: number;
      departments?: DepartmentAccess;
      regions?: RegionAccess;
    }
  ): boolean {
    // Check level jika ada
    if (criteria.minimumLevel !== undefined) {
      if (this.hasMinimumLevel(user, criteria.minimumLevel)) {
        return true;
      }
    }

    // Check department jika ada
    if (criteria.departments !== undefined) {
      if (this.hasAllowedDepartment(user, criteria.departments)) {
        return true;
      }
    }

    // Check region jika ada
    if (criteria.regions !== undefined) {
      if (this.hasAllowedRegion(user, criteria.regions)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get detailed attribute check result dengan context
   * @param user - User object
   * @param criteria - Kriteria yang akan dicek
   * @returns Array context hasil pengecekan setiap attribute
   */
  getAttributeCheckDetails(
    user: User,
    criteria: {
      minimumLevel?: number;
      departments?: DepartmentAccess;
      regions?: RegionAccess;
    }
  ): AttributeCheckContext[] {
    const results: AttributeCheckContext[] = [];

    // Check level
    if (criteria.minimumLevel !== undefined) {
      results.push({
        checkType: 'level',
        requiredValue: criteria.minimumLevel,
        userValue: user.level,
        result: this.hasMinimumLevel(user, criteria.minimumLevel)
      });
    }

    // Check department
    if (criteria.departments !== undefined) {
      results.push({
        checkType: 'department',
        requiredValue: criteria.departments,
        userValue: user.department,
        result: this.hasAllowedDepartment(user, criteria.departments)
      });
    }

    // Check region
    if (criteria.regions !== undefined) {
      results.push({
        checkType: 'region',
        requiredValue: criteria.regions,
        userValue: user.region,
        result: this.hasAllowedRegion(user, criteria.regions)
      });
    }

    return results;
  }

  /**
   * Validate attribute values
   * @param user - User object
   * @returns Object berisi validasi setiap attribute
   */
  validateUserAttributes(user: User): {
    level: { valid: boolean; message?: string };
    department: { valid: boolean; message?: string };
    region: { valid: boolean; message?: string };
  } {
    const validation: {
      level: { valid: boolean; message?: string };
      department: { valid: boolean; message?: string };
      region: { valid: boolean; message?: string };
    } = {
      level: { valid: true },
      department: { valid: true },
      region: { valid: true }
    };

    // Validate level
    if (user.level !== null && user.level !== undefined) {
      if (typeof user.level !== 'number' || user.level < 0) {
        validation.level = {
          valid: false,
          message: 'Level harus berupa angka positif atau null'
        };
      }
    }

    // Validate department
    if (user.department !== null && user.department !== undefined) {
      if (typeof user.department !== 'string' || user.department.trim() === '') {
        validation.department = {
          valid: false,
          message: 'Department harus berupa string yang tidak kosong atau null'
        };
      }
    }

    // Validate region
    if (user.region !== null && user.region !== undefined) {
      if (typeof user.region !== 'string' || user.region.trim() === '') {
        validation.region = {
          valid: false,
          message: 'Region harus berupa string yang tidak kosong atau null'
        };
      }
    }

    return validation;
  }

  /**
   * Get user attribute summary
   * @param user - User object
   * @returns Object summary attribute user
   */
  getUserAttributeSummary(user: User): {
    level: number | null;
    department: string | null;
    region: string | null;
    hasLevel: boolean;
    hasDepartment: boolean;
    hasRegion: boolean;
  } {
    return {
      level: user.level,
      department: user.department,
      region: user.region,
      hasLevel: user.level !== null && user.level !== undefined,
      hasDepartment: user.department !== null && user.department !== undefined,
      hasRegion: user.region !== null && user.region !== undefined
    };
  }

  /**
   * Compare user attributes dengan user lain
   * @param userA - User pertama
   * @param userB - User kedua
   * @returns Object perbandingan attribute
   */
  compareUserAttributes(userA: User, userB: User): {
    levelComparison: 'higher' | 'lower' | 'equal' | 'incomparable';
    sameDepartment: boolean;
    sameRegion: boolean;
  } {
    let levelComparison: 'higher' | 'lower' | 'equal' | 'incomparable';

    if (userA.level === null || userB.level === null) {
      levelComparison = 'incomparable';
    } else if (userA.level > userB.level) {
      levelComparison = 'higher';
    } else if (userA.level < userB.level) {
      levelComparison = 'lower';
    } else {
      levelComparison = 'equal';
    }

    return {
      levelComparison,
      sameDepartment: userA.department === userB.department,
      sameRegion: userA.region === userB.region
    };
  }
}

// Export singleton instance
export const attributeChecker = new AttributeChecker();
export default attributeChecker;