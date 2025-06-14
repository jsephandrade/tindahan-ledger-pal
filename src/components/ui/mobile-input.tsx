
import React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface MobileInputProps extends React.ComponentProps<typeof Input> {
  touchFriendly?: boolean;
}

const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, touchFriendly = true, type, ...props }, ref) => {
    return (
      <Input
        type={type}
        className={cn(
          touchFriendly && "input-touch",
          "text-base", // Prevent zoom on iOS
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
MobileInput.displayName = "MobileInput";

export { MobileInput };
