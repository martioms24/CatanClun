import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="font-cinzel text-sm font-semibold text-medieval-dark"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-medieval-stone">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-medieval border-2 border-medieval-brown/40 bg-parchment-light",
              "px-4 py-3 text-medieval-dark font-garamond text-base",
              "placeholder:text-medieval-stone/60",
              "focus:outline-none focus:border-medieval-gold focus:ring-2 focus:ring-medieval-gold/20",
              "transition-colors",
              icon && "pl-10",
              error && "border-medieval-burgundy",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-medieval-burgundy text-sm font-garamond">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="font-cinzel text-sm font-semibold text-medieval-dark"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "w-full rounded-medieval border-2 border-medieval-brown/40 bg-parchment-light",
            "px-4 py-3 text-medieval-dark font-garamond text-base",
            "placeholder:text-medieval-stone/60",
            "focus:outline-none focus:border-medieval-gold focus:ring-2 focus:ring-medieval-gold/20",
            "transition-colors resize-none",
            error && "border-medieval-burgundy",
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-medieval-burgundy text-sm font-garamond">{error}</p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
