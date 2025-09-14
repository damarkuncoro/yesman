/**
 * Interface untuk hasil analisis kekuatan password
 */
export interface PasswordStrengthResult {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
  details: {
    length: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumbers: boolean;
    hasSpecialChars: boolean;
    isLongEnough: boolean;
  };
}

/**
 * PasswordStrengthChecker
 * Bertanggung jawab untuk menganalisis kekuatan password
 * Mengikuti Single Responsibility Principle
 */
export class PasswordStrengthChecker {
  private readonly MIN_LENGTH = 8;
  private readonly RECOMMENDED_LENGTH = 12;
  private readonly STRONG_LENGTH = 16;

  /**
   * Analisis kekuatan password secara komprehensif
   * @param password - Password yang akan dianalisis
   * @returns PasswordStrengthResult - Hasil analisis kekuatan password
   */
  checkPasswordStrength(password: string): PasswordStrengthResult {
    const feedback: string[] = [];
    let score = 0;

    // Analisis detail password
    const details = this.analyzePasswordDetails(password);

    // Scoring berdasarkan panjang
    const lengthScore = this.scoreLengthComplexity(password, feedback);
    score += lengthScore;

    // Scoring berdasarkan variasi karakter
    const varietyScore = this.scoreCharacterVariety(details, feedback);
    score += varietyScore;

    // Bonus untuk password yang sangat panjang
    if (password.length >= this.STRONG_LENGTH) {
      score += 10;
    }

    // Penalti untuk pola yang mudah ditebak
    const patternPenalty = this.checkCommonPatterns(password, feedback);
    score -= patternPenalty;

    // Pastikan score tidak negatif atau lebih dari 100
    score = Math.max(0, Math.min(100, score));

    // Tentukan level berdasarkan score
    const level = this.determineStrengthLevel(score);

    return {
      score,
      level,
      feedback,
      details
    };
  }

  /**
   * Analisis detail komponen password
   * @param password - Password yang akan dianalisis
   * @returns object - Detail komponen password
   */
  private analyzePasswordDetails(password: string) {
    return {
      length: password.length >= this.MIN_LENGTH,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      isLongEnough: password.length >= this.RECOMMENDED_LENGTH
    };
  }

  /**
   * Scoring berdasarkan panjang password
   * @param password - Password yang akan di-score
   * @param feedback - Array feedback yang akan diisi
   * @returns number - Score untuk panjang
   */
  private scoreLengthComplexity(password: string, feedback: string[]): number {
    let score = 0;

    if (password.length >= this.MIN_LENGTH) {
      score += 20;
    } else {
      feedback.push(`Gunakan minimal ${this.MIN_LENGTH} karakter`);
    }

    if (password.length >= this.RECOMMENDED_LENGTH) {
      score += 10;
    } else {
      feedback.push(`Gunakan minimal ${this.RECOMMENDED_LENGTH} karakter untuk keamanan lebih baik`);
    }

    return score;
  }

  /**
   * Scoring berdasarkan variasi karakter
   * @param details - Detail komponen password
   * @param feedback - Array feedback yang akan diisi
   * @returns number - Score untuk variasi karakter
   */
  private scoreCharacterVariety(details: any, feedback: string[]): number {
    let score = 0;

    if (details.hasLowercase) {
      score += 15;
    } else {
      feedback.push('Tambahkan huruf kecil');
    }

    if (details.hasUppercase) {
      score += 15;
    } else {
      feedback.push('Tambahkan huruf besar');
    }

    if (details.hasNumbers) {
      score += 15;
    } else {
      feedback.push('Tambahkan angka');
    }

    if (details.hasSpecialChars) {
      score += 15;
    } else {
      feedback.push('Tambahkan karakter khusus');
    }

    return score;
  }

  /**
   * Check pola umum yang mudah ditebak
   * @param password - Password yang akan dicek
   * @param feedback - Array feedback yang akan diisi
   * @returns number - Penalti score
   */
  private checkCommonPatterns(password: string, feedback: string[]): number {
    let penalty = 0;

    // Check sequential characters
    if (this.hasSequentialChars(password)) {
      penalty += 10;
      feedback.push('Hindari karakter berurutan (123, abc)');
    }

    // Check repeated characters
    if (this.hasRepeatedChars(password)) {
      penalty += 10;
      feedback.push('Hindari karakter berulang (aaa, 111)');
    }

    // Check common patterns
    if (this.hasCommonPatterns(password)) {
      penalty += 15;
      feedback.push('Hindari pola umum (qwerty, password)');
    }

    return penalty;
  }

  /**
   * Check apakah password memiliki karakter berurutan
   * @param password - Password yang akan dicek
   * @returns boolean - true jika ada karakter berurutan
   */
  private hasSequentialChars(password: string): boolean {
    const sequences = ['123', '234', '345', '456', '567', '678', '789', '890',
                      'abc', 'bcd', 'cde', 'def', 'efg', 'fgh', 'ghi', 'hij'];
    
    const lowerPassword = password.toLowerCase();
    return sequences.some(seq => lowerPassword.includes(seq));
  }

  /**
   * Check apakah password memiliki karakter berulang
   * @param password - Password yang akan dicek
   * @returns boolean - true jika ada karakter berulang
   */
  private hasRepeatedChars(password: string): boolean {
    return /(..).*\1/.test(password) || /(.{3,}).*\1/.test(password);
  }

  /**
   * Check apakah password menggunakan pola umum
   * @param password - Password yang akan dicek
   * @returns boolean - true jika menggunakan pola umum
   */
  private hasCommonPatterns(password: string): boolean {
    const commonPatterns = [
      'password', 'qwerty', 'asdf', 'zxcv', 'admin', 'login',
      '12345', '54321', 'abcde', 'edcba'
    ];
    
    const lowerPassword = password.toLowerCase();
    return commonPatterns.some(pattern => lowerPassword.includes(pattern));
  }

  /**
   * Tentukan level kekuatan berdasarkan score
   * @param score - Score kekuatan password
   * @returns string - Level kekuatan
   */
  private determineStrengthLevel(score: number): 'weak' | 'fair' | 'good' | 'strong' {
    if (score < 40) return 'weak';
    if (score < 60) return 'fair';
    if (score < 80) return 'good';
    return 'strong';
  }

  /**
   * Mendapatkan rekomendasi untuk meningkatkan kekuatan password
   * @param password - Password yang akan dianalisis
   * @returns string[] - Array rekomendasi
   */
  getPasswordRecommendations(password: string): string[] {
    const result = this.checkPasswordStrength(password);
    const recommendations: string[] = [];

    if (result.level === 'weak') {
      recommendations.push('Password Anda sangat lemah. Pertimbangkan untuk menggantinya.');
    } else if (result.level === 'fair') {
      recommendations.push('Password Anda cukup, tapi bisa ditingkatkan.');
    } else if (result.level === 'good') {
      recommendations.push('Password Anda baik, tapi masih bisa diperkuat.');
    } else {
      recommendations.push('Password Anda sangat kuat!');
    }

    recommendations.push(...result.feedback);
    return recommendations;
  }
}

// Export singleton instance
export const passwordStrengthChecker = new PasswordStrengthChecker();
export default passwordStrengthChecker;