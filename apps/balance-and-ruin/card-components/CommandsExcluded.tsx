import {
  ALL_COMMANDS,
  CommandOption,
  FIGHT,
  LEAP,
  NONE,
  NONE_OPTION,
  RANDOM,
  RANDOM_UNIQUE,
} from "@ff6wc/ff6-types";
import { Card } from "@ff6wc/ui";
import orderBy from "lodash/orderBy";
import { useId, useMemo } from "react";
import { useDispatch } from "react-redux";
import { CardColumn } from "~/components/CardColumn/CardColumn";
import { FlagLabel } from "~/components/FlagLabel/FlagLabel";
import {
  Select as CustomSelect,
  SelectOption,
} from "~/components/Select/Select";
import { setFlag, useFlagValueSelector } from "~/state/flagSlice";

const hoistedOptions = [RANDOM, RANDOM_UNIQUE, NONE];
const nonExcludable = [FIGHT, LEAP];

const rawOptions = Object.values(ALL_COMMANDS).filter(
  ({ value }) =>
    !hoistedOptions.includes(value) && !nonExcludable.includes(value),
);

const allOptions: CommandOption[] = [
  NONE_OPTION,
  ...orderBy(rawOptions, ({ label }) => label),
];

type ExcludeSelectProps = {
  flag: string;
};

const useExcludedCommands = () => {
  const rec1 = useFlagValueSelector("-rec1");
  const rec2 = useFlagValueSelector("-rec2");
  const rec3 = useFlagValueSelector("-rec3");
  const rec4 = useFlagValueSelector("-rec4");
  const rec5 = useFlagValueSelector("-rec5");
  const rec6 = useFlagValueSelector("-rec6");
  return useMemo(
    () =>
      [rec1, rec2, rec3, rec4, rec5, rec6]
        .map(Number)
        .filter((val) => val !== NONE),
    [rec1, rec2, rec3, rec4, rec5, rec6],
  );
};

export const ExcludeSelect = ({ flag }: ExcludeSelectProps) => {
  const excludedValues = useExcludedCommands();
  const dispatch = useDispatch();
  const id = useId();
  const value = useFlagValueSelector<number>(flag);

  const selectOptions = useMemo(() => {
    const currentValue = Number(value ?? NONE);
    return allOptions
      .filter(({ value: id }) => id === currentValue || !excludedValues.includes(id))
      .map((opt) => ({
        label: opt.label,
        value: opt.value.toString(),
      }));
  }, [excludedValues, value]);

  const currentSelectValue = useMemo(() => {
    const activeVal = Number(value ?? NONE);
    return (
      selectOptions.find((opt) => Number(opt.value) === activeVal) ?? {
        label: NONE_OPTION.label,
        value: NONE_OPTION.value.toString(),
      }
    );
  }, [selectOptions, value]);

  const onChange = (val: SelectOption | null) => {
    dispatch(
      setFlag({
        flag,
        value: val ? Number(val.value) : null,
      }),
    );
  };

  return (
    <CustomSelect
      options={selectOptions}
      onChange={onChange}
      value={currentSelectValue}
    />
  );
};

export const CommandsExcluded = () => {
  return (
    <Card title={"Excluded"}>
      <div className="flex flex-col gap-4">
        <div className="col-span-full">
          <FlagLabel
            flag="-rec1"
            helperText={
              "The commands below will not be considered for Random and Random Unique commands"
            }
            label={"Excluded Commands"}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ExcludeSelect flag="-rec1" />
          <ExcludeSelect flag="-rec2" />
          <ExcludeSelect flag="-rec3" />
          <ExcludeSelect flag="-rec4" />
          <ExcludeSelect flag="-rec5" />
          <ExcludeSelect flag="-rec6" />
        </div>
      </div>
    </Card>
  );
};
