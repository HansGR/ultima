import { Card } from "@ff6wc/ui";
import { Divider } from "@ff6wc/ui/Divider/Divider";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { SingleValue } from "react-select";
import { ObjectiveCloneButton } from "~/components/ObjectiveCloneButton/ObjectiveCloneButton";
import { FlagLabel } from "~/components/FlagLabel/FlagLabel";
import { ObjectiveConditionSelect } from "~/components/ObjectiveConditionSelect/ObjectiveConditionSelect";
import { ObjectiveConditionsRequired } from "~/components/ObjectiveConditionsRequired/ObjectiveConditionsRequired";
import { ObjectiveDeleteButton } from "~/components/ObjectiveDeleteButton/ObjectiveDeleteButton";
import { ObjectiveResultSelect } from "~/components/ObjectiveResultSelect/ObjectiveResultSelect";
import { ObjectiveResultValue } from "~/components/ObjectiveResultValue/ObjectiveResultValue";
import { setFlag, useFlagValueSelector } from "~/state/flagSlice";
import {
  MAX_CONDITION_COUNT,
  selectObjectiveConditionMetadataById,
  selectObjectiveResultMetadataById,
  setObjective,
  setResultValue,
} from "~/state/objectiveSlice";
import {
  Objective,
  ObjectiveCondition,
  ObjectiveResult,
} from "~/types/objectives";
import { createObjective } from "~/utils/createObjective";
import { objectiveToString } from "~/utils/objectiveToString";
import { isValidCondition } from "~/utils/isValidCondition";

type ObjectiveCardProps = {
  objective: Objective;
};

export const ObjectiveCard = ({ objective }: ObjectiveCardProps) => {
  const { flag, letter } = objective;
  const dispatch = useDispatch();

  const value = useFlagValueSelector<string>(`-o${letter}`)?.split(".") ?? [];

  const [resultId] = value;
  const metadata = useSelector(selectObjectiveResultMetadataById);
  const conditionMetadata = useSelector(selectObjectiveConditionMetadataById);

  const resultMetadata = metadata[resultId] ?? {};
  const { value_range } = resultMetadata;

  const addConditionDirectly = () => {
    if (objective.conditions.length >= MAX_CONDITION_COUNT) {
      return;
    }
    const RANDOM_ID = "1";
    const cMetadata = conditionMetadata[RANDOM_ID];
    if (!cMetadata) return;

    const newObjective = { ...objective };
    const conditions = [...objective.conditions];
    const newCondition: ObjectiveCondition = {
      id: RANDOM_ID,
      name: cMetadata.condition_type_name,
      range: cMetadata.range,
      values: [cMetadata.value_range[0]],
    };

    conditions.push(newCondition);
    newObjective.conditions = conditions;
    newObjective.requiredConditions = [
      objective.requiredConditions[0] + 1,
      objective.requiredConditions[1] + 1,
    ];

    dispatch(setObjective(newObjective));
    dispatch(
      setFlag({
        flag,
        value: objectiveToString(newObjective),
      }),
    );
  };

  const deleteConditionAtIndex = (idxToDelete: number) => {
    const newObjective = { ...objective };
    const conditions = [...objective.conditions];
    conditions.splice(idxToDelete, 1);
    newObjective.conditions = conditions;

    const validCount = conditions.filter(isValidCondition).length;
    newObjective.requiredConditions = [
      Math.min(objective.requiredConditions[0], validCount),
      Math.min(objective.requiredConditions[1], validCount),
    ];

    dispatch(setObjective(newObjective));
    dispatch(
      setFlag({
        flag,
        value: objectiveToString(newObjective),
      }),
    );
  };

  const clearObjectiveResult = () => {
    return dispatch(
      setFlag({
        flag,
        value: null,
      }),
    );
  };

  const onResultChange = (val: SingleValue<ObjectiveResult>) => {
    if (val === null) {
      return clearObjectiveResult();
    }

    const newMetadata = metadata[val.id];
    const newObjective = createObjective(objective, newMetadata);

    // allow range of values
    if (newMetadata.value_range) {
      const minVal = Number.parseInt(newMetadata.value_range[0].toString());
      newObjective.result.value = [minVal, minVal];
      const newValue = objectiveToString(newObjective);
      dispatch(
        setFlag({
          flag,
          value: newValue,
        }),
      );
      dispatch(setObjective(newObjective));
    } else {
      const newValue = objectiveToString(newObjective);
      newObjective.result.value = undefined;
      dispatch(
        setFlag({
          flag,
          value: newValue,
        }),
      );
      dispatch(setObjective(newObjective));
    }
  };

  const onObjectiveChange = (obj: Objective) => {
    const ots = objectiveToString;
    dispatch(setObjective(obj));
    dispatch(
      setFlag({
        flag: obj.flag,
        value: ots(obj),
      }),
    );
  };

  const title = (
    <div className="flex flex-row items-center justify-between w-full">
      <span>Objective {letter.toUpperCase()}</span>
      <div className="flex flex-row items-center gap-2">
        <ObjectiveDeleteButton objective={objective} />
        <ObjectiveCloneButton objective={objective} />
      </div>
    </div>
  );

  return (
    <Card title={title as unknown as any}>
      <ObjectiveResultSelect flag={flag} onChange={onResultChange} />
      {value_range ? (
        <ObjectiveResultValue objective={objective} metadata={resultMetadata} />
      ) : null}
      {objective.conditions.map((c, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-1 w-full overflow-visible mb-1"
        >
          <div className="flex flex-row items-center justify-between w-full">
            <FlagLabel
              flag={objective.flag}
              helperText=""
              label={"Condition"}
            />
            <button
              onClick={() => deleteConditionAtIndex(idx)}
              className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 p-1 rounded transition-all cursor-pointer flex items-center justify-center shrink-0"
              title="Delete this Condition"
              style={{ width: "30px", height: "30px" }}
            >
              <FaTrash size={13} />
            </button>
          </div>
          <div className="w-full overflow-visible">
            <ObjectiveConditionSelect
              condition={c}
              objective={objective}
              onChange={onObjectiveChange}
            />
          </div>
        </div>
      ))}

      {/* Horizontal Long Add Condition Button */}
      {objective.conditions.length < MAX_CONDITION_COUNT && (
        <div
          onClick={addConditionDirectly}
          title="Add More Conditions"
          className="flex items-center justify-center w-full h-10 border-2 border-dashed border-slate-200 dark:border-slate-700/60 hover:border-blue-400 dark:hover:border-blue-500/50 bg-slate-50/40 dark:bg-slate-800/10 hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-all duration-300 rounded-lg cursor-pointer group my-3 p-1"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 group-hover:scale-110 group-hover:border-blue-500 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.2)] transition-all duration-300">
            <FaPlus className="text-slate-400 dark:text-slate-400 group-hover:text-blue-500 text-[10px]" />
          </div>
        </div>
      )}
      <Divider />
      <ObjectiveConditionsRequired
        objective={objective}
        onChange={onObjectiveChange}
      />
    </Card>
  );
};
