import {
  DEFAULT_COMMANDS,
  NONE,
  CommandOption,
  RANDOM_OPTION,
  RANDOM_UNIQUE_OPTION,
  NONE_OPTION,
  ALL_COMMANDS,
  RANDOM_UNIQUE,
  RANDOM,
  FIGHT,
  MORPH,
  LEAP,
} from "@ff6wc/ff6-types";
import { Button, Card } from "@ff6wc/ui";
import orderBy from "lodash/orderBy";
import padStart from "lodash/padStart";
import sample from "lodash/sample";
import uniq from "lodash/uniq";
import { useDispatch } from "react-redux";
import { CardColumn } from "~/components/CardColumn/CardColumn";
import { FlagSwitch } from "~/components/FlagSwitch/FlagSwitch";
import { InputLabel } from "~/components/InputLabel/InputLabel";
import {
  Select as CustomSelect,
  SelectOption,
} from "~/components/Select/Select";
import { setFlag, useFlagValueSelector } from "~/state/flagSlice";
import PortraitDrawLoad from "~/components/PortraitDrawLoad/PortraitDrawLoad";
import {
  defaultCharacterNameString,
  defaultPortraitString,
} from "~/constants/graphicConstants";

const valToStr = (val: number) => padStart(val.toString(), 2, "0");
const strToVals = (val: string) => val.match(/.{1,2}/g) as string[];

const alwaysExclude = [LEAP, MORPH];
const uniqueOptionIds = [MORPH];
const characterSpecificOptions: Record<number, number[]> = {
  /** Force leap only into the 12th spot */
  12: [LEAP],
};

const originalCommandFlags = DEFAULT_COMMANDS.map(valToStr).join("");

const LABELS = [
  "Terra (Morph)",
  "Locke (Steal)",
  "Cyan (SwdTech)",
  "Shadow (Throw)",
  "Edgar (Tools)",
  "Sabin ( Blitz)",
  "Celes (Runic)",
  "Strago (Lore)",
  "Relm (Sketch)",
  "Setzer (Slot)",
  "Mog (Dance)",
  "Gau (Rage)",
  "Gau (Leap)",
];

const PARENTHETICALS = [
  "(Morph)",
  "(Steal)",
  "(SwdTech)",
  "(Throw)",
  "(Tools)",
  "( Blitz)",
  "(Runic)",
  "(Lore)",
  "(Sketch)",
  "(Slot)",
  "(Dance)",
  "(Rage)",
  "(Leap)",
];

const hoistedOptions = [RANDOM, RANDOM_UNIQUE, NONE];
const commandOptions = Object.values(ALL_COMMANDS).filter(
  ({ value }) => !hoistedOptions.includes(value),
);

const constructOptions = (options: CommandOption[]): CommandOption[] => {
  return [
    RANDOM_OPTION,
    RANDOM_UNIQUE_OPTION,
    NONE_OPTION,
    ...orderBy(options, ({ label }) => label),
  ];
};

const isSpecificToCharacter = (commandId: number, commandIndex: number) => {
  const charSpecificCommands = characterSpecificOptions[commandIndex];
  return charSpecificCommands?.includes(commandId);
};

const getOptionsForCharacter = (
  options: CommandOption[],
  selectedCommands: number[],
  commandIndex: number,
) => {
  const characterCommands = options.filter(({ value: id }) =>
    isSpecificToCharacter(id, commandIndex),
  );

  const uniqueCommands = options.filter(({ value: id }) =>
    uniqueOptionIds.includes(id)
      ? !selectedCommands.includes(id) || selectedCommands[commandIndex] === id
      : false,
  );

  const characterCommandIds = characterCommands.map(({ value: id }) => id);
  const uniqueCommandIds = characterCommands.map(({ value: id }) => id);
  const excludes = uniq(characterCommandIds.concat(uniqueCommandIds));

  const standardOptions = options
    .filter(
      ({ value: id }) => !excludes.includes(id) && !alwaysExclude.includes(id),
    )
    .concat();

  return standardOptions.concat(uniqueCommands).concat(characterCommands);
};

export const CommandsList = () => {
  const dispatch = useDispatch();
  const commandValue =
    useFlagValueSelector<string>("-com") ?? originalCommandFlags;

  const rawPortraitString =
    useFlagValueSelector<string>("-cpor") ?? defaultPortraitString;
  const portraitValues = rawPortraitString.split(".");

  const rawCharacterNames =
    useFlagValueSelector<string>("-name") ?? defaultCharacterNameString;
  const characterNamesList = rawCharacterNames.split(".");

  const rawValues = strToVals(commandValue) ?? [];

  const values = rawValues.map((val) => ALL_COMMANDS[Number.parseInt(val)]);
  const valueIds = values.map(({ value }) => value);

  const setCommands = (value: string) => {
    dispatch(
      setFlag({
        flag: "-com",
        value,
      }),
    );
  };

  const onChange = (val: SelectOption | null, idx: number) => {
    const ids = values.map(({ value }) => valToStr(value));
    ids[idx] = valToStr(val ? Number(val.value) : NONE);
    const newValue = ids.join("");
    setCommands(newValue);
  };

  const allOriginal = () => {
    setCommands(originalCommandFlags);
  };

  const allRandomized = () => {
    const excludedRandomized = [FIGHT, LEAP];
    const validOptions = commandOptions.filter(
      ({ value }) => !excludedRandomized.includes(value),
    );
    const randomized = DEFAULT_COMMANDS.map(
      () => sample(validOptions) as CommandOption,
    )
      .map(({ value }) => valToStr(value))
      .join("");
    setCommands(randomized);
  };

  const allRandom = () => {
    const random = valToStr(RANDOM);
    setCommands(DEFAULT_COMMANDS.map(() => random).join(""));
  };

  const allRandomUnique = () => {
    const randomUnique = valToStr(RANDOM_UNIQUE);
    setCommands(DEFAULT_COMMANDS.map(() => randomUnique).join(""));
  };

  return (
    <Card contentClassName="gap-6" title={"Commands"}>
      <div className="flex gap-3 justify-center flex-wrap">
        <Button className="hidden" onClick={allRandomized} variant="primary">
          Randomize
        </Button>
        <Button onClick={allRandom} variant="primary">
          All Random
        </Button>
        <Button onClick={allRandomUnique} variant="primary">
          All Random Unique
        </Button>
        <Button onClick={allOriginal} variant="primary">
          Original
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 grid-flow-row-dense gap-6">
        {LABELS.map((label, idx) => {
          const id = `${label}-select`;
          const unsortedOptions = getOptionsForCharacter(
            commandOptions,
            valueIds,
            idx,
          );

          const selectOptions = constructOptions(unsortedOptions).map(
            (opt) => ({
              label: opt.label,
              value: opt.value.toString(),
            }),
          );

          const currentSelectValue = values[idx]
            ? (selectOptions.find(
                (opt) => opt.value === values[idx].value.toString(),
              ) ?? null)
            : null;

          const isGauLeap = label === "Gau (Leap)";
          const charId = idx === 12 ? 11 : idx;
          const dynamicName = characterNamesList[charId];

          return (
            <div
              key={id}
              className={
                isGauLeap
                  ? "col-start-1 md:col-start-2 xl:col-start-4"
                  : undefined
              }
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <div className="flex-shrink-0 w-[32px] h-[32px] rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shadow-sm select-none">
                  <PortraitDrawLoad
                    portraitId={portraitValues[charId]}
                    scale={1}
                  />
                </div>
                <InputLabel
                  htmlFor={id}
                  className="!mb-0 select-none flex items-baseline gap-1.5"
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-100 tracking-wide">
                    {dynamicName}
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 font-normal text-sm tracking-normal whitespace-nowrap">
                    {PARENTHETICALS[idx]}
                  </span>
                </InputLabel>
              </div>
              <CustomSelect
                options={selectOptions}
                onChange={(val) => onChange(val, idx)}
                value={currentSelectValue}
              />
            </div>
          );
        })}

        {/* Place Shuffle Commands directly into the same grid at the bottom left */}
        <div className="col-start-1 xl:col-start-1 self-end pb-1">
          <FlagSwitch
            flag="-scc"
            label="Shuffle Commands"
            helperText="Shuffle the commands selected above"
          />
        </div>
      </div>
    </Card>
  );
};
