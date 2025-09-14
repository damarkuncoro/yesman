/**
 * Constants untuk User Registration Service
 * Menghilangkan hardcode values dan menyediakan konfigurasi terpusat
 */

// Validation constants
export const VALIDATION_RULES = {
  NAME: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 100,
    REQUIRED: true
  },
  EMAIL: {
    REQUIRED: true,
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  LEVEL: {
    MIN: 1,
    MAX: 10,
    REQUIRED: false
  }
} as const;

// Business logic constants
export const BUSINESS_RULES = {
  DEFAULT_ROLE: 'USER',
  EMAIL_VERIFICATION_REQUIRED: false,
  ALLOW_SELF_REGISTRATION: true,
  MAX_BULK_REGISTRATION_SIZE: 100,
  BATCH_SIZE: 10,
  STATISTICS_RECENT_DAYS: 30
} as const;

// Role hierarchy for permission checks
export const ROLE_HIERARCHY = {
  SUPER_ADMIN: {
    level: 100,
    canRegisterAny: true,
    canManageAny: true
  },
  ADMIN: {
    level: 80,
    canRegisterBelow: true,
    canManageBelow: true
  },
  HR: {
    level: 60,
    canRegisterUsers: true,
    allowedRoles: ['USER', 'EMPLOYEE']
  },
  MANAGER: {
    level: 40,
    canRegisterInDepartment: true,
    canManageInDepartment: true
  },
  USER: {
    level: 10,
    canRegisterSelf: false,
    canManageSelf: true
  }
} as const;

// Department configuration
export const DEPARTMENT_CONFIG = {
  VALID_DEPARTMENTS: [
    'IT', 'HR', 'FINANCE', 'MARKETING', 
    'SALES', 'OPERATIONS', 'LEGAL'
  ] as const,
  DEPARTMENT_MANAGERS: {
    IT: ['TECH_LEAD', 'IT_MANAGER'],
    HR: ['HR_MANAGER', 'HR_SPECIALIST'],
    FINANCE: ['FINANCE_MANAGER', 'ACCOUNTANT'],
    MARKETING: ['MARKETING_MANAGER', 'MARKETING_SPECIALIST'],
    SALES: ['SALES_MANAGER', 'SALES_REPRESENTATIVE'],
    OPERATIONS: ['OPERATIONS_MANAGER', 'OPERATIONS_SPECIALIST'],
    LEGAL: ['LEGAL_MANAGER', 'LEGAL_COUNSEL']
  }
} as const;

// Region configuration
export const REGION_CONFIG = {
  VALID_REGIONS: [
    'JAKARTA', 'BANDUNG', 'SURABAYA', 
    'MEDAN', 'MAKASSAR', 'BALI'
  ] as const,
  REGION_MANAGERS: {
    JAKARTA: ['JAKARTA_MANAGER'],
    BANDUNG: ['BANDUNG_MANAGER'],
    SURABAYA: ['SURABAYA_MANAGER'],
    MEDAN: ['MEDAN_MANAGER'],
    MAKASSAR: ['MAKASSAR_MANAGER'],
    BALI: ['BALI_MANAGER']
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  VALIDATION: {
    NAME_REQUIRED: 'Nama harus diisi',
    NAME_TOO_SHORT: `Nama minimal ${VALIDATION_RULES.NAME.MIN_LENGTH} karakter`,
    NAME_TOO_LONG: `Nama maksimal ${VALIDATION_RULES.NAME.MAX_LENGTH} karakter`,
    EMAIL_REQUIRED: 'Email harus diisi',
    EMAIL_INVALID: 'Format email tidak valid',
    EMAIL_EXISTS: 'Email sudah terdaftar',
    PASSWORD_REQUIRED: 'Password harus diisi',
    PASSWORD_TOO_SHORT: 'Password minimal 8 karakter',
    PASSWORD_WEAK: 'Password harus mengandung huruf besar, huruf kecil, dan angka',
    PASSWORD_PERSONAL_INFO: 'Password tidak boleh mengandung informasi personal',
    DEPARTMENT_INVALID: `Department tidak valid. Pilihan: ${DEPARTMENT_CONFIG.VALID_DEPARTMENTS.join(', ')}`,
    REGION_INVALID: `Region tidak valid. Pilihan: ${REGION_CONFIG.VALID_REGIONS.join(', ')}`,
    LEVEL_INVALID: `Level harus berupa integer antara ${VALIDATION_RULES.LEVEL.MIN}-${VALIDATION_RULES.LEVEL.MAX}`,
    ROLE_INVALID: 'Role tidak valid',
    ROLE_INACTIVE: 'Role tidak aktif',
    FAILED: 'Validasi gagal'
  },
  REGISTRATION: {
    FAILED: 'Registrasi user gagal',
    USER_EXISTS: 'User sudah terdaftar',
    INVALID_DATA: 'Data registrasi tidak valid'
  },
  PERMISSION: {
    ACCESS_DENIED: 'Akses ditolak',
    INSUFFICIENT_PERMISSION: 'Permission tidak mencukupi',
    CANNOT_REGISTER: 'Tidak memiliki permission untuk registrasi user',
    CANNOT_REGISTER_ROLE: 'Tidak dapat registrasi user dengan role tersebut',
    CANNOT_REGISTER_LEVEL: 'Tidak dapat registrasi user dengan level tersebut',
    CANNOT_REGISTER_DEPARTMENT: 'Tidak dapat registrasi user di department tersebut'
  },
  CONFLICT: {
    EMAIL_EXISTS: 'Email sudah terdaftar'
  },
  SYSTEM: {
    REGISTRATION_FAILED: 'Registrasi user gagal',
    BULK_REGISTRATION_FAILED: 'Bulk registrasi gagal',
    STATISTICS_FAILED: 'Gagal mengambil statistik registrasi'
  }
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  REGISTRATION: {
    USER_CREATED: 'User berhasil diregistrasi',
    USER_UPDATED: 'User berhasil diperbarui'
  },
  BULK_OPERATION: {
    ALL_SUCCESS: 'Semua user berhasil diregistrasi',
    PARTIAL_SUCCESS: 'Sebagian user berhasil diregistrasi',
    COMPLETED: 'Bulk registrasi selesai'
  },
  STATISTICS: {
    GENERATED: 'Statistik berhasil dibuat',
    EXPORTED: 'Statistik berhasil diekspor'
  },
  GENERAL: {
    DATA_RETRIEVED: 'Data berhasil diambil',
    OPERATION_SUCCESS: 'Operasi berhasil'
  }
} as const;

// Log levels and categories
export const LOG_CONFIG = {
  LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
  },
  CATEGORIES: {
    REGISTRATION: 'user-registration',
    VALIDATION: 'validation',
    PERMISSION: 'permission',
    BULK_OPERATION: 'bulk-operation',
    STATISTICS: 'statistics'
  }
} as const;

// Export types
export type ValidDepartment = typeof DEPARTMENT_CONFIG.VALID_DEPARTMENTS[number];
export type ValidRegion = typeof REGION_CONFIG.VALID_REGIONS[number];
export type RoleType = keyof typeof ROLE_HIERARCHY;
export type LogLevel = typeof LOG_CONFIG.LEVELS[keyof typeof LOG_CONFIG.LEVELS];
export type LogCategory = typeof LOG_CONFIG.CATEGORIES[keyof typeof LOG_CONFIG.CATEGORIES];

// Utility functions
export const isValidDepartment = (department: string): department is ValidDepartment => {
  return DEPARTMENT_CONFIG.VALID_DEPARTMENTS.includes(department.toUpperCase() as ValidDepartment);
};

export const isValidRegion = (region: string): region is ValidRegion => {
  return REGION_CONFIG.VALID_REGIONS.includes(region.toUpperCase() as ValidRegion);
};

export const getRoleLevel = (roleName: string): number => {
  const role = ROLE_HIERARCHY[roleName.toUpperCase() as RoleType];
  return role?.level || 0;
};

export const canRoleRegisterRole = (adminRole: string, targetRole: string): boolean => {
  const adminLevel = getRoleLevel(adminRole);
  const targetLevel = getRoleLevel(targetRole);
  return adminLevel > targetLevel;
};

export const getDepartmentManagers = (department: ValidDepartment): readonly string[] => {
  return DEPARTMENT_CONFIG.DEPARTMENT_MANAGERS[department] || [];
};

export const getRegionManagers = (region: ValidRegion): readonly string[] => {
  return REGION_CONFIG.REGION_MANAGERS[region] || [];
};