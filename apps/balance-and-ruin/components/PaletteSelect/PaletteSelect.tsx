import { useId } from "react";
import { PaletteSwatch } from "~/components/PaletteSwatch/PaletteSwatch";
import { Select } from "~/components/Select/Select";

export type PaletteSelectOption = {
  readonly value: string;
  readonly label: string;
  readonly color?: number[][];
  readonly isDisabled?: boolean;
};

type SelectProps = {
  onChange: (selected: PaletteSelectOption | null) => void;
  options: PaletteSelectOption[];
  value: PaletteSelectOption;
};

const PaletteSelect = ({ options, onChange, value }: SelectProps) => {
  const id = useId();

  return (
    <div className="flex flex-col gap-1 flex-grow">
      <Select
        nextOnArrowKeys
        options={options}
        onChange={(val) => {
          onChange(val as PaletteSelectOption);
        }}
        value={value}
        renderOption={(opt: PaletteSelectOption) => (
          <div className="flex flex-col justify-center gap-2">
            <span className="block truncate font-medium">{opt.label}</span>
            <div>
              <PaletteSwatch colors={opt.color as number[][]} />
            </div>
          </div>
        )}
      />
    </div>
  );
};

export default PaletteSelect;
