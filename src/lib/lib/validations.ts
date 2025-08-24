// Form and data validation utilities
// src/lib/validations.ts

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface ValidationRule<T> {
  test: (value: T) => boolean
  message: string
}

/**
 * Generic validator that applies multiple rules
 */
export function validate<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
  const errors: string[] = []
  
  for (const rule of rules) {
    if (!rule.test(value)) {
      errors.push(rule.message)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Email validation
 */
export function validateEmail(email: string): ValidationResult {
  const rules: ValidationRule<string>[] = [
    {
      test: (value) => value.length > 0,
      message: 'Email is required'
    },
    {
      test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: 'Please enter a valid email address'
    },
    {
      test: (value) => value.length <= 254,
      message: 'Email address is too long'
    }
  ]
  
  return validate(email.trim(), rules)
}

/**
 * Password validation
 */
export function validatePassword(password: string): ValidationResult {
  const rules: ValidationRule<string>[] = [
    {
      test: (value) => value.length >= 8,
      message: 'Password must be at least 8 characters long'
    },
    {
      test: (value) => /[A-Z]/.test(value),
      message: 'Password must contain at least one uppercase letter'
    },
    {
      test: (value) => /[a-z]/.test(value),
      message: 'Password must contain at least one lowercase letter'
    },
    {
      test: (value) => /[0-9]/.test(value),
      message: 'Password must contain at least one number'
    },
    {
      test: (value) => value.length <= 128,
      message: 'Password is too long'
    }
  ]
  
  return validate(password, rules)
}

/**
 * Username validation
 */
export function validateUsername(username: string): ValidationResult {
  const cleanUsername = username.replace('@', '').trim()
  
  const rules: ValidationRule<string>[] = [
    {
      test: (value) => value.length >= 3,
      message: 'Username must be at least 3 characters long'
    },
    {
      test: (value) => value.length <= 20,
      message: 'Username must be 20 characters or less'
    },
    {
      test: (value) => /^[a-zA-Z0-9_]+$/.test(value),
      message: 'Username can only contain letters, numbers, and underscores'
    },
    {
      test: (value) => !/^[_0-9]/.test(value),
      message: 'Username cannot start with a number or underscore'
    },
    {
      test: (value) => !value.includes('__'),
      message: 'Username cannot contain consecutive underscores'
    }
  ]
  
  return validate(cleanUsername, rules)
}

/**
 * Phone number validation
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  const cleaned = phone.replace(/\D/g, '')
  
  const rules: ValidationRule<string>[] = [
    {
      test: (value) => value.length === 10 || (value.length === 11 && value[0] === '1'),
      message: 'Please enter a valid phone number'
    }
  ]
  
  return validate(cleaned, rules)
}

/**
 * Bet stake validation
 */
export function validateStake(stake: number, minStake: number = 1, maxStake: number = 10000): ValidationResult {
  const rules: ValidationRule<number>[] = [
    {
      test: (value) => !isNaN(value) && isFinite(value),
      message: 'Stake must be a valid number'
    },
    {
      test: (value) => value > 0,
      message: 'Stake must be greater than zero'
    },
    {
      test: (value) => value >= minStake,
      message: `Stake must be at least ${minStake}`
    },
    {
      test: (value) => value <= maxStake,
      message: `Stake cannot exceed ${maxStake}`
    },
    {
      test: (value) => Number.isInteger(value * 100),
      message: 'Stake can only have up to 2 decimal places'
    }
  ]
  
  return validate(stake, rules)
}

/**
 * Odds validation (American format)
 */
export function validateOdds(odds: number): ValidationResult {
  const rules: ValidationRule<number>[] = [
    {
      test: (value) => !isNaN(value) && isFinite(value),
      message: 'Odds must be a valid number'
    },
    {
      test: (value) => value !== 0,
      message: 'Odds cannot be zero'
    },
    {
      test: (value) => value >= -10000 && value <= 10000,
      message: 'Odds must be between -10000 and +10000'
    },
    {
      test: (value) => Number.isInteger(value),
      message: 'Odds must be a whole number'
    }
  ]
  
  return validate(odds, rules)
}

/**
 * Confidence level validation (1-5 scale)
 */
export function validateConfidence(confidence: number): ValidationResult {
  const rules: ValidationRule<number>[] = [
    {
      test: (value) => Number.isInteger(value),
      message: 'Confidence must be a whole number'
    },
    {
      test: (value) => value >= 1 && value <= 5,
      message: 'Confidence must be between 1 and 5'
    }
  ]
  
  return validate(confidence, rules)
}

/**
 * Units validation
 */
export function validateUnits(units: number, maxUnits: number = 10): ValidationResult {
  const rules: ValidationRule<number>[] = [
    {
      test: (value) => !isNaN(value) && isFinite(value),
      message: 'Units must be a valid number'
    },
    {
      test: (value) => value > 0,
      message: 'Units must be greater than zero'
    },
    {
      test: (value) => value <= maxUnits,
      message: `Units cannot exceed ${maxUnits}`
    },
    {
      test: (value) => Number.isInteger(value * 10),
      message: 'Units can only have up to 1 decimal place'
    }
  ]
  
  return validate(units, rules)
}

/**
 * Subscription price validation
 */
export function validatePrice(price: number, minPrice: number = 1, maxPrice: number = 200): ValidationResult {
  const rules: ValidationRule<number>[] = [
    {
      test: (value) => !isNaN(value) && isFinite(value),
      message: 'Price must be a valid number'
    },
    {
      test: (value) => value >= minPrice,
      message: `Price must be at least ${minPrice}`
    },
    {
      test: (value) => value <= maxPrice,
      message: `Price cannot exceed ${maxPrice}`
    },
    {
      test: (value) => Number.isInteger(value * 100),
      message: 'Price can only have up to 2 decimal places'
    }
  ]
  
  return validate(price, rules)
}

/**
 * Bio/description validation
 */
export function validateBio(bio: string, maxLength: number = 500): ValidationResult {
  const rules: ValidationRule<string>[] = [
    {
      test: (value) => value.length <= maxLength,
      message: `Bio must be ${maxLength} characters or less`
    },
    {
      test: (value) => !/<script|javascript:|data:/i.test(value),
      message: 'Bio contains prohibited content'
    }
  ]
  
  return validate(bio.trim(), rules)
}

/**
 * Pick title validation
 */
export function validatePickTitle(title: string): ValidationResult {
  const rules: ValidationRule<string>[] = [
    {
      test: (value) => value.length > 0,
      message: 'Pick title is required'
    },
    {
      test: (value) => value.length <= 100,
      message: 'Pick title must be 100 characters or less'
    },
    {
      test: (value) => value.trim().length >= 5,
      message: 'Pick title must be at least 5 characters'
    }
  ]
  
  return validate(title.trim(), rules)
}

/**
 * Pick analysis validation
 */
export function validatePickAnalysis(analysis: string, minLength: number = 20, maxLength: number = 1000): ValidationResult {
  const rules: ValidationRule<string>[] = [
    {
      test: (value) => value.length >= minLength,
      message: `Analysis must be at least ${minLength} characters`
    },
    {
      test: (value) => value.length <= maxLength,
      message: `Analysis must be ${maxLength} characters or less`
    },
    {
      test: (value) => !/<script|javascript:|data:/i.test(value),
      message: 'Analysis contains prohibited content'
    }
  ]
  
  return validate(analysis.trim(), rules)
}

/**
 * Game time validation (must be in future, within reasonable limits)
 */
export function validateGameTime(gameTime: Date): ValidationResult {
  const now = new Date()
  const maxFutureDate = new Date(now.getTime() + (365 * 24 * 60 * 60 * 1000)) // 1 year from now
  
  const rules: ValidationRule<Date>[] = [
    {
      test: (value) => value instanceof Date && !isNaN(value.getTime()),
      message: 'Game time must be a valid date'
    },
    {
      test: (value) => value > now,
      message: 'Game time must be in the future'
    },
    {
      test: (value) => value < maxFutureDate,
      message: 'Game time cannot be more than 1 year in the future'
    }
  ]
  
  return validate(gameTime, rules)
}

/**
 * Credit card validation (basic Luhn algorithm)
 */
export function validateCreditCard(cardNumber: string): ValidationResult {
  const cleaned = cardNumber.replace(/\D/g, '')
  
  const luhnCheck = (num: string): boolean => {
    let sum = 0
    let isEven = false
    
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i] ?? '0')
      
      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }
      
      sum += digit
      isEven = !isEven
    }
    
    return sum % 10 === 0
  }
  
  const rules: ValidationRule<string>[] = [
    {
      test: (value) => value.length >= 13 && value.length <= 19,
      message: 'Card number must be between 13 and 19 digits'
    },
    {
      test: (value) => /^\d+$/.test(value),
      message: 'Card number must contain only digits'
    },
    {
      test: (value) => luhnCheck(value),
      message: 'Invalid card number'
    }
  ]
  
  return validate(cleaned, rules)
}

/**
 * Age validation (must be 18+)
 */
export function validateAge(birthDate: Date): ValidationResult {
  const now = new Date()
  const age = Math.floor((now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
  
  const rules: ValidationRule<Date>[] = [
    {
      test: (value) => value instanceof Date && !isNaN(value.getTime()),
      message: 'Birth date must be a valid date'
    },
    {
      test: (value) => value < now,
      message: 'Birth date must be in the past'
    },
    {
      test: () => age >= 18,
      message: 'You must be at least 18 years old to use TrueSharp'
    },
    {
      test: () => age <= 120,
      message: 'Please enter a valid birth date'
    }
  ]
  
  return validate(birthDate, rules)
}

/**
 * URL validation
 */
export function validateUrl(url: string, requireHttps: boolean = false): ValidationResult {
  const rules: ValidationRule<string>[] = [
    {
      test: (value) => {
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      },
      message: 'Please enter a valid URL'
    },
    {
      test: (value) => !requireHttps || value.startsWith('https://'),
      message: 'URL must use HTTPS'
    }
  ]
  
  return validate(url.trim(), rules)
}

/**
 * File validation
 */
export function validateFile(
  file: File, 
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif'],
  maxSize: number = 5 * 1024 * 1024 // 5MB default
): ValidationResult {
  const rules: ValidationRule<File>[] = [
    {
      test: (value) => allowedTypes.includes(value.type),
      message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
    },
    {
      test: (value) => value.size <= maxSize,
      message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`
    },
    {
      test: (value) => value.size > 0,
      message: 'File appears to be empty'
    }
  ]
  
  return validate(file, rules)
}

/**
 * Combined form validation
 */
export interface FormValidationConfig {
  [fieldName: string]: {
    value: unknown
    rules: ValidationRule<unknown>[]
    required?: boolean
  }
}

export function validateForm(config: FormValidationConfig): {
  isValid: boolean
  errors: { [fieldName: string]: string[] }
  firstError?: string
} {
  const errors: { [fieldName: string]: string[] } = {}
  let firstError: string | undefined
  
  for (const [fieldName, fieldConfig] of Object.entries(config)) {
    const { value, rules, required = true } = fieldConfig
    
    // Check if required field is empty
    if (required && (value === '' || value === null || value === undefined)) {
      errors[fieldName] = ['This field is required']
      if (!firstError) firstError = 'This field is required'
      continue
    }
    
    // Skip validation if optional field is empty
    if (!required && (value === '' || value === null || value === undefined)) {
      continue
    }
    
    // Run validation rules
    const result = validate(value, rules)
    if (!result.isValid) {
      errors[fieldName] = result.errors
      if (!firstError) firstError = result.errors[0]
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    ...(firstError !== undefined ? { firstError } : {})
  }
}

/**
 * Real-time validation debouncer
 */
export function createValidator<T>(
  validationFn: (value: T) => ValidationResult,
  debounceMs: number = 300
) {
  let timeout: NodeJS.Timeout
  
  return (value: T, callback: (result: ValidationResult) => void) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      const result = validationFn(value)
      callback(result)
    }, debounceMs)
  }
}
