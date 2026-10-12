import { Input, Slider } from "@ff6wc/ui";
import { useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FlagLabel } from "~/components/FlagLabel/FlagLabel";
import { setFlag, useFlagValueSelector } from "~/state/flagSlice";
import {
  selectDefaultValue,
  selectMax,
  selectMin,
  selectStep,
} from "~/state/schemaSlice";
import { useNumberScroll } from "~/utils/useNumberScroll";

export type FlagSingleOrRangeProps = {
  /** flag written when both ends are equal, e.g. `-stl LEVEL` */
  singleFlag: string;
  /** flag written when the ends differ, e.g. `-stlr MIN MAX` */
  rangeFlag: string;
  label: React.ReactNode;
  singleHelperText: (value: number) => React.ReactNode;
  rangeHelperText: (min: number, max: number) => React.ReactNode;
};

/**
 * One range slider driving two mutually exclusive flags: equal ends write
 * `singleFlag value` (and clear `rangeFlag`), different ends write
 * `rangeFlag min max` (and clear `singleFlag`). Reads back from whichever of
 * the two is set, so pasted flag strings and presets display correctly.
 */
export const FlagSingleOrRange = ({
  singleFlag,
  rangeFlag,
  label,
  singleHelperText,
  rangeHelperText,
}: FlagSingleOrRangeProps) => {
  const minRef = useRef<HTMLInputElement>(null);
  const maxRef = useRef<HTMLInputElement>(null);
  useNumberScroll(minRef);
  useNumberScroll(maxRef);
  const dispatch = useDispatch();

  const single = useFlagValueSelector<number>(singleFlag);
  const range = useFlagValueSelector<number[]>(rangeFlag);

  // bounds come from the single flag's schema (the range flag shares them);
  // every selector runs on every render (no short-circuited hooks)
  const singleMin = useSelector(selectMin(singleFlag));
  const rangeMin = useSelector(selectMin(rangeFlag));
  const singleMax = useSelector(selectMax(singleFlag));
  const rangeMax = useSelector(selectMax(rangeFlag));
  const singleStep = useSelector(selectStep(singleFlag));
  const schemaDefault = useSelector(selectDefaultValue(singleFlag));
  const min = (singleMin ?? rangeMin ?? 0) as number;
  const max = (singleMax ?? rangeMax ?? 100) as number;
  const step = (singleStep || 1) as number;
  const defaultValue =
    typeof schemaDefault === "number" ? schemaDefault : (min as number);

  const value: [number, number] =
    Array.isArray(range) && range.length === 2
      ? [range[0], range[1]]
      : typeof single === "number"
        ? [single, single]
        : [defaultValue, defaultValue];

  const onChange = ([low, high]: number[]) => {
    if (low === high) {
      dispatch(setFlag({ flag: rangeFlag, value: null }));
      dispatch(setFlag({ flag: singleFlag, value: low }));
    } else {
      dispatch(setFlag({ flag: singleFlag, value: null }));
      dispatch(setFlag({ flag: rangeFlag, value: [low, high] }));
    }
  };

  const parseValue = (val: string | number) =>
    Number.parseFloat((val || "0").toString());

  const isRange = value[0] !== value[1];
  const helperText = isRange
    ? rangeHelperText(Math.min(...value), Math.max(...value))
    : singleHelperText(value[0]);

  return (
    <div className={"flex flex-col gap-2"}>
      <div className={"flex justify-between items-center gap-3"}>
        <div className="w-full">
          <FlagLabel
            flag={isRange ? rangeFlag : singleFlag}
            helperText={helperText}
            label={label}
            // reserve room for the longer of the two descriptions so the
            // card does not jump when switching between them
            ghosts={[singleHelperText(max), rangeHelperText(max, max)]}
          />
        </div>
        <div className={"flex items-center justify-center flex-shrink-0 gap-1"}>
          <Input
            className={"max-w-[64px] text-center"}
            ref={minRef}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange([parseValue(e.target.value), value[1]])}
            type="number"
            value={value[0]}
          />
          <span className={"flex-shrink font-semibold"}>-</span>
          <Input
            className={"max-w-[64px] text-center"}
            ref={maxRef}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange([value[0], parseValue(e.target.value)])}
            type="number"
            value={value[1]}
          />
        </div>
      </div>
      <div>
        <Slider
          min={min}
          max={max}
          step={step}
          onChange={(val) => onChange(val as number[])}
          range
          value={value}
        />
      </div>
    </div>
  );
};
