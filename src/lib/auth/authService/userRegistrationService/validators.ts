import { ValidationError, ConflictError } from "../../../errors/errorHandler";
import { PasswordService } from "../passwordService";
import { 
  UserCreateData, 
  UserRepository, 
  RoleRepository,
  VALID_DEPARTMENTS,
  VALID_REGIONS,
  LEVEL_CONSTRAINTS
} from "./types";
import { VALIDATION_RULES, ERROR_MESSAGES } from './constants';
import { logUserRegistration } from './logger';

/**
 * Validator class untuk User Registration
 * Menangani semua validasi data registrasi user
 */
export class UserRegistrationValidator {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
    private passwordService: PasswordService
  ) {}

  /**
   * Validasi data registrasi lengkap
   * @param userData - Data user yang akan divalidasi
   * @throws ValidationError jika data tidak valid
   */
  async validateRegistrationData(userData: UserCreateData): Promise<void> {
    // Validasi name
    this.validateName(userData.name);

    // Validasi email
    this.validateEmail(userData.email);

    // Validasi password menggunakan PasswordService
    this.passwordService.validatePassword(userData.password);

    // Check apakah password mengandung informasi personal
    this.validatePasswordPersonalInfo(userData);
  }

  /**
   * Validasi nama user
   * @param name - Nama yang akan divalidasi
   * @throws ValidationError jika nama tidak valid
   */
  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Nama harus diisi');
    }

    if (name.trim().length < VALIDATION_RULES.NAME.MIN_LENGTH) {
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.NAME_TOO_SHORT);
    }

    if (name.trim().length > VALIDATION_RULES.NAME.MAX_LENGTH) {
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.NAME_TOO_LONG);
    }
  }

  /**
   * Validasi email user
   * @param email - Email yang akan divalidasi
   * @throws ValidationError jika email tidak valid
   */
  private validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new ValidationError('Email harus diisi');
    }

    if (!this.isValidEmailFormat(email)) {
      throw new ValidationError(ERROR_MESSAGES.VALIDATION.EMAIL_INVALID);
    }
  }

  /**
   * Validasi password tidak mengandung informasi personal
   * @param userData - Data user untuk ekstrak informasi personal
   * @throws ValidationError jika password mengandung informasi personal
   */
  private validatePasswordPersonalInfo(userData: UserCreateData): void {
    const personalInfo = [
      userData.name,
      userData.email.split('@')[0], // username dari email
      userData.department,
      userData.region
    ].filter(Boolean) as string[];

    if (this.passwordService.containsPersonalInfo(userData.password, personalInfo)) {
      throw new ValidationError('Password tidak boleh mengandung informasi personal');
    }
  }

  /**
   * Check ketersediaan email
   * @param email - Email yang akan dicek
   * @throws ConflictError jika email sudah terdaftar
   */
  async checkEmailAvailability(email: string): Promise<void> {
    const existingUser = await this.userRepository.findByEmail(email.toLowerCase().trim());
    
    if (existingUser) {
      logUserRegistration.validation(email, 'email', ERROR_MESSAGES.VALIDATION.EMAIL_EXISTS);
      throw new ConflictError('User', 'email', email, { existingUserId: existingUser.id });
    }
  }

  /**
   * Validasi role
   * @param roleId - ID role yang akan divalidasi
   * @throws ValidationError jika role tidak valid
   */
  async validateRole(roleId: string): Promise<void> {
    const role = await this.roleRepository.findById(roleId);
    
    if (!role) {
      throw new ValidationError('Role tidak valid');
    }

    if (!role.isActive) {
      throw new ValidationError('Role tidak aktif');
    }
  }

  /**
   * Validasi department dan region
   * @param department - Department yang akan divalidasi
   * @param region - Region yang akan divalidasi
   * @throws ValidationError jika department atau region tidak valid
   */
  validateDepartmentAndRegion(department?: string | null, region?: string | null): void {
    if (department && !VALID_DEPARTMENTS.includes(department.toUpperCase() as any)) {
      throw new ValidationError(
        `Department tidak valid. Pilihan: ${VALID_DEPARTMENTS.join(', ')}`
      );
    }

    if (region && !VALID_REGIONS.includes(region.toUpperCase() as any)) {
      throw new ValidationError(
        `Region tidak valid. Pilihan: ${VALID_REGIONS.join(', ')}`
      );
    }
  }

  /**
   * Validasi level
   * @param level - Level yang akan divalidasi
   * @throws ValidationError jika level tidak valid
   */
  validateLevel(level?: number | null): void {
    if (level !== null && level !== undefined) {
      if (!Number.isInteger(level) || level < LEVEL_CONSTRAINTS.MIN || level > LEVEL_CONSTRAINTS.MAX) {
        throw new ValidationError(
          `Level harus berupa integer antara ${LEVEL_CONSTRAINTS.MIN}-${LEVEL_CONSTRAINTS.MAX}`
        );
      }
    }
  }

  /**
   * Validasi format email
   * @param email - Email yang akan divalidasi
   * @returns true jika format email valid
   */
  private isValidEmailFormat(email: string): boolean {
    return VALIDATION_RULES.EMAIL.PATTERN.test(email);
  }

  /**
   * Register user baru dengan validasi lengkap
   * @param userData - Data user yang akan diregistrasi
   * @param currentUser - User yang melakukan registrasi (untuk permission check)
   * @returns Promise<UserResponse> - Data user yang berhasil dibuat
   */
  async registerUser(userData: UserCreateData, currentUser: any): Promise<any> {
    try {
      // Validasi data registrasi
      await this.validateRegistrationData(userData);
      
      // Check email availability
      await this.checkEmailAvailability(userData.email);
      
      // Validasi role jika ada
      if (userData.roleId) {
        await this.validateRole(userData.roleId);
      }
      
      // Validasi department dan region
      this.validateDepartmentAndRegion(userData.department, userData.region);
      
      // Validasi level
      this.validateLevel(userData.level);
      
      // Hash password
      const hashedPassword = await this.passwordService.hashPassword(userData.password);
      
      // Siapkan data untuk database
      const userDataToCreate = {
        name: userData.name,
        email: userData.email,
        passwordHash: hashedPassword,
        department: userData.department || null,
        region: userData.region || null,
        level: userData.level || null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Buat user di database
      const newUser = await this.userRepository.create(userDataToCreate);
      
      // Assign default role jika tidak ada role yang ditentukan
      let assignedRole = null;
      if (userData.roleId) {
        assignedRole = await this.roleRepository.findById(userData.roleId);
      } else {
        // Assign default role 'USER'
        const defaultRole = await this.roleRepository.findByName('USER');
        if (defaultRole) {
          // Assign role ke user (implementasi tergantung struktur database)
          assignedRole = defaultRole;
        }
      }
      
      // Log successful registration
       logUserRegistration.success(
         userData.email,
         newUser.id.toString()
       );
      
      // Return user response
      return {
        id: newUser.id.toString(),
        name: newUser.name,
        email: newUser.email,
        department: newUser.department,
        region: newUser.region,
        level: newUser.level,
        role: assignedRole?.name || 'USER',
        createdAt: newUser.createdAt
      };
      
    } catch (error) {
      // Log failed registration
       logUserRegistration.failed(
         userData.email,
         error instanceof Error ? error.message : 'Unknown error',
         'unknown'
       );
      
      throw error;
    }
  }
}

/**
 * Factory function untuk membuat UserRegistrationValidator
 */
export function createUserRegistrationValidator(
  userRepository: UserRepository,
  roleRepository: RoleRepository,
  passwordService: PasswordService
): UserRegistrationValidator {
  return new UserRegistrationValidator(
    userRepository,
    roleRepository,
    passwordService
  );
}