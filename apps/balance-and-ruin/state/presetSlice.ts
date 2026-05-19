import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";
import { AppState } from "./store";
import { setFlag, setFlags } from "./flagSlice";

export interface PresetState {
  /** Name of the currently active preset, null when none is selected or flags have been manually changed */
  activePresetName: string | null;
}

const initialState: PresetState = {
  activePresetName: null,
};

export const presetSlice = createSlice({
  name: "preset",
  initialState,
  reducers: {
    setActivePreset(state, action: PayloadAction<string>) {
      state.activePresetName = action.payload;
    },
    clearActivePreset(state) {
      state.activePresetName = null;
    },
  },
  extraReducers: (builder) => {
    // Auto-clear the active preset when the user manually changes individual flags.
    // Note: setRawFlags is intentionally NOT listed here — it is dispatched by the
    // preset loader itself, so we must not clear on that action.
    builder
      .addCase(setFlag, (state) => {
        state.activePresetName = null;
      })
      .addCase(setFlags, (state) => {
        state.activePresetName = null;
      })
      .addCase(HYDRATE as any, (state, action: any) => {
        return {
          ...state,
          ...action.payload.preset,
        };
      });
  },
});

export const { setActivePreset, clearActivePreset } = presetSlice.actions;

export const selectActivePresetName = (state: AppState) =>
  state.preset.activePresetName;

export default presetSlice.reducer;
