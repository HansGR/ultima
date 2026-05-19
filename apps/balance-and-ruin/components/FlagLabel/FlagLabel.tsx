import { InputLabel } from "~/components/InputLabel/InputLabel";
import { HelperText } from "@ff6wc/ui";

export type FlagLabelProps = {
  helperText: React.ReactNode;
  flag: string;
  label: React.ReactNode;
  hideFlag?: boolean;
};

export const FlagLabel = ({
  helperText,
  flag,
  label,
  hideFlag,
}: FlagLabelProps) => {
  return (
    <div className="flex-grow wrap">
      <InputLabel flag={flag} htmlFor={flag} hideFlag={hideFlag}>
        {label}
      </InputLabel>
      <HelperText>{helperText}</HelperText>
    </div>
  );
};
