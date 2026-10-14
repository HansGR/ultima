import { HelperText, Input, Switch } from "@ff6wc/ui";
import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { InputLabel } from "~/components/InputLabel/InputLabel";
import { setFlag, useFlagValueSelector } from "~/state/flagSlice";
import { useNumberScroll } from "~/utils/useNumberScroll";

const FLAG = "-lc";

// bounds enforced by WorldsCollide's -lc (args/xpmpgp.py)
const HARD = { min: 3, max: 98 };
const MEAN = { min: 1, max: 99 };
const WIDTH = { min: 0.1, max: 99 };
const DEFAULT_CAP = 43;
const DEFAULT_WIDTH = 5;

// the last soft-cap width, so switching hard -> soft restores it; kept outside
// the component because changing tabs remounts the card
let rememberedWidth = DEFAULT_WIDTH;

type NumberBoxProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  /** 1 for whole numbers, 0.1 for one decimal place */
  step: number;
  onCommit: (value: number) => void;
};

/**
 * A number box that keeps typed text as a draft and writes the flag only
 * once the text is a valid value in bounds; blur or Enter commits it clamped,
 * so partial input ("4" on the way to "43", an empty box) never reaches the
 * flag string.
 */
const NumberBox = ({ label, value, min, max, step, onCommit }: NumberBoxProps) => {
  const ref = useRef<HTMLInputElement>(null);
  useNumberScroll(ref);
  const [draft, setDraft] = useState<string | null>(null);

  const round = (val: number) => Math.round(val / step) * step;
  const clamp = (val: number) =>
    Number(Math.min(max, Math.max(min, round(val))).toFixed(step < 1 ? 1 : 0));

  const isValid = (text: string) => {
    const parsed = Number(text);
    return (
      text.trim() !== "" &&
      Number.isFinite(parsed) &&
      Math.abs(round(parsed) - parsed) < 1e-9 &&
      parsed >= min &&
      parsed <= max
    );
  };

  const onType = (text: string) => {
    setDraft(text);
    if (isValid(text)) {
      onCommit(clamp(Number(text)));
    }
  };

  const onBlur = () => {
    const text = draft;
    setDraft(null);
    // empty or unparseable input reverts to the stored value
    if (text === null || text.trim() === "" || !Number.isFinite(Number(text))) {
      return;
    }
    onCommit(clamp(Number(text)));
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm">{label}</span>
      <Input
        className={"max-w-[72px] text-center"}
        ref={ref}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onType(e.target.value)}
        onBlur={onBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          }
        }}
        type="number"
        value={draft ?? value}
      />
    </div>
  );
};

/**
 * Level cap (-lc): off, a hard cap (`-lc LEVEL`, characters stop gaining
 * experience at LEVEL) or a soft cap (`-lc MEAN WIDTH`, experience to the
 * next level multiplied by 1 + 10^((level - MEAN) / WIDTH)). The flag's value
 * says which: unset, one number, or two numbers.
 */
export const FlagLevelCap = () => {
  const dispatch = useDispatch();
  const raw = useFlagValueSelector<number | number[]>(FLAG);
  const stl = useFlagValueSelector<number>("-stl");
  const stlr = useFlagValueSelector<number[]>("-stlr");

  const soft = Array.isArray(raw) && raw.length === 2;
  const enabled = soft || typeof raw === "number";
  const cap = soft ? (raw as number[])[0] : (raw as number) ?? DEFAULT_CAP;
  const width = soft ? (raw as number[])[1] : DEFAULT_WIDTH;

  // the highest level a character can start at; a hard cap below it is
  // rejected by the generator
  const startLevel =
    Array.isArray(stlr) && stlr.length === 2
      ? Math.max(stlr[0], stlr[1])
      : typeof stl === "number"
        ? stl
        : 3;

  useEffect(() => {
    if (soft) {
      rememberedWidth = width;
    }
  }, [soft, width]);

  const write = (value: number | number[] | null) =>
    dispatch(setFlag({ flag: FLAG, value }));
  const hardCap = (level: number) =>
    Math.min(HARD.max, Math.max(HARD.min, startLevel, Math.round(level)));

  const onToggle = (on: boolean) => write(on ? hardCap(DEFAULT_CAP) : null);
  const onMode = (toSoft: boolean) =>
    write(
      toSoft
        ? [Math.min(MEAN.max, Math.max(MEAN.min, cap)), rememberedWidth]
        : hardCap(cap),
    );

  const belowStart = enabled && !soft && cap < startLevel;
  const description = !enabled
    ? "Characters can reach level 99"
    : soft
      ? `Experience to the next level doubles at level ${cap}, and the extra cost grows tenfold every ${width} level${width === 1 ? "" : "s"} after that`
      : `Characters stop gaining experience at level ${cap}`;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <div
          className={"flex items-center gap-4 flex-shrink cursor-pointer w-fit"}
          onClick={() => onToggle(!enabled)}
        >
          <div className="flex-shrink-0 flex items-center">
            <Switch checked={enabled} onChange={(val) => onToggle(val)} />
          </div>
          <InputLabel
            className={"cursor-pointer"}
            flag={FLAG}
            htmlFor={FLAG}
            onClick={() => onToggle(!enabled)}
          >
            Level Cap
          </InputLabel>
        </div>
        <HelperText>{description}</HelperText>
        {belowStart && (
          <span className="text-xs font-medium text-red-500 dark:text-red-400">
            A hard cap below the starting level ({startLevel}) cannot be
            generated: raise the cap or lower the starting level.
          </span>
        )}
      </div>

      {enabled && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pl-12">
          <div className="flex items-center gap-2 text-sm">
            <span
              className={`cursor-pointer ${soft ? "" : "font-semibold"}`}
              onClick={() => onMode(false)}
            >
              Hard
            </span>
            <Switch
              checked={soft}
              description="Soft level cap"
              onChange={(val) => onMode(val)}
            />
            <span
              className={`cursor-pointer ${soft ? "font-semibold" : ""}`}
              onClick={() => onMode(true)}
            >
              Soft
            </span>
          </div>
          <NumberBox
            label="Cap"
            value={cap}
            min={soft ? MEAN.min : Math.max(HARD.min, startLevel)}
            max={soft ? MEAN.max : HARD.max}
            step={1}
            onCommit={(val) => write(soft ? [val, width] : val)}
          />
          {soft && (
            <NumberBox
              label="Width"
              value={width}
              min={WIDTH.min}
              max={WIDTH.max}
              step={0.1}
              onCommit={(val) => write([cap, val])}
            />
          )}
        </div>
      )}
    </div>
  );
};
