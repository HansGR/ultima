import { Button } from "@ff6wc/ui";
import { FaMinus } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { setFlag } from "~/state/flagSlice";
import { setObjective } from "~/state/objectiveSlice";
import { Objective } from "~/types/objectives";
import { objectiveToString } from "~/utils/objectiveToString";

type ObjectiveCardProps = {
  objective: Objective;
};

export const ObjectiveRemoveConditionButton = ({
  objective,
}: ObjectiveCardProps) => {
  const { flag } = objective;
  const dispatch = useDispatch();

  const removeObjectiveCondition = () => {
    if (objective.conditions.length <= 0) {
      return;
    }

    const newObjective = { ...objective };
    const conditions = [...objective.conditions];
    conditions.pop(); // Safely pop the bottommost condition

    newObjective.conditions = conditions;

    // Adjust required conditions constraints so they do not exceed the new count
    const remainingCount = conditions.length;
    newObjective.requiredConditions = [
      Math.min(objective.requiredConditions[0], remainingCount),
      Math.min(objective.requiredConditions[1], remainingCount),
    ];

    dispatch(setObjective(newObjective));

    dispatch(
      setFlag({
        flag,
        value: objectiveToString(newObjective),
      }),
    );
  };

  return (
    <Button
      className="w-fit"
      disabled={objective.conditions.length <= 0}
      onClick={removeObjectiveCondition}
      size="small"
      variant="default"
      title="remove last condition"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0.4rem",
      }}
    >
      <FaMinus size={13} />
    </Button>
  );
};
