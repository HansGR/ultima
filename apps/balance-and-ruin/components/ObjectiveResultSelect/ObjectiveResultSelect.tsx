import groupBy from "lodash/groupBy";
import { useId, useMemo } from "react";
import { useSelector } from "react-redux";
import { FlagLabel } from "~/components/FlagLabel/FlagLabel";
import {
  Select as CustomSelect,
  SelectOption,
  SelectGroup,
} from "~/components/Select/Select";
import { useFlagValueSelector } from "~/state/flagSlice";
import { selectObjectiveResultMetadata } from "~/state/objectiveSlice";
import { ObjectiveResult, RawObjectiveResult } from "~/types/objectives";

type ObjectiveCardProps = {
  flag: string;
  onChange: (val: ObjectiveResult | null) => any;
};

const useResultOptions = (results: RawObjectiveResult[]) => {
  return useMemo<ObjectiveResult[]>(
    () =>
      results.map(({ group, id, format_string }) => ({
        group,
        id: id.toString(),
        label: format_string.replace("{{ . }}", ""),
      })),
    [results],
  );
};

export const ObjectiveResultSelect = ({
  flag,
  onChange,
}: ObjectiveCardProps) => {
  const resultMetadata = useSelector(selectObjectiveResultMetadata);
  const rawValue = useFlagValueSelector<string>(flag) ?? "0.0.0";

  const [resultId] = rawValue?.split(".") ?? [];

  const results = useResultOptions(resultMetadata);

  const resultsById = useMemo(
    () =>
      results.reduce(
        (acc, result) => {
          acc[result.id] = resultMetadata.find(
            ({ id }) => id.toString() === result.id,
          );
          return acc;
        },
        {} as Record<string | number, RawObjectiveResult | undefined>,
      ),
    [resultMetadata, results],
  );

  const id = useId();

  const getOptionLabel = (option: ObjectiveResult) => {
    const label = `${resultsById[option.id]?.name}`;
    if (label !== option.group) {
      return label;
    }
    return label === "Random" ? "Random" : `Random (${option.group})`;
  };

  // Construct groups matching SelectGroup schema for CustomSelect
  const groupOptions = useMemo<SelectGroup[]>(() => {
    const resultsByGroup = groupBy(results, (i) => i.group);
    return Object.entries(resultsByGroup).map(([groupName, groupResults]) => {
      return {
        label: groupName,
        options: groupResults.map(
          (res) =>
            ({
              ...res,
              value: res.id,
              label: getOptionLabel(res),
            }) as SelectOption,
        ),
      };
    });
  }, [results, resultsById]);

  const activeSelectValue = useMemo(() => {
    for (const group of groupOptions) {
      const found = group.options.find((opt) => opt.value === resultId);
      if (found) return found;
    }
    return null;
  }, [groupOptions, resultId]);

  // Search filter matching legacy filterOption
  const filterOption = (opt: SelectOption, needle: string) => {
    const query = needle.trim().toLowerCase();
    if (!query) return true;

    const label = opt.label.toLowerCase();
    const val = opt.value.toLowerCase();
    const grp = (opt.group || "").toLowerCase();

    return label.includes(query) || val.includes(query) || grp.includes(query);
  };

  return (
    <div key={id}>
      <div>
        <FlagLabel flag={flag} helperText="" label="Result" />
      </div>
      <CustomSelect
        isSearchable
        filterOption={filterOption}
        options={groupOptions}
        onChange={(selected) => {
          if (!selected) {
            onChange(null);
            return;
          }
          // Return back legacy format
          const original = results.find((r) => r.id === selected.value);
          if (original) {
            onChange(original);
          }
        }}
        value={activeSelectValue}
      />
    </div>
  );
};
