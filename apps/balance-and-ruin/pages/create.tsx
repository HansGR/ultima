import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectVersion, setVersion } from "~/state/settingsSlice";
import dynamic from "next/dynamic";

const FlagCreatePage = dynamic<any>(
  () =>
    import("../components/FlagCreatePage/FlagCreatePage").then(
      (mod) => mod.FlagCreatePage,
    ),
  { ssr: false },
);
import { setRawFlags, applyPersistedGraphics } from "~/state/flagSlice";
import { setRawObjectives } from "~/state/objectiveSlice";
import { setRawStartingItems, initItemMetadata } from "~/state/itemSlice";
import { setObjectiveMetadata } from "~/state/objectiveSlice";
import { RawFlagMetadata, setSchema } from "~/state/schemaSlice";
import { ObjectiveMetadata } from "~/types/objectives";
import { FlagPreset } from "~/types/preset";
import { fetchWithTimeout } from "~/utils/fetchWithTimeout";
import { normalizePresets } from "~/utils/presets";
import fallbackFlag from "~/public/metadata-fallback/flag.json";
import fallbackObjective from "~/public/metadata-fallback/objective.json";
import fallbackWc from "~/public/metadata-fallback/wc.json";
import fallbackPresets from "~/public/metadata-fallback/presets.json";

export type PageProps = {
  objectives: ObjectiveMetadata;
  presets: Record<string, FlagPreset>;
  schema: Record<string, RawFlagMetadata>;
};

const DecodeB64QueryStringParam = (param: string) => {
  let base64 = param.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if necessary
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const buf = Buffer.from(base64, "base64");
  return buf.toString("utf-8");
};

const Create = () => {
  const dispatch = useDispatch();
  const [isMounted, setIsMounted] = useState(false);
  const [objectives, setObjectives] = useState<ObjectiveMetadata>(
    fallbackObjective as any,
  );
  const [presets, setPresets] = useState<Record<string, FlagPreset>>(
    normalizePresets(fallbackPresets),
  );
  const [schema, setSchemaLocal] = useState<Record<string, RawFlagMetadata>>(
    fallbackFlag as any,
  );
  const version = useSelector(selectVersion);

  useEffect(() => {
    setIsMounted(true);
    dispatch(initItemMetadata());
    // 1. Try to load initial values from localStorage cache for instant load
    try {
      const cachedObjectives = localStorage.getItem("cached_objectives");
      const cachedPresets = localStorage.getItem("cached_presets");
      const cachedSchema = localStorage.getItem("cached_schema");
      const cachedVersion = localStorage.getItem("cached_version");

      if (cachedObjectives) {
        const parsed = JSON.parse(cachedObjectives);
        if (parsed && typeof parsed === "object") {
          setObjectives(parsed);
          dispatch(setObjectiveMetadata(parsed));
        }
      }
      if (cachedPresets) {
        const parsed = JSON.parse(cachedPresets);
        if (parsed && typeof parsed === "object") {
          const normalized = normalizePresets(parsed);
          if (normalized && Object.keys(normalized).length > 0) {
            setPresets(normalized);
            const preset = normalized["ultros league"];
            if (preset) {
              dispatch(setRawFlags(preset.flags));
              dispatch(setRawObjectives(preset.flags));
              dispatch(setRawStartingItems(preset.flags));
            }
            // Always restore persisted graphics — runs unconditionally so
            // even if "ultros league" is not found, the restore still fires.
            applyPersistedGraphics(dispatch);
          }
        }
      }
      if (cachedSchema) {
        const parsed = JSON.parse(cachedSchema);
        if (parsed && typeof parsed === "object") {
          setSchemaLocal(parsed);
          dispatch(setSchema(parsed));
        }
      }
      if (cachedVersion) {
        const parsed = JSON.parse(cachedVersion);
        if (parsed && typeof parsed === "string") {
          dispatch(setVersion(parsed));
        }
      }
    } catch (e) {
      console.warn("Failed to parse cached metadata:", e);
    }

    // 2. Fetch fresh data in the background (Stale-While-Revalidate)
    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    fetchWithTimeout(`${backendUrl}/presets`, {}, 2500)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        const normalized = normalizePresets(data);
        setPresets(normalized);
        localStorage.setItem("cached_presets", JSON.stringify(normalized));
        const preset = normalized["ultros league"];
        if (preset) {
          dispatch(setRawFlags(preset.flags));
          dispatch(setRawObjectives(preset.flags));
          dispatch(setRawStartingItems(preset.flags));
        }
        applyPersistedGraphics(dispatch);
      })
      .catch((err) => {
        console.warn(
          "Failed to fetch presets from API, trying fallback fetch:",
          err,
        );
        fetch("/metadata-fallback/presets.json")
          .then((res) => res.json())
          .then((data) => {
            const normalized = normalizePresets(data);
            setPresets(normalized);
            localStorage.setItem("cached_presets", JSON.stringify(normalized));
            const preset = normalized["ultros league"];
            if (preset) {
              dispatch(setRawFlags(preset.flags));
              dispatch(setRawObjectives(preset.flags));
              dispatch(setRawStartingItems(preset.flags));
            }
            applyPersistedGraphics(dispatch);
          })
          .catch((fallbackErr) => {
            console.error("Failed to fetch fallback presets:", fallbackErr);
            setPresets((prev) => prev || {});
          });
      });

    fetchWithTimeout(`${backendUrl}/api/metadata/flag`, {}, 2500)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setSchemaLocal(data);
        localStorage.setItem("cached_schema", JSON.stringify(data));
        dispatch(setSchema(data));
      })
      .catch((err) => {
        console.warn(
          "Failed to fetch flag metadata from API, trying fallback fetch:",
          err,
        );
        fetch("/metadata-fallback/flag.json")
          .then((res) => res.json())
          .then((data) => {
            setSchemaLocal(data);
            localStorage.setItem("cached_schema", JSON.stringify(data));
            dispatch(setSchema(data));
          })
          .catch((fallbackErr) => {
            console.error(
              "Failed to fetch fallback flag metadata, using hardcoded fallback:",
              fallbackErr,
            );
            setSchemaLocal(fallbackFlag as any);
            localStorage.setItem("cached_schema", JSON.stringify(fallbackFlag));
            dispatch(setSchema(fallbackFlag as any));
          });
      });

    fetchWithTimeout(`${backendUrl}/api/metadata/objective`, {}, 2500)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setObjectives(data);
        localStorage.setItem("cached_objectives", JSON.stringify(data));
        dispatch(setObjectiveMetadata(data));
      })
      .catch((err) => {
        console.warn(
          "Failed to fetch objective metadata from API, trying fallback fetch:",
          err,
        );
        fetch("/metadata-fallback/objective.json")
          .then((res) => res.json())
          .then((data) => {
            setObjectives(data);
            localStorage.setItem("cached_objectives", JSON.stringify(data));
            dispatch(setObjectiveMetadata(data));
          })
          .catch((fallbackErr) => {
            console.error(
              "Failed to fetch fallback objective metadata, using hardcoded fallback:",
              fallbackErr,
            );
            setObjectives(fallbackObjective as any);
            localStorage.setItem(
              "cached_objectives",
              JSON.stringify(fallbackObjective),
            );
            dispatch(setObjectiveMetadata(fallbackObjective as any));
          });
      });

    fetchWithTimeout(`${backendUrl}/api/wc`, {}, 2500)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        const fetchedVersion = data["version"];
        dispatch(setVersion(fetchedVersion));
        localStorage.setItem("cached_version", JSON.stringify(fetchedVersion));
      })
      .catch((err) => {
        console.warn(
          "Failed to fetch version from API, trying fallback fetch:",
          err,
        );
        fetch("/metadata-fallback/wc.json")
          .then((res) => res.json())
          .then((data) => {
            const fetchedVersion = data["version"];
            dispatch(setVersion(fetchedVersion));
            localStorage.setItem(
              "cached_version",
              JSON.stringify(fetchedVersion),
            );
          })
          .catch((fallbackErr) => {
            console.error(
              "Failed to fetch fallback version, using hardcoded fallback:",
              fallbackErr,
            );
            const fetchedVersion = (fallbackWc as any).version || "1.4.4d";
            dispatch(setVersion(fetchedVersion));
            localStorage.setItem(
              "cached_version",
              JSON.stringify(fetchedVersion),
            );
          });
      });
  }, [dispatch]);

  if (isMounted && objectives && presets && schema && version) {
    return (
      <FlagCreatePage
        objectives={objectives}
        presets={presets}
        schema={schema}
        version={version}
      />
    );
  } else {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-white font-outfit text-xl">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="animate-pulse">Loading Worlds Collide...</p>
          <div className="text-xs text-slate-500 mt-4 font-mono border border-slate-800 rounded bg-slate-900/50 p-4 max-w-sm text-left">
            <h4 className="font-bold text-slate-400 mb-2 uppercase tracking-wider text-[10px]">
              Diagnostics Panel
            </h4>
            <div className="flex flex-col gap-1">
              <div>
                • Mounted:{" "}
                <span
                  className={isMounted ? "text-emerald-400" : "text-amber-500"}
                >
                  {isMounted ? "Yes" : "No (Waiting...)"}
                </span>
              </div>
              <div>
                • Objectives:{" "}
                <span
                  className={objectives ? "text-emerald-400" : "text-amber-500"}
                >
                  {objectives ? "Loaded" : "Missing"}
                </span>
              </div>
              <div>
                • Presets:{" "}
                <span
                  className={presets ? "text-emerald-400" : "text-amber-500"}
                >
                  {presets ? "Loaded" : "Missing"}
                </span>
              </div>
              <div>
                • Flag Schema:{" "}
                <span
                  className={schema ? "text-emerald-400" : "text-amber-500"}
                >
                  {schema ? "Loaded" : "Missing"}
                </span>
              </div>
              <div>
                • Version:{" "}
                <span
                  className={version ? "text-emerald-400" : "text-amber-500"}
                >
                  {version ? `v${version}` : "Missing"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Create;
