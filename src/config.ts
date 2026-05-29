// Configuration file for Condify
// All hardcoded values that should be configurable for clients are defined here

export const CONFIG = {
  // Condominium start date (when the condominium began operations)
  // This affects payment calculations and date ranges
  CONDOMINIUM_START_DATE: new Date(2025, 5, 1), // June 1, 2025 (month is 0-indexed)
  
  // Available fractions in the condominium
  // These are the fraction letters/identifiers that users can be assigned to
  FRACTIONS: ['A', 'B', 'C', 'D', 'E', 'F'],
  
  // Default fraction for new users
  DEFAULT_FRACTION: 'N/A',
  
  // Currency configuration
  CURRENCY: {
    CODE: 'EUR',
    LOCALE: 'pt-PT',
    SYMBOL: '€'
  },
  
  // Date range for year selection dropdowns
  YEAR_RANGE: {
    START: 2025,
    YEARS_AHEAD: 10 // How many years ahead to show in dropdowns
  },
  
  // Polling intervals for real-time updates (in milliseconds)
  POLLING: {
    PAYMENT_PROOFS: 5000, // 5 seconds
    BUDGET_ITEMS: 5000,   // 5 seconds
    USERS: 5000          // 5 seconds
  },
  
  // File upload limits
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  },
  
  // App branding
  BRANDING: {
    NAME: 'Condify',
    DESCRIPTION: 'Sistema de Gestão de Condomínio'
  }
} as const

// Helper functions for common operations
export const getYearRange = () => {
  const currentYear = new Date().getFullYear()
  const startYear = Math.max(CONFIG.CONDOMINIUM_START_DATE.getFullYear(), currentYear - 1)
  return Array.from(
    { length: CONFIG.YEAR_RANGE.YEARS_AHEAD }, 
    (_, i) => startYear + i
  )
}

export const formatCurrency = (amount: number) => {
  return amount.toLocaleString(CONFIG.CURRENCY.LOCALE, {
    style: 'currency',
    currency: CONFIG.CURRENCY.CODE
  })
}

export const isValidFraction = (fraction: string) => {
  return CONFIG.FRACTIONS.includes(fraction.toUpperCase() as typeof CONFIG.FRACTIONS[number])
} 