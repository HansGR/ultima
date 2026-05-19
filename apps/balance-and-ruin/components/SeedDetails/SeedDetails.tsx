import { useEffect, useRef, useState } from "react";
import { Card } from "@ff6wc/ui";
import { HiClipboardCopy, HiCheck, HiPlay } from "react-icons/hi";
import { CardColumn } from "~/components/CardColumn/CardColumn";
import { SeedData } from "~/components/SeedCard/SeedCard";
import first from "lodash/first";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import useSWRMutation from "swr/mutation";
import { base64ToByteArray } from "~/utils/base64ToByteArray";
import { isValidROM, removeHeader, applyInGameConfig } from "~/utils/romUtils";
import { XDelta3Decoder } from "~/utils/xdelta3_decoder";
import JSZip from "jszip";

export type SeedDetailsProps = {
  seedId: string;
};

type GenerateResponse = {
  filename: string;
  patch: string;
  seed_id: string;
  log: string;
};

export const SeedDetails = ({ seedId }: SeedDetailsProps) => {
  const [seed, setSeed] = useState<SeedData | null>(null);
  const [logWithFlags, setLogWithFlags] = useState("");
  const [copied, setCopied] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const [romData, setRomData] = useState<string | null>(null);
  const [romName, setRomName] = useState("");
  const [errorState, setErrorState] = useState<string | null>(null);

  const { executeRecaptcha } = useGoogleReCaptcha();

  // Pre-load ROM data cached in local storage
  useEffect(() => {
    const savedRomData = localStorage.getItem("rom_data");
    const savedRomName = localStorage.getItem("rom_name");
    if (savedRomData) {
      setRomData(savedRomData);
    }
    if (savedRomName) {
      setRomName(savedRomName);
    }
  }, []);

  const handleCopy = () => {
    if (seed?.flags) {
      navigator.clipboard.writeText(seed.flags);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (seedId) {
      const url = `${process.env.NEXT_PUBLIC_API_URL}/api/seed/ff6wc/${seedId}`;
      fetch(url)
        .then((res) => res.json())
        .then(({ data: seed, errors }) => {
          if (seed) {
            setSeed(seed);
            setLogWithFlags(seed.log);
          } else {
            setLogWithFlags(`Error retrieving seed: ${errors}`);
          }
        });
    } else {
      setLogWithFlags("No id given.");
    }
  }, [seedId]);

  // API mutation definition for rolling a brand new seed
  const { trigger, isMutating } = useSWRMutation(
    ["/api/generate", seed?.flags],
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
        const error = await result.text();
        throw new Error(`Error generating seed: ${error}`);
      }

      const data = await result.json();
      return data as GenerateResponse;
    },
  );

  const rollNewSeed = async (currentRomData: string) => {
    if (!seed?.flags || isMutating) {
      return;
    }
    setErrorState(null);

    let reCAPTCHA: string | null = null;
    try {
      if (!executeRecaptcha) {
        throw new Error(
          "reCAPTCHA validation engine is not loaded. Please check for script blockages.",
        );
      }
      reCAPTCHA = await executeRecaptcha("generate_seed");
      if (!reCAPTCHA) {
        throw new Error("Could not extract recaptcha confirmation payload.");
      }
    } catch (e) {
      setErrorState(
        `Validation Error: ${(e as Error).message || "Failed to verify recaptcha."}`,
      );
      return;
    }

    try {
      const generateResult = await trigger({ flags: seed.flags, reCAPTCHA });
      if (!generateResult) {
        throw new Error("Generate script finished without producing a payload.");
      }

      const { filename, patch, seed_id, log } = generateResult;

      // Perform standard base ROM patching stream using standard decoder logic
      const patched = XDelta3Decoder.decode(
        base64ToByteArray(patch),
        base64ToByteArray(currentRomData),
      );

      applyInGameConfig(patched);

      // Zip the components and release as file attachment stream
      const jsz = new JSZip();
      let zip = jsz.file(`${filename}.smc`, patched, { binary: true });
      zip = jsz.file(`${filename}.txt`, log);
      await zip.generateAsync({ type: "blob" }).then((content) => {
        var link = document.createElement("a");
        link.href = window.URL.createObjectURL(content);
        link.download = `${filename}.zip`;
        link.click();
      });

      // Pop out to the resulting seed details route natively
      window.open(`/seed/?id=${seed_id}`, "_blank");
    } catch (err) {
      setErrorState((err as Error).message);
    }
  };

  const handleGenerateClick = () => {
    if (romData) {
      rollNewSeed(romData);
    } else {
      inputRef.current?.click();
    }
  };

  const onRomSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = first(e.target.files);
    const reader = new FileReader();
    if (file) {
      reader.onload = async function () {
        let rom_data = new Uint8Array(reader.result as ArrayBuffer);
        rom_data = await removeHeader(rom_data);

        let result = await isValidROM(rom_data);
        if (!result.success) {
          setErrorState(`${result.message}`);
          return;
        }

        let data_string = "";
        let data_length = rom_data.byteLength;

        for (let i = 0; i < data_length; i++) {
          data_string += String.fromCharCode(rom_data[i]);
        }

        data_string = btoa(data_string);
        setErrorState(null);

        try {
          localStorage.setItem("rom_data", data_string);
          localStorage.setItem("rom_name", file.name);
          setRomData(data_string);
          setRomName(file.name);

          // Seamless execution flow immediately upon validation success
          await rollNewSeed(data_string);
        } catch (e) {
          return;
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="w-full shadow-lg" title={"Log"}>
        <CardColumn>
          <textarea
            className="w-full min-h-[400px] max-h-[900px] p-6 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg font-mono text-[0.9rem] text-[var(--text-input)] resize-y leading-relaxed focus:outline-none select-all col-span-full shadow-inner overflow-y-auto"
            readOnly
            value={logWithFlags ? logWithFlags : "Loading..."}
          />

          {seed && (
            <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700 flex flex-col gap-3 w-full col-span-full">
              <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                Flags Used
              </h3>
              <div className="flex flex-col gap-3 w-full">
                <textarea
                  className="w-full min-h-[150px] max-h-[300px] p-4 bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg font-mono text-[0.9rem] text-[var(--text-input)] resize-y leading-relaxed focus:outline-none select-all shadow-inner"
                  readOnly
                  value={seed.flags}
                />
                <div className="flex flex-col items-end gap-2 mt-1">
                  {errorState && (
                    <span className="text-xs font-medium text-red-500 dark:text-red-400 mb-1 bg-red-500/5 px-3 py-1 rounded border border-red-500/10">
                      {errorState}
                    </span>
                  )}
                  <div className="flex justify-end gap-3 items-center flex-wrap">
                    <button
                      onClick={handleCopy}
                      className={`whitespace-nowrap flex items-center justify-center gap-2 transition-all duration-200 px-6 py-2.5 rounded-lg font-semibold font-sans text-sm border shadow-sm outline-none select-none active:scale-[0.98] ${
                        copied
                          ? "border-green-500 text-green-600 bg-green-50 hover:bg-green-100"
                          : "border-slate-300 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400"
                      }`}
                    >
                      {copied ? (
                        <HiCheck size={18} className="text-green-600" />
                      ) : (
                        <HiClipboardCopy size={18} className="text-slate-600" />
                      )}
                      <span
                        className={copied ? "text-green-600" : "text-slate-700"}
                      >
                        {copied ? "Copied!" : "Copy Flags"}
                      </span>
                    </button>

                    <button
                      onClick={handleGenerateClick}
                      disabled={isMutating}
                      className="whitespace-nowrap flex items-center justify-center gap-2 transition-all duration-200 px-6 py-2.5 rounded-lg font-bold font-sans text-sm text-white bg-[#2c3859] hover:bg-[#1e293b] active:scale-[0.98] shadow-sm outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <HiPlay size={18} />
                      <span>
                        {isMutating ? "Generating..." : "Generate Another ROM"}
                      </span>
                    </button>

                    <input
                      className="hidden"
                      id="rom_file_picker_inline"
                      ref={inputRef}
                      name="rom"
                      onChange={onRomSelect}
                      type="file"
                      accept=".smc,.sfc"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardColumn>
      </Card>
    </div>
  );
};

