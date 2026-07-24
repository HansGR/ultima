import { CodeBlock, HelperText, Input, Link } from "@ff6wc/ui";
import first from "lodash/first";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdClear, MdFileUpload } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import useSWRMutation from "swr/mutation";
import { getFlagValue, selectFlagValues, setRawFlags } from "~/state/flagSlice";
import { setRawObjectives } from "~/state/objectiveSlice";
import { setRawStartingItems } from "~/state/itemSlice";
import JSZip from "jszip";
import { useRouter } from "next/router";
import { selectSchema } from "~/state/schemaSlice";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useAppSession } from "~/hooks/useAppSession";
import { useAuthFetch } from "~/hooks/useAuthFetch";
const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false";
import { GenerateUpload } from "~/components/GenerateUpload/GenerateUpload";
import { FlagTextInput } from "~/components/FlagInput/FlagInput";
import { FlagSwitch } from "~/components/FlagSwitch/FlagSwitch";
import styles from "./GenerateCard.module.css";
import { ArchipelagoYamlModal } from "~/components/ArchipelagoYamlModal/ArchipelagoYamlModal";
import { getGeneratingHtml } from "~/utils/generatingHtml";
import {
  selectActivePresetName,
  selectLastSelectedPresetName,
} from "~/state/presetSlice";
import { FlagSummary } from "~/components/FlagSummary/FlagSummary";
import { FaCopy, FaCheck } from "react-icons/fa";

const hasSevereProfanity = (text: string): boolean => {
  if (!text) return false;

  // 1. Check with word boundaries (catches exact words with punctuation/spaces around them)
  // Severe terms: fuck, cunt, faggot, nigger, chink, kike, dyke, tranny, retard, shit, cock
  const severePatterns = [
    /\bf[u*v]ck(?:s|ers?|ing)?\b/i,
    /\bc[u*]nt[s]?\b/i,
    /\bsh[i*!1]t[s]?\b/i,
    /\bc[o*0]ck[s]?\b/i,
    /\bfag[o0]t[s]?\b/i,
    /\bnigg[e3]r[s]?\b/i,
    /\bchink[s]?\b/i,
    /\bkik[e3][s]?\b/i,
    /\bdyk[e3][s]?\b/i,
    /\btrann[y]?[s]?\b/i,
    /\bretard(?:ed)?\b/i,
  ];

  if (severePatterns.some((pattern) => pattern.test(text))) {
    return true;
  }

  // 2. Normalize and check for strict severe terms (covers attempts to bypass with spaces or symbols)
  const normalized = text
    .toLowerCase()
    .replace(/[0oO*@4vV]/g, "u")
    .replace(/[1iIl!|]/g, "i")
    .replace(/[3eE]/g, "e")
    .replace(/[5sS$]/g, "s")
    .replace(/[7tT]/g, "t")
    .replace(/[^a-z]/g, ""); // strip all spaces, symbols, numbers

  const strictSubstrings = [
    "fuck",
    "faggot",
    "faggut",
    "nigger",
    "kike",
    "tranny",
  ];

  if (strictSubstrings.some((word) => normalized.includes(word))) {
    return true;
  }

  return false;
};

export type FlagsCardProps = {
  className?: string;
  enableEditing?: boolean;
};

type GenerateResponse = {
  filename: string;
  patch: string;
  seed_id: string;
  log: string;
};

const useOrderedFlags = () => {
  const schema = useSelector(selectSchema);
  const flagValues = useSelector(selectFlagValues);
  return useMemo(() => {
    const keys = Object.keys(schema);
    // list required characters (-rc) just before the starting party (-sc1..4)
    // sequence, regardless of the order the metadata was served in
    const rcIndex = keys.indexOf("-rc");
    const sc1Index = keys.indexOf("-sc1");
    if (rcIndex !== -1 && sc1Index !== -1) {
      keys.splice(rcIndex, 1);
      keys.splice(keys.indexOf("-sc1"), 0, "-rc");
    }
    return keys.reduce((acc, key) => {
      const additional = getFlagValue(key, flagValues[key]);
      return `${acc} ${additional}`.trim();
    }, "");
  }, [flagValues, schema]);
};

export const GenerateCard = ({
  className,
  enableEditing = false,
  ...rest
}: FlagsCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [romData, setRomData] = useState<string | null>(null);
  const [romName, setRomName] = useState("");
  const [romSelectError, setRomSelectError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [copiedReport, setCopiedReport] = useState(false);

  const ext = romName.slice(romName.length - 7, romName.length);
  const displayRomName = !romName
    ? ""
    : romName.length > 20
      ? romName.slice(0, 8).concat("...", ext)
      : romName;

  const flags = useOrderedFlags();
  const router = useRouter();
  const { data: session } = useAppSession();
  const activePresetName = useSelector(selectActivePresetName);
  const lastSelectedPresetName = useSelector(selectLastSelectedPresetName);
  const authFetch = useAuthFetch();

  const [copied, setCopied] = useState(false);
  const [isArchipelagoModalOpen, setIsArchipelagoModalOpen] = useState(false);

  const handleCopyFlags = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(inputFlags).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [isSubmittingPreset, setIsSubmittingPreset] = useState(false);
  const [presetError, setPresetError] = useState<string | null>(null);
  const [lastSavedFlags, setLastSavedFlags] = useState<string | null>(null);

  const handleSavePreset = async () => {
    if (
      hasSevereProfanity(presetName) ||
      hasSevereProfanity(presetDescription)
    ) {
      setPresetError(
        "Preset Name and Description must not contain inappropriate language.",
      );
      return;
    }
    setIsSubmittingPreset(true);
    setPresetError(null);
    try {
      const res = await authFetch("/user-presets", {
        method: "POST",
        body: JSON.stringify({
          name: presetName,
          preset_name: presetName,
          preset_name_lower: presetName.toLowerCase(),
          description: presetDescription,
          flags,
          creator_id: session?.user?.discordId || undefined,
          creator_name: session?.user?.name || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save preset");
      }
      setLastSavedFlags(flags);
      setIsSavingPreset(false);
      setPresetName("");
      setPresetDescription("");
    } catch (e) {
      setPresetError((e as Error).message);
    } finally {
      setIsSubmittingPreset(false);
    }
  };

  const isSaved = lastSavedFlags === flags;

  const { executeRecaptcha } = useGoogleReCaptcha();

  const hasRomData = Boolean(romData);

  useEffect(() => {
    if (!inputRef.current) {
      return;
    }
    const savedRomData = localStorage.getItem("rom_data");
    const savedRomName = localStorage.getItem("rom_name");

    if (savedRomData) {
      setRomData(savedRomData);
      setSuccess(true);
    }

    if (savedRomName) {
      setRomName(savedRomName);
    }
  }, [inputRef]);

  const { error, trigger, isMutating } = useSWRMutation(
    ["/api/generate", flags],
    async (key, { arg }) => {
      const { flags, reCAPTCHA } = arg;
      const result = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/generate`,
        {
          body: JSON.stringify({ reCAPTCHA, flags }),
          headers: {
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );

      if (result.status !== 200) {
        const text = await result.text().catch(() => "");
        let errMsg = `Error creating seed: ${text || result.statusText}`;
        let stderr = undefined;
        let originalFlags = undefined;
        try {
          const parsed = JSON.parse(text);
          if (parsed && typeof parsed === "object") {
            if (parsed.errors) {
              errMsg = Array.isArray(parsed.errors)
                ? parsed.errors.join(", ")
                : String(parsed.errors);
            }
            stderr = parsed.stderr;
            originalFlags = parsed.flags;
          }
        } catch (e) {
          // ignore parsing error, use generic fallback text
        }

        const customErr = new Error(errMsg) as any;
        customErr.stderr = stderr;
        customErr.flags = originalFlags;
        throw customErr;
      }

      const data = await result.json();
      return data as GenerateResponse;
    },
  );

  const generate = async () => {
    if (isMutating) {
      return;
    }
    setClientError(null);

    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.open();
      newWindow.document.write(
        getGeneratingHtml(process.env.NEXT_PUBLIC_API_URL || ""),
      );
      newWindow.document.close();
    }

    let reCAPTCHA: string | null = null;
    try {
      if (!executeRecaptcha) {
        throw new Error(
          "reCAPTCHA security is not available. If you are using an ad-blocker or Brave Shields, please disable them and refresh.",
        );
      }
      reCAPTCHA = await executeRecaptcha("generate_seed");
      if (!reCAPTCHA) {
        throw new Error(
          "Received empty validation token from security engine.",
        );
      }
    } catch (e) {
      if (newWindow) newWindow.close();
      setClientError(
        `Validation Error: ${(e as Error).message || "Ensure you access the app via a whitelisted domain like http://dev.ff6worldscollide.com:3000 (see .env.local) instead of localhost."}`,
      );
      return;
    }

    try {
      const generateResult = await trigger({ flags, reCAPTCHA });
      if (!generateResult) {
        throw new Error("There was an error generating the ROM");
      }
      const { filename, patch, seed_id, log } = generateResult;
      const rom = romData as string;

      const [{ XDelta3Decoder }, { base64ToByteArray }, { applyInGameConfig }] =
        await Promise.all([
          import("~/utils/xdelta3_decoder"),
          import("~/utils/base64ToByteArray"),
          import("~/utils/romUtils"),
        ]);

      const patched = XDelta3Decoder.decode(
        base64ToByteArray(patch as string),
        base64ToByteArray(rom),
      );

      applyInGameConfig(patched);

      const jsz = new JSZip();
      let zip = jsz.file(`${filename}.smc`, patched, { binary: true });
      zip = jsz.file(`${filename}.txt`, log);
      zip.generateAsync({ type: "blob" }).then((content) => {
        var link = document.createElement("a");
        link.href = window.URL.createObjectURL(content);
        link.download = `${filename}.zip`;
        link.click();

        if (newWindow) {
          newWindow.location.href = `/seed/?id=${seed_id}`;
        } else {
          window.open(`/seed/?id=${seed_id}`, "_blank");
        }
      });

      // Track seed generation count in localStorage
      try {
        const currentCount = parseInt(
          localStorage.getItem("seeds_generated") || "0",
          10,
        );
        localStorage.setItem("seeds_generated", String(currentCount + 1));

        // Track most-played preset per user
        if (lastSelectedPresetName) {
          const presetCountKey = "preset_play_counts";
          const existingCounts = JSON.parse(
            localStorage.getItem(presetCountKey) || "{}",
          );
          existingCounts[lastSelectedPresetName] =
            (existingCounts[lastSelectedPresetName] || 0) + 1;
          localStorage.setItem(presetCountKey, JSON.stringify(existingCounts));
        }
      } catch (e) {
        console.error("Failed to track generation stats:", e);
      }

      // Record seed in seedlist database
      try {
        const host =
          typeof window !== "undefined" ? window.location.hostname : "";
        const serverName =
          host === "ff6worldscollide.com"
            ? "ff6worldscollide.com"
            : "dev.ff6worldscollide.com";
        const shareUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/seed/?id=${seed_id}`
            : "";

        authFetch("/seedlist", {
          method: "POST",
          body: JSON.stringify({
            seed_type: lastSelectedPresetName || "ff6wc",
            share_url: shareUrl,
            server_name: serverName,
            flagstring: flags,
          }),
        }).catch((err) =>
          console.error("Failed to record seed to seedlist database:", err),
        );
      } catch (e) {
        console.error("Failed to record seed to seedlist:", e);
      }

      // Update preset download timestamp when generating a seed using a selected preset
      if (lastSelectedPresetName) {
        authFetch("/user-presets", {
          method: "PUT",
          body: JSON.stringify({ flags, presetName: lastSelectedPresetName }),
        }).catch(console.error);

        // Record download time for official/custom presets in local storage
        if (session?.user) {
          const discordId = (session.user as any).discordId;
          if (discordId) {
            try {
              localStorage.setItem(
                `preset_real_dl:${discordId}:${lastSelectedPresetName}`,
                new Date().toISOString(),
              );
            } catch (e) {
              console.error(
                "Failed to write preset download to localStorage:",
                e,
              );
            }
          }
        }
      }
    } catch (err) {
      if (newWindow) newWindow.close();
      setClientError((err as Error).message);
    }
  };

  const clearRomValues = () => {
    localStorage.removeItem("rom_name");
    localStorage.removeItem("rom_data");
    setRomName("");
    setRomData(null);
    setSuccess(false);
    setRomSelectError(null);
  };

  const onRomSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = first(e.target.files);
    const reader = new FileReader();
    if (file) {
      reader.onload = async function () {
        let rom_data = new Uint8Array(reader.result as ArrayBuffer);
        const { removeHeader, isValidROM } = await import("~/utils/romUtils");
        rom_data = await removeHeader(rom_data);

        let result = await isValidROM(rom_data);
        if (!result.success) {
          setRomSelectError(`${result.message}`);
          return;
        }

        let data_string = "";
        let data_length = rom_data.byteLength;

        for (let i = 0; i < data_length; i++) {
          data_string += String.fromCharCode(rom_data[i]);
        }

        data_string = btoa(data_string);

        setSuccess(true);
        setRomSelectError(null);

        try {
          localStorage.setItem("rom_data", data_string);
          localStorage.setItem("rom_name", file.name);
          setRomData(data_string);
          setRomName(file.name);
        } catch (e) {
          return;
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };

  const showDisabledText = !romData;
  const dispatch = useDispatch();
  const [inputFlags, setInputFlags] = useState("");

  // Extract error object once to avoid repeated `(clientError || error) as any` casts
  const activeError = (clientError || error) as any;
  const activeErrorMessage = activeError?.message || activeError?.toString();
  const activeErrorStderr = activeError?.stderr;
  const activeErrorFlags = activeError?.flags || flags || "Unknown";

  useEffect(() => {
    setInputFlags(flags);
  }, [flags]);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Generate Your ROM</h2>

      <div className={styles.stepContainer}>
        <h3 className={styles.stepTitle}>Step 1: Review Flags</h3>
        <textarea
          className={styles.textarea}
          onBlur={(e) => {
            const val = e.target.value;
            dispatch(setRawFlags(val));
            dispatch(setRawObjectives(val));
            dispatch(setRawStartingItems(val));
          }}
          onChange={(e) => setInputFlags(e.target.value)}
          onPaste={(e) => {
            e.preventDefault();
            const pastedText = e.clipboardData.getData("text");
            dispatch(setRawFlags(pastedText));
            dispatch(setRawObjectives(pastedText));
            dispatch(setRawStartingItems(pastedText));
          }}
          value={inputFlags}
          placeholder="Your selected flags will appear here..."
        />

        <div className="mt-3 flex justify-between items-center w-full">
          <div>
            {session?.user ? (
              !isSavingPreset && (
                <button
                  className={`text-sm font-bold py-1.5 px-4 rounded shadow transition-colors ${
                    isSaved
                      ? "bg-emerald-600 text-white cursor-default opacity-80"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                  onClick={() => !isSaved && setIsSavingPreset(true)}
                  disabled={isSaved}
                >
                  {isSaved ? "✓ Preset Saved" : "Save as Preset"}
                </button>
              )
            ) : (
              <span className="text-xs text-slate-400 block italic">
                Log in to save these flags as a preset.
              </span>
            )}
          </div>

          <button
            onClick={handleCopyFlags}
            className="text-sm font-bold py-1.5 px-4 rounded shadow bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center gap-1.5"
          >
            {copied ? <FaCheck /> : <FaCopy />}
            {copied ? "Copied!" : "Copy Flags"}
          </button>
        </div>

        {session?.user && isSavingPreset && (
          <div className="p-4 bg-slate-800 border border-slate-700 rounded-md mt-2 flex flex-col gap-3 shadow-inner w-full">
            <h4 className="text-sm font-bold text-blue-400 m-0">
              Save New Preset
            </h4>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset Name"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <textarea
              value={presetDescription}
              onChange={(e) => setPresetDescription(e.target.value)}
              placeholder="Description (Optional)"
              rows={2}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-2 justify-end mt-1">
              <button
                className="text-sm bg-slate-600 hover:bg-slate-500 text-white font-bold py-1.5 px-4 rounded transition-colors"
                onClick={() => {
                  setIsSavingPreset(false);
                  setPresetName("");
                  setPresetDescription("");
                }}
              >
                Cancel
              </button>
              <button
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!presetName.trim() || isSubmittingPreset}
                onClick={handleSavePreset}
              >
                {isSubmittingPreset ? "Saving..." : "Save Preset"}
              </button>
            </div>
            {presetError && (
              <span className="text-xs text-red-400">{presetError}</span>
            )}
          </div>
        )}
        <FlagSummary />
      </div>

      <div className={styles.divider} />

      <div className={styles.stepContainer}>
        <h3 className={styles.stepTitle}>Step 2: Select your v1.0 US ROM</h3>
        <GenerateUpload
          clearRomValues={clearRomValues}
          hasRomData={hasRomData}
          romName={romName}
          shortRomName={displayRomName}
          error={romSelectError}
          inputRef={inputRef}
          onRomSelect={onRomSelect}
          success={success}
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.stepContainer}>
        <h3 className={styles.stepTitle}>Step 3: Generate Options</h3>
        <div className="flex flex-col gap-4 mb-4">
          <FlagTextInput
            flag="-s"
            description="Games generated with the same seed and flags will be identical. When empty, a random seed will be generated"
            label="Seed"
            placeholder="Use Random Seed"
          />
          <FlagSwitch flag="-sl" label="Spoiler Log" />
        </div>

        {showDisabledText && (
          <span className={styles.helperText}>
            This button will be disabled until a valid ROM is selected.
          </span>
        )}

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <button
            className={styles.generateButton}
            disabled={!hasRomData || isMutating}
            onClick={generate}
          >
            {isMutating ? "Generating..." : "Generate ROM"}
          </button>

          <button
            type="button"
            className="px-6 py-3 rounded-lg font-bold text-base border border-indigo-500/50 hover:border-indigo-500 hover:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-all select-none active:scale-[0.98]"
            onClick={() => setIsArchipelagoModalOpen(true)}
          >
            Generate Archipelago YAML
          </button>
        </div>

        {activeError && (
          <div className={styles.error}>
            <div>{activeErrorMessage}</div>
            {activeErrorStderr && (
              <div className="mt-4 p-4 bg-slate-900 border border-red-950 rounded-md text-left flex flex-col gap-3 shadow-inner">
                <div className="text-xs font-bold text-red-400 uppercase tracking-wider">
                  System Error Log (wc.py)
                </div>

                <div className="text-sm text-slate-300 block italic leading-relaxed">
                  Please report this issue in the{" "}
                  <a
                    href="https://discord.com/channels/666661907628949504/666811452350398493"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 underline hover:text-blue-300 font-bold"
                  >
                    #bug-reports
                  </a>{" "}
                  channel on the Discord. You can copy the diagnostic details
                  block below to include in your report.
                </div>

                <div className="relative">
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded font-mono text-xs overflow-x-auto text-red-300 max-h-60 leading-normal select-all">
                    {`[Seed Generation Error Report]
Flags: ${activeErrorFlags}
Error Detail:
${activeErrorStderr}`}
                  </pre>
                  <button
                    onClick={() => {
                      const reportText = `[Seed Generation Error Report]\nFlags: ${activeErrorFlags}\nError Detail:\n${activeErrorStderr}`;
                      if (
                        typeof window !== "undefined" &&
                        navigator.clipboard
                      ) {
                        navigator.clipboard.writeText(reportText).then(() => {
                          setCopiedReport(true);
                          setTimeout(() => setCopiedReport(false), 2000);
                        });
                      }
                    }}
                    className="absolute top-2 right-2 text-xs font-bold py-1 px-2.5 rounded shadow bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                  >
                    {copiedReport ? "✓ Copied!" : "Copy Report Details"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <ArchipelagoYamlModal
        isOpen={isArchipelagoModalOpen}
        onClose={() => setIsArchipelagoModalOpen(false)}
        flags={flags}
        presetName={lastSelectedPresetName || "ff6wc"}
        userName={session?.user?.name}
      />
    </div>
  );
};
