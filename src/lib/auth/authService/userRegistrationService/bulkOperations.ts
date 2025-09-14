import { UserCreateData, UserResponse, BulkRegistrationResult } from "./types";
import { logBulkOperation } from './logger';

/**
 * Bulk Operations class untuk User Registration
 * Menangani operasi registrasi user dalam jumlah banyak
 */
export class UserRegistrationBulkOperations {
  constructor(
    private registerUserFunction: (userData: UserCreateData) => Promise<UserResponse>
  ) {}

  /**
   * Bulk register users dari array data
   * @param usersData - Array data user yang akan diregistrasi
   * @returns Array hasil registrasi dengan status success/error
   */
  async bulkRegisterUsers(usersData: UserCreateData[]): Promise<BulkRegistrationResult> {
    const successful: UserResponse[] = [];
    const failed: { data: UserCreateData; error: string }[] = [];

    logBulkOperation.start(usersData.length, 'system');

    for (const userData of usersData) {
      try {
        const user = await this.registerUserFunction(userData);
        successful.push(user);
        // Success logged in main registration service
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        failed.push({
          data: userData,
          error: errorMessage
        });
        // Error logged in main registration service
      }
    }

    logBulkOperation.complete(
      successful.length,
      failed.length,
      'system'
    );
    
    return { successful, failed };
  }

  /**
   * Bulk register users dengan batch processing
   * @param usersData - Array data user yang akan diregistrasi
   * @param batchSize - Ukuran batch untuk processing (default: 10)
   * @returns Array hasil registrasi dengan status success/error
   */
  async bulkRegisterUsersInBatches(
    usersData: UserCreateData[], 
    batchSize: number = 10
  ): Promise<BulkRegistrationResult> {
    const successful: UserResponse[] = [];
    const failed: { data: UserCreateData; error: string }[] = [];

    logBulkOperation.start(usersData.length, 'system');

    // Bagi data menjadi batch-batch
    for (let i = 0; i < usersData.length; i += batchSize) {
      const batch = usersData.slice(i, i + batchSize);
      logBulkOperation.progress(i + batch.length, usersData.length, 'system');

      // Process batch secara parallel
      const batchPromises = batch.map(async (userData) => {
        try {
          const user = await this.registerUserFunction(userData);
          return { success: true, user, userData };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          return { success: false, error: errorMessage, userData };
        }
      });

      const batchResults = await Promise.all(batchPromises);

      // Kategorikan hasil batch
      for (const result of batchResults) {
        if (result.success) {
          successful.push(result.user!);
          // Success logged in main registration service
        } else {
          failed.push({
            data: result.userData,
            error: result.error!
          });
          // Error logged in main registration service
        }
      }

      // Delay antar batch untuk menghindari overload
      if (i + batchSize < usersData.length) {
        await this.delay(100); // 100ms delay
      }
    }

    logBulkOperation.complete(
      successful.length,
      failed.length,
      'system'
    );
    
    return { successful, failed };
  }

  /**
   * Validasi data bulk sebelum registrasi
   * @param usersData - Array data user yang akan divalidasi
   * @returns Array error validasi jika ada
   */
  validateBulkData(usersData: UserCreateData[]): string[] {
    const errors: string[] = [];

    if (!Array.isArray(usersData)) {
      errors.push('Data harus berupa array');
      return errors;
    }

    if (usersData.length === 0) {
      errors.push('Array data tidak boleh kosong');
      return errors;
    }

    if (usersData.length > 1000) {
      errors.push('Maksimal 1000 user per batch');
    }

    // Check duplicate emails dalam batch
    const emails = usersData.map(user => user.email?.toLowerCase().trim()).filter(Boolean);
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
    
    if (duplicateEmails.length > 0) {
      errors.push(`Email duplikat ditemukan: ${[...new Set(duplicateEmails)].join(', ')}`);
    }

    // Validasi basic untuk setiap user
    usersData.forEach((userData, index) => {
      if (!userData.name?.trim()) {
        errors.push(`User index ${index}: Nama harus diisi`);
      }
      if (!userData.email?.trim()) {
        errors.push(`User index ${index}: Email harus diisi`);
      }
      if (!userData.password?.trim()) {
        errors.push(`User index ${index}: Password harus diisi`);
      }
    });

    return errors;
  }

  /**
   * Generate laporan hasil bulk registration
   * @param result - Hasil bulk registration
   * @returns String laporan
   */
  generateBulkRegistrationReport(result: BulkRegistrationResult): string {
    const { successful, failed } = result;
    const total = successful.length + failed.length;
    const successRate = total > 0 ? ((successful.length / total) * 100).toFixed(2) : '0';

    let report = `\n=== LAPORAN BULK REGISTRATION ===\n`;
    report += `Total User: ${total}\n`;
    report += `Berhasil: ${successful.length}\n`;
    report += `Gagal: ${failed.length}\n`;
    report += `Success Rate: ${successRate}%\n\n`;

    if (successful.length > 0) {
      report += `BERHASIL DIREGISTRASI:\n`;
      successful.forEach((user, index) => {
        report += `${index + 1}. ${user.name} (${user.email})\n`;
      });
      report += `\n`;
    }

    if (failed.length > 0) {
      report += `GAGAL DIREGISTRASI:\n`;
      failed.forEach((item, index) => {
        report += `${index + 1}. ${item.data.name} (${item.data.email}) - Error: ${item.error}\n`;
      });
    }

    return report;
  }

  /**
   * Utility function untuk delay
   * @param ms - Milliseconds untuk delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Factory function untuk membuat UserRegistrationBulkOperations
 */
export function createUserRegistrationBulkOperations(
  registerUserFunction: (userData: UserCreateData) => Promise<UserResponse>
): UserRegistrationBulkOperations {
  return new UserRegistrationBulkOperations(registerUserFunction);
}