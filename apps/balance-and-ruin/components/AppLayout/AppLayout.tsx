import React, { useEffect, useState } from "react";

import { FaDiscord, FaBook, FaSearch, FaBolt } from "react-icons/fa";
import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi";
import styles from "~/components/FlagCreatePage/FlagCreatePage.module.css";

type AppLayoutProps = {
  children: React.ReactNode;
  title?: string;
};

export const AppLayout = ({ children, title }: AppLayoutProps) => {
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
        if (b > r && b > g) data[i + 3] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
      setProcessedLogo(canvas.toDataURL("image/png"));
    };
  }, []);

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
              padding: "10px 10px 0 10px",
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

          {/* User profile */}
          <div style={{ width: "100%", marginTop: "0.75rem" }}>
            <div className={styles.userProfile}>
              <div
                className={styles.avatar}
                style={{ backgroundColor: "#5865F2" }}
              >
                <FaDiscord color="white" size={20} />
              </div>
              <span className={styles.userName}>Login with Discord</span>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div
          style={{
            padding: "1rem 0",
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
      </aside>

      {/* Main area */}
      <main className={styles.mainContent}>
        {/* Top bar */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
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
