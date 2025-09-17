/**
 * Toast utility untuk notifikasi
 * Mengikuti prinsip SOLID dan DRY
 */

/**
 * Interface untuk toast options
 */
export interface ToastOptions {
  duration?: number
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
  style?: React.CSSProperties
}

/**
 * Simple toast implementation
 * Dapat diganti dengan library toast yang lebih advanced
 */
class ToastManager {
  private toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }> = []
  private listeners: Array<(toasts: typeof this.toasts) => void> = []

  /**
   * Subscribe to toast changes
   */
  subscribe(listener: (toasts: typeof this.toasts) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Notify all listeners
   */
  private notify() {
    this.listeners.forEach(listener => listener([...this.toasts]))
  }

  /**
   * Add toast
   */
  private addToast(message: string, type: 'success' | 'error' | 'info' | 'warning', options?: ToastOptions) {
    const id = Math.random().toString(36).substr(2, 9)
    const toast = { id, message, type }
    
    this.toasts.push(toast)
    this.notify()

    // Auto remove after duration
    setTimeout(() => {
      this.removeToast(id)
    }, options?.duration || 3000)

    return id
  }

  /**
   * Remove toast
   */
  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id)
    this.notify()
  }

  /**
   * Success toast
   */
  success(message: string, options?: ToastOptions) {
    return this.addToast(message, 'success', options)
  }

  /**
   * Error toast
   */
  error(message: string, options?: ToastOptions) {
    return this.addToast(message, 'error', options)
  }

  /**
   * Info toast
   */
  info(message: string, options?: ToastOptions) {
    return this.addToast(message, 'info', options)
  }

  /**
   * Warning toast
   */
  warning(message: string, options?: ToastOptions) {
    return this.addToast(message, 'warning', options)
  }

  /**
   * Clear all toasts
   */
  clear() {
    this.toasts = []
    this.notify()
  }
}

// Export singleton instance
export const toast = new ToastManager()

// Export default for compatibility
export default toast