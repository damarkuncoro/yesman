import { userRepository } from '@/repositories';
import { userService } from '@/services';
import { userRoleService } from '@/services/rbac/userRoleService';
import { roleService } from '@/services/rbac/roleService';
import { BaseService } from '@/services/base/baseService';
import type { UserCreateInput } from '@/services/user/types';

/**
 * Service untuk menangani initial setup aplikasi
 * Membuat super admin otomatis ketika users == 0
 */
export class InitialSetupService extends BaseService {
  private static instance: InitialSetupService;
  private isSetupCompleted = false;

  constructor() {
    super('InitialSetupService');
  }

  /**
   * Singleton pattern untuk InitialSetupService
   * @returns InitialSetupService instance
   */
  static getInstance(): InitialSetupService {
    if (!InitialSetupService.instance) {
      InitialSetupService.instance = new InitialSetupService();
    }
    return InitialSetupService.instance;
  }

  /**
   * Mengecek apakah setup sudah selesai
   */
  isSetupComplete(): boolean {
    return this.isSetupCompleted;
  }

  /**
   * Mengecek dan menjalankan initial setup jika diperlukan
   * Hanya berjalan ketika users == 0
   */
  async checkAndRunInitialSetup(): Promise<{
    needsSetup: boolean;
    userCount: number;
    message: string;
    setupCompleted?: boolean;
  }> {
    return this.executeWithErrorHandling(
      'check and run initial setup',
      async () => {
        console.log('🔍 Checking if initial setup is needed...');
        
        const userCount = await userRepository.count();
        console.log(`👥 Current user count: ${userCount}`);
        
        if (userCount === 0) {
          console.log('🚀 No users found. Running initial setup wizard...');
          
          // Jalankan wizard setup super admin
          const setupResult = await this.runSuperAdminWizard();
          
          if (setupResult.success) {
            this.isSetupCompleted = true;
            return {
              needsSetup: true,
              userCount: 0,
              message: 'Initial setup completed successfully. Super admin created.',
              setupCompleted: true
            };
          } else {
            return {
              needsSetup: true,
              userCount: 0,
              message: `Initial setup failed: ${setupResult.message || 'Unknown error'}`
            };
          }
        } else {
          console.log('✅ Users already exist. Skipping initial setup.');
          this.isSetupCompleted = true;
          return {
            needsSetup: false,
            userCount,
            message: 'Application already initialized. Users exist in database.'
          };
        }
      }
    );
  }

  /**
   * Menjalankan wizard setup super admin
   * Membuat user pertama dengan role super_admin
   * Validasi: hanya bisa dijalankan jika users == 0
   */
  private async runSuperAdminWizard(): Promise<{
    success: boolean;
    credentials?: {
      email: string;
      password: string;
      warning: string;
    };
    message?: string;
  }> {
    return this.executeWithErrorHandling(
      'run super admin wizard',
      async () => {
        // Validasi ulang: pastikan tidak ada user di database
        const userCount = await userRepository.count();
        if (userCount > 0) {
          console.warn('⚠️ Super admin wizard blocked: Users already exist in database');
          return {
            success: false,
            message: 'Cannot create super admin: Users already exist in the system. This wizard can only be used on a fresh installation.'
          };
        }
        
        // Validasi: pastikan belum ada super_admin
          try {
            const allRoles = await roleService.getAllRoles();
            const superAdminRole = allRoles.find(role => role.name === 'super_admin');
            if (superAdminRole) {
              const existingSuperAdmins = await userRoleService.getUserRoles(superAdminRole.id);
              if (existingSuperAdmins && existingSuperAdmins.length > 0) {
                console.warn('⚠️ Super admin wizard blocked: Super admin already exists');
                return {
                  success: false,
                  message: 'Cannot create super admin: A super administrator already exists in the system.'
                };
              }
            }
          } catch (error) {
            console.log('Super admin role check failed, continuing with setup...');
          }
        
        console.log('🧙‍♂️ Running super admin wizard...');
        
        // Default credentials untuk super admin
        const defaultEmail = 'admin@company.com';
        const defaultPassword = 'admin123';
        
        // Data default untuk super admin
          const defaultSuperAdmin: UserCreateInput = {
            email: defaultEmail,
            name: 'Super Administrator',
            password: defaultPassword, // Password akan di-hash oleh userService
            department: 'IT',
            region: 'HQ'
          };
        
        console.log('👤 Creating super admin user...');
        
        // Buat user menggunakan userService
          const createdUser = await userService.createUser(defaultSuperAdmin);
          console.log(`✅ Super admin user created with ID: ${createdUser.id}`);
          
          // Cari role super_admin
          const allRoles = await roleService.getAllRoles();
          const superAdminRole = allRoles.find(role => role.name === 'super_admin');
          if (!superAdminRole) {
            throw new Error('Super admin role not found in database');
          }
          
          // Assign role super_admin
          console.log('🔐 Assigning super_admin role...');
          const assignRoleResult = await userRoleService.assignRole({
            userId: createdUser.id,
            roleId: superAdminRole.id
          });
          
          console.log('✅ Super admin role assigned successfully');
        
        console.log('✅ Super admin role assigned successfully');
        console.log('🔒 Security: This wizard is now permanently disabled until database is reset');
        console.log('');
        console.log('🎉 INITIAL SETUP COMPLETED!');
        console.log('📋 Super Admin Credentials:');
        console.log(`   📧 Email: ${defaultEmail}`);
        console.log(`   🔑 Password: ${defaultPassword}`);
        console.log('');
        console.log('⚠️  IMPORTANT SECURITY NOTICE:');
        console.log('   Please change the default password immediately after first login!');
        console.log('   This is a temporary password for initial access only.');
        console.log('');
        
        return {
          success: true,
          credentials: {
            email: defaultEmail,
            password: defaultPassword,
            warning: 'Please change this password immediately after first login for security purposes. This setup wizard will not be available again.'
          }
        };
      }
    );
  }

  /**
   * Mengecek apakah initial setup diperlukan
   * @returns true jika users == 0, false jika sudah ada user
   */
  async needsInitialSetup(): Promise<boolean> {
    return this.executeWithErrorHandling(
      'check if initial setup is needed',
      async () => {
        const userCount = await userRepository.count();
        return userCount === 0;
      }
    );
  }

  /**
   * Reset status setup (untuk development/testing)
   */
  resetSetupStatus(): void {
    this.isSetupCompleted = false;
    console.log('🔄 Setup status reset (development mode)');
  }
}

// Export singleton instance
export const initialSetupService = InitialSetupService.getInstance();