import { useMemo } from "react";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppState } from "./store";
import { HYDRATE } from "next-redux-wrapper";
import { useSelector } from "react-redux";
import { flagsToData } from "~/utils/flagsToData";

type FlagValue = string | number | string[] | number[] | boolean | null;
type FlagData = {
  /**
   * The WC flag used to identify a flag
   * @example
   * `-cg`
   * `-msl`
   */
  flag: string;
  /**
   * The value of the flag - null indicates it hasn't been set or has been cleared
   */
  value: FlagValue | null;
};

// Type for our state
export interface FlagState {
  flagValues: Record<string, FlagValue | null>;
  rawFlags: string;
}

export const getFlagValue = (key: string, val: FlagValue | null) => {
  if ([null, undefined].includes(val as any)) {
    return "";
  }
  if (Array.isArray(val)) {
    // an empty list means the flag is effectively unset (e.g. `-rc` with no characters)
    if (val.length === 0) {
      return "";
    }
    return `${key} ${val.join(" ")}`;
  }
  if (typeof val === "boolean") {
    return val ? `${key}` : "";
  }
  return `${key} ${val}`;
};
const valuesToString = (flagValues: FlagState["flagValues"]) => {
  return Object.entries(flagValues).reduce((acc, [key, val]) => {
    return `${acc} ${getFlagValue(key, val)}`.trim();
  }, "");
};

const startingFlags = `-cg -oa 2.2.2.2.6.7.4.9.11 -ob 3.1.1.2.9.9.4.12.12.10.22.22 -oc 30.8.8.1.1.11.8 -od 59.1.1.11.31 -sc1 random -sc2 random -sc3 random -sal -eu -csrp 80 125 -fst -brl -slr 3 5 -lmprp 75 125 -lel -srr 25 35 -rnl -rnc -sdr 1 2 -das -dda -dns -sch -scis -com 98989898989898989898989898 -rec1 28 -rec2 27 -xpm 3 -mpm 5 -gpm 5 -nxppd -lsced 2 -hmced 2 -xgced 2 -ase 2 -msl 40 -sed -bbs -drloc shuffle -stloc mix -be -bnu -res -fer 0 -escr 100 -dgne -wnz -mmnu -cmd -esr 2 5 -elrt -ebr 82 -emprp 75 125 -nm1 random -rnl1 -rns1 -nm2 random -rnl2 -rns2 -nmmi -mmprp 75 125 -gp 5000 -smc 3 -sto 1 -ieor 33 -ieror 33 -ir stronger -csb 6 14 -mca -stra -saw -sisr 20 -sprp 75 125 -sdm 5 -npi -sebr -snsb -snee -snil -ccsr 20 -chrm 0 0 -cms -frw -wmhc -cor 100 -crr 100 -crvr 100 120 -crm -ari -anca -adeh -ame 1 -nmc -noshoes -u254 -nfps -fs -fe -fvd -fr -fj -fbs -fedc -fc -ond -etn -si 222.3.3.240.3.3.253.3.3`;
const initialState: FlagState = {
  flagValues: flagsToData(startingFlags),
  rawFlags: startingFlags,
};

export const EMPTY_FLAG_VALUE = "-ff6wc-empty-value";

// Actual Slice
export const flagSlice = createSlice({
  name: "flag",
  initialState,
  reducers: {
    setFlag: (state, action: PayloadAction<FlagData>) => {
      // clear value
      if (action.payload.value === null) {
        delete state.flagValues[action.payload.flag];
        state.rawFlags = valuesToString(state.flagValues);
        if (
          typeof window !== "undefined" &&
          localStorage.getItem("gfx_persist_enabled") === "true" &&
          ["-name", "-cpal", "-cpor", "-cspr", "-cspp"].includes(
            action.payload.flag,
          )
        ) {
          localStorage.removeItem(`gfx_${action.payload.flag.slice(1)}`);
        }
        return;
      }
      state.flagValues[action.payload.flag] = action.payload.value;
      state.rawFlags = valuesToString(state.flagValues);

      if (
        typeof window !== "undefined" &&
        localStorage.getItem("gfx_persist_enabled") === "true" &&
        ["-name", "-cpal", "-cpor", "-cspr", "-cspp"].includes(
          action.payload.flag,
        )
      ) {
        const lsKey = `gfx_${action.payload.flag.slice(1)}`;
        const lsVal = action.payload.value as string;
        localStorage.setItem(lsKey, lsVal);
      }
    },
    setFlags: (state, action: PayloadAction<Record<string, FlagValue>>) => {
      Object.keys(action.payload).forEach((key) => {
        state.flagValues[key] = action.payload[key];
        if (
          typeof window !== "undefined" &&
          localStorage.getItem("gfx_persist_enabled") === "true" &&
          ["-name", "-cpal", "-cpor", "-cspr", "-cspp"].includes(key)
        ) {
          localStorage.setItem(
            `gfx_${key.slice(1)}`,
            action.payload[key] as string,
          );
        }
      });

      state.rawFlags = valuesToString(state.flagValues);
    },
    setRawFlags: (state, action: PayloadAction<string>) => {
      const newFlagValues = flagsToData(action.payload);
      const GRAPHICS_FLAGS = [
        "-name",
        "-cpal",
        "-cpor",
        "-cspr",
        "-cspp",
      ] as const;

      // For user-triggered preset changes: if persist is enabled and the preset
      // explicitly includes a graphics flag, save that value to localStorage.
      // For flags NOT in the preset, do nothing here — restorePersistedGraphics
      // is called separately on initial page load to pull values from localStorage.
      if (
        typeof window !== "undefined" &&
        localStorage.getItem("gfx_persist_enabled") === "true"
      ) {
        for (const flag of GRAPHICS_FLAGS) {
          if (flag in newFlagValues) {
            const val = newFlagValues[flag];
            if (val !== null && val !== undefined) {
              localStorage.setItem(`gfx_${flag.slice(1)}`, val as string);
            }
          }
        }
      }

      GRAPHICS_FLAGS.forEach((flag) => {
        if (!(flag in newFlagValues) && state.flagValues[flag] !== undefined) {
          newFlagValues[flag] = state.flagValues[flag];
        }
      });

      state.flagValues = newFlagValues;
      state.rawFlags = valuesToString(state.flagValues);
    },
  },
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.flag,
      };
    },
  },
});

export const { setFlag, setFlags, setRawFlags } = flagSlice.actions;

/**
 * Plain function (NOT a Redux reducer) that restores persisted graphics flags
 * from localStorage by dispatching individual setFlag actions.
 *
 * Must be called from a React useEffect (client-side only). Because it is
 * regular JS — not a reducer — it is 100% guaranteed to run in the browser
 * where localStorage exists, regardless of Next.js SSR/hydration order.
 */
export const applyPersistedGraphics = (
  dispatch: (action: ReturnType<typeof setFlag>) => void,
) => {
  if (typeof window === "undefined") return;
  if (localStorage.getItem("gfx_persist_enabled") !== "true") return;

  const GRAPHICS_FLAGS = [
    ["-name", "gfx_name"],
    ["-cpal", "gfx_cpal"],
    ["-cpor", "gfx_cpor"],
    ["-cspr", "gfx_cspr"],
    ["-cspp", "gfx_cspp"],
  ] as const;

  GRAPHICS_FLAGS.forEach(([flag, lsKey]) => {
    const saved = localStorage.getItem(lsKey);
    if (saved !== null) {
      dispatch(setFlag({ flag, value: saved }));
    }
  });
};

export const selectFlagValues = (state: AppState) => state.flag.flagValues;
export const selectFlagValue =
  <T>(flag: string | null) =>
  (state: AppState) => {
    if (!flag || flag === EMPTY_FLAG_VALUE) {
      return null;
    }
    return state.flag.flagValues[flag] as unknown as T;
  };

export const selectRawFlags = (state: AppState) => {
  return state.flag.rawFlags;
};

export const useFlagValueSelector = <T>(flag: string | null) => {
  const flagValueSelector = useMemo(
    () => selectFlagValue<T | null>(flag),
    [flag],
  );
  return useSelector(flagValueSelector);
};

/**
 *
 * @param flags
 * @returns
 */
export const selectActiveMutuallyExclusiveFlag =
  (...flags: string[]) =>
  (state: AppState) => {
    return flags.find((flag) => {
      const val = state.flag.flagValues[flag];
      return val != null;
    });
  };

export default flagSlice.reducer;
