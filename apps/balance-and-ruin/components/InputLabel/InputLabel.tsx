import { useContext } from "react";
import { useSelector } from "react-redux";
import { selectShowFlags } from "~/state/settingsSlice";
import { EMPTY_FLAG_VALUE } from "~/state/flagSlice";
import { FlagSubflagContext } from "~/components/FlagSubflagSelect/FlagSubflagContext";

export type InputLabelProps = {
  children: React.ReactNode;
  /** name of input */
  htmlFor: string;
  flag?: string;
  hideFlag?: boolean;
} & React.DetailedHTMLProps<
  React.LabelHTMLAttributes<HTMLLabelElement>,
  HTMLLabelElement
>;

export const InputLabel = ({
  children,
  htmlFor,
  flag,
  hideFlag = false,
  ...rest
}: InputLabelProps) => {
  const showFlags = useSelector(selectShowFlags);
  const isInSubflagSelect = useContext(FlagSubflagContext);
  const hasValidFlag = flag && flag !== EMPTY_FLAG_VALUE;

  return (
    <h4 className="text-sm font-medium flex items-baseline w-full">
      <label
        {...rest}
        className={`w-full ${rest.className ?? ""}`}
        htmlFor={htmlFor}
      >
        {children}
        {showFlags && hasValidFlag && !hideFlag && !isInSubflagSelect && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-normal ml-1">
            ({flag})
          </span>
        )}
      </label>
    </h4>
  );
};
