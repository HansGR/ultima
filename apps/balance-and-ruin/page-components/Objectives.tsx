import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaPlus } from "react-icons/fa";
import { ObjectiveCard } from "~/card-components/ObjectiveCard";
import { selectRawFlags, setFlag } from "~/state/flagSlice";
import {
  addObjective,
  alphabet,
  DEFAULT_OBJECTIVE_VALUE,
  MAX_OBJECTIVE_COUNT,
  selectObjectives,
  setRawObjectives,
} from "~/state/objectiveSlice";
import { PageContainer } from "~/components/PageContainer/PageContainer";

export const Objectives = () => {
  const dispatch = useDispatch();
  const rawFlags = useSelector(selectRawFlags);

  const objectives = Object.values(useSelector(selectObjectives) ?? {});

  useEffect(() => {
    dispatch(setRawObjectives(rawFlags));
  }, [dispatch]);

  const onAddObjective = () => {
    const nextObjectiveId = objectives.length;
    const letter = alphabet[nextObjectiveId];
    const flag = `-o${letter}`;
    dispatch(
      addObjective({
        flag,
        letter,
      }),
    );
    dispatch(
      setFlag({
        flag,
        value: DEFAULT_OBJECTIVE_VALUE,
      }),
    );
  };

  return (
    <PageContainer columns={3}>
      <div className="col-span-full flex flex-col gap-4 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 items-stretch">
          {objectives.map((objective) => (
            <div key={objective.flag} className="h-full flex flex-col">
              <ObjectiveCard key={objective.flag} objective={objective} />
            </div>
          ))}
          {objectives.length < MAX_OBJECTIVE_COUNT && (
            <div
              onClick={onAddObjective}
              title="Add New Objective"
              className="flex flex-col items-center justify-center cursor-pointer group border-2 border-dashed border-slate-200 dark:border-slate-700/60 bg-slate-50/40 dark:bg-slate-800/10 hover:bg-slate-100/60 dark:hover:bg-slate-800/30 hover:border-blue-400 dark:hover:border-blue-500/50 transition-all duration-300 rounded-xl p-6 shadow-sm hover:shadow-md self-start"
              style={{ maxWidth: "280px", width: "100%", height: "295px" }}
            >
              <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 group-hover:scale-110 group-hover:border-blue-500/50 group-hover:shadow-[0_0_15px_rgba(59,130,246,0.2)] dark:group-hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300">
                <FaPlus className="text-slate-400 dark:text-slate-500 group-hover:text-blue-500 text-xl transition-all duration-300" />
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
};
