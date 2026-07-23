import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import { selectFlagValues, selectRawFlags } from "~/state/flagSlice";
import { selectObjectives } from "~/state/objectiveSlice";
import { selectActivePresetName } from "~/state/presetSlice";
import styles from "./FlagSummary.module.css";

// ─── Objective result IDs ─────────────────────────────────────────────────────
const RESULT_FINAL_KEFKA = "2";
const RESULT_KT_SKIP = "3";

// Condition type IDs (from objective.json)
const COND_NONE = "0";
const COND_CHARACTERS = "2";
const COND_ESPERS = "4";
const COND_DRAGONS = "6";
const COND_BOSSES = "8";
const COND_CHECKS = "10";

// Command ID → name
const COMMAND_NAMES: Record<number, string> = {
  97: "None",
  0: "Fight",
  1: "Item",
  2: "Magic",
  3: "Morph",
  4: "Revert",
  5: "Steal",
  6: "Capture",
  7: "SwdTech",
  8: "Throw",
  9: "Tools",
  10: "Blitz",
  11: "Runic",
  12: "Lore",
  13: "Sketch",
  14: "Control",
  15: "Slot",
  16: "Rage",
  17: "Leap",
  18: "Mimic",
  19: "Dance",
  20: "Row",
  21: "Defend",
  22: "Jump",
  23: "X-Magic",
  24: "GP Rain",
  25: "Summon",
  26: "Health",
  27: "Shock",
  28: "Possess",
  29: "Magitek",
};

// ─── Standard Atma Series baseline values ────────────────────────────────────
// Deviations from these produce difficulty score changes.
// A seed matching all these values should score in "Standard" range.
//   lsced 2×, hmced 2×, xpm 3, mpm 5, gpm 5, nxppd (full XP)
//   bbs (boss shuffle), escr 100, esr 2–5, elrt
//   ccsr 20, sisr 20, rec1=28(Possess) rec2=27(Shock)
//   gp 5000, csrp 80–125, msl 40

type BulletSeverity = "hard" | "medium" | "easy" | "info";
interface Bullet {
  text: string;
  severity: BulletSeverity;
}

const SCALING_FLAGS = [
  "-lsa",
  "-lsh",
  "-lsce",
  "-lsced",
  "-lsc",
  "-lst",
  "-lsbd",
];
const HP_FLAGS = ["-hma", "-hmh", "-hmce", "-hmced", "-hmc", "-hmt", "-hmbd"];
const XP_GP_REWARD_FLAGS = [
  "-xga",
  "-xgh",
  "-xgce",
  "-xgced",
  "-xgc",
  "-xgt",
  "-xgbd",
];

const SCALING_LABEL: Record<string, string> = {
  "-lsa": "party avg level",
  "-lsh": "highest party level",
  "-lsce": "chars + espers",
  "-lsced": "chars, espers & dragons",
  "-lsc": "checks completed",
  "-lst": "time elapsed",
  "-lsbd": "bosses & dragons",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hasFlag(fv: Record<string, any>, flag: string): boolean {
  const v = fv[flag];
  return v !== null && v !== undefined && v !== false && v !== "";
}
function flagNum(fv: Record<string, any>, flag: string): number | null {
  const v = fv[flag];
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return parseFloat(String(v[0]));
  const n = parseFloat(String(v));
  return isNaN(n) ? null : n;
}
function flagNumArr(fv: Record<string, any>, flag: string): number[] | null {
  const v = fv[flag];
  if (!Array.isArray(v)) return null;
  const nums = (v as any[])
    .map((x) => parseFloat(String(x)))
    .filter((x) => !isNaN(x));
  return nums.length > 0 ? nums : null;
}
function flagStr(fv: Record<string, any>, flag: string): string | null {
  const v = fv[flag];
  if (v === null || v === undefined) return null;
  return String(v);
}

// Objective format: resultId.minRequired.maxRequired[.condId.val1[.val2]...]
function parseObjectiveValue(raw: string) {
  const parts = raw.split(".");
  const resultId = parts[0] ?? "0";
  const min = parseInt(parts[1] ?? "0", 10);
  const max = parseInt(parts[2] ?? "0", 10);
  return {
    resultId,
    minRequired: isNaN(min) ? 0 : min,
    maxRequired: isNaN(max) ? 0 : max,
  };
}

function describeObjectiveConditions(objective: any): string {
  if (!objective?.conditions?.length) return "";
  return (objective.conditions as any[])
    .filter((c) => c.id !== COND_NONE && c.id !== "0")
    .map((c) => {
      const vals = c.values ?? [];
      if (c.id === COND_CHARACTERS || c.id === "2")
        return vals[1] ? `${vals[0]}–${vals[1]} chars` : `${vals[0]} chars`;
      if (c.id === COND_ESPERS || c.id === "4")
        return vals[1] ? `${vals[0]}–${vals[1]} espers` : `${vals[0]} espers`;
      if (c.id === COND_DRAGONS || c.id === "6")
        return vals[1] ? `${vals[0]}–${vals[1]} dragons` : `${vals[0]} dragons`;
      if (c.id === COND_BOSSES || c.id === "8")
        return vals[1] ? `${vals[0]}–${vals[1]} bosses` : `${vals[0]} bosses`;
      if (c.id === COND_CHECKS || c.id === "10")
        return vals[1] ? `${vals[0]}–${vals[1]} checks` : `${vals[0]} checks`;
      return c.name ?? c.id;
    })
    .filter(Boolean)
    .join(", ");
}

// ─── Info panel rows ──────────────────────────────────────────────────────────
interface InfoRow {
  label: string;
  value: string;
  highlight?: boolean;
}

function buildInfoRows(
  fv: Record<string, any>,
  objectives: Record<string, any>,
): InfoRow[] {
  const rows: InfoRow[] = [];

  // Game Mode
  if (hasFlag(fv, "-open")) {
    rows.push({ label: "Game Mode", value: "Open World" });
  } else if (hasFlag(fv, "-cg")) {
    rows.push({ label: "Game Mode", value: "Character Gating" });
  } else {
    rows.push({ label: "Game Mode", value: "Standard" });
  }

  // Starting party
  const formatChar = (c: string | null) =>
    c === "random"
      ? "Random"
      : c === "randomngu"
        ? "Random (No Gogo/Umaro)"
        : (c ?? "?").charAt(0).toUpperCase() + (c ?? "?").slice(1);
  const startChars = ["-sc1", "-sc2", "-sc3", "-sc4"]
    .map((f) => flagStr(fv, f))
    .filter(Boolean);
  // -rc: required characters are also starting characters (see StartingParty)
  const rcRaw = fv["-rc"];
  const requiredChars: string[] = Array.isArray(rcRaw)
    ? rcRaw.map(String)
    : typeof rcRaw === "string"
      ? rcRaw.split(" ").filter(Boolean)
      : [];
  if (startChars.length || requiredChars.length) {
    const charList = startChars
      .map((c) => formatChar(c))
      .concat(requiredChars.map((c) => `${formatChar(c)} [required]`));
    rows.push({
      label: "Starting Party",
      value: `${charList.length} characters (${charList.join(", ")})`,
    });
  }

  // No Free Characters/Espers (-nfce)
  if (hasFlag(fv, "-nfce")) {
    rows.push({
      label: "Challenges",
      value: "No Free Characters / Espers",
      highlight: true,
    });
  }

  // Final Kefka conditions
  const kefkaObjs = Object.values(objectives).filter(
    (o: any) => o?.result?.id === RESULT_FINAL_KEFKA,
  );
  if (kefkaObjs.length > 0) {
    const obj = kefkaObjs[0] as any;
    const { minRequired } = parseObjectiveValue(
      flagStr(fv, obj.flag) ?? "2.0.0",
    );
    const conds = describeObjectiveConditions(obj);
    rows.push({
      label: "Final Kefka",
      value: conds
        ? `${minRequired} of: ${conds}`
        : minRequired > 0
          ? `${minRequired} condition(s) required`
          : "No conditions set",
    });
  }

  // KT Skip conditions
  const ktObjs = Object.values(objectives).filter(
    (o: any) => o?.result?.id === RESULT_KT_SKIP,
  );
  if (ktObjs.length > 0) {
    const obj = ktObjs[0] as any;
    const { minRequired } = parseObjectiveValue(
      flagStr(fv, obj.flag) ?? "3.0.0",
    );
    const conds = describeObjectiveConditions(obj);
    rows.push({
      label: "KT Skip",
      value: conds
        ? `${minRequired} of: ${conds}`
        : minRequired > 0
          ? `${minRequired} condition(s) required`
          : "No conditions set",
    });
  }

  // Excluded Commands — only show if different from standard (Possess=28, Shock=27, Steal=5)
  const recFlags = ["-rec1", "-rec2", "-rec3", "-rec4", "-rec5", "-rec6"];
  const excludedCmds = recFlags
    .map((f) => flagNum(fv, f))
    .filter((v) => v !== null && v !== 97)
    .map((v) => COMMAND_NAMES[v as number] ?? `#${v}`);
  const sortedExcluded = [...excludedCmds].sort().join(", ");
  const stdExcluded = ["Possess", "Shock", "Steal"].sort().join(", "); // rec1=28, rec2=27, rec3=5
  if (sortedExcluded !== stdExcluded) {
    rows.push({
      label: "Excluded Commands",
      value: excludedCmds.length > 0 ? excludedCmds.join(", ") : "None",
      highlight: excludedCmds.length > 3,
    });
  }

  // Scaling — always show; highlight if non-standard
  const activeScalingFlag = SCALING_FLAGS.find((f) => hasFlag(fv, f));
  if (activeScalingFlag) {
    const mult = flagNum(fv, activeScalingFlag);
    const isStd = activeScalingFlag === "-lsced" && mult === 2;
    rows.push({
      label: "Level Scaling",
      value: `${mult}× ${SCALING_LABEL[activeScalingFlag] ?? ""}`,
      highlight: !isStd,
    });
  } else {
    rows.push({
      label: "Level Scaling",
      value: "None (fixed levels)",
      highlight: true,
    });
  }

  // HP/MP Scaling — only if different from standard hmced 2
  const activeHpFlag = HP_FLAGS.find((f) => hasFlag(fv, f));
  if (activeHpFlag) {
    const hpMult = flagNum(fv, activeHpFlag);
    const isStd = activeHpFlag === "-hmced" && hpMult === 2;
    if (!isStd) {
      rows.push({
        label: "HP/MP Scaling",
        value: `${hpMult}× ${SCALING_LABEL[activeHpFlag] ?? ""}`,
        highlight: hpMult !== null && hpMult > 2.5,
      });
    }
  }

  // Multipliers — only show deviations from standard (xpm=3, mpm=5, gpm=5, full XP)
  const xpm = flagNum(fv, "-xpm");
  const mpm = flagNum(fv, "-mpm");
  const gpm = flagNum(fv, "-gpm");
  const partyXpSplit = !hasFlag(fv, "-nxppd");
  const multParts: string[] = [];
  if (xpm !== null && xpm !== 3) multParts.push(`XP ×${xpm}`);
  if (mpm !== null && mpm !== 5) multParts.push(`MP ×${mpm}`);
  if (gpm !== null && gpm !== 5) multParts.push(`Gold ×${gpm}`);
  if (partyXpSplit) multParts.push("Party XP split among survivors");
  if (multParts.length > 0) {
    rows.push({
      label: "Multipliers",
      value: multParts.join(", "),
      highlight: true,
    });
  }

  // Boss Settings — only if non-standard
  const bossParts: string[] = [];
  if (hasFlag(fv, "-bbr")) bossParts.push("Fully randomized bosses");
  const drloc = flagStr(fv, "-drloc");
  if (drloc && drloc !== "shuffle") bossParts.push(`Dragons: ${drloc}`);
  const stloc = flagStr(fv, "-stloc");
  if (stloc && stloc !== "mix") bossParts.push(`Statues: ${stloc}`);
  if (!hasFlag(fv, "-be")) bossParts.push("Bosses give no EXP");
  if (!hasFlag(fv, "-bnu")) bossParts.push("Boss undead on");
  if (bossParts.length > 0) {
    rows.push({
      label: "Boss Settings",
      value: bossParts.join(", "),
      highlight: true,
    });
  }

  // Natural Magic — only if non-standard
  const nm1 = flagStr(fv, "-nm1");
  const nm2 = flagStr(fv, "-nm2");
  const nmParts: string[] = [];
  if (nm1 && nm1 !== "random") nmParts.push(`Terra → ${nm1}`);
  if (nm2 && nm2 !== "random") nmParts.push(`Celes → ${nm2}`);
  if (!hasFlag(fv, "-nm1") && !hasFlag(fv, "-nm2")) nmParts.push("Disabled");
  if (nmParts.length > 0) {
    rows.push({
      label: "Natural Magic",
      value: nmParts.join(", "),
      highlight: true,
    });
  }

  // Esper Equipability — only if set
  if (hasFlag(fv, "-eer")) {
    const arr = flagNumArr(fv, "-eer");
    if (arr)
      rows.push({
        label: "Esper Equipability",
        value: `${arr[0]}–${arr[1]} chars per esper`,
        highlight: true,
      });
  } else if (hasFlag(fv, "-eebr")) {
    const v = flagNum(fv, "-eebr");
    rows.push({
      label: "Esper Equipability",
      value: `${v} chars balanced`,
      highlight: true,
    });
  }

  // Starting Gold — only if different from 5000
  const gp = flagNum(fv, "-gp");
  if (gp !== null && gp !== 5000) {
    rows.push({
      label: "Starting Gold",
      value: `${gp.toLocaleString()} GP`,
      highlight: gp < 1000,
    });
  }

  // Shops — always show; highlight deviations from standard
  const shopParts: string[] = [];
  if (hasFlag(fv, "-sie")) {
    shopParts.push("Empty");
  } else {
    if (hasFlag(fv, "-sirt")) {
      shopParts.push("Random tiered");
    } else {
      const sisr = flagNum(fv, "-sisr");
      if (sisr === null || sisr === 0) {
        shopParts.push("Original");
      } else {
        shopParts.push(`${sisr}% inventory randomized`);
      }
    }
    const sprp = flagNumArr(fv, "-sprp");
    if (sprp && (sprp[0] !== 75 || sprp[1] !== 125))
      shopParts.push(`prices ${sprp[0]}–${sprp[1]}%`);
    if (!hasFlag(fv, "-npi")) shopParts.push("priceless items kept");
  }
  rows.push({
    label: "Shops",
    value: shopParts.join(", "),
    highlight: hasFlag(fv, "-sie"),
  });

  // Chest randomization — always show
  const chestParts: string[] = [];
  if (hasFlag(fv, "-cce")) {
    chestParts.push("All empty");
  } else if (hasFlag(fv, "-ccrs")) {
    chestParts.push("Scaled tiered random");
  } else if (hasFlag(fv, "-ccrt")) {
    chestParts.push("Tiered random");
  } else {
    const ccsr = flagNum(fv, "-ccsr");
    if (ccsr === null || ccsr === 0) {
      chestParts.push("Original");
    } else {
      chestParts.push(`${ccsr}% randomized`);
    }
  }
  const chrm = flagNumArr(fv, "-chrm");
  if (chrm && chrm[0] > 0) chestParts.push(`${chrm[0]}% monster chests`);
  rows.push({
    label: "Chests",
    value: chestParts.join(", "),
    highlight: hasFlag(fv, "-cce"),
  });

  // Equipment randomization — only if non-standard
  const eqParts: string[] = [];
  const ieor = flagNum(fv, "-ieor");
  if (ieor !== null && ieor !== 33) eqParts.push(`Weapons +${ieor}%`);
  const ieror = flagNum(fv, "-ieror");
  if (ieror !== null && ieror !== 33) eqParts.push(`Relics +${ieror}%`);
  if (hasFlag(fv, "-ier")) {
    const a = flagNumArr(fv, "-ier");
    eqParts.push(`Weapons: ${a?.[0]}–${a?.[1]} chars`);
  }
  if (hasFlag(fv, "-iebr")) {
    const v = flagNum(fv, "-iebr");
    eqParts.push(`Weapons: ${v} chars balanced`);
  }
  if (eqParts.length > 0)
    rows.push({
      label: "Equipable Items",
      value: eqParts.join(", "),
      highlight: true,
    });

  // Restrictions
  const resParts: string[] = [];
  if (hasFlag(fv, "-sn")) resParts.push("Start naked");
  if (!hasFlag(fv, "-mca")) resParts.push("Moogle Charm: char-restricted");
  if (hasFlag(fv, "-escr")) {
    const pct = flagNum(fv, "-escr");
    if (pct !== null && pct < 100)
      resParts.push(`${pct}% encounters escapable`);
  }
  if (resParts.length > 0) {
    rows.push({
      label: "Restrictions",
      value: resParts.join(", "),
      highlight: true,
    });
  }

  // Bug Fixes — only if not all on
  const fixFlags = ["-fedc", "-fe", "-fbs", "-fvd", "-fj"];
  const BUG_FIX_LABELS: Record<string, string> = {
    "-fedc": "Enemy Damage Counter",
    "-fe": "Evade",
    "-fbs": "Boss Skip",
    "-fvd": "Vanish/Doom",
    "-fj": "Jump",
  };
  const missingFixes = fixFlags.filter((f) => !hasFlag(fv, f));
  if (missingFixes.length === fixFlags.length) {
    rows.push({ label: "Bug Fixes", value: "All disabled", highlight: true });
  } else if (missingFixes.length > 0) {
    const disabledNames = missingFixes.map((f) => BUG_FIX_LABELS[f] ?? f);
    rows.push({
      label: "Bug Fixes",
      value: `${disabledNames.join(", ")} disabled`,
      highlight: missingFixes.length > 2,
    });
  }

  return rows;
}

// ─── Difficulty analysis ──────────────────────────────────────────────────────
// Scoring philosophy:
//   A seed matching ALL Atma Series standard settings should score ~20 → "Standard"
//   BASE_SCORE = 20 represents the "you are playing a randomizer with objectives and
//   boss shuffle and enemy scaling" starting point. Deviations add or subtract from it.

const BASE_SCORE = 20;

// Configuration map for preset-specific difficulty overrides
const PRESET_DIFFICULTY_OVERRIDES: Record<
  string,
  { score: number; label: string; color: string }
> = {};

function analyzeDifficulty(
  fv: Record<string, any>,
  objectives: Record<string, any>,
  activePresetName: string | null,
  rawFlags?: string,
): { score: number; label: string; color: string; bullets: Bullet[] } {
  const bullets: Bullet[] = [];
  let delta = 0; // points above/below the standard baseline

  // Calculate environmental coupling factors
  const activeScaleFlag = SCALING_FLAGS.find((f) => hasFlag(fv, f));
  const scaleMult = activeScaleFlag
    ? (flagNum(fv, activeScaleFlag) ?? 2.0)
    : 2.0;

  let scaleFactor = 1.0;
  if (activeScaleFlag) {
    if (activeScaleFlag === "-lst") {
      scaleFactor = Math.max(1.0, 2.0 / (scaleMult || 2.0));
    } else if (activeScaleFlag === "-lsa" || activeScaleFlag === "-lsh") {
      scaleFactor = Math.max(1.0, scaleMult / 1.0);
    } else {
      scaleFactor = Math.max(1.0, scaleMult / 2.0);
    }
  } else {
    scaleFactor = 0.5; // No scaling is much easier
  }

  const xpm = flagNum(fv, "-xpm") ?? 1;
  const partyXpSplit = !hasFlag(fv, "-nxppd");
  const xpmBaseline = partyXpSplit ? 7 : 3;

  let xpFactor = 1.0;
  if (xpm < xpmBaseline) {
    xpFactor = xpmBaseline / Math.max(0.5, xpm);
  } else if (xpm > xpmBaseline) {
    xpFactor = Math.max(0.2, xpmBaseline / xpm);
  }

  const msl = flagNum(fv, "-msl") ?? 40;
  let mslFactor = 1.0;
  if (msl > 40) {
    mslFactor = msl / 40.0;
  } else if (msl < 40) {
    mslFactor = Math.max(0.5, msl / 40.0);
  }

  // Safely cap environmental multiplier
  const envMult = Math.min(15.0, scaleFactor * xpFactor * mslFactor);

  // ── ALWAYS-SHOW: Final Kefka conditions ──
  const kefkaObjRaw = Object.values(objectives)
    .filter((o: any) => o?.result?.id === RESULT_FINAL_KEFKA)
    .map((o: any) => ({
      parsed: parseObjectiveValue(flagStr(fv, (o as any).flag) ?? "2.0.0"),
      obj: o as any,
    }));
  const ktObjRaw = Object.values(objectives)
    .filter((o: any) => o?.result?.id === RESULT_KT_SKIP)
    .map((o: any) => ({
      parsed: parseObjectiveValue(flagStr(fv, (o as any).flag) ?? "3.0.0"),
      obj: o as any,
    }));

  const kefkaRequired = kefkaObjRaw.reduce(
    (s, o) => s + o.parsed.minRequired,
    0,
  );
  const ktRequired = ktObjRaw.reduce((s, o) => s + o.parsed.minRequired, 0);

  if (kefkaRequired > 0 || ktRequired > 0) {
    const kefkaConds =
      kefkaObjRaw.length > 0
        ? describeObjectiveConditions(kefkaObjRaw[0].obj)
        : "";
    const ktConds =
      ktObjRaw.length > 0 ? describeObjectiveConditions(ktObjRaw[0].obj) : "";

    const kefkaText = kefkaConds
      ? `Final Kefka: ${kefkaRequired} of (${kefkaConds})`
      : `Final Kefka: ${kefkaRequired} condition(s)`;
    const ktText =
      ktRequired > 0
        ? ktConds
          ? ` · KT Skip: ${ktRequired} of (${ktConds})`
          : ` · KT Skip: ${ktRequired} condition(s)`
        : "";

    // Calculate detailed objective difficulty points
    let kefkaDelta = 0;
    if (kefkaRequired > 0) {
      // 3.5 points per required condition as baseline deviation from standard (2 conditions)
      // High requirements are magnified in harsh environments
      const reqDiff = kefkaRequired - 2;
      if (reqDiff > 0) {
        kefkaDelta += reqDiff * 3.5 * envMult;
      } else {
        kefkaDelta += reqDiff * 3.5;
      }

      if (kefkaObjRaw[0]?.obj?.conditions) {
        const conditions = kefkaObjRaw[0].obj.conditions;
        const totalCondsCount = conditions.length;
        // Scale positive deviations if players only need to meet a subset of total conditions
        const conditionRatio =
          totalCondsCount > 0
            ? Math.min(1.0, kefkaRequired / totalCondsCount)
            : 1.0;

        for (const cond of conditions) {
          const valNum =
            cond.values && cond.values.length > 1
              ? parseInt(String(cond.values[1]), 10)
              : cond.values?.[0] !== undefined
                ? parseInt(String(cond.values[0]), 10)
                : NaN;
          if (!isNaN(valNum)) {
            if (cond.id === COND_CHARACTERS || cond.id === "2") {
              const diff = valNum - 6; // 6 is standard baseline
              if (diff > 0) {
                kefkaDelta += diff * 1.5 * envMult * conditionRatio; // low base impact (1.5), scaled by environment & ratio
              } else {
                kefkaDelta += diff * 2.0; // Less is easier
              }
            } else if (cond.id === COND_ESPERS || cond.id === "4") {
              const diff = valNum - 9; // 9 is standard baseline
              if (diff > 0) {
                kefkaDelta += diff * 0.8 * envMult * conditionRatio; // low base impact (0.8), scaled by environment & ratio
              } else {
                kefkaDelta += diff * 1.0; // Less is easier
              }
            } else if (cond.id === COND_DRAGONS || cond.id === "6") {
              const diff = valNum - 0; // 0 is standard
              if (diff > 0) {
                kefkaDelta += diff * 2.0 * envMult * conditionRatio; // low base impact (2.0), scaled by environment & ratio
              }
            }
          }
        }
      }
    }

    // KT Skip gets less weight (e.g. 1.5 points per required condition baseline deviation from standard (1 condition), compared to Kefka's 3.5 baseline + condition scaling)
    let ktDelta = 0;
    if (ktRequired > 0) {
      ktDelta += (ktRequired - 1) * 1.5;
    }

    const objTotalDelta = kefkaDelta + ktDelta;
    const sev: BulletSeverity =
      objTotalDelta >= 20
        ? "hard"
        : objTotalDelta >= 8
          ? "medium"
          : objTotalDelta >= 0
            ? "info"
            : "easy";

    bullets.push({ text: kefkaText + ktText, severity: sev });
    delta += objTotalDelta;
  } else if (Object.keys(objectives).length > 0) {
    bullets.push({
      text: "Final Kefka: no conditions set — open access to endgame",
      severity: "info",
    });
  }

  // ── ALWAYS-SHOW: Level scaling ──
  const activeScalingFlag = SCALING_FLAGS.find((f) => hasFlag(fv, f));
  if (activeScalingFlag) {
    const mult = flagNum(fv, activeScalingFlag);
    const lbl = SCALING_LABEL[activeScalingFlag] ?? "";
    const isStd = activeScalingFlag === "-lsced" && mult === 2;

    if (mult !== null) {
      if (activeScalingFlag === "-lst") {
        if (mult === 0.5) {
          bullets.push({
            text: `Enemy scaling every ${mult} min. — extremely fast level ups, extreme difficulty`,
            severity: "hard",
          });
          delta += 30;
        } else if (mult === 1.0) {
          bullets.push({
            text: `Enemy scaling every ${mult} min. — very fast level ups, very high difficulty`,
            severity: "hard",
          });
          delta += 22;
        } else if (mult === 1.5) {
          bullets.push({
            text: `Enemy scaling every ${mult} min. — fast level ups, harder than standard`,
            severity: "medium",
          });
          delta += 12;
        } else if (mult === 3.0) {
          bullets.push({
            text: `Enemy scaling every ${mult} min. — slow level ups, easier than standard`,
            severity: "easy",
          });
          delta -= 4;
        } else if (mult === 3.5) {
          bullets.push({
            text: `Enemy scaling every ${mult} min. — slow level ups, easier than standard`,
            severity: "easy",
          });
          delta -= 7;
        } else if (mult === 4.0) {
          bullets.push({
            text: `Enemy scaling every ${mult} min. — very slow level ups, much easier than standard`,
            severity: "easy",
          });
          delta -= 10;
        } else if (mult === 4.5) {
          bullets.push({
            text: `Enemy scaling every ${mult} min. — very slow level ups, much easier than standard`,
            severity: "easy",
          });
          delta -= 12;
        } else if (mult >= 5.0) {
          bullets.push({
            text: `Enemy scaling every ${mult} min. — extremely slow level ups, minimal difficulty`,
            severity: "easy",
          });
          delta -= 14;
        } else {
          bullets.push({
            text: `Enemy scaling every ${mult} min.`,
            severity: "info",
          });
        }
      } else {
        if (activeScalingFlag === "-lsa" || activeScalingFlag === "-lsh") {
          // -lsa and -lsh have standard mult = 1.0, and scale exponentially for higher values
          const isCappedUnder40 = msl < 40;

          if (mult <= 0.5) {
            bullets.push({
              text: `Enemy scaling ${mult}× ${lbl} — easier than the 1× standard`,
              severity: "easy",
            });
            delta -= 6;
          } else if (mult === 1.0) {
            bullets.push({
              text: `Enemy scaling ${mult}× ${lbl} — standard level scaling`,
              severity: "info",
            });
            // standard 1.0 = 0 delta
          } else {
            // mult > 1.0: gets exponentially harder
            // 1.5 is pretty hard, 2.0 is very hard
            let scalingDelta = 0;
            let severity: BulletSeverity = "medium";

            if (mult <= 1.5) {
              scalingDelta = 12;
              severity = "medium";
            } else if (mult <= 2.0) {
              scalingDelta = 22;
              severity = "hard";
            } else {
              scalingDelta = 35;
              severity = "hard";
            }

            if (isCappedUnder40) {
              // Max scale level cap under 40 limits the challenge (tapered by 40%), but it is still harder
              scalingDelta = Math.round(scalingDelta * 0.6);
              bullets.push({
                text: `Enemy scaling ${mult}× ${lbl} — very challenging, partially limited by low level cap (${msl})`,
                severity: severity,
              });
            } else {
              bullets.push({
                text: `Enemy scaling ${mult}× ${lbl} — extremely challenging, enemies scale aggressively with level`,
                severity: severity,
              });
            }
            delta += scalingDelta;
          }
        } else {
          if (mult < 1.0) {
            bullets.push({
              text: `Enemy scaling ${mult}× — enemies are much weaker than standard`,
              severity: "easy",
            });
            delta -= 12;
          } else if (mult < 2.0) {
            bullets.push({
              text: `Enemy scaling ${mult}× ${lbl} — easier than the 2× standard`,
              severity: "easy",
            });
            delta -= 6;
          } else if (mult >= 4.0) {
            bullets.push({
              text: `Enemy scaling ${mult}× ${lbl} — extreme difficulty`,
              severity: "hard",
            });
            delta += 25;
          } else if (mult >= 3.0) {
            bullets.push({
              text: `Enemy scaling ${mult}× ${lbl} — harder than standard 2×`,
              severity: "hard",
            });
            delta += 15;
          } else if (mult > 2.5) {
            bullets.push({
              text: `Enemy scaling ${mult}× ${lbl} — slightly above standard`,
              severity: "medium",
            });
            delta += 8;
          } else {
            // 2.0–2.5 = standard — always show as info
            bullets.push({
              text: `Enemy scaling ${mult}× ${lbl}`,
              severity: "info",
            });
          }
        }
      }

      // Max scale level — only call out if non-standard (standard = 40)
      if (msl !== 40) {
        if (msl < 30) {
          bullets.push({
            text: `Enemy level cap: ${msl} — late-game is much easier`,
            severity: "easy",
          });
          delta -= 8;
        } else if (msl > 40) {
          const mslDiff = msl - 40;
          // Dynamically scale difficulty: higher enemy level scaling magnifying cap difficulty
          const mslDelta = mslDiff * 0.1 * Math.max(0.6, scaleFactor);
          bullets.push({
            text: `Enemy level cap: ${msl} — higher cap increases difficulty`,
            severity: "medium",
          });
          delta += mslDelta;
        } else {
          bullets.push({ text: `Enemy level cap: ${msl}`, severity: "info" });
        }
      }
    }
  } else {
    bullets.push({
      text: "No enemy level scaling — enemies at fixed levels",
      severity: "info",
    });
    delta -= 5; // easier than having scaling
  }

  // ── HP/MP Scaling ── (2× = standard, no delta)
  const activeHpFlag = HP_FLAGS.find((f) => hasFlag(fv, f));
  if (activeHpFlag) {
    const hpMult = flagNum(fv, activeHpFlag);
    if (hpMult !== null) {
      if (activeHpFlag === "-hmt") {
        if (hpMult === 0.5) {
          bullets.push({
            text: `Enemy HP/MP scaling every ${hpMult} min. — extremely fast growth, fights get very tough quickly`,
            severity: "hard",
          });
          delta += 22;
        } else if (hpMult === 1.0) {
          bullets.push({
            text: `Enemy HP/MP scaling every ${hpMult} min. — very fast growth, fights get tough quickly`,
            severity: "hard",
          });
          delta += 16;
        } else if (hpMult === 1.5) {
          bullets.push({
            text: `Enemy HP/MP scaling every ${hpMult} min. — fast growth, fights get tough quickly`,
            severity: "medium",
          });
          delta += 8;
        } else if (hpMult === 3.0) {
          bullets.push({
            text: `Enemy HP/MP scaling every ${hpMult} min. — slow growth, fights stay slightly easier`,
            severity: "easy",
          });
          delta -= 2;
        } else if (hpMult === 3.5) {
          bullets.push({
            text: `Enemy HP/MP scaling every ${hpMult} min. — slow growth, fights stay slightly easier`,
            severity: "easy",
          });
          delta -= 4;
        } else if (hpMult === 4.0) {
          bullets.push({
            text: `Enemy HP/MP scaling every ${hpMult} min. — very slow growth, fights stay easier`,
            severity: "easy",
          });
          delta -= 6;
        } else if (hpMult === 4.5) {
          bullets.push({
            text: `Enemy HP/MP scaling every ${hpMult} min. — very slow growth, fights stay easier`,
            severity: "easy",
          });
          delta -= 8;
        } else if (hpMult >= 5.0) {
          bullets.push({
            text: `Enemy HP/MP scaling every ${hpMult} min. — extremely slow growth, fights stay much easier`,
            severity: "easy",
          });
          delta -= 10;
        }
      } else {
        if (hpMult < 1.5) {
          bullets.push({
            text: `Enemy HP/MP ${hpMult}× — squishier than standard`,
            severity: "easy",
          });
          delta -= 6;
        } else if (hpMult > 3.0) {
          bullets.push({
            text: `Enemy HP/MP ${hpMult}× — very tanky, fights are drawn out`,
            severity: "hard",
          });
          delta += 18;
        } else if (hpMult > 2.5) {
          bullets.push({
            text: `Enemy HP/MP ${hpMult}× — above-standard tankiness`,
            severity: "hard",
          });
          delta += 10;
        } else if (hpMult < 2.0) {
          bullets.push({
            text: `Enemy HP/MP ${hpMult}× — slightly below standard`,
            severity: "easy",
          });
          delta -= 3;
        }
        // 2.0–2.5 = standard, skip
      }
    }
  }

  // ── Ability Scaling ── (lower = harder; 2.0-2.5 = standard, skip)
  if (hasFlag(fv, "-ase") || hasFlag(fv, "-asr")) {
    const asMult = flagNum(fv, "-ase") ?? flagNum(fv, "-asr");
    if (asMult !== null) {
      if (asMult === 0.5) {
        bullets.push({
          text: `Ability scaling is extremely fast (${asMult}×) — enemies gain powerful spells very early`,
          severity: "hard",
        });
        delta += 16;
      } else if (asMult === 1.0) {
        bullets.push({
          text: `Ability scaling is very fast (${asMult}×) — enemies gain powerful spells early`,
          severity: "hard",
        });
        delta += 12;
      } else if (asMult === 1.5) {
        bullets.push({
          text: `Ability scaling is fast (${asMult}×) — enemies gain powerful spells earlier than standard`,
          severity: "medium",
        });
        delta += 6;
      } else if (asMult === 3.0) {
        bullets.push({
          text: `Ability scaling is slow (${asMult}×) — enemies gain powerful spells later than standard`,
          severity: "easy",
        });
        delta -= 3;
      } else if (asMult === 3.5) {
        bullets.push({
          text: `Ability scaling is slow (${asMult}×) — enemies gain powerful spells later than standard`,
          severity: "easy",
        });
        delta -= 5;
      } else if (asMult === 4.0) {
        bullets.push({
          text: `Ability scaling is very slow (${asMult}×) — enemies gain powerful spells very late`,
          severity: "easy",
        });
        delta -= 7;
      } else if (asMult === 4.5) {
        bullets.push({
          text: `Ability scaling is very slow (${asMult}×) — enemies gain powerful spells very late`,
          severity: "easy",
        });
        delta -= 8;
      } else if (asMult >= 5.0) {
        bullets.push({
          text: `Ability scaling is extremely slow (${asMult}×) — enemies gain powerful spells very late`,
          severity: "easy",
        });
        delta -= 9;
      }
    }
  }

  // ── XP Multiplier ── (3× = standard; 7× if party XP split)

  if (partyXpSplit) {
    bullets.push({
      text: "Party XP divided among survivors — effective XP baseline shifts to ~7×",
      severity: "hard",
    });
    delta += 12;
  }

  // Boss XP Challenge
  if (!hasFlag(fv, "-be")) {
    bullets.push({
      text: "Boss experience disabled — bosses award 0 XP (makes game more challenging)",
      severity: "hard",
    });
    delta += 15;
  }

  // Check if reward scaling is set very low
  const isXgceLow = hasFlag(fv, "-xgce") && (flagNum(fv, "-xgce") ?? 0) < 2;
  const isXgcedLow = hasFlag(fv, "-xgced") && (flagNum(fv, "-xgced") ?? 0) < 2;
  const isXgtLow = hasFlag(fv, "-xgt") && (flagNum(fv, "-xgt") ?? 0) < 2;
  const isXgaLow = hasFlag(fv, "-xga") && (flagNum(fv, "-xga") ?? 0) < 1;
  const isXghLow = hasFlag(fv, "-xgh") && (flagNum(fv, "-xgh") ?? 0) < 1;
  const isXgScalingVeryLow =
    isXgceLow || isXgcedLow || isXgtLow || isXgaLow || isXghLow;

  if (flagNum(fv, "-xpm") !== null) {
    const xpmDiff = xpm - xpmBaseline;
    if (xpmDiff < 0) {
      if (xpmDiff <= -4) {
        bullets.push({
          text: `XP multiplier ${xpm}× is extremely low compared to baseline (${xpmBaseline}×) — grinding will be extremely slow`,
          severity: "hard",
        });
        delta += 30;
      } else if (xpmDiff <= -2) {
        bullets.push({
          text: `XP multiplier ${xpm}× is well below baseline (${xpmBaseline}×) — leveling is very slow`,
          severity: "hard",
        });
        delta += 20;
      } else {
        bullets.push({
          text: `XP multiplier ${xpm}× is slightly below baseline (${xpmBaseline}×) — slow leveling`,
          severity: "medium",
        });
        delta += 10;
      }
    } else if (xpmDiff > 0) {
      if (!partyXpSplit) {
        // Without split party XP (baseline is 3)
        if (isXgScalingVeryLow || !hasFlag(fv, "-be")) {
          const minimalEase = Math.min(5, xpmDiff * 0.5);
          bullets.push({
            text: `XP multiplier ${xpm}× (mitigated by low reward scaling or disabled boss XP) — standard leveling advantage`,
            severity: "info",
          });
          delta -= minimalEase;
        } else {
          // Exponential easing for fast XP (no split)
          const ease = Math.min(45, Math.pow(xpmDiff, 0.7) * 8 + xpmDiff * 1.5);
          bullets.push({
            text: `XP multiplier ${xpm}× with no split XP — leveling is extremely fast, game is exponentially easier`,
            severity: "easy",
          });
          delta -= ease;
        }
      } else {
        // With split party XP (baseline is 7)
        if (isXgScalingVeryLow || !hasFlag(fv, "-be")) {
          const minimalEase = Math.min(4, xpmDiff * 0.3);
          bullets.push({
            text: `XP multiplier ${xpm}× with split XP (mitigated by low scaling or disabled boss XP)`,
            severity: "info",
          });
          delta -= minimalEase;
        } else {
          const ease = Math.min(30, xpmDiff * 1.5);
          bullets.push({
            text: `XP multiplier ${xpm}× with split XP — leveling is faster than baseline`,
            severity: "easy",
          });
          delta -= ease;
        }
      }
    }
  }

  // ── XP/GP reward scaling from enemies ── (2× = standard)
  const activeXgFlag = XP_GP_REWARD_FLAGS.find((f) => hasFlag(fv, f));
  if (activeXgFlag) {
    const xgMult = flagNum(fv, activeXgFlag);
    if (xgMult !== null) {
      if (activeXgFlag === "-xgt") {
        // Time elapsed: smaller values = faster reward growth = easier
        if (xgMult <= 0.5) {
          bullets.push({
            text: `Enemy XP/GP yield scaling every ${xgMult} min. — extremely fast reward scaling, game is much easier`,
            severity: "easy",
          });
          delta -= 12;
        } else if (xgMult <= 1.0) {
          bullets.push({
            text: `Enemy XP/GP yield scaling every ${xgMult} min. — very fast reward scaling, game is easier`,
            severity: "easy",
          });
          delta -= 8;
        } else if (xgMult <= 1.5) {
          bullets.push({
            text: `Enemy XP/GP yield scaling every ${xgMult} min. — fast reward scaling, game is slightly easier`,
            severity: "easy",
          });
          delta -= 4;
        } else if (xgMult >= 5.0) {
          bullets.push({
            text: `Enemy XP/GP yield scaling every ${xgMult} min. — extremely slow reward scaling, grinding is tedious`,
            severity: "hard",
          });
          delta += 12;
        } else if (xgMult >= 4.0) {
          bullets.push({
            text: `Enemy XP/GP yield scaling every ${xgMult} min. — very slow reward scaling, grinding is slow`,
            severity: "hard",
          });
          delta += 8;
        } else if (xgMult >= 3.0) {
          bullets.push({
            text: `Enemy XP/GP yield scaling every ${xgMult} min. — slow reward scaling`,
            severity: "medium",
          });
          delta += 4;
        } else {
          bullets.push({
            text: `Enemy XP/GP yield scaling every ${xgMult} min.`,
            severity: "info",
          });
        }
      } else {
        // Multiplier based scaling (standard is 2.0x)
        const lbl = SCALING_LABEL[activeXgFlag] ?? "";
        if (xgMult < 1.0) {
          bullets.push({
            text: `Enemy XP/GP yield ${xgMult}× ${lbl} — extremely low rewards, grinding is very hard`,
            severity: "hard",
          });
          delta += 12;
        } else if (xgMult < 2.0) {
          bullets.push({
            text: `Enemy XP/GP yield ${xgMult}× ${lbl} — below standard 2×, grinding is slower`,
            severity: "medium",
          });
          delta += 6;
        } else if (xgMult > 2.0) {
          const ease = Math.min(
            18,
            xgMult > 4.0 ? (xgMult - 2.0) * 4.5 : (xgMult - 2.0) * 3.5,
          );
          bullets.push({
            text: `Enemy XP/GP yield ${xgMult}× ${lbl} — generous rewards make game easier`,
            severity: "easy",
          });
          delta -= ease;
        } else {
          bullets.push({
            text: `Enemy XP/GP yield ${xgMult}× ${lbl}`,
            severity: "info",
          });
        }
      }
    }
  }

  // ── Boss Randomization (shuffle = standard, no delta) ──
  if (hasFlag(fv, "-bbr")) {
    bullets.push({
      text: "Bosses fully randomized — any boss may appear at any location",
      severity: "medium",
    });
    delta += 10;
  }

  // ── Escapable Encounters (100% = standard) ──
  if (hasFlag(fv, "-escr")) {
    const pct = flagNum(fv, "-escr");
    if (pct !== null && pct === 0) {
      bullets.push({
        text: "No encounters can be escaped — all battles are forced",
        severity: "hard",
      });
      delta += 20;
    } else if (pct !== null && pct <= 25) {
      bullets.push({
        text: `Only ${pct}% of encounters escapable — most battles are forced`,
        severity: "hard",
      });
      delta += 14;
    } else if (pct !== null && pct <= 60) {
      bullets.push({
        text: `${pct}% of encounters escapable — below the 100% standard`,
        severity: "medium",
      });
      delta += 6;
    }
  }

  // ── ALWAYS-SHOW: Shop settings ──
  if (hasFlag(fv, "-sie")) {
    bullets.push({
      text: "All shop inventories empty — items must be sourced from the field",
      severity: "hard",
    });
    delta += 18;
  } else if (hasFlag(fv, "-sirt")) {
    bullets.push({
      text: "Shops: tiered random — higher tier items are less likely to be sold",
      severity: "medium",
    });
    delta += 6;
  } else {
    const sisr = flagNum(fv, "-sisr") ?? 0;
    const shopSev: BulletSeverity = sisr > 60 ? "easy" : "info";
    bullets.push({
      text:
        sisr === 0
          ? "Shops: standard inventory (no randomization)"
          : `Shops: ${sisr}% inventory randomized`,
      severity: shopSev,
    });
    if (sisr === 0) {
      delta += 2; // standard sisr=20, no randomization is harder
    } else if (sisr > 60) {
      delta -= 4; // high randomization is easier
    }
  }

  // ── ALWAYS-SHOW: Chest randomization ──
  if (hasFlag(fv, "-cce")) {
    bullets.push({
      text: "All chests are empty — no items in treasure chests",
      severity: "hard",
    });
    delta += 18;
  } else if (hasFlag(fv, "-ccrs") || hasFlag(fv, "-ccrt")) {
    bullets.push({
      text: "Chest contents tiered/scaled — good items are harder to find early game",
      severity: "medium",
    });
    delta += 4;
  } else {
    const ccsr = flagNum(fv, "-ccsr") ?? 0;
    const chestSev: BulletSeverity = ccsr > 60 ? "easy" : "info";
    bullets.push({
      text:
        ccsr === 0
          ? "Chests: standard contents (no randomization)"
          : `Chests: ${ccsr}% contents randomized`,
      severity: chestSev,
    });
    if (ccsr === 0) {
      delta += 2; // standard ccsr=20, no randomization is harder
    } else if (ccsr > 60) {
      delta -= 4; // high randomization is easier
    }
  }

  // Chest monsters
  const chrm = flagNumArr(fv, "-chrm");
  if (chrm && chrm[0] > 0) {
    bullets.push({
      text: `${chrm[0]}% of chests contain enemies (${chrm[1]}% boss chance)`,
      severity: chrm[0] >= 30 ? "hard" : "medium",
    });
    delta += chrm[0] >= 30 ? 10 : 4;
  }

  // ── Esper Spells ── (2–5 per esper = standard, no bullet unless different)
  if (hasFlag(fv, "-esr")) {
    const esrArr = flagNumArr(fv, "-esr");
    if (esrArr) {
      const [minS, maxS] = esrArr;
      const isStd = minS === 2 && maxS === 5;
      if (!isStd) {
        if (maxS < 2) {
          bullets.push({
            text: `Esper spells ${minS}–${maxS} per esper — below 2–5 standard, weaker magic`,
            severity: "hard",
          });
          delta += 10;
        } else if (minS < 1) {
          bullets.push({
            text: `Esper spells ${minS}–${maxS} per esper — some espers may teach nothing`,
            severity: "medium",
          });
          delta += 5;
        } else {
          bullets.push({
            text: `Esper spells ${minS}–${maxS} per esper (standard is 2–5)`,
            severity: "info",
          });
        }
      }
      // 2–5 = standard, no bullet
    }
  } else if (hasFlag(fv, "-esrt")) {
    bullets.push({
      text: "Esper spells tiered — powerful spells are harder to obtain early game",
      severity: "medium",
    });
    delta += 5;
  } else if (hasFlag(fv, "-ess")) {
    bullets.push({
      text: "Esper spells shuffled — magic redistributed, total unchanged",
      severity: "info",
    });
  }

  // Esper learn rates (tiered = standard — no bullet/delta)
  if (hasFlag(fv, "-elr")) {
    bullets.push({
      text: "Esper learn rates randomized — faster access to powerful spells",
      severity: "easy",
    });
    delta -= 4;
  }
  // Esper Equipability
  if (hasFlag(fv, "-eer")) {
    const arr = flagNumArr(fv, "-eer");
    if (arr) {
      const [minE, maxE] = arr;
      if (maxE <= 1) {
        bullets.push({
          text: `Esper equipability brutally restricted (${minE}–${maxE} chars per esper) — virtually no spell sharing possible`,
          severity: "hard",
        });
        delta += 32;
      } else if (maxE <= 2) {
        bullets.push({
          text: `Esper equipability highly restricted (${minE}–${maxE} chars per esper) — extremely limited magic access`,
          severity: "hard",
        });
        delta += 24;
      } else if (maxE <= 4) {
        bullets.push({
          text: `Esper equipability significantly restricted (${minE}–${maxE} chars per esper) — restricted magic access`,
          severity: "hard",
        });
        delta += 16;
      } else if (maxE <= 6) {
        bullets.push({
          text: `Esper equipability moderately restricted (${minE}–${maxE} chars per esper)`,
          severity: "medium",
        });
        delta += 10;
      } else {
        bullets.push({
          text: `Esper equipability slightly restricted (${minE}–${maxE} chars per esper)`,
          severity: "medium",
        });
        delta += 6;
      }
    }
  } else if (hasFlag(fv, "-eebr")) {
    const v = flagNum(fv, "-eebr");
    if (v !== null) {
      if (v <= 1) {
        bullets.push({
          text: `Esper equipability balanced but brutally restricted (${v} char per esper) — virtually no spell sharing possible`,
          severity: "hard",
        });
        delta += 32;
      } else if (v <= 2) {
        bullets.push({
          text: `Esper equipability balanced but highly restricted (${v} chars per esper) — extremely limited magic access`,
          severity: "hard",
        });
        delta += 24;
      } else if (v <= 4) {
        bullets.push({
          text: `Esper equipability balanced but significantly restricted (${v} chars per esper) — restricted magic access`,
          severity: "hard",
        });
        delta += 16;
      } else if (v <= 6) {
        bullets.push({
          text: `Esper equipability balanced but moderately restricted (${v} chars per esper)`,
          severity: "medium",
        });
        delta += 10;
      } else {
        bullets.push({
          text: `Esper equipability balanced and slightly restricted (${v} chars per esper)`,
          severity: "medium",
        });
        delta += 6;
      }
    }
  }

  // ── Character Stats ──
  const csrp = flagNumArr(fv, "-csrp");
  if (csrp) {
    const [lo, hi] = csrp;
    if (lo < 40) {
      bullets.push({
        text: `Character stats ${lo}–${hi}% — severe stats penalty, characters are extremely weak`,
        severity: "hard",
      });
      delta += 25;
    } else if (lo < 60) {
      bullets.push({
        text: `Character stats ${lo}–${hi}% — notable stats penalty, characters are significantly weaker`,
        severity: "hard",
      });
      delta += 16;
    } else if (lo < 78) {
      bullets.push({
        text: `Character stats ${lo}–${hi}% — slight stats penalty`,
        severity: "medium",
      });
      delta += 8;
    } else if (lo >= 150 && hi >= 200) {
      bullets.push({
        text: `Character stats ${lo}–${hi}% — godlike stats boost, characters are overwhelmingly powerful`,
        severity: "easy",
      });
      delta -= 30;
    } else if (lo >= 120 && hi >= 160) {
      bullets.push({
        text: `Character stats ${lo}–${hi}% — massive stats boost, characters are extremely powerful`,
        severity: "easy",
      });
      delta -= 22;
    } else if (lo >= 100 && hi >= 135) {
      bullets.push({
        text: `Character stats ${lo}–${hi}% — solid stats boost, characters are stronger than standard`,
        severity: "easy",
      });
      delta -= 14;
    } else if (lo > 80 || hi > 125) {
      bullets.push({
        text: `Character stats ${lo}–${hi}% — slight stats advantage`,
        severity: "easy",
      });
      delta -= 6;
    }
  }

  // ── Equipment Randomization ──
  if (hasFlag(fv, "-ietr")) {
    bullets.push({
      text: "Equipment equipability is tiered random — higher tier gear is less likely to be equipable",
      severity: "medium",
    });
    delta += 8;
  } else if (hasFlag(fv, "-ier") || hasFlag(fv, "-iebr")) {
    bullets.push({
      text: "Equipment availability randomized — limited gear options per character",
      severity: "medium",
    });
    delta += 5;
  }

  // ── Relics Randomization ──
  if (hasFlag(fv, "-iertr")) {
    bullets.push({
      text: "Relic equipability is tiered random — higher tier relics are less likely to be equipable",
      severity: "medium",
    });
    delta += 8;
  } else if (
    hasFlag(fv, "-ierr") ||
    hasFlag(fv, "-ierbr") ||
    hasFlag(fv, "-ieror") ||
    hasFlag(fv, "-iersr")
  ) {
    const v = flagNum(fv, "-ieror") ?? flagNum(fv, "-iersr");
    if (v !== null && v === 33) {
      // 33% is standard baseline (Atma Series)
    } else {
      bullets.push({ text: "Relic availability randomized", severity: "info" });
      delta += 3;
    }
  }

  // ── Challenge flags ──
  if (hasFlag(fv, "-nfce")) {
    bullets.push({
      text: "No Free Characters/Espers — rewards removed from events (Auction, Collapsing House, etc.)",
      severity: "medium",
    });
    delta += 8;
  }
  if (hasFlag(fv, "-sn")) {
    bullets.push({
      text: "Start naked — recruited characters have no starting equipment",
      severity: "info",
    });
    delta += 2;
  }

  // Starting Gold
  const gpVal = flagNum(fv, "-gp") ?? 5000;
  if (gpVal <= 0) {
    bullets.push({
      text: "Starting with no gold — severe economic disadvantage",
      severity: "hard",
    });
    delta += 6;
  } else if (gpVal > 5000) {
    const emptyShops = hasFlag(fv, "-sie");
    const isPricesRandom = hasFlag(fv, "-sprv") || hasFlag(fv, "-sprp");

    let gpEase = Math.min(15, Math.log10(gpVal / 5000) * 6.5);
    if (emptyShops) {
      gpEase = 0;
      bullets.push({
        text: `Starting with ${gpVal.toLocaleString()} gold (completely neutralized by empty shops)`,
        severity: "info",
      });
    } else if (isPricesRandom) {
      gpEase = gpEase * 0.5; // Tapers benefit by 50%
      bullets.push({
        text: `Starting with ${gpVal.toLocaleString()} gold — economic advantage (tapered by random prices)`,
        severity: "easy",
      });
    } else {
      bullets.push({
        text: `Starting with ${gpVal.toLocaleString()} gold — strong economic advantage`,
        severity: "easy",
      });
    }
    delta -= gpEase;
  }

  // Open World
  if (hasFlag(fv, "-open")) {
    bullets.push({
      text: "Open world — all events accessible from the start",
      severity: "easy",
    });
    delta -= 5;
  }

  // Final score = BASE (standard) + deviations
  const rawScore = Math.max(0, BASE_SCORE + delta);

  // Dampen/compress high challenge scores to avoid runaway ballooning above 100+
  let score = rawScore;
  if (rawScore > 22) {
    score = 22 + Math.pow(rawScore - 22, 0.68) * 2.6;
  }
  score = Math.round(score);

  let label: string;
  let color: string;
  // Thresholds relative to BASE_SCORE=20:
  //   ≤8  = Casual    (significantly easier than standard)
  //   9–22 = Standard  (close to Atma baseline)
  //   23–42 = Challenging
  //   43–65 = Hard
  //   >65  = Brutal
  if (score <= 8) {
    label = "Casual";
    color = "#22c55e";
  } else if (score <= 22) {
    label = "Standard";
    color = "#3b82f6";
  } else if (score <= 42) {
    label = "Challenging";
    color = "#f59e0b";
  } else if (score <= 65) {
    label = "Hard";
    color = "#ef4444";
  } else {
    label = "Brutal";
    color = "#a855f7";
  }

  // Check for preset difficulty overrides based on active preset name
  if (activePresetName) {
    const nameLower = activePresetName.toLowerCase();
    for (const [presetKey, override] of Object.entries(
      PRESET_DIFFICULTY_OVERRIDES,
    )) {
      if (nameLower.includes(presetKey)) {
        score = override.score;
        label = override.label;
        color = override.color;
        break;
      }
    }
  }

  return { score, label, color, bullets };
}

// ─── Component ────────────────────────────────────────────────────────────────
export const FlagSummary = () => {
  const flagValues = useSelector(selectFlagValues) as Record<string, any>;
  const objectives = useSelector(selectObjectives) as Record<string, any>;
  const activePresetName = useSelector(selectActivePresetName);
  const rawFlags = useSelector(selectRawFlags);

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("flag_summary_collapsed");
    if (stored === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("flag_summary_collapsed", String(nextState));
  };

  const infoRows = buildInfoRows(flagValues, objectives);
  const { score, label, color, bullets } = analyzeDifficulty(
    flagValues,
    objectives,
    activePresetName,
    rawFlags,
  );

  const severityIcon: Record<BulletSeverity, string> = {
    hard: "⚠️",
    medium: "◆",
    easy: "✓",
    info: "ℹ",
  };
  const severityColor: Record<BulletSeverity, string> = {
    hard: "#ef4444",
    medium: "#f59e0b",
    easy: "#22c55e",
    info: "#60a5fa",
  };

  return (
    <div className={styles.container}>
      {/* ── Collapsible Header ── */}
      <div
        className={styles.cardHeader}
        onClick={toggleCollapse}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleCollapse();
          }
        }}
      >
        <div className={styles.headerTitleGroup}>
          <h3 className={styles.title}>Flag Set Summary</h3>
          {isCollapsed && (
            <div
              className={styles.difficultyBadgeCompact}
              style={{ borderColor: color, color }}
            >
              <span className={styles.difficultyLabelCompact}>{label}</span>
              <span
                className={styles.difficultyScoreCompact}
                style={{ backgroundColor: color }}
              >
                {score} pts
              </span>
            </div>
          )}
        </div>
        <button
          className={styles.collapseBtn}
          aria-label={
            isCollapsed
              ? "Expand Flag Set Summary"
              : "Collapse Flag Set Summary"
          }
          onClick={(e) => {
            // Prevent event bubbling so double clicking/triggering is avoided
            e.stopPropagation();
            toggleCollapse();
          }}
        >
          {isCollapsed ? (
            <HiChevronDown size={18} />
          ) : (
            <HiChevronUp size={18} />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div className={styles.collapsibleContent}>
          {/* ── Info Panel ── */}
          <div className={styles.infoGrid}>
            {infoRows.map((row, i) => (
              <div key={i} className={styles.infoRow}>
                <span className={styles.infoLabel}>{row.label}</span>
                <span
                  className={`${styles.infoValue} ${row.highlight ? styles.infoValueHighlight : ""}`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* ── Divider ── */}
          <div className={styles.sectionDivider} />

          {/* ── Difficulty ── */}
          <div className={styles.header}>
            <span className={styles.difficultyTitle}>Difficulty</span>
            <div
              className={styles.difficultyBadge}
              style={{ borderColor: color, color }}
            >
              <span className={styles.difficultyLabel}>{label}</span>
              <span
                className={styles.difficultyScore}
                style={{ backgroundColor: color }}
              >
                {score} pts
              </span>
            </div>
          </div>

          <div className={styles.meterBar}>
            <div
              className={styles.meterFill}
              style={{
                width: `${Math.min(100, (score / 80) * 100)}%`,
                backgroundColor: color,
              }}
            />
          </div>
          <div className={styles.meterLabels}>
            <span>Casual</span>
            <span>Standard</span>
            <span>Challenging</span>
            <span>Hard</span>
            <span>Brutal</span>
          </div>

          {bullets.length === 0 ? (
            <p className={styles.noBullets}>
              No significant difficulty modifiers detected.
            </p>
          ) : (
            <ul className={styles.bulletList}>
              {bullets.map((b, i) => (
                <li key={i} className={styles.bulletItem}>
                  <span
                    className={styles.bulletIcon}
                    style={{ color: severityColor[b.severity] }}
                    title={b.severity}
                  >
                    {severityIcon[b.severity]}
                  </span>
                  <span className={styles.bulletText}>{b.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
