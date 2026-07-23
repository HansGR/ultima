import { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAppSession } from "~/hooks/useAppSession";
import { useAuthFetch } from "~/hooks/useAuthFetch";

import {
  FaCalendarAlt,
  FaUsers,
  FaUser,
  FaChevronDown,
  FaChevronRight,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTimes,
  FaPlus,
  FaDice,
  FaBolt,
  FaSkull,
} from "react-icons/fa";
import {
  generateRandom,
  generateChaos,
  generateTrueChaos,
} from "~/utils/randomFlagsets";
import { setRawFlags, selectRawFlags } from "~/state/flagSlice";
import { setRawObjectives } from "~/state/objectiveSlice";
import { setRawStartingItems } from "~/state/itemSlice";
import {
  setActivePreset,
  clearActivePreset,
  selectActivePresetName,
} from "~/state/presetSlice";
import { FlagPreset } from "~/types/preset";
import { PageContainer } from "~/components/PageContainer/PageContainer";

// ─── LocalStorage helpers ──────────────────────────────────────────────────────

const LS_KEY = (userId: string, presetName: string) =>
  `preset_real_dl:${userId}:${presetName}`;

function recordDownload(userId: string, presetName: string) {
  try {
    localStorage.setItem(LS_KEY(userId, presetName), new Date().toISOString());
  } catch {
    // storage unavailable — silently ignore
  }
}

function getLastDownloaded(
  userId: string,
  presetName: string,
): string | undefined {
  try {
    return localStorage.getItem(LS_KEY(userId, presetName)) ?? undefined;
  } catch {
    return undefined;
  }
}

// ─── Sorting ───────────────────────────────────────────────────────────────────

type SortField = "name" | "author" | "created_at" | "last_downloaded";
type SortDir = "asc" | "desc";

const SORT_LABELS: Record<SortField, string> = {
  name: "Name",
  author: "Author",
  created_at: "Creation Date",
  last_downloaded: "Last Downloaded",
};

function sortPresets(
  presets: FlagPreset[],
  field: SortField,
  dir: SortDir,
): FlagPreset[] {
  const sorted = [...presets].sort((a, b) => {
    let cmp = 0;
    switch (field) {
      case "name":
        cmp = (a.name || "").localeCompare(b.name || "");
        break;
      case "author":
        cmp = (a.creator_name || a.creator || "").localeCompare(
          b.creator_name || b.creator || "",
        );
        break;
      case "created_at":
        cmp =
          (a.created_at ? new Date(a.created_at).getTime() : 0) -
          (b.created_at ? new Date(b.created_at).getTime() : 0);
        break;
      case "last_downloaded":
        // Presets without a download date always sort to the end
        if (!a.last_downloaded && !b.last_downloaded) return 0;
        if (!a.last_downloaded) return 1;
        if (!b.last_downloaded) return -1;
        cmp =
          new Date(a.last_downloaded).getTime() -
          new Date(b.last_downloaded).getTime();
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}

// ─── SortBar ──────────────────────────────────────────────────────────────────

type SortBarProps = {
  field: SortField;
  dir: SortDir;
  onChange: (field: SortField, dir: SortDir) => void;
};

const SortBar = ({ field, dir, onChange }: SortBarProps) => {
  const fields: SortField[] = [
    "name",
    "author",
    "created_at",
    "last_downloaded",
  ];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.4rem",
        padding: "0.5rem 0",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <span
        style={{
          fontSize: "0.7rem",
          fontWeight: 600,
          color: "var(--text-sub)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginRight: "0.25rem",
        }}
      >
        Sort:
      </span>
      {fields.map((f) => {
        const active = field === f;
        return (
          <button
            key={f}
            onClick={(e) => {
              e.stopPropagation();
              onChange(f, active && dir === "asc" ? "desc" : "asc");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.25rem 0.6rem",
              borderRadius: "999px",
              border: active
                ? "1px solid var(--text-sub)"
                : "1px solid var(--border-light)",
              background: active ? "var(--bg-app)" : "transparent",
              color: active ? "var(--text-main)" : "var(--text-sub)",
              fontSize: "0.75rem",
              fontWeight: active ? 700 : 400,
              cursor: "pointer",
              transition: "all 0.15s",
              whiteSpace: "nowrap",
            }}
          >
            {SORT_LABELS[f]}
            {active &&
              (dir === "asc" ? (
                <FaSortAmountUp size={9} />
              ) : (
                <FaSortAmountDown size={9} />
              ))}
          </button>
        );
      })}
    </div>
  );
};

// ─── PresetCard ───────────────────────────────────────────────────────────────

type PresetCardProps = {
  preset: FlagPreset;
  onSelect: (preset: FlagPreset) => void;
  selected: boolean;
};

const formatTruncatedDate = (dateStr: string) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const year = String(d.getFullYear()).slice(-2);
    return `${month}/${day}/${year}`;
  } catch (e) {
    return "";
  }
};

const PresetCard = ({ preset, onSelect, selected }: PresetCardProps) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: selected ? "rgba(59,130,246,0.08)" : "var(--bg-app)",
        border: `1px solid ${selected ? "#3b82f6" : "var(--border-light)"}`,
        borderRadius: "10px",
        padding: "1rem",
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
      onClick={() => onSelect(preset)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {selected && (
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#3b82f6",
                  flexShrink: 0,
                }}
              />
            )}
            <span
              style={{
                fontWeight: 700,
                fontSize: "0.9rem",
                color: selected ? "#3b82f6" : "var(--text-main)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {preset.name}
            </span>
          </div>
          <span
            style={{
              fontSize: "0.75rem",
              color: "var(--text-sub)",
              marginTop: "0.1rem",
            }}
          >
            by {preset.creator_name || preset.creator}
            {preset.created_at && (
              <>
                {" · "}
                {formatTruncatedDate(preset.created_at)}
              </>
            )}
            {preset.last_downloaded && (
              <span
                style={{
                  marginLeft: "0.5rem",
                  fontSize: "0.7rem",
                  fontStyle: "italic",
                  opacity: 0.7,
                }}
              >
                Last Downloaded{" "}
                {new Date(preset.last_downloaded).toLocaleDateString(
                  undefined,
                  {
                    month: "short",
                    day: "numeric",
                  },
                )}
              </span>
            )}
          </span>
        </div>

        {preset.description && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-sub)",
              padding: "0.25rem",
              flexShrink: 0,
            }}
          >
            {expanded ? (
              <FaChevronDown size={12} />
            ) : (
              <FaChevronRight size={12} />
            )}
          </button>
        )}
      </div>

      {expanded && preset.description && (
        <p
          style={{
            marginTop: "0.75rem",
            paddingTop: "0.75rem",
            borderTop: "1px solid var(--border-light)",
            fontSize: "0.8rem",
            color: "var(--text-sub)",
            lineHeight: 1.5,
            margin: "0.75rem 0 0",
          }}
        >
          {preset.description}
        </p>
      )}
    </div>
  );
};

// ─── CategorySection ──────────────────────────────────────────────────────────

type CategorySectionProps = {
  icon: React.ReactNode;
  title: string;
  color: string;
  presets: FlagPreset[];
  selectedName: string | null;
  onSelect: (preset: FlagPreset) => void;
  defaultOpen?: boolean;
};

const CategorySection = ({
  icon,
  title,
  color,
  presets,
  selectedName,
  onSelect,
  defaultOpen = false,
}: CategorySectionProps) => {
  const { data: session } = useAppSession();
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  useEffect(() => {
    const key = `presets-category-open-${title.toLowerCase().replace(/\s+/g, "-")}`;
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      setOpen(saved === "true");
    }
  }, [title]);

  const toggleOpen = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    const key = `presets-category-open-${title.toLowerCase().replace(/\s+/g, "-")}`;
    localStorage.setItem(key, String(nextOpen));
  };

  const handleSortChange = useCallback((f: SortField, d: SortDir) => {
    setSortField(f);
    setSortDir(d);
  }, []);

  const filtered = search.trim()
    ? presets.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.description || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.creator_name || p.creator || "")
            .toLowerCase()
            .includes(search.toLowerCase()),
      )
    : presets;

  const sorted = sortPresets(filtered, sortField, sortDir);

  if (presets.length === 0 && title !== "My Presets") return null;

  return (
    <div
      style={{
        background: "var(--bg-card)",
        borderRadius: "12px",
        border: "1px solid var(--border-light)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <button
        onClick={toggleOpen}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 1.25rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-main)",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ color, fontSize: "1.1rem" }}>{icon}</span>
          <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{title}</span>
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              background: color + "22",
              color,
              padding: "0.1rem 0.5rem",
              borderRadius: "999px",
            }}
          >
            {presets.length}
          </span>
        </div>
        <FaChevronDown
          size={14}
          style={{
            color: "var(--text-sub)",
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Content */}
      {open && (
        <div style={{ padding: "0 1rem 1rem" }}>
          {/* Sort + Search row */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <SortBar
              field={sortField}
              dir={sortDir}
              onChange={handleSortChange}
            />

            {/* Search within category — only shown when there are enough presets */}
            {presets.length > 5 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0.75rem",
                  background: "var(--bg-app)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-light)",
                }}
              >
                <FaSearch size={12} color="var(--text-sub)" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: "none",
                    border: "none",
                    outline: "none",
                    fontSize: "0.85rem",
                    color: "var(--text-main)",
                    flex: 1,
                    width: "100%",
                  }}
                />
                {search && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearch("");
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-sub)",
                      fontSize: "0.8rem",
                      padding: 0,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            {sorted.length === 0 ? (
              <p
                style={{
                  color: "var(--text-sub)",
                  fontSize: "0.85rem",
                  padding: "0.5rem",
                }}
              >
                {title === "My Presets"
                  ? session?.user
                    ? "No saved presets. Save your current flags as a preset on the Generate page to see them here!"
                    : "Please connect your Discord account in the Profile tab to view your saved presets."
                  : "No results found."}
              </p>
            ) : (
              sorted.map((preset) => (
                <PresetCard
                  key={preset.name}
                  preset={preset}
                  onSelect={onSelect}
                  selected={selectedName === preset.name}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Presets page ─────────────────────────────────────────────────────────────

// --- Profanity checking utility for severe words ---
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

type PresetsPageProps = {
  presets: Record<string, FlagPreset>;
};

export const Presets = ({ presets: rawPresets }: PresetsPageProps) => {
  const dispatch = useDispatch();
  const authFetch = useAuthFetch();

  const ENABLE_PRESET_CREATION = false;

  // Active preset name lives in Redux — persists across tab navigation
  const activePresetName = useSelector(selectActivePresetName);

  const [globalSearch, setGlobalSearch] = useState("");
  const [customPresets, setCustomPresets] = useState<
    Record<string, FlagPreset>
  >({});
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const activeFlags = useSelector(selectRawFlags);
  const { data: session } = useAppSession();
  const currentUserId = (session?.user as any)?.discordId || undefined;

  const [dbPresets, setDbPresets] = useState<any[]>([]);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "random" | "chaos" | "true_chaos";
  } | null>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 1500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleRandomRoll = (
    type: "random" | "chaos" | "true_chaos",
    generator: () => string,
  ) => {
    try {
      const rolledFlags = generator();
      dispatch(clearActivePreset());
      dispatch(setRawFlags(rolledFlags));
      dispatch(setRawObjectives(rolledFlags));
      dispatch(setRawStartingItems(rolledFlags));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("animate-preset-box"));
      }

      const typeLabel =
        type === "random"
          ? "Random"
          : type === "chaos"
            ? "Chaos"
            : "True Chaos";
      setToast({
        message: `Successfully rolled ${typeLabel} flags!`,
        type: type,
      });
    } catch (e) {
      console.error("Failed to generate random flagset:", e);
    }
  };

  const randomRolls = [
    {
      id: "random",
      title: "Random",
      icon: <FaDice size={22} />,
      color: "#10b981", // Emerald / Green
      rgb: "16, 185, 129",
      glow: "rgba(16,185,129,0.15)",
      bgGradient:
        "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(16,185,129,0.01) 100%)",
      helper: "Light randomization, perfect for quick runs",
      action: "Roll Random",
      generator: generateRandom,
    },
    {
      id: "chaos",
      title: "Chaos",
      icon: <FaBolt size={22} />,
      color: "#f59e0b", // Amber / Yellow
      rgb: "245, 158, 11",
      glow: "rgba(245,158,11,0.15)",
      bgGradient:
        "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(245,158,11,0.01) 100%)",
      helper: "More randomization, can get a little wacky",
      action: "Unleash Chaos",
      generator: generateChaos,
    },
    {
      id: "true_chaos",
      title: "True Chaos",
      icon: <FaSkull size={22} />,
      color: "#ef4444", // Red
      rgb: "239, 68, 68",
      glow: "rgba(239,68,68,0.15)",
      bgGradient:
        "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.01) 100%)",
      helper: "Total randomization. Good luck!",
      action: "Enter the Void",
      generator: generateTrueChaos,
    },
  ];

  useEffect(() => {
    try {
      const stored = localStorage.getItem("custom_presets");
      if (stored) {
        setCustomPresets(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (session?.user) {
      authFetch("/user-presets")
        .then((res) => {
          if (res.ok) return res.json();
          return [];
        })
        .then((data) => {
          setDbPresets(data);
        })
        .catch((err) => {
          console.warn(
            "Failed to fetch database presets under Presets tab:",
            err,
          );
        });
    } else {
      setDbPresets([]);
    }
  }, [session, authFetch]);

  const mappedDbPresets = useMemo<FlagPreset[]>(() => {
    return dbPresets
      .filter((p) => {
        const creatorId = p.owner_id || p.creator_id;
        return creatorId !== "override" && !p.deleted;
      })
      .map((p) => {
        const creatorId = p.owner_id || p.creator_id;
        const officialVal =
          p.is_official !== undefined
            ? p.is_official
            : !!p.official ||
              (Array.isArray(p.tags) && p.tags.includes("official"));
        const createdAt = p.created_at || p.created_timestamp;

        const isSelf =
          creatorId != null &&
          currentUserId != null &&
          String(creatorId) === String(currentUserId);
        const displayName = isSelf
          ? "You"
          : p.creator_name ||
            (creatorId === "seedbot" ? "Seedbot" : "Community");

        const presetName = p.preset_name || p.name || "";
        return {
          name: presetName,
          creator_name: displayName,
          creator: displayName,
          description: p.description || "",
          flags: p.flags,
          creator_id: creatorId,
          arguments: "",
          official: officialVal,
          hidden: false,
          created_at: createdAt,
          last_downloaded: p.download_timestamp || undefined,
          id: p.id || presetName,
          tags: p.tags || [],
        };
      });
  }, [dbPresets, currentUserId]);

  const mergedPresets = useMemo(
    () => ({
      ...rawPresets,
      ...customPresets,
    }),
    [rawPresets, customPresets],
  );

  const handleCreatePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim() || !creatorName.trim()) {
      setSubmitError("Preset Name and Creator Name are required.");
      return;
    }

    if (hasSevereProfanity(newPresetName) || hasSevereProfanity(description)) {
      setSubmitError(
        "Preset Name and Description must not contain inappropriate language.",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const createdPreset: FlagPreset = {
      name: newPresetName.trim(),
      preset_name: newPresetName.trim(),
      preset_name_lower: newPresetName.trim().toLowerCase(),
      creator_name: creatorName.trim(),
      creator: creatorName.trim(),
      description: description.trim(),
      flags: activeFlags,
      creator_id: session?.user?.discordId || "",
      arguments: "",
      official: false,
      hidden: false,
      created_at: new Date().toISOString(),
    };

    // 1. Store locally for immediate viewing & fallback
    const updatedCustom = {
      ...customPresets,
      [createdPreset.name]: createdPreset,
    };
    setCustomPresets(updatedCustom);
    try {
      localStorage.setItem("custom_presets", JSON.stringify(updatedCustom));
    } catch (e) {}

    // 2. Post to the backend for bidirectional sync with seedbot
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/presets`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(createdPreset),
        },
      );

      if (!response.ok) {
        console.warn(`Server save returned ${response.statusText}`);
      }
    } catch (err) {
      console.warn("Error posting preset to server:", err);
    }

    setSubmitSuccess(true);
    setNewPresetName("");
    setDescription("");
    setTimeout(() => {
      setShowCreateForm(false);
      setSubmitSuccess(false);
    }, 1500);
    setIsSubmitting(false);
  };

  // Annotate each preset with the user's last-downloaded timestamp from localStorage
  const allPresets = useMemo<FlagPreset[]>(() => {
    const currentUserNameLower = session?.user?.name?.toLowerCase() || "";
    const overridesMap = new Map<string, any>();
    for (const p of dbPresets) {
      const creatorId = p.owner_id || p.creator_id;
      if (creatorId === "override") {
        const name = p.preset_name || p.name;
        if (name) {
          overridesMap.set(name.toLowerCase(), p);
        }
      }
    }

    const apiPresets = Object.values(mergedPresets)
      .filter(
        (p) =>
          !p.hidden &&
          p.flags &&
          !p.flags.startsWith("<") &&
          p.flags.trim() !== "",
      )
      .map((p): FlagPreset => {
        const override = overridesMap.get(p.name.toLowerCase());
        const isDeleted = override?.deleted === true;

        let officialVal =
          p.is_official !== undefined ? !!p.is_official : !!p.official;
        if (override) {
          if (override.is_official !== undefined) {
            officialVal = !!override.is_official;
          } else if (override.official !== undefined) {
            officialVal = !!override.official;
          } else if (
            Array.isArray(override.tags) &&
            override.tags.includes("official")
          ) {
            officialVal = true;
          }
        }
        const tagsVal = override?.tags ? override.tags : p.tags || [];

        return {
          ...p,
          creator_id: p.owner_id || p.creator_id,
          official: officialVal,
          tags: tagsVal,
          hidden: isDeleted,
          last_downloaded: currentUserId
            ? getLastDownloaded(currentUserId, p.name)
            : undefined,
        };
      })
      .filter((p) => !p.hidden);

    const combined: FlagPreset[] = [...apiPresets];
    const existingNames = new Set(apiPresets.map((p) => p.name.toLowerCase()));

    for (const dbP of mappedDbPresets) {
      if (!existingNames.has(dbP.name.toLowerCase())) {
        combined.push(dbP);
      }
    }

    return combined.filter((p) => {
      const isOfficial = p.official;
      const isUserOwned =
        currentUserId &&
        (String(p.creator_id) === String(currentUserId) ||
          String(p.creator_name).toLowerCase() === currentUserNameLower);
      const isLocalCustom = customPresets[p.name] !== undefined;
      const isUserDbPreset = mappedDbPresets.some(
        (dbP) =>
          dbP.name.toLowerCase() === p.name.toLowerCase() &&
          currentUserId &&
          (String(dbP.creator_id) === String(currentUserId) ||
            String(dbP.creator_name).toLowerCase() === currentUserNameLower),
      );

      return isOfficial || isUserOwned || isLocalCustom || isUserDbPreset;
    });
  }, [
    mergedPresets,
    currentUserId,
    mappedDbPresets,
    dbPresets,
    customPresets,
    session?.user?.name,
  ]);

  const customPresetNames = new Set(Object.keys(customPresets));

  const eventPresets = useMemo(() => {
    return allPresets.filter((p) => p.official);
  }, [allPresets]);

  const myPresets = useMemo(() => {
    // 1. Start with all database saved presets authored by current user
    const combined = mappedDbPresets.filter(
      (p) => currentUserId && String(p.creator_id) === String(currentUserId),
    );
    const existingNames = new Set(combined.map((p) => p.name.toLowerCase()));

    // 2. Add local storage custom presets if they aren't duplicates
    const customList = Object.values(customPresets);
    for (const cp of customList) {
      if (!existingNames.has(cp.name.toLowerCase())) {
        combined.push(cp);
      }
    }

    // 3. Add any presets from the API that have matching creator_id
    const apiMyPresets = allPresets.filter(
      (p) =>
        currentUserId &&
        !p.official &&
        String(p.creator_id) === String(currentUserId),
    );

    for (const ap of apiMyPresets) {
      if (!existingNames.has(ap.name.toLowerCase())) {
        combined.push(ap);
      }
    }

    return combined;
  }, [mappedDbPresets, customPresets, allPresets, currentUserId]);

  const handleSelect = (preset: FlagPreset) => {
    // Dispatch setActivePreset BEFORE setRawFlags so the preset name is set
    // when setRawFlags fires. presetSlice deliberately does NOT listen on
    // setRawFlags, so this order is safe.
    dispatch(setActivePreset(preset.name));
    dispatch(setRawFlags(preset.flags));
    dispatch(setRawObjectives(preset.flags));
    dispatch(setRawStartingItems(preset.flags));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("animate-preset-box"));
    }
  };

  const handleClear = () => {
    dispatch(clearActivePreset());
  };

  // Global search across all
  const searchActive = globalSearch.trim().length > 0;
  const searchResults = searchActive
    ? allPresets.filter(
        (p) =>
          p.name.toLowerCase().includes(globalSearch.toLowerCase()) ||
          (p.description || "")
            .toLowerCase()
            .includes(globalSearch.toLowerCase()) ||
          (p.creator_name || p.creator || "")
            .toLowerCase()
            .includes(globalSearch.toLowerCase()),
      )
    : [];

  return (
    <PageContainer columns={1}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {/* Header */}
        <div>
          <h1
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--text-main)",
              margin: "0 0 0.25rem",
            }}
          >
            Presets
          </h1>
          <p
            style={{ color: "var(--text-sub)", fontSize: "0.9rem", margin: 0 }}
          >
            Choose a preset to load its flagset or click one of the randomize
            options for a new experience every time. You can customize the flags
            further using the tabs on the left before generation, or go straight
            to &ldquo;Generate&rdquo; to download a seed.
          </p>
        </div>

        {/* Style injection for slideUpFade keyframes only */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes slideUpFade {
            from { transform: translateY(12px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `,
          }}
        />

        {/* Random / Chaos / True Chaos rolling panel */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-1">
          {randomRolls.map((card) => {
            const isRolled = toast && toast.type === card.id;
            return (
              <div
                key={card.id}
                onClick={() => handleRandomRoll(card.id as any, card.generator)}
                className={`group relative overflow-hidden cursor-pointer flex flex-col justify-between p-5 rounded-[14px] border transition-all duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]
                  ${
                    isRolled
                      ? "scale-[0.98] border-[var(--card-color)] bg-[rgba(var(--card-rgb),0.12)] shadow-[0_0_15px_var(--card-glow)]"
                      : "border-[var(--border-light)] bg-[var(--bg-card)] hover:-translate-y-1 hover:border-[var(--card-color)] hover:bg-[linear-gradient(135deg,rgba(var(--card-rgb),0.08)_0%,rgba(var(--card-rgb),0.01)_100%)] hover:shadow-[0_10px_20px_-5px_rgba(var(--card-rgb),0.15),0_4px_6px_-2px_rgba(var(--card-rgb),0.15)] max-sm:hover:translate-y-0 max-sm:hover:border-[var(--border-light)] max-sm:hover:bg-[var(--bg-card)] max-sm:hover:shadow-none"
                  }
                  max-sm:p-[0.6rem_0.4rem] max-sm:min-h-[125px] max-sm:justify-center max-sm:items-center max-sm:text-center max-sm:gap-1 max-sm:rounded-xl
                `}
                style={
                  {
                    "--card-color": card.color,
                    "--card-rgb": card.rgb,
                    "--card-glow": card.glow,
                  } as React.CSSProperties
                }
              >
                {isRolled ? (
                  <div className="flex flex-col items-center justify-center flex-1 gap-2 text-center animate-[slideUpFade_0.2s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                    <div className="flex items-center justify-center w-11 h-11 rounded-full text-lg font-bold bg-[rgba(var(--card-rgb),0.2)] text-[var(--card-color)]">
                      ✓
                    </div>
                    <span className="text-[0.95rem] font-extrabold text-[var(--text-main)]">
                      {card.id === "random"
                        ? "Rolled Random!"
                        : card.id === "chaos"
                          ? "Chaos Unleashed!"
                          : "Void Entered!"}
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Visual Accent/Glow backdrop on hover */}
                    <div className="absolute -top-[20%] -right-[20%] w-20 h-20 rounded-full bg-[var(--card-color)] blur-[40px] opacity-0 pointer-events-none transition-opacity duration-250 group-hover:opacity-[0.15] max-sm:group-hover:opacity-0" />

                    <div className="flex items-start justify-between w-full max-sm:justify-center max-sm:mb-1">
                      <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[var(--bg-app)] border border-[var(--border-light)] text-[var(--card-color)] transition-all duration-250 group-hover:bg-[rgba(0,0,0,0.15)] group-hover:border-[var(--card-color)] max-sm:w-9 max-sm:h-9 max-sm:rounded-lg max-sm:group-hover:bg-[var(--bg-app)] max-sm:group-hover:border-[var(--border-light)]">
                        {card.icon}
                      </div>
                      <span className="text-[0.7rem] font-bold uppercase tracking-wider text-[var(--card-color)] bg-[rgba(var(--card-rgb),0.1)] px-2 py-0.5 rounded-md max-sm:hidden">
                        Preset Generator
                      </span>
                    </div>

                    <div className="flex flex-col max-sm:items-center max-sm:justify-center max-sm:w-full">
                      <h3 className="text-lg font-extrabold m-0 mb-1.5 text-[var(--text-main)] transition-colors duration-200 max-sm:text-[0.8rem] max-sm:m-0 max-sm:font-bold max-sm:leading-[1.1]">
                        {card.title}
                      </h3>
                      <p className="block max-sm:hidden text-[0.82rem] text-[var(--text-sub)] m-0 leading-[1.4] min-h-[2.8rem]">
                        {card.helper}
                      </p>
                      <p className="hidden max-sm:block text-[0.6rem] text-[var(--text-sub)] mt-0.5 leading-[1.1] opacity-80">
                        {card.id === "random"
                          ? "Light randomization"
                          : card.id === "chaos"
                            ? "More randomization"
                            : "Total randomization"}
                      </p>
                    </div>

                    <div className="flex max-sm:hidden items-center justify-between mt-2 pt-3 border-t border-[var(--border-light)] text-[0.8rem] font-bold text-[var(--text-sub)] transition-all duration-250 ease-in-out group-hover:text-[var(--card-color)]">
                      <span>{card.action}</span>
                      <span className="transition-transform duration-200 group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Create Preset Form Section */}
        {ENABLE_PRESET_CREATION && (
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: "12px",
              border: "1px solid var(--border-light)",
              overflow: "hidden",
              transition: "all 0.3s ease",
            }}
          >
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "1rem 1.25rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-main)",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <span
                  style={{
                    color: "#3b82f6",
                    fontSize: "1.1rem",
                    display: "flex",
                  }}
                >
                  <FaPlus />
                </span>
                <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                  Create Custom Preset
                </span>
              </div>
              <FaChevronDown
                size={14}
                style={{
                  color: "var(--text-sub)",
                  transform: showCreateForm ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 0.2s",
                }}
              />
            </button>

            {showCreateForm && (
              <form
                onSubmit={handleCreatePreset}
                style={{ padding: "0 1.25rem 1.25rem" }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <p
                    style={{
                      color: "var(--text-sub)",
                      fontSize: "0.8rem",
                      margin: "0 0 0.25rem",
                    }}
                  >
                    Save your currently selected flags as a custom preset. It
                    will be saved locally and synced back.
                  </p>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-main)",
                      }}
                    >
                      Preset Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      placeholder="e.g. DoubleDown Blitz Race"
                      style={{
                        padding: "0.6rem",
                        background: "var(--bg-app)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "8px",
                        color: "var(--text-main)",
                        outline: "none",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-main)",
                      }}
                    >
                      Creator Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={creatorName}
                      onChange={(e) => setCreatorName(e.target.value)}
                      placeholder="Your handle"
                      style={{
                        padding: "0.6rem",
                        background: "var(--bg-app)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "8px",
                        color: "var(--text-main)",
                        outline: "none",
                        fontSize: "0.85rem",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-main)",
                      }}
                    >
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your preset..."
                      rows={2}
                      style={{
                        padding: "0.6rem",
                        background: "var(--bg-app)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "8px",
                        color: "var(--text-main)",
                        outline: "none",
                        resize: "none",
                        fontSize: "0.85rem",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.25rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: "var(--text-main)",
                      }}
                    >
                      Current Flags
                    </label>
                    <div
                      style={{
                        padding: "0.6rem",
                        background: "rgba(0,0,0,0.1)",
                        border: "1px solid var(--border-light)",
                        borderRadius: "8px",
                        color: "var(--text-sub)",
                        fontSize: "0.75rem",
                        wordBreak: "break-all",
                        maxHeight: "60px",
                        overflowY: "auto",
                        fontFamily: "monospace",
                      }}
                    >
                      {activeFlags || "No flags selected"}
                    </div>
                  </div>

                  {submitError && (
                    <div
                      style={{
                        color: "#ef4444",
                        fontSize: "0.8rem",
                        marginTop: "0.25rem",
                      }}
                    >
                      {submitError}
                    </div>
                  )}

                  {submitSuccess && (
                    <div
                      style={{
                        color: "#10b981",
                        fontSize: "0.8rem",
                        marginTop: "0.25rem",
                        fontWeight: 600,
                      }}
                    >
                      ✓ Preset successfully created!
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !activeFlags}
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.6rem",
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      opacity: isSubmitting || !activeFlags ? 0.7 : 1,
                    }}
                  >
                    {isSubmitting ? "Creating..." : "Save & Sync Preset"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Global search */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            background: "var(--bg-card)",
            borderRadius: "10px",
            border: "1px solid var(--border-light)",
          }}
        >
          <FaSearch color="var(--text-sub)" />
          <input
            type="text"
            placeholder="Search all presets..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              fontSize: "0.95rem",
              color: "var(--text-main)",
              flex: 1,
            }}
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-sub)",
                fontSize: "0.8rem",
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Active selection banner — shown whenever a preset is active */}
        {activePresetName && (
          <div
            style={{
              padding: "0.75rem 1rem",
              background: "rgba(59,130,246,0.08)",
              border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#3b82f6",
              fontSize: "0.9rem",
              fontWeight: 600,
            }}
          >
            <span>
              ✓ Active preset: <strong>{activePresetName}</strong>
            </span>
            <button
              onClick={handleClear}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                background: "none",
                border: "1px solid rgba(59,130,246,0.4)",
                borderRadius: "6px",
                cursor: "pointer",
                color: "#3b82f6",
                fontSize: "0.78rem",
                fontWeight: 600,
                padding: "0.2rem 0.55rem",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "rgba(59,130,246,0.12)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  "none")
              }
            >
              <FaTimes size={10} />
              Clear
            </button>
          </div>
        )}

        {/* Global search results */}
        {searchActive ? (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <p
              style={{
                color: "var(--text-sub)",
                fontSize: "0.85rem",
                margin: 0,
              }}
            >
              Found {searchResults.length} result
              {searchResults.length !== 1 ? "s" : ""}
            </p>
            {searchResults.map((p) => (
              <PresetCard
                key={p.name}
                preset={p}
                onSelect={handleSelect}
                selected={activePresetName === p.name}
              />
            ))}
          </div>
        ) : (
          <>
            <CategorySection
              icon={<FaCalendarAlt />}
              title="Event Presets"
              color="#f59e0b"
              presets={eventPresets}
              selectedName={activePresetName}
              onSelect={handleSelect}
              defaultOpen={true}
            />
            <CategorySection
              icon={<FaUser />}
              title="My Presets"
              color="#8b5cf6"
              presets={myPresets}
              selectedName={activePresetName}
              onSelect={handleSelect}
              defaultOpen={true}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
};
