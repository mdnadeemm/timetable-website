import React, { createContext, useContext, useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'destructive' | 'success'
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { ...toast, id }])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeToast(id)
    }, 5000)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

const ToastComponent: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const variantStyles = {
    default: 'bg-background border-border text-foreground',
    destructive: 'bg-destructive border-destructive text-destructive-foreground',
    success: 'bg-green-500 border-green-500 text-white'
  }

  return (
    <div className={`${variantStyles[toast.variant || 'default']} border rounded-lg p-4 shadow-lg max-w-sm animate-in slide-in-from-right-full duration-300`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{toast.title}</h4>
          {toast.description && (
            <p className="text-sm opacity-90 mt-1">{toast.description}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="ml-2 h-6 w-6">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}

/* eslint-disable react-refresh/only-export-components */
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}
