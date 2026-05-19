import { cx } from "cva";
import React from "react";
import styles from "./Card.module.css";

export type CardProps = Omit<
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
  "title"
> & {
  contentClassName?: string;
  prependedComponent?: React.ReactNode;
  title: React.ReactNode | JSX.Element;
  variant?: "default" | "primary";
};

export const Card = ({
  children,
  className,
  contentClassName,
  prependedComponent,
  title,
  variant = "default",
  ...rest
}: CardProps) => {
  return (
    <div className={cx(styles.card, className, "WC-Card")}>
      <div
        className={cx(
          styles.heading,
          variant === "primary" ? styles.headingPrimary : undefined,
        )}
      >
        {title}
      </div>
      {prependedComponent ? <>{prependedComponent}</> : null}
      <div className={cx(styles.content, contentClassName)} {...rest}>
        {children}
      </div>
    </div>
  );
};
