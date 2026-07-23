import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { signIn, signOut } from "~/hooks/useAppSession";
import { useAppSession } from "~/hooks/useAppSession";
import { selectVersion } from "~/state/settingsSlice";

const AUTH_ENABLED = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false";

import {
  FaDiscord,
  FaBook,
  FaSearch,
  FaBolt,
  FaSlidersH,
} from "react-icons/fa";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi";
import styles from "~/components/FlagCreatePage/FlagCreatePage.module.css";

type AppLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export const AppLayout = ({ children, title }: AppLayoutProps) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const { data: session, status } = useAppSession();
  const [profileHovered, setProfileHovered] = useState(false);
  const logoSrc =
    theme === "dark" ? "/logo-transparent.png?v=2" : "/logo-light.png?v=2";
  const version = useSelector(selectVersion);

  useEffect(() => {
    const saved = localStorage.getItem("app-theme") as "light" | "dark";
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    const defaultTheme = saved || (prefersDark ? "dark" : "light");
    setTheme(defaultTheme);
    if (defaultTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("app-theme", next);
    if (next === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div
            className={styles.logo}
            style={{
              width: "100%",
              position: "relative",
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
                src={logoSrc}
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
        </div>

        {/* Nav links */}
        <div
          style={{
            padding: "0 0 1rem 0",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            gap: "0.25rem",
          }}
        >
          <a
            href="/create"
            className={styles.tabItem}
            style={{ textDecoration: "none" }}
          >
            <FaBolt size={16} />
            <span>Generator</span>
          </a>

          {!AUTH_ENABLED ? null : (
            <>
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.15)",
                  margin: "1.5rem 1rem 0.75rem 1rem",
                }}
              />
              {session?.user ? (
                <a
                  href="/create?tab=profile"
                  className={styles.tabItem}
                  style={{
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#334155",
                      flexShrink: 0,
                    }}
                  >
                    {session.user.image ? (
                      <img
                        src={session.user.image}
                        alt=""
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <FaDiscord size={12} color="white" />
                    )}
                  </div>
                  <span>Profile</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => signIn("discord")}
                  className={styles.discordLoginBtn}
                  style={{ width: "calc(100% - 2rem)" }}
                >
                  <FaDiscord size={20} />
                  <span>Login</span>
                </button>
              )}
              <div
                style={{
                  borderTop: "1px solid rgba(255, 255, 255, 0.15)",
                  margin: "0.75rem 1rem 0.75rem 1rem",
                }}
              />
            </>
          )}
        </div>

        {/* Bottom link */}
        <div style={{ padding: "1rem" }}>
          <a
            href="https://discord.gg/5MPeng5"
            target="_blank"
            rel="noreferrer"
            className={styles.tabItem}
            style={{ textDecoration: "none" }}
          >
            <FaDiscord size={16} />
            <span>Join Discord</span>
          </a>
        </div>

        <div className={styles.sidebarFooter}>
          <span>Version</span>
          <span className={styles.versionBadge}>
            {version ? `v${version}` : "Unknown"}
          </span>
        </div>
      </aside>

      {/* Main area */}
      <main className={styles.mainContent}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center text-neutral-600 dark:text-neutral-300 shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer"
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
          </div>

          <div className={styles.topBarLinks}>
            <a
              href="https://ff6worldscollide.com/sotw/"
              target="_blank"
              rel="noreferrer"
              className={styles.topBarLink}
            >
              <span style={{ fontSize: "20px" }}>🌱</span>
              <span>SEED OF THE WEEK</span>
            </a>
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
            />
          </div>
        </div>

        {/* Page content */}
        <div className={styles.pageContainer}>{children}</div>
      </main>
    </div>
  );
};
