import { Input, Slider } from "@ff6wc/ui";
import { useEffect, useRef, useState } from "react";
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
  const defaultValue = typeof schemaDefault === "number" ? schemaDefault : min;

  const value: [number, number] =
    Array.isArray(range) && range.length === 2
      ? [range[0], range[1]]
      : typeof single === "number"
        ? [single, single]
        : [defaultValue, defaultValue];

  // text typed into the number boxes that has not been committed yet;
  // null means the box shows the stored value
  const [drafts, setDrafts] = useState<[string | null, string | null]>([
    null,
    null,
  ]);

  const clamp = (val: number) =>
    Math.min(max, Math.max(min, Math.round(val / step) * step));

  /** writes `[low, high]` clamped and sorted, as the single or range flag */
  const commit = ([low, high]: number[]) => {
    const [a, b] = [clamp(low), clamp(high)].sort((x, y) => x - y);
    if (a === b) {
      dispatch(setFlag({ flag: rangeFlag, value: null }));
      dispatch(setFlag({ flag: singleFlag, value: a }));
    } else {
      dispatch(setFlag({ flag: singleFlag, value: null }));
      dispatch(setFlag({ flag: rangeFlag, value: [a, b] }));
    }
  };

  // a pasted flag string or preset can hold both flags, a reversed or equal
  // range, or levels out of bounds; rewrite it the way the slider would
  useEffect(() => {
    if (!Array.isArray(range) || range.length !== 2) {
      return;
    }
    const [low, high] = range;
    if (single != null || low >= high || low < min || high > max) {
      commit(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, single, min, max]);

  /** a whole number inside the bounds, or null for partial/invalid input */
  const parseDraft = (text: string) => {
    const parsed = Number(text);
    return text.trim() !== "" &&
      Number.isInteger(parsed) &&
      parsed >= min &&
      parsed <= max
      ? parsed
      : null;
  };

  const onType = (index: 0 | 1, text: string) => {
    setDrafts((prev) => (index === 0 ? [text, prev[1]] : [prev[0], text]));
    // update the slider live only while the typed value is valid and keeps
    // the ends in order; anything else waits for blur so that typing "25"
    // does not write "2" first, and a reversed range does not swap the boxes
    const parsed = parseDraft(text);
    if (parsed === null) {
      return;
    }
    const next: [number, number] =
      index === 0 ? [parsed, value[1]] : [value[0], parsed];
    if (next[0] <= next[1]) {
      commit(next);
    }
  };

  const onBlur = (index: 0 | 1) => {
    const text = drafts[index];
    setDrafts((prev) => (index === 0 ? [null, prev[1]] : [prev[0], null]));
    if (text === null) {
      return;
    }
    const parsed = Number(text);
    // empty or unparseable input reverts to the stored value
    if (text.trim() === "" || !Number.isFinite(parsed)) {
      return;
    }
    commit(index === 0 ? [parsed, value[1]] : [value[0], parsed]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

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
            onChange={(e) => onType(0, e.target.value)}
            onBlur={() => onBlur(0)}
            onKeyDown={onKeyDown}
            type="number"
            value={drafts[0] ?? value[0]}
          />
          <span className={"flex-shrink font-semibold"}>-</span>
          <Input
            className={"max-w-[64px] text-center"}
            ref={maxRef}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onType(1, e.target.value)}
            onBlur={() => onBlur(1)}
            onKeyDown={onKeyDown}
            type="number"
            value={drafts[1] ?? value[1]}
          />
        </div>
      </div>
      <div>
        <Slider
          min={min}
          max={max}
          step={step}
          onChange={(val) => commit(val as number[])}
          range
          value={value}
        />
      </div>
    </div>
  );
};
