import { Tab } from "@headlessui/react";
import styles from "./FlagCreatePage.module.css";
import Head from "next/head";
import React, { useEffect, useMemo, useState, useRef } from "react";

import type { IconType } from "react-icons";
import {
  GiBrokenWall,
  GiDrinkMe,
  GiElectric,
  GiGladius,
  GiMagnifyingGlass,
  GiPaintBrush,
  GiRetroController,
  GiWizardStaff,
  GiSprout,
} from "react-icons/gi";
import {
  HiCog,
  HiOutlineViewList,
  HiUserGroup,
  HiOutlineQuestionMarkCircle,
  HiOutlineMoon,
  HiOutlineSun,
  HiCode,
  HiFlag,
} from "react-icons/hi";
import { HiOutlineWrench } from "react-icons/hi2";
import {
  FaDiscord,
  FaBook,
  FaSearch,
  FaSlidersH,
  FaBolt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { selectShowFlags, setShowFlags } from "~/state/settingsSlice";
import { CardColumn } from "~/components/CardColumn/CardColumn";
import { EventsTab } from "~/page-components/EventsTab";
import { SotwTab } from "~/page-components/SotwTab";
import { GenerateCard } from "~/components/GenerateCard/GenerateCard";
import { PageContainer } from "~/components/PageContainer/PageContainer";
import { Battle } from "~/page-components/Battle";
import { BetaPage } from "~/page-components/BetaPage";
import { Presets } from "~/page-components/Presets";
import { Commands } from "~/page-components/Commands";
import { Gameplay } from "~/page-components/Gameplay";
import { Graphics } from "~/page-components/Graphics";
import { Items } from "~/page-components/Items";
import { Magic } from "~/page-components/Magic";
import { Settings } from "~/page-components/Settings";
import { Objectives } from "~/page-components/Objectives";
import { Party } from "~/page-components/Party";
import { setObjectiveMetadata } from "~/state/objectiveSlice";
import { RawFlagMetadata, setSchema } from "~/state/schemaSlice";
import { ObjectiveMetadata } from "~/types/objectives";
import { FlagPreset } from "~/types/preset";
import { Switch } from "@ff6wc/ui";
import Image from "next/image";

type PageProps = {
  objectives: ObjectiveMetadata;
  presets: Record<string, FlagPreset>;
  schema: Record<string, RawFlagMetadata>;
  version: string;
};

type TabItem = {
  content?: React.ReactNode;
  label: string;
  Icon?: IconType;
  id: string;
  isAction?: boolean;
};

const TAB_TITLES_MAP: Record<string, string[]> = {
  presets: ["Presets", "Beta Presets", "Seed History"],
  objectives: ["Objectives", "Conditions", "Required Conditions", "Results"],
  party: ["Party Members", "Starting Party", "Starting Party Level"],
  commands: [
    "Blitz",
    "Excluded",
    "Commands",
    "Dance",
    "Lore",
    "Other",
    "Rage",
    "Sketch/Control",
    "Steal/Capture",
    "SwdTech",
    "Tools",
    "Fast SwdTech",
    "Everyone Learns",
    "Restore Retort Glitch",
    "Starting Tools",
    "Chance to Steal",
    "Fix Capture Bugs",
    "Steals & Drops",
    "Improved Sketch/Control",
    "Restore Sketch Glitch",
    "SwdTech Runic All",
    "Starting Rages",
    "No Leap",
    "No Charm",
  ],
  battle: [
    "Bosses",
    "Encounters",
    "Experience, Magic Points, Gold",
    "Scaling",
    "Level Scaling",
    "HP/MP Scaling",
    "Exp/GP Scaling",
    "Ability Scaling",
    "Scale Eight Dragons",
    "Scale Final Battles",
    "Boss Restoration",
    "Experience Multiplier",
    "Magic Points Multiplier",
    "Gold Multiplier",
    "Split Party Exp",
    "Boss Experience",
    "Random Encounters",
    "Fixed Encounters",
    "Escapable",
    "Dragon Battles",
    "Dragon Experience",
  ],
  magic: [
    "Espers",
    "Natural Magic",
    "Spells",
    "MP",
    "Learnable Spells",
    "Ultima",
    "Terra's Natural Magic",
    "Celes' Natural Magic",
    "Randomize Levels",
    "Randomize Spells",
    "Menu Indicator",
  ],
  items: [
    "Chests",
    "Coliseum",
    "Equipable Items",
    "Restrictions",
    "Other",
    "Shops",
    "Starting Gold/Items",
    "Cursed Shield Battles",
    "Stronger Atma Weapon",
    "Contents",
    "Price",
    "Sell Price",
    "Dried Meat",
    "No Breakable Rods",
    "Expensive Breakable Rods",
    "No Super Balls",
    "Expensive Super Balls",
    "No Priceless Items",
    "No Elemental Shields",
    "No Exp. Eggs",
    "No Illuminas",
    "Starting Gold",
    "Starting Moogle Charms",
    "Starting Warp Stones",
    "Starting Fenix Downs",
    "Equipment",
    "Relics",
    "Moogle Charms All",
    "Rewards Menu",
    "No Exp. Egg",
    "No Illumina",
    "MIAB Shuffled",
    "Random Monsters",
  ],
  misc: [
    "Auction House",
    "Challenges",
    "Checks",
    "Game Mode",
    "Other",
    "Movement",
    "No Free Characters/Espers",
    "Randomize Items",
    "Allow Chocobo/Airship",
    "Door Hint",
    "Max Espers",
    "Permadeath",
    "Normalize & Distort Boss Stats",
    "Add Phunbaba 3 to Boss Pool",
    "Ironmog Mode",
    "Y NPC",
    "Event Timers",
    "Original Name Display",
    "NPC Tips",
  ],
  Graphics: [
    "Character Sprites",
    "Sprite Palettes",
    "Other Sprites",
    "Palette",
  ],
  settings: [
    "Accessibility",
    "Bug Fixes",
    "Boss Restoration",
    "Enemy Damage Counter",
    "Evade",
    "Boss Skip",
    "Vanish/Doom",
    "Jump",
    "Boss Battles",
    "Statue Battles",
    "Restore Marshal's Lobos",
    "Restore Undead Bosses",
    "Chadarnook Less Demon",
    "Doom Gaze Escapes",
    "MagiMaster Casts Ultima on Death",
    "Wrexsoul Casts Zinger",
    "Remove Flashes",
    "High-Contrast World Minimap",
    "Alternate Healing Text Color",
  ],
  beta: [
    "Beta",
    "Workshop",
    "Random Encounters",
    "Sketch/Control Improved Abilities",
    "Starting Junk",
  ],
};

export const FlagCreatePage = ({
  objectives,
  presets,
  schema,
  version,
}: PageProps) => {
  const tabs: TabItem[] = useMemo(
    () =>
      [
        {
          label: "Presets",
          id: "presets",
          Icon: FaBook,
          content: <Presets presets={presets} />,
        },
        {
          label: "Objectives",
          id: "objectives",
          Icon: HiOutlineViewList,
          content: <Objectives />,
        },
        {
          label: "Party",
          id: "party",
          Icon: HiUserGroup,
          content: <Party />,
        },
        {
          label: "Commands",
          id: "commands",
          Icon: GiWizardStaff,
          content: <Commands />,
        },
        {
          label: "Battle",
          id: "battle",
          Icon: GiGladius,
          content: <Battle />,
        },
        {
          label: "Magic",
          id: "magic",
          Icon: GiElectric,
          content: <Magic />,
        },
        {
          label: "Items",
          id: "items",
          Icon: GiDrinkMe,
          content: <Items />,
        },
        {
          label: "Gameplay",
          id: "misc",
          Icon: GiRetroController,
          content: <Gameplay />,
        },
        {
          label: "Graphics",
          id: "Graphics",
          Icon: GiPaintBrush,
          content: <Graphics />,
        },
        {
          label: "Settings",
          id: "settings",
          Icon: FaSlidersH,
          content: <Settings presets={presets} />,
        },
        /* process.env.NEXT_PUBLIC_ENABLE_BETA === "true"
          ? {
              label: "Beta",
              id: "beta",
              Icon: HiOutlineWrench,
              content: <BetaPage />,
            }
          : null, */
        {
          label: "Generate",
          id: "generate",
          Icon: FaBolt,
          content: (
            <PageContainer columns={1}>
              <GenerateCard />
            </PageContainer>
          ),
          isAction: true,
        },
        {
          label: "Events",
          id: "events",
          Icon: HiFlag,
          content: <EventsTab />,
        },
        {
          label: "Seed of the Week",
          id: "sotw",
          Icon: GiSprout,
          content: <SotwTab />,
        },
      ].filter((z) => !!z) as TabItem[],
    [presets],
  );

  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeTabId = tabs[selectedIndex]?.id;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const mainContentRef = useRef<HTMLElement>(null);

  // Reset scroll position to top of main container whenever active tab index changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTop = 0;
    }
  }, [selectedIndex]);

  const dispatch = useDispatch();
  const showFlags = useSelector(selectShowFlags);

  const matchesSearch = (tabId: string) => {
    const normalizedSearch = searchQuery.trim().toLowerCase();
    if (!normalizedSearch) return false;
    const titles = TAB_TITLES_MAP[tabId] || [];
    const labelMatch = tabs
      .find((t) => t.id === tabId)
      ?.label.toLowerCase()
      .includes(normalizedSearch);
    const titlesMatch = titles.some((title) =>
      title.toLowerCase().includes(normalizedSearch),
    );
    return !!(labelMatch || titlesMatch);
  };

  useEffect(() => {
    const customCSS = typeof CSS !== "undefined" ? (CSS as any) : null;
    const customHighlight =
      typeof window !== "undefined" ? (window as any).Highlight : null;

    const highlight = () => {
      // Protect React nodes: Skip manual DOM string manipulation entirely. If CSS Highlight
      // is unavailable, gracefully degrade rather than forcing intrusive, destructive edits.
      if (!customCSS?.highlights || !customHighlight) {
        return;
      }

      const query = searchQuery.trim().toLowerCase();

      try {
        // Clear previous search matches gracefully
        customCSS.highlights.delete("search-results");
      } catch (e) {}

      if (!query) return;

      const elements = document.querySelectorAll(
        '.WC-Card div[class*="heading"], label, span[class*="Label"], h1, h2, h3, h4, h5, h6',
      );
      const ranges: Range[] = [];

      const findRanges = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = (node.nodeValue || "").toLowerCase();
          let start = 0;
          while ((start = text.indexOf(query, start)) !== -1) {
            const range = new Range();
            range.setStart(node, start);
            range.setEnd(node, start + query.length);
            ranges.push(range);
            start += query.length;
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          Array.from(node.childNodes).forEach(findRanges);
        }
      };

      elements.forEach(findRanges);

      if (ranges.length > 0) {
        try {
          const searchHighlight = new customHighlight(...ranges);
          customCSS.highlights.set("search-results", searchHighlight);
        } catch (e) {
          console.error("Failed to construct CSS custom highlight:", e);
        }
      }
    };

    highlight();
    const timer1 = setTimeout(highlight, 50);
    const timer2 = setTimeout(highlight, 250);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [searchQuery, selectedIndex]);

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [processedLogo, setProcessedLogo] = useState<string | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/logo.png";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        // A pixel is PART of the background grid if AND ONLY IF Blue is strictly dominant over Red AND Green.
        // This trivially preserves White (R=G=B), Gray (R=G=B), and Gold (R>B, G>B).
        const isBlueDominant = b > r && b > g;

        if (isBlueDominant) {
          data[i + 3] = 0; // Wipe background transparency
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setProcessedLogo(canvas.toDataURL("image/png"));
    };
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as "light" | "dark";
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const defaultTheme = savedTheme || (prefersDark ? "dark" : "light");

    setTheme(defaultTheme);
    if (defaultTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("app-theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    dispatch(setSchema(schema));
    dispatch(setObjectiveMetadata(objectives));
  }, [dispatch, objectives, schema]);

  return (
    <>
      <Head>
        <title>FF6WC</title>
        <meta
          name="description"
          content="Final Fantasy VI open-world randomizer"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <style>{`
        ::highlight(search-results) {
          background-color: #facc15 !important;
          color: #000000 !important;
        }
      `}</style>
      <div className={styles.layout}>
        <Tab.Group
          selectedIndex={selectedIndex}
          onChange={(idx) => {
            setSelectedIndex(idx);
            setSidebarOpen(false);
          }}
        >
          {sidebarOpen && (
            <div
              className={styles.sidebarBackdrop}
              onClick={() => setSidebarOpen(false)}
            />
          )}
          {/* Sidebar */}
          <aside
            className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
          >
            <button
              className={styles.closeSidebarBtn}
              onClick={() => setSidebarOpen(false)}
              title="Close Menu"
            >
              ✕
            </button>
            <div className={styles.sidebarHeader}>
              <div
                className={styles.logo}
                style={{
                  padding: "10px 10px 0 10px",
                  position: "relative",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src="/logo-transparent.png"
                    alt="Final Fantasy VI Randomizer"
                    style={{
                      objectFit: "contain",
                      width: "100%",
                      height: "auto",
                      maxHeight: "80px",
                    }}
                  />
                </div>
              </div>
              <div className={styles.userProfile}>
                <div
                  className={styles.avatar}
                  style={{ backgroundColor: "#5865F2" }}
                >
                  <FaDiscord color="white" />
                </div>
                <span className={styles.userName}>Login with Discord</span>
              </div>
            </div>

            <Tab.List className={styles.tabList}>
              {tabs.map((tab) => {
                const isSideNavHidden = ["events", "sotw"].includes(tab.id);
                const isHighlighted = matchesSearch(tab.id);

                return (
                  <Tab
                    key={tab.id}
                    className={`${tab.isAction ? styles.generateBtn : styles.tabItem} ${isHighlighted ? "bg-yellow-500/20 !text-yellow-400 border-l-4 border-yellow-400 font-bold" : ""} ${isSideNavHidden ? styles.mobileOnly : ""}`}
                  >
                    {tab.Icon && <tab.Icon size={20} />}
                    <span>{tab.label}</span>
                  </Tab>
                );
              })}
            </Tab.List>

            <div
              className={`${styles.mobileOnly} flex-col gap-1 border-t border-white/10 pt-4 mt-auto mb-4`}
            >
              <a
                href="https://wiki.ff6worldscollide.com/wiki/Main_Page"
                target="_blank"
                rel="noreferrer"
                className={styles.tabItem}
                style={{ margin: "0 1rem" }}
              >
                <FaBook size={20} />
                <span>WIKI</span>
              </a>
              <a
                href="https://discord.gg/5MPeng5"
                target="_blank"
                rel="noreferrer"
                className={styles.tabItem}
                style={{ margin: "0 1rem" }}
              >
                <FaDiscord size={20} />
                <span>DISCORD</span>
              </a>
            </div>
          </aside>

          {/* Main Content Area */}
          <main ref={mainContentRef} className={styles.mainContent}>
            {/* Top Bar */}
            <div className={styles.topBar}>
              <div
                className={styles.topBarLeft}
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "center",
                }}
              >
                <button
                  onClick={() => setSidebarOpen(true)}
                  className={styles.hamburgerBtn}
                  title="Open Navigation Menu"
                >
                  <FaBars size={22} />
                </button>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center text-neutral-600 dark:text-neutral-300 shadow-sm border border-slate-200 dark:border-slate-700"
                  title={
                    theme === "light" ? "Enable Dark Mode" : "Enable Light Mode"
                  }
                >
                  {theme === "light" ? (
                    <HiOutlineMoon size={22} />
                  ) : (
                    <HiOutlineSun size={22} className="text-yellow-400" />
                  )}
                </button>

                <button
                  onClick={() => dispatch(setShowFlags(!showFlags))}
                  className={`p-2 rounded-full transition-all flex items-center justify-center shadow-sm border ${showFlags ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border-blue-200 dark:border-blue-800" : "bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-600 dark:text-neutral-300 border-slate-200 dark:border-slate-700"}`}
                  title={showFlags ? "Hide Flags" : "Show Flags"}
                >
                  <HiCode size={22} />
                </button>
              </div>

              <div className={styles.topBarLinks}>
                <button
                  onClick={() => {
                    const idx = tabs.findIndex((t) => t.id === "events");
                    if (idx !== -1) setSelectedIndex(idx);
                  }}
                  className={`${styles.topBarLink} ${activeTabId === "events" ? styles.topBarLinkActive : ""}`}
                >
                  <HiFlag size={20} />
                  <span>EVENTS</span>
                </button>
                <button
                  onClick={() => {
                    const idx = tabs.findIndex((t) => t.id === "sotw");
                    if (idx !== -1) setSelectedIndex(idx);
                  }}
                  className={`${styles.topBarLink} ${activeTabId === "sotw" ? styles.topBarLinkActive : ""}`}
                >
                  <GiSprout size={20} />
                  <span>SEED OF THE WEEK</span>
                </button>
                <a
                  href="https://wiki.ff6worldscollide.com/wiki/Main_Page"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.topBarLink}
                >
                  <FaBook size={20} />
                  <span>WIKI</span>
                </a>
                <a
                  href="https://discord.gg/5MPeng5"
                  target="_blank"
                  rel="noreferrer"
                  className={styles.topBarLink}
                >
                  <FaDiscord size={20} />
                  <span>DISCORD</span>
                </a>
              </div>

              <div className={styles.searchBar}>
                <FaSearch color="#64748b" />
                <input
                  type="text"
                  placeholder="Search"
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    title="Clear search"
                  >
                    <FaTimes size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Form Content */}
            <div className={styles.pageContainer}>
              <Tab.Panels>
                {tabs.map(({ content, id }) => (
                  <Tab.Panel key={`tab-panel-${id}`}>{content}</Tab.Panel>
                ))}
              </Tab.Panels>
            </div>
          </main>
        </Tab.Group>
      </div>
    </>
  );
};
