export const applySafeScaling = (flagstring: string): string => {
  const flagsToRemove = [
    "lsa",
    "lsh",
    "lsce",
    "lsced",
    "lsc",
    "lst",
    "lsbd",
    "hma",
    "hmh",
    "hmce",
    "hmced",
    "hmc",
    "hmt",
    "hmbd",
    "xga",
    "xgh",
    "xgce",
    "xgced",
    "xgc",
    "xgt",
    "xgbd",
  ];

  // Split flagstring into chunks separated by spaces followed by a hyphen
  const flagChunks = flagstring
    .trim()
    .split(/\s+(?=-)/)
    .filter(Boolean);

  const filteredChunks = flagChunks.filter((chunk) => {
    const firstWord = chunk.split(/\s+/)[0];
    const flagName = firstWord.replace(/^-+/, ""); // strip leading hyphens
    return !flagsToRemove.includes(flagName);
  });

  const safeFlags = "-lsc 2 -hmc 2 -xgc 2";
  return [...filteredChunks, safeFlags].join(" ").trim();
};

export const generateArchipelagoYaml = (
  flags: string,
  treasuresanity: string,
  scaling: string,
  playerName: string,
  presetName?: string,
): { content: string; filename: string } => {
  const finalFlags = scaling === "safe" ? applySafeScaling(flags) : flags;

  // Determine host dynamically
  const host =
    typeof window !== "undefined"
      ? window.location.hostname
      : "ff6worldscollide.com";
  const displayHost = host.includes("dev")
    ? "dev.ff6worldscollide.com"
    : "ff6worldscollide.com";

  const escapedFlags = finalFlags.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const escapedPlayerName = playerName
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"');

  // Replicate seedbot template yaml with placeholders, wrapping names and flagstrings in double quotes to prevent special char syntax errors.
  const templateYaml = `Final Fantasy 6 Worlds Collide:
  progression_balancing: 50
  accessibility: full
  EnableFlagstring: "true"
  Flagstring: "${escapedFlags}"
  Treasuresanity: ${treasuresanity}
description: 'Generated on ${displayHost}'
game: Final Fantasy 6 Worlds Collide
name: "${escapedPlayerName}"
`;

  const sanitizedPresetName = presetName
    ? presetName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
    : "archipelago";

  const filename = `${sanitizedPresetName}.yaml`;

  return { content: templateYaml, filename };
};

export const downloadYamlFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/yaml;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
