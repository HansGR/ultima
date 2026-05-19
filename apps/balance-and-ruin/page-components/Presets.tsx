import { useCallback, useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

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
} from "react-icons/fa";
import { setRawFlags, selectRawFlags } from "~/state/flagSlice";
import { setRawObjectives } from "~/state/objectiveSlice";
import {
  setActivePreset,
  clearActivePreset,
  selectActivePresetName,
} from "~/state/presetSlice";
import { FlagPreset } from "~/types/preset";
import { PageContainer } from "~/components/PageContainer/PageContainer";

// ─── LocalStorage helpers ──────────────────────────────────────────────────────

const LS_KEY = (userId: string, presetName: string) =>
  `preset_last_dl:${userId}:${presetName}`;

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
                {new Date(preset.created_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
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
                Downloaded{" "}
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
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

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

  if (presets.length === 0) return null;

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
        onClick={() => setOpen(!open)}
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
                No results found.
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

type PresetsPageProps = {
  presets: Record<string, FlagPreset>;
};

export const Presets = ({ presets: rawPresets }: PresetsPageProps) => {
  const dispatch = useDispatch();

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

  const currentUserId: string | undefined = undefined;

  useEffect(() => {
    try {
      const stored = localStorage.getItem("custom_presets");
      if (stored) {
        setCustomPresets(JSON.parse(stored));
      }
    } catch (e) {}
  }, []);

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

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    const createdPreset: FlagPreset = {
      name: newPresetName.trim(),
      creator_name: creatorName.trim(),
      creator: creatorName.trim(),
      description: description.trim(),
      flags: activeFlags,
      creator_id: 0,
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
  const allPresets = Object.values(mergedPresets)
    .filter(
      (p) =>
        !p.hidden &&
        p.flags &&
        !p.flags.startsWith("<") &&
        p.flags.trim() !== "",
    )
    .map((p) => ({
      ...p,
      last_downloaded: currentUserId
        ? getLastDownloaded(currentUserId, p.name)
        : undefined,
    }));

  const customPresetNames = new Set(Object.keys(customPresets));

  const eventPresets = allPresets.filter((p) => p.official);

  const myPresets = allPresets.filter(
    (p) =>
      customPresetNames.has(p.name) ||
      (currentUserId &&
        !p.official &&
        String(p.creator_id) === String(currentUserId)),
  );

  const communityPresets = allPresets.filter(
    (p) =>
      !p.official &&
      !customPresetNames.has(p.name) &&
      !(currentUserId && String(p.creator_id) === String(currentUserId)),
  );

  const handleSelect = (preset: FlagPreset) => {
    // Dispatch setActivePreset BEFORE setRawFlags so the preset name is set
    // when setRawFlags fires. presetSlice deliberately does NOT listen on
    // setRawFlags, so this order is safe.
    dispatch(setActivePreset(preset.name));
    dispatch(setRawFlags(preset.flags));
    dispatch(setRawObjectives(preset.flags));

    // Record download time for the logged-in user
    if (currentUserId) {
      recordDownload(currentUserId, preset.name);
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
            Choose an event or community-created preset to load its flagset. You
            can customize it further using the tabs on the left before
            generation, or go straight to &ldquo;Generate&rdquo; to download a
            seed.
          </p>
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
            {myPresets.length > 0 && (
              <CategorySection
                icon={<FaUser />}
                title="My Presets"
                color="#8b5cf6"
                presets={myPresets}
                selectedName={activePresetName}
                onSelect={handleSelect}
                defaultOpen={true}
              />
            )}
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
              icon={<FaUsers />}
              title="Community Presets"
              color="#10b981"
              presets={communityPresets}
              selectedName={activePresetName}
              onSelect={handleSelect}
              defaultOpen={false}
            />
          </>
        )}
      </div>
    </PageContainer>
  );
};
