import { cx } from "cva";
import styles from "./Button.module.css";

type BaseButtonProps = React.DetailedHTMLProps<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export const buttonStyles = ({
  disabled,
  size = "default",
  variant = "default",
  className,
}: {
  disabled?: boolean | null;
  size?: "default" | "small" | "smallest" | null;
  variant?: "default" | "primary" | "danger" | "discord" | "outline" | null;
  className?: string | null;
}) => {
  return cx(
    styles.button,
    disabled ? styles.disabled : undefined,
    size === "default" ? styles.sizeDefault : undefined,
    size === "small" ? styles.sizeSmall : undefined,
    size === "smallest" ? styles.sizeSmallest : undefined,
    variant === "default" ? styles.variantDefault : undefined,
    variant === "primary" ? styles.variantPrimary : undefined,
    variant === "danger" ? styles.variantDanger : undefined,
    variant === "discord" ? styles.variantDiscord : undefined,
    variant === "outline" ? styles.variantOutline : undefined,
    className ?? undefined,
  );
};

export type ButtonProps = BaseButtonProps & {
  children: React.ReactNode;
  size?: "default" | "small" | "smallest";
  variant?: "default" | "primary" | "danger" | "discord" | "outline";
};

export const Button = ({
  children,
  className,
  disabled,
  size,
  variant,
  ...props
}: ButtonProps) => {
  return (
    <button
      {...props}
      className={buttonStyles({ disabled, size, variant, className })}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
