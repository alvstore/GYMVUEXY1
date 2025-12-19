export class ValidationHelper {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/
    return phoneRegex.test(phone)
  }

  static validateIdProof(idType: string, idNumber: string): boolean {
    switch (idType.toUpperCase()) {
      case 'AADHAAR':
        return /^\d{12}$/.test(idNumber.replace(/\s/g, ''))
      case 'PAN':
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(idNumber.toUpperCase())
      case 'PASSPORT':
        return /^[A-Z][0-9]{7}$/.test(idNumber.toUpperCase())
      case 'DL':
      case 'DRIVING_LICENSE':
        return idNumber.length >= 8 && idNumber.length <= 16
      default:
        return idNumber.length >= 5
    }
  }

  static maskIdProof(idNumber: string): string {
    if (idNumber.length <= 4) return '****'
    const visible = idNumber.slice(-4)
    const masked = '*'.repeat(idNumber.length - 4)
    return masked + visible
  }

  static validateCouponCode(code: string): boolean {
    return /^[A-Z0-9]{4,20}$/.test(code.toUpperCase())
  }

  static validatePercentage(value: number): boolean {
    return value >= 0 && value <= 100
  }

  static validateAmount(value: number): boolean {
    return value >= 0 && Number.isFinite(value)
  }
}
