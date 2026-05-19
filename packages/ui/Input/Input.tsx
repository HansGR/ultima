import { cva, cx } from "cva";
import React from "react";

export type InputProps = React.DetailedHTMLProps<
  React.InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

const styles = cva("", {
  variants: {
    variant: {
      default: [
        "focus-visible:shadow-input-focus focus-visible:border-blue-400 focus-visible:outline-none",
        "border-inputs-border border-1 rounded",
        "bg-white text-black",
        "px-2 py-1",
        "text-sm",
      ],
    },
    disabled: {
      true: "select-none opacity-60 text-gray-500 dark:text-gray-200",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, disabled, ...rest }: InputProps, ref) => {
    return (
      <input
        {...rest}
        className={cx(styles({ disabled }), className)}
        disabled={disabled}
        ref={ref}
      />
    );
  },
);

Input.displayName = "Input";
