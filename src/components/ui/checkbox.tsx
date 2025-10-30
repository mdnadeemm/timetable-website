import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "../../lib/utils"

interface CheckboxProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked = false, onCheckedChange, disabled = false, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "inline-flex items-center justify-center rounded border border-gray-300 w-4 h-4",
          "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          checked 
            ? "bg-blue-600 border-blue-600 text-white" 
            : "bg-white border-gray-300",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        {...props}
      >
        {checked && <Check className="h-3 w-3" />}
      </button>
    )
  }
)
Checkbox.displayName = "Checkbox"
