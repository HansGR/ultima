import { CodeBlock, HelperText, Input, Link } from "@ff6wc/ui";
import first from "lodash/first";
import { useEffect, useMemo, useRef, useState } from "react";
import { MdClear, MdFileUpload } from "react-icons/md";
import { useDispatch, useSelector } from "react-redux";
import useSWRMutation from "swr/mutation";
import { getFlagValue, selectFlagValues, setRawFlags } from "~/state/flagSlice";
import { base64ToByteArray } from "~/utils/base64ToByteArray";
import { isValidROM, removeHeader, applyInGameConfig } from "~/utils/romUtils";
import { XDelta3Decoder } from "~/utils/xdelta3_decoder";
import JSZip from "jszip";
import { useRouter } from "next/router";
import { selectSchema } from "~/state/schemaSlice";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { GenerateUpload } from "~/components/GenerateUpload/GenerateUpload";
import { FlagTextInput } from "~/components/FlagInput/FlagInput";
import { FlagSwitch } from "~/components/FlagSwitch/FlagSwitch";
import styles from "./GenerateCard.module.css";

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

  const ext = romName.slice(romName.length - 7, romName.length);
  const displayRomName = !romName
    ? ""
    : romName.length > 20
      ? romName.slice(0, 8).concat("...", ext)
      : romName;

  const flags = useOrderedFlags();
  const router = useRouter();

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
        const error = await result.text();
        throw new Error(`Error creating seed: ${error}`);
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
      setClientError(
        `Validation Error: ${(e as Error).message || "Ensure you access the app via a whitelisted domain like http://dev.ff6worldscollide.com:3001 (see .env.local) instead of localhost."}`,
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
        window.open(`/seed/?id=${seed_id}`, "_blank");
      });
    } catch (err) {
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
          onBlur={(e) => dispatch(setRawFlags(e.target.value))}
          onChange={(e) => setInputFlags(e.target.value)}
          value={inputFlags}
          placeholder="Your selected flags will appear here..."
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.stepContainer}>
        <h3 className={styles.stepTitle}>Step 2: Provide Base ROM</h3>
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

        <button
          className={styles.generateButton}
          disabled={!hasRomData || isMutating}
          onClick={generate}
        >
          {isMutating ? "Generating..." : "Generate ROM"}
        </button>

        {(clientError || error) && (
          <div className={styles.error}>
            {(clientError || error)?.toString()}
          </div>
        )}
      </div>
    </div>
  );
};
