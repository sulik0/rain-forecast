import { cn } from '@/lib/utils'
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
}

const colorMap = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-primary-light',
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type]
        return (
          <div
            key={toast.id}
            className={cn(
              'toast',
              toast.type === 'success' && 'toast-success',
              toast.type === 'warning' && 'toast-warning',
              toast.type === 'danger' && 'toast-danger'
            )}
          >
            <Icon className={cn('w-5 h-5', colorMap[toast.type])} />
            <span className="text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
