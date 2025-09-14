/**
 * PasswordGenerator
 * Bertanggung jawab untuk menghasilkan password yang aman
 * Mengikuti Single Responsibility Principle
 */
export class PasswordGenerator {
  private readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private readonly NUMBERS = '0123456789';
  private readonly SPECIAL_CHARS = '!@#$%^&*(),.?":{}|<>';
  private readonly DEFAULT_LENGTH = 12;

  /**
   * Generate random password yang aman
   * @param length - Panjang password (default: 12)
   * @param options - Opsi untuk karakter yang digunakan
   * @returns string - Random password yang memenuhi kriteria kompleksitas
   */
  generateSecurePassword(
    length: number = this.DEFAULT_LENGTH,
    options: {
      includeUppercase?: boolean;
      includeLowercase?: boolean;
      includeNumbers?: boolean;
      includeSpecialChars?: boolean;
    } = {}
  ): string {
    // Default options
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSpecialChars = true
    } = options;

    if (length < 4) {
      throw new Error('Password length harus minimal 4 karakter');
    }

    let availableChars = '';
    let requiredChars = '';

    // Build character sets dan pastikan minimal satu karakter dari setiap kategori
    if (includeUppercase) {
      availableChars += this.UPPERCASE;
      requiredChars += this.getRandomChar(this.UPPERCASE);
    }

    if (includeLowercase) {
      availableChars += this.LOWERCASE;
      requiredChars += this.getRandomChar(this.LOWERCASE);
    }

    if (includeNumbers) {
      availableChars += this.NUMBERS;
      requiredChars += this.getRandomChar(this.NUMBERS);
    }

    if (includeSpecialChars) {
      availableChars += this.SPECIAL_CHARS;
      requiredChars += this.getRandomChar(this.SPECIAL_CHARS);
    }

    if (!availableChars) {
      throw new Error('Minimal satu jenis karakter harus diaktifkan');
    }

    // Isi sisa karakter secara random
    let password = requiredChars;
    for (let i = requiredChars.length; i < length; i++) {
      password += this.getRandomChar(availableChars);
    }

    // Shuffle password untuk menghindari pola yang dapat diprediksi
    return this.shuffleString(password);
  }

  /**
   * Generate password dengan template tertentu
   * @param template - Template password (contoh: 'Aa1!Aa1!Aa1!')
   * @returns string - Password berdasarkan template
   */
  generateFromTemplate(template: string): string {
    return template.replace(/./g, (char) => {
      switch (char) {
        case 'A': return this.getRandomChar(this.UPPERCASE);
        case 'a': return this.getRandomChar(this.LOWERCASE);
        case '1': return this.getRandomChar(this.NUMBERS);
        case '!': return this.getRandomChar(this.SPECIAL_CHARS);
        default: return char;
      }
    });
  }

  /**
   * Generate multiple passwords sekaligus
   * @param count - Jumlah password yang akan dibuat
   * @param length - Panjang setiap password
   * @returns string[] - Array password yang dihasilkan
   */
  generateMultiplePasswords(count: number, length: number = this.DEFAULT_LENGTH): string[] {
    if (count <= 0) {
      throw new Error('Count harus lebih dari 0');
    }

    const passwords: string[] = [];
    for (let i = 0; i < count; i++) {
      passwords.push(this.generateSecurePassword(length));
    }

    return passwords;
  }

  /**
   * Generate password yang mudah diingat (pronounceable)
   * @param length - Panjang password
   * @returns string - Password yang mudah diingat
   */
  generatePronounceablePassword(length: number = 8): string {
    const consonants = 'bcdfghjklmnpqrstvwxyz';
    const vowels = 'aeiou';
    const numbers = this.NUMBERS;
    const specials = '!@#$';
    
    let password = '';
    let useConsonant = true;
    
    for (let i = 0; i < length - 2; i++) {
      if (useConsonant) {
        password += this.getRandomChar(consonants);
      } else {
        password += this.getRandomChar(vowels);
      }
      useConsonant = !useConsonant;
    }
    
    // Tambahkan angka dan karakter khusus di akhir
    password += this.getRandomChar(numbers);
    password += this.getRandomChar(specials);
    
    return password;
  }

  /**
   * Mendapatkan karakter random dari string
   * @param chars - String karakter yang tersedia
   * @returns string - Karakter random
   */
  private getRandomChar(chars: string): string {
    return chars[Math.floor(Math.random() * chars.length)];
  }

  /**
   * Shuffle string secara random
   * @param str - String yang akan di-shuffle
   * @returns string - String yang sudah di-shuffle
   */
  private shuffleString(str: string): string {
    return str.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Mendapatkan konfigurasi karakter yang tersedia
   * @returns object - Konfigurasi karakter
   */
  getCharacterSets(): {
    uppercase: string;
    lowercase: string;
    numbers: string;
    specialChars: string;
  } {
    return {
      uppercase: this.UPPERCASE,
      lowercase: this.LOWERCASE,
      numbers: this.NUMBERS,
      specialChars: this.SPECIAL_CHARS
    };
  }
}

// Export singleton instance
export const passwordGenerator = new PasswordGenerator();
export default passwordGenerator;