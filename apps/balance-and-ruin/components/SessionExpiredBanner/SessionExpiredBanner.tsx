import React, { useEffect, useState } from "react";
import { signIn } from "~/hooks/useAppSession";
import { FaExclamationTriangle, FaTimes, FaDiscord } from "react-icons/fa";

export const SessionExpiredBanner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleExpired = () => {
      setShow(true);
    };

    window.addEventListener("auth:expired", handleExpired);
    return () => {
      window.removeEventListener("auth:expired", handleExpired);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        maxWidth: "400px",
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        border: "2px solid #ef4444",
        borderRadius: "8px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
        color: "#f8fafc",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        animation: "slideIn 0.3s ease-out forwards",
      }}
    >
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div
        style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}
      >
        <FaExclamationTriangle
          size={20}
          color="#ef4444"
          style={{ flexShrink: 0, marginTop: "2px" }}
        />
        <div style={{ flexGrow: 1 }}>
          <h4
            style={{
              margin: 0,
              fontWeight: "bold",
              fontSize: "0.95rem",
              color: "#f87171",
            }}
          >
            Session Expired
          </h4>
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.85rem",
              color: "#cbd5e1",
              lineHeight: 1.4,
            }}
          >
            Your connection has expired or been invalidated. Please sign in
            again to continue saving presets.
          </p>
        </div>
        <button
          onClick={() => setShow(false)}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            padding: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="hover:text-white"
        >
          <FaTimes size={14} />
        </button>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "0.5rem",
          marginTop: "0.25rem",
        }}
      >
        <button
          onClick={() => setShow(false)}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: "bold",
            padding: "0.5rem 0.75rem",
          }}
          className="hover:text-white"
        >
          Dismiss
        </button>
        <button
          onClick={() => {
            setShow(false);
            signIn("discord");
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            backgroundColor: "#5865F2",
            border: "none",
            borderRadius: "4px",
            color: "white",
            cursor: "pointer",
            fontSize: "0.8rem",
            fontWeight: "bold",
            padding: "0.5rem 1rem",
            boxShadow: "0 2px 4px rgba(88, 101, 242, 0.3)",
            transition: "background-color 0.2s",
          }}
          className="hover:bg-[#4752c4]"
        >
          <FaDiscord size={14} />
          <span>Login</span>
        </button>
      </div>
    </div>
  );
};
