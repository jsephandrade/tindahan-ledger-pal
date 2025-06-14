
import React from 'react';
import { cn } from '@/lib/utils';

interface MobileFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

interface MobileFormStepProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

interface MobileFormFieldProps {
  children: React.ReactNode;
  label?: string;
  error?: string;
  required?: boolean;
  className?: string;
}

interface MobileFormActionsProps {
  children: React.ReactNode;
  className?: string;
}

const MobileForm = React.forwardRef<HTMLFormElement, MobileFormProps>(
  ({ className, children, ...props }, ref) => (
    <form
      ref={ref}
      className={cn("mobile-form-spacing w-full max-w-md mx-auto", className)}
      {...props}
    >
      {children}
    </form>
  )
);
MobileForm.displayName = "MobileForm";

const MobileFormStep = ({ children, title, description, className }: MobileFormStepProps) => (
  <div className={cn("space-y-4", className)}>
    {(title || description) && (
      <div className="text-center space-y-2">
        {title && <h2 className="mobile-title">{title}</h2>}
        {description && <p className="mobile-subtitle">{description}</p>}
      </div>
    )}
    {children}
  </div>
);

const MobileFormField = ({ children, label, error, required, className }: MobileFormFieldProps) => (
  <div className={cn("space-y-2", className)}>
    {label && (
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
    )}
    {children}
    {error && (
      <p className="text-sm text-destructive">{error}</p>
    )}
  </div>
);

const MobileFormActions = ({ children, className }: MobileFormActionsProps) => (
  <div className={cn("mobile-button-group pt-4", className)}>
    {children}
  </div>
);

export { MobileForm, MobileFormStep, MobileFormField, MobileFormActions };
