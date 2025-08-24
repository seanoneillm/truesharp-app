interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: 'Email is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }

  return { isValid: true }
}

export function validateUsername(username: string): ValidationResult {
  if (!username) {
    return { isValid: false, error: 'Username is required' }
  }

  if (username.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long' }
  }

  if (username.length > 20) {
    return { isValid: false, error: 'Username must be no more than 20 characters long' }
  }

  const usernameRegex = /^[a-zA-Z0-9]+$/
  if (!usernameRegex.test(username)) {
    return { isValid: false, error: 'Username can only contain letters and numbers' }
  }

  return { isValid: true }
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: 'Password is required' }
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' }
  }

  const hasUpperCase = /[A-Z]/.test(password)
  const hasLowerCase = /[a-z]/.test(password)
  const hasNumbers = /\d/.test(password)
  const hasNonalphas = /\W/.test(password)

  const criteriaMet = [hasUpperCase, hasLowerCase, hasNumbers, hasNonalphas].filter(Boolean).length

  if (criteriaMet < 3) {
    return { 
      isValid: false, 
      error: 'Password must contain at least 3 of the following: uppercase letter, lowercase letter, number, or special character' 
    }
  }

  return { isValid: true }
}
