import { cx } from "cva";
import first from "lodash/first";
import { useEffect, useRef, useState } from "react";
import { base64ToByteArray } from "~/utils/base64ToByteArray";
import { isValidROM, removeHeader, applyInGameConfig } from "~/utils/romUtils";
import { XDelta3Decoder } from "~/utils/xdelta3_decoder";
import JSZip from "jszip";
import styles from "~/components/GenerateCard/GenerateCard.module.css";

export type SeedData = {
  created_at: number;
  created_by: string | null;
  description: string | null;
  flags: string;
  filename: string;
  hash: string;
  log: string;
  patch: string;
  seed_id: string;
  url: string;
  version: string;
};

export type SeedCardProps = {
  className?: string;
  seed: SeedData;
};

export const SeedCard = ({ className, seed }: SeedCardProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [romData, setRomData] = useState<string | null>(null);
  const [romName, setRomName] = useState("");
  const [romSelectError, setRomSelectError] = useState<string | null>(null);

  const hasRomData = Boolean(romData);

  const ext = romName.slice(romName.length - 7, romName.length);
  const displayRomName = !romName
    ? ""
    : romName.length > 20
      ? romName.slice(0, 8).concat("...", ext)
      : romName;

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

  const executeGenerate = async (currentRomData: string) => {
    const { filename, patch, log } = seed;

    const patched = XDelta3Decoder.decode(
      base64ToByteArray(patch as string),
      base64ToByteArray(currentRomData),
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
    });
  };

  const handleGenerateClick = () => {
    if (romData) {
      executeGenerate(romData);
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
          setRomSelectError(`${result.message}`);
          return;
        }

        let data_string = "";
        let data_length = rom_data.byteLength;

        for (let i = 0; i < data_length; i++) {
          data_string += String.fromCharCode(rom_data[i]);
        }

        data_string = btoa(data_string);

        setRomSelectError(null);

        try {
          localStorage.setItem("rom_data", data_string);
          localStorage.setItem("rom_name", file.name);
          setRomData(data_string);
          setRomName(file.name);
          
          // Immediately trigger generate upon selection
          await executeGenerate(data_string);
        } catch (e) {
          return;
        }
      };

      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className={cx(styles.container, className)}>
      <div className="flex flex-col items-center text-center gap-6 py-6 w-full">
        <h2 className={cx(styles.title, "w-full text-center pb-4")}>Generate Your ROM</h2>
        
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-md font-sans font-medium mt-2">
          {hasRomData 
            ? `Your base ROM (${displayRomName}) is loaded and ready.` 
            : "Load your base ROM to patch and download this seed instantly."}
        </p>

        <button
          className={cx(styles.generateButton, "w-full sm:w-auto min-w-[220px] justify-center flex items-center gap-2 px-8 py-3.5 font-bold text-base transition-all duration-200 shadow-md active:scale-95 hover:shadow-lg self-center mt-4")}
          onClick={handleGenerateClick}
        >
          Generate ROM
        </button>

        {romSelectError && (
          <div className="text-red-500 dark:text-red-400 font-medium text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 mt-4 font-sans">
            {romSelectError}
          </div>
        )}

        <input
          className="hidden"
          id="rom_file_picker"
          ref={inputRef}
          name="rom"
          onChange={onRomSelect}
          type="file"
          accept=".smc,.sfc"
        />
      </div>
    </div>
  );
};


