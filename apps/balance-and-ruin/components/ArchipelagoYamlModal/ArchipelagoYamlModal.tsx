import React, { useEffect, useState } from "react";
import { MdClear } from "react-icons/md";
import { HiOutlineBookOpen } from "react-icons/hi";
import { generateArchipelagoYaml, downloadYamlFile } from "~/utils/archipelago";

interface ArchipelagoYamlModalProps {
  isOpen: boolean;
  onClose: () => void;
  flags: string;
  presetName: string;
  userName?: string | null;
}

export const ArchipelagoYamlModal: React.FC<ArchipelagoYamlModalProps> = ({
  isOpen,
  onClose,
  flags,
  presetName,
  userName,
}) => {
  const [playerName, setPlayerName] = useState("Player");
  const [appendNumberSfx, setAppendNumberSfx] = useState(false);
  const [scaling, setScaling] = useState<"unchanged" | "safe">("unchanged");
  const [treasuresanity, setTreasuresanity] = useState<
    "off" | "on" | "on_with_additional_gating"
  >("off");

  const getFinalPlayerName = (name: string, append: boolean) => {
    if (!append) return name;
    return `${name.slice(0, 12)}{number}`;
  };

  useEffect(() => {
    if (isOpen) {
      const defaultName = userName
        ? `${userName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10)}_WC`
        : "Player";
      setPlayerName(defaultName);
      setAppendNumberSfx(false);
      setScaling("unchanged");
      setTreasuresanity("off");
    }
  }, [isOpen, userName]);

  // Handle Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { content, filename } = generateArchipelagoYaml(
      flags,
      treasuresanity,
      scaling,
      getFinalPlayerName(playerName, appendNumberSfx),
      presetName,
    );
    downloadYamlFile(content, filename);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all transform scale-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-outfit uppercase tracking-wider">
            Archipelago YAML Settings
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close"
          >
            <MdClear size={22} />
          </button>
        </div>

        {/* Form Body */}
        <form
          id="archipelago-yaml-form"
          onSubmit={handleSubmit}
          className="flex-grow overflow-y-auto p-6 flex flex-col gap-6"
        >
          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-200 text-sm leading-relaxed flex flex-col gap-3 shadow-inner">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 text-indigo-500 dark:text-indigo-400">
                💡
              </span>
              <p>
                <strong>Archipelago</strong> is a cross-game modification system
                which randomizes different games, then uses the result to build
                a single unified multi-player game. Items from one game may be
                present in another, and you will need your fellow players to
                find items you need in their games to help you complete your
                own.
              </p>
            </div>
            <a
              href="https://docs.google.com/document/d/1ZN-eO3ZasTEAReGCRP7l9tgI-kEh0GG4gJxVv7JOlyk/edit?tab=t.0#heading=h.1zborqwokvgu"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 self-start text-xs font-bold text-indigo-700 dark:text-indigo-350 hover:text-indigo-900 dark:hover:text-indigo-200 underline transition-colors"
            >
              <HiOutlineBookOpen size={15} />
              Read the FF6WC Archipelago Guide
            </a>
          </div>

          {/* Player Name */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Player Name
            </label>
            <input
              type="text"
              required
              maxLength={16}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Player or HeroName"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans text-sm"
            />

            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={appendNumberSfx}
                onChange={(e) => setAppendNumberSfx(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20"
              />
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                Append slot number suffix (<code>{"{number}"}</code>)
              </span>
            </label>

            <div className="mt-1 p-2 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                YAML Slot Name Preview:
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {getFinalPlayerName(playerName, appendNumberSfx)}
              </span>
            </div>

            {appendNumberSfx && playerName.length > 12 && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Player name trimmed to 12 characters to reserve space for
                slot suffix.
              </span>
            )}
          </div>

          {/* Scaling */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 m-0">
              Scaling
            </h4>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="scaling"
                  value="unchanged"
                  checked={scaling === "unchanged"}
                  onChange={() => setScaling("unchanged")}
                  className="mt-1 accent-indigo-500"
                />
                <span className="flex flex-col gap-0.5 text-sm text-slate-900 dark:text-slate-100 font-medium">
                  Unchanged
                  <span className="text-xs text-slate-400 font-normal leading-normal">
                    Uses the flagset&apos;s scaling. Caution: character/esper
                    scaling can be very difficult.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="scaling"
                  value="safe"
                  checked={scaling === "safe"}
                  onChange={() => setScaling("safe")}
                  className="mt-1 accent-indigo-500"
                />
                <span className="flex flex-col gap-0.5 text-sm text-slate-900 dark:text-slate-100 font-medium">
                  Safe
                  <span className="text-xs text-slate-400 font-normal leading-normal">
                    Changes all scaling to &quot;Check&quot; scaling to prevent
                    dangerous difficulty spikes.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Treasuresanity */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 m-0">
              Treasuresanity
            </h4>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="treasuresanity"
                  value="off"
                  checked={treasuresanity === "off"}
                  onChange={() => setTreasuresanity("off")}
                  className="mt-1 accent-indigo-500"
                />
                <span className="flex flex-col gap-0.5 text-sm text-slate-900 dark:text-slate-100 font-medium">
                  Off
                  <span className="text-xs text-slate-400 font-normal leading-normal">
                    Treasure chests will not be shuffled into the multiworld.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="treasuresanity"
                  value="on"
                  checked={treasuresanity === "on"}
                  onChange={() => setTreasuresanity("on")}
                  className="mt-1 accent-indigo-500"
                />
                <span className="flex flex-col gap-0.5 text-sm text-slate-900 dark:text-slate-100 font-medium">
                  On
                  <span className="text-xs text-slate-400 font-normal leading-normal">
                    Treasure chests will be shuffled into the multiworld.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-150 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name="treasuresanity"
                  value="on_with_additional_gating"
                  checked={treasuresanity === "on_with_additional_gating"}
                  onChange={() =>
                    setTreasuresanity("on_with_additional_gating")
                  }
                  className="mt-1 accent-indigo-500"
                />
                <span className="flex flex-col gap-0.5 text-sm text-slate-900 dark:text-slate-100 font-medium">
                  On with Additional Gating
                  <span className="text-xs text-slate-400 font-normal leading-normal">
                    Chests are shuffled and logically require the character of
                    that map to access.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="archipelago-yaml-form"
            className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          >
            Generate YAML
          </button>
        </div>
      </div>
    </div>
  );
};
