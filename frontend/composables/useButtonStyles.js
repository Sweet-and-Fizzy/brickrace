export const useButtonStyles = () => {
  const getButtonClass = (variant = 'primary', size = 'medium') => {
    const baseClasses =
      'relative inline-flex items-center justify-center font-semibold transition-all duration-200'

    const sizeClasses = {
      small: 'px-4 py-2 text-sm',
      medium: 'px-6 py-3 text-base',
      large: 'px-8 py-4 text-lg'
    }

    const variantClasses = {
      primary: 'bg-black text-white hover:bg-gray-800',
      secondary: 'bg-transparent text-black border-2 border-black hover:bg-black hover:text-white',
      'brand-blue': 'bg-brand-blue text-white hover:opacity-90',
      'brand-green': 'bg-brand-green text-white hover:opacity-90',
      'brand-gold': 'bg-brand-gold text-black hover:opacity-90'
    }

    return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} skew-button`
  }

  return {
    getButtonClass
  }
}
