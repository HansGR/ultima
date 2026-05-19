import React, { useId, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FlagLabel } from "~/components/FlagLabel/FlagLabel";
import { Select as CustomSelect } from "~/components/Select/Select";
import {
  EMPTY_FLAG_VALUE,
  selectActiveMutuallyExclusiveFlag,
  selectFlagValues,
  setFlag,
  useFlagValueSelector,
} from "~/state/flagSlice";
import { FlagValue, selectDescription } from "~/state/schemaSlice";
import { renderDescription } from "~/utils/renderDescription";
import { FlagSubflagContext } from "./FlagSubflagContext";

export type SubflagOption = {
  defaultValue: FlagValue;
  flag: string;
  helperText: string | ((value: FlagValue) => React.ReactNode);
  label: string;
  // if true, it will match flag name + defaultValue to the current selected.
  isStatic?: boolean;
  Renderable?: React.FC<{ children: React.ReactNode }> | null;
};

export type FlagSubflagSelectProps = {
  className?: string;
  label: React.ReactNode;
  options: SubflagOption[];
  nullable?: {
    description: string;
    label: string;
  };
  defaultSelected?: SubflagOption;
};

export const FlagSubflagSelect = ({
  className = "h-fit",
  label,
  nullable,
  options: baseOptions,
  defaultSelected,
}: FlagSubflagSelectProps) => {
  const dispatch = useDispatch();
  const id = useId();

  const selectedFlag = useSelector(
    selectActiveMutuallyExclusiveFlag(...baseOptions.map(({ flag }) => flag)),
  );

  const allFlagValues = useSelector(selectFlagValues);

  const schemaDescription = useSelector(
    selectedFlag ? selectDescription(selectedFlag) : () => null,
  );

  const empty = useMemo<SubflagOption>(
    () => ({
      flag: EMPTY_FLAG_VALUE,
      label: nullable?.label ?? "",
      defaultValue: null,
      helperText: nullable?.description ?? "",
    }),
    [nullable],
  );

  const options: SubflagOption[] = useMemo(() => {
    const newOptions = [...baseOptions];
    if (nullable) {
      newOptions.unshift(empty);
    }

    return newOptions;
  }, [baseOptions, empty, nullable]);

  const onChange = ({ defaultValue, flag }: SubflagOption) => {
    if (selectedFlag && selectedFlag !== EMPTY_FLAG_VALUE) {
      dispatch(
        setFlag({
          flag: selectedFlag,
          value: null,
        }),
      );
    }

    if (flag !== EMPTY_FLAG_VALUE) {
      dispatch(
        setFlag({
          flag,
          value: defaultValue,
        }),
      );
    }
  };
  const selectedValue = useFlagValueSelector<FlagValue>(selectedFlag!);

  const selectedOption = useMemo(
    () =>
      options.find(({ defaultValue, flag, isStatic }) => {
        if (flag === selectedFlag) {
          if (isStatic) {
            return flag === selectedFlag && defaultValue === selectedValue;
          }
        }
        return flag === selectedFlag;
      }) ??
      defaultSelected ??
      empty,
    [options, defaultSelected, empty, selectedFlag, selectedValue],
  );

  let description: React.ReactNode;
  if (typeof selectedOption.helperText === "function") {
    description = selectedOption.helperText(selectedValue);
  } else {
    description = renderDescription(selectedOption.helperText, selectedValue);
  }

  const { Renderable } = selectedOption;

  // Create custom mapping to match CustomSelect schema safely
  const selectOptions = options.map((opt) => ({
    ...opt,
    value: opt.flag + opt.defaultValue, // Use the unique selector key
    helperText: opt.helperText,
    dynamicValue: allFlagValues[opt.flag] ?? opt.defaultValue,
  }));

  const activeSelectValue =
    selectOptions.find(
      (opt) =>
        opt.flag === selectedOption.flag &&
        opt.defaultValue === selectedOption.defaultValue,
    ) ?? null;

  const SelectWrapper = (
    <CustomSelect
      options={selectOptions}
      onChange={(selected) => {
        const originalOpt = options.find(
          (opt) => opt.flag + opt.defaultValue === selected?.value,
        );
        if (originalOpt) {
          onChange(originalOpt);
        }
      }}
      value={activeSelectValue}
    />
  );

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <>
        <FlagLabel
          flag={selectedOption.flag}
          helperText={description}
          label={label}
        />

        <FlagSubflagContext.Provider value={true}>
          {Renderable ? (
            <Renderable>{SelectWrapper}</Renderable>
          ) : (
            SelectWrapper
          )}
        </FlagSubflagContext.Provider>
      </>
    </div>
  );
};
