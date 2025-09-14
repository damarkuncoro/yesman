import { BaseService } from "../base/baseService";
import { AbacOperator, UserAttribute, ComparisonResult, User } from "./types";

/**
 * Service untuk melakukan perbandingan values dalam ABAC policies
 * Bertanggung jawab untuk evaluasi operator dan comparison logic
 */
export class PolicyComparisonService extends BaseService {
  constructor() {
    super();
  }

  /**
   * Ambil nilai attribute dari user
   * @param user - User object
   * @param attribute - Nama attribute
   * @returns string | number | null - Nilai attribute atau null jika tidak ada
   */
  getUserAttributeValue(user: User, attribute: string): string | number | null {
    switch (attribute) {
      case UserAttribute.DEPARTMENT:
        return user.department;
      case UserAttribute.REGION:
        return user.region;
      case UserAttribute.LEVEL:
        return user.level;
      default:
        console.warn(`Unknown attribute: ${attribute}`);
        return null;
    }
  }

  /**
   * Bandingkan nilai user dengan policy value menggunakan operator
   * @param userValue - Nilai attribute user
   * @param operator - Operator perbandingan
   * @param policyValue - Nilai dari policy
   * @returns ComparisonResult - Hasil perbandingan dengan status dan error handling
   */
  compareValues(
    userValue: string | number | null,
    operator: string,
    policyValue: string
  ): ComparisonResult {
    try {
      switch (operator) {
        case AbacOperator.EQUALS:
          return {
            success: true,
            result: String(userValue) === policyValue
          };
        
        case AbacOperator.NOT_EQUALS:
          return {
            success: true,
            result: String(userValue) !== policyValue
          };
        
        case AbacOperator.GREATER_THAN:
          return this.compareNumericValues(userValue, policyValue, (a, b) => a > b);
        
        case AbacOperator.GREATER_THAN_OR_EQUAL:
          return this.compareNumericValues(userValue, policyValue, (a, b) => a >= b);
        
        case AbacOperator.LESS_THAN:
          return this.compareNumericValues(userValue, policyValue, (a, b) => a < b);
        
        case AbacOperator.LESS_THAN_OR_EQUAL:
          return this.compareNumericValues(userValue, policyValue, (a, b) => a <= b);
        
        case AbacOperator.IN:
          return this.compareInOperator(userValue, policyValue);
        
        default:
          return {
            success: false,
            error: `Unknown operator: ${operator}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: `Error comparing values: ${userValue} ${operator} ${policyValue} - ${error}`
      };
    }
  }

  /**
   * Perbandingan numerik dengan function comparator
   * @param userValue - Nilai user
   * @param policyValue - Nilai policy
   * @param compareFn - Function untuk perbandingan
   * @returns ComparisonResult
   */
  private compareNumericValues(
    userValue: string | number | null,
    policyValue: string,
    compareFn: (a: number, b: number) => boolean
  ): ComparisonResult {
    const userNum = Number(userValue);
    const policyNum = Number(policyValue);
    
    if (isNaN(userNum) || isNaN(policyNum)) {
      return {
        success: false,
        error: `Cannot compare non-numeric values: ${userValue} and ${policyValue}`
      };
    }
    
    return {
      success: true,
      result: compareFn(userNum, policyNum)
    };
  }

  /**
   * Perbandingan untuk operator 'in' (array membership)
   * @param userValue - Nilai user
   * @param policyValue - JSON array string dari policy
   * @returns ComparisonResult
   */
  private compareInOperator(
    userValue: string | number | null,
    policyValue: string
  ): ComparisonResult {
    try {
      const allowedValues = JSON.parse(policyValue);
      
      if (!Array.isArray(allowedValues)) {
        return {
          success: false,
          error: `Policy value untuk operator 'in' harus berupa array: ${policyValue}`
        };
      }
      
      return {
        success: true,
        result: allowedValues.includes(String(userValue))
      };
    } catch (parseError) {
      return {
        success: false,
        error: `Error parsing policy value untuk operator 'in': ${policyValue} - ${parseError}`
      };
    }
  }

  /**
   * Validasi apakah operator yang diberikan valid
   * @param operator - Operator yang akan divalidasi
   * @returns boolean - true jika operator valid
   */
  isValidOperator(operator: string): boolean {
    return Object.values(AbacOperator).includes(operator as AbacOperator);
  }

  /**
   * Validasi apakah attribute yang diberikan valid
   * @param attribute - Attribute yang akan divalidasi
   * @returns boolean - true jika attribute valid
   */
  isValidAttribute(attribute: string): boolean {
    return Object.values(UserAttribute).includes(attribute as UserAttribute);
  }

  /**
   * Get daftar semua operator yang didukung
   * @returns string[] - Array operator yang didukung
   */
  getSupportedOperators(): string[] {
    return Object.values(AbacOperator);
  }

  /**
   * Get daftar semua attribute yang didukung
   * @returns string[] - Array attribute yang didukung
   */
  getSupportedAttributes(): string[] {
    return Object.values(UserAttribute);
  }
}

// Export instance untuk digunakan di service lain
export const policyComparisonService = new PolicyComparisonService();
