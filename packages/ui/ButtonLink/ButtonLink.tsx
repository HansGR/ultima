import { Link } from "../Link/Link";
import { montserrat } from "@ff6wc/utils/fonts";
import { buttonStyles, ButtonProps } from "../Button/Button";

export const ButtonLink = ({
  children,
  className,
  href,
  variant,
}: {
  children: React.ReactNode;
  className?: string;
  href: string;
  variant?: ButtonProps["variant"];
}) => {
  return (
    <Link
      color="inherit"
      className={buttonStyles({
        className: `${montserrat.className} ${
          className ?? ""
        } inline-flex flex-row items-center justify-center gap-2 text-lg font-extrabold`,
        disabled: false,
        variant,
      })}
      href={href}
    >
      {children}
    </Link>
  );
};
