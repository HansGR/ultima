import { Action, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppState } from "./store";
import { HYDRATE } from "next-redux-wrapper";
import last from "lodash/last";
import orderBy from "lodash/orderBy";
import {
  Objective,
  ObjectiveCondition,
  ObjectiveMetadata,
  ObjectiveResult,
  RawObjectiveCondition,
  RawObjectiveResult,
} from "~/types/objectives";
import { objectivesToData } from "~/utils/flagsToData";

/*
   Objective String:
    0.2.2.2.7.7.4.10.10

    resultId.conditionMin.conditionMax.conditonOneId.conditionOneValue1.conditionValue2.conditionTwoValue1.conditionTwoValue2, etc.
 */

// Type for our state
export interface ObjectiveState {
  metadata: ObjectiveMetadata;

  metadataById: {
    conditions: Record<string | number, RawObjectiveCondition>;
    results: Record<string | number, RawObjectiveResult>;
  };
  /** ordered objective array */
  objectives: Objective[];
  objectivesByFlag: Record<string, Objective>;
}

// Initial state
const initialState: ObjectiveState = {
  metadata: {
    conditions: [],
    objectives: [],
  },
  metadataById: {
    conditions: {},
    results: {},
  },
  objectives: [],
  objectivesByFlag: {},
};

export const MAX_CONDITION_COUNT = 8;
export const MAX_OBJECTIVE_COUNT = 25;
export const DEFAULT_OBJECTIVE_VALUE = "2.0.0";

export const alphabet = Array.from(new Array(MAX_OBJECTIVE_COUNT)).map(
  (_, idx) => String.fromCharCode(97 + idx),
);

export const objectiveFlags = alphabet.map((letter) => `-o${letter}`);

export const normalizeObjectivesArr = (objectives: Objective[]) => {
  const ordered = orderBy(Object.values(objectives), ({ letter }) =>
    letter.charCodeAt(0),
  );

  const normalized = ordered.map(
    ({ conditions, requiredConditions, result }, idx) => {
      const [minReq, maxReq] = requiredConditions;
      const logicalConditions = conditions.filter((z) => z.id !== "0");

      const minRequired = Math.max(
        Math.min(minReq ?? 0, logicalConditions.length),
        0,
      );
      const maxRequired = Math.max(
        Math.min(maxReq ?? conditions.length, logicalConditions.length),
        0,
      );

      return {
        flag: `-o${alphabet[idx]}`,
        letter: alphabet[idx],
        conditions,
        requiredConditions: [minRequired, maxRequired] as [number, number],
        result,
      };
    },
  );

  return normalized;
};

const objectivesToDict = (objectives: Objective[]) => {
  return objectives.reduce(
    (acc, val) => {
      acc[val.flag] = val;
      return acc;
    },
    {} as Record<string, Objective>,
  );
};

export const normalizeObjectives = (
  objectives: Record<string, Objective>,
): Objective[] => {
  return normalizeObjectivesArr(Object.values(objectives));
};
// Actual Slice
export const objectiveSlice = createSlice({
  name: "objective",
  initialState,
  reducers: {
    setObjectiveMetadata(state, action: PayloadAction<ObjectiveMetadata>) {
      const conditionsById = action.payload.conditions.reduce(
        (acc, val) => {
          acc[val.id] = val;
          return acc;
        },
        {} as Record<string, RawObjectiveCondition>,
      );

      const resultsById = action.payload.objectives.reduce(
        (acc, val) => {
          acc[val.id] = val;
          return acc;
        },
        {} as Record<string, RawObjectiveResult>,
      );

      state.metadata = action.payload;
      state.metadataById = {
        conditions: conditionsById,
        results: resultsById,
      };
    },
    setObjectives(state, action: PayloadAction<Objective[]>) {
      state.objectives = normalizeObjectivesArr(action.payload);
      state.objectivesByFlag = objectivesToDict(action.payload);
    },
    setObjective(state, action: PayloadAction<Objective>) {
      state.objectivesByFlag[action.payload.flag] = { ...action.payload };
      state.objectives = normalizeObjectives(state.objectivesByFlag);
    },
    setRawObjectives(state, action: PayloadAction<string>) {
      const objectiveValues = objectivesToData(action.payload);
      const objectives = Object.entries(objectiveValues).map(
        ([flag, value]) => {
          const values =
            value?.split(".") || DEFAULT_OBJECTIVE_VALUE.split(".");
          const resultId = values[0];
          let metadata = state.metadataById.results[resultId];
          if (!metadata) {
            metadata = {
              id: Number.parseInt(resultId) || 0,
              name: "Unknown",
              value_range: [],
              group: "Other",
              format_string: "Unknown Objective",
            };
            state.metadataById.results[resultId] = metadata;
          }
          const hasRange = Boolean(metadata.value_range);

          // result id, condition min/max
          const conditions: ObjectiveCondition[] = [];
          let conditionStart = 3;
          if (hasRange) {
            conditionStart += 2;
          }

          const conditionString = values.slice(conditionStart, values.length);

          let nextConditionIdx = 0;
          conditionString.forEach((val, idx) => {
            if (idx !== nextConditionIdx) {
              return;
            }

            // skip over this id
            nextConditionIdx += 1;

            const conditionMetadata = state.metadataById.conditions[val];
            if (!conditionMetadata) {
              return;
            }
            const { id, condition_type_name, range, value_range } =
              conditionMetadata;

            if (range) {
              nextConditionIdx += 2;
            } else {
              nextConditionIdx += 1;
            }

            const rawMin = conditionString[idx + 1];
            const minValNum = Number.parseInt(rawMin);
            const values: (string | number)[] = [];

            if (rawMin != null) {
              values.push(Number.isFinite(minValNum) ? minValNum : rawMin);
            }

            // Only parse and consume rawMax if the condition is defined as a range.
            // For non-range conditions, rawMax (at idx + 2) represents the ID of
            // the next condition in the flag string. Consuming it here would corrupt
            // the current condition's value list and prevent the next condition from
            // being correctly recognized.
            if (range) {
              const rawMax = conditionString[idx + 2];
              const maxValNum = Number.parseInt(rawMax);
              if (rawMax != null) {
                values.push(Number.isFinite(maxValNum) ? maxValNum : rawMax);
              }
            }

            conditions.push({
              id: id.toString(),
              name: condition_type_name,
              range,
              values,
            });
          });

          const minConditions = Number.parseInt(
            hasRange ? values[3] : values[1],
          );

          const maxConditions = Number.parseInt(
            hasRange ? values[4] : values[2],
          );

          const resultMetadata =
            state.metadataById.results[resultId] || metadata;
          const { group, id, format_string } = resultMetadata;

          const result: ObjectiveResult = {
            group: resultMetadata?.group || "",
            label: resultMetadata?.format_string || "",
            id: resultMetadata?.id?.toString() || resultId || "",
            value: hasRange
              ? [Number.parseInt(values[1]), Number.parseInt(values[2])]
              : undefined,
          };

          const objective: Omit<Objective, "value"> = {
            conditions,
            flag,
            letter: `${last(flag)}`,
            requiredConditions: [
              Number.isFinite(minConditions) ? minConditions : 0,
              Number.isFinite(maxConditions) ? maxConditions : 0,
            ],
            result,
          };

          return {
            ...objective,
          } as Objective;
        },
      );

      let finalObjectives = objectives;
      // Fallback: if the parsed objectives list is empty, default to ONE objective with "Unlock Final Kefka" (ID 2)
      if (finalObjectives.length === 0 && state.metadataById.results[2]) {
        const { group, id, format_string } = state.metadataById.results[2];
        finalObjectives = [
          {
            flag: "-oa",
            letter: "a",
            conditions: [],
            requiredConditions: [0, 0],
            result: {
              group,
              id: id.toString(),
              label: format_string,
            },
          } as Objective,
        ];
      }
      state.objectives = normalizeObjectivesArr(finalObjectives);
      state.objectivesByFlag = objectivesToDict(state.objectives);
    },
    setResultValue(
      state,
      action: PayloadAction<{ flag: string; value: number[] }>,
    ) {
      const objective = {
        ...state.objectivesByFlag[action.payload.flag],
      };

      objective.result.value = action.payload.value as [number, number];
      state.objectivesByFlag[action.payload.flag] = objective;
      state.objectives = normalizeObjectives(state.objectivesByFlag);
    },
    addObjective(
      state,
      action: PayloadAction<
        Omit<Objective, "conditions" | "requiredConditions" | "result"> &
          Partial<
            Pick<Objective, "conditions" | "requiredConditions" | "result">
          >
      >,
    ) {
      const objectiveCount = Object.keys(state.objectivesByFlag).length;
      if (objectiveCount >= MAX_OBJECTIVE_COUNT) {
        return;
      }

      const fallbackObjective = state.metadataById.results[2] ||
        state.metadata.objectives[0] || {
          id: 2,
          name: "Unlock Final Kefka",
          value_range: [],
          group: "Other",
          format_string: "Unknown Objective",
        };
      const { format_string, group, id } = fallbackObjective;

      state.objectivesByFlag[action.payload.flag] = {
        conditions: [],
        result: {
          group,
          id: id.toString(),
          label: format_string,
        },
        requiredConditions: [0, 0],
        ...action.payload,
      };

      state.objectives = normalizeObjectives(state.objectivesByFlag);
    },
    removeObjective(state, action: PayloadAction<{ flag: string }>) {
      if (state.objectivesByFlag[action.payload.flag]) {
        delete state.objectivesByFlag[action.payload.flag];
      }

      state.objectives = normalizeObjectives(state.objectivesByFlag);
    },
  },
  // Special reducer for hydrating the state. Special case for next-redux-wrapper
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.objective,
      };
    },
  },
});

export const {
  addObjective,
  removeObjective,
  setObjective,
  setObjectives,
  setObjectiveMetadata,
  setResultValue,
  setRawObjectives,
} = objectiveSlice.actions;

export const selectObjectives = (state: AppState) =>
  state.objective.objectivesByFlag;

export const selectObjective = (flag: string) => (state: AppState) =>
  state.objective.objectivesByFlag[flag];

export const selectObjectiveResultMetadata = (state: AppState) =>
  state.objective.metadata.objectives;

export const selectObjectiveResultMetadataById = (state: AppState) =>
  state.objective.metadataById.results;

export const selectObjectiveConditionMetadata = (state: AppState) =>
  state.objective.metadata.conditions;

export const selectObjectiveConditionMetadataById = (state: AppState) =>
  state.objective.metadataById.conditions;

export default objectiveSlice.reducer;
