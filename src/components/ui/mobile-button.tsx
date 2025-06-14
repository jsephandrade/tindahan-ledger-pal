
import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileButtonProps extends ButtonProps {
  touchFriendly?: boolean;
  fullWidth?: boolean;
}

const MobileButton = React.forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ className, touchFriendly = true, fullWidth = false, ...props }, ref) => {
    return (
      <Button
        className={cn(
          touchFriendly && "btn-touch",
          fullWidth && "w-full",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
MobileButton.displayName = "MobileButton";

export { MobileButton, type MobileButtonProps };
