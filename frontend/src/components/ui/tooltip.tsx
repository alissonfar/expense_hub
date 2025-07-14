"use client";
import * as React from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";

export const TooltipProvider = RadixTooltip.Provider;
export const TooltipRoot = RadixTooltip.Root;
export const TooltipTrigger = RadixTooltip.Trigger;
export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof RadixTooltip.Content>,
  React.ComponentPropsWithoutRef<typeof RadixTooltip.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <RadixTooltip.Content
    ref={ref}
    sideOffset={sideOffset}
    className={
      "z-50 overflow-hidden rounded-md bg-black px-3 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 data-[state=delayed-open]:fade-in-100" +
      (className ? ` ${className}` : "")
    }
    {...props}
  />
));
TooltipContent.displayName = RadixTooltip.Content.displayName;

export function Tooltip({ children, ...props }: RadixTooltip.TooltipProps) {
  return <RadixTooltip.Root {...props}>{children}</RadixTooltip.Root>;
} 