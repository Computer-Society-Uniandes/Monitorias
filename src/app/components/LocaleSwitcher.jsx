"use client";

import React from "react";
import { useI18n } from "../../lib/i18n";

export default function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  const isES = locale === "es";

  const baseBtn = {
    padding: "6px 10px",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#ddd",
    borderRadius: 6,
    background: "#fff",
    cursor: "pointer",
  };

  const activeBtn = {
    ...baseBtn,
    background: "#111",
    color: "#fff",
    borderColor: "#111",
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 bg-white border border-gray-200 rounded-lg p-2 flex gap-2 lg:bottom-4">
      <button
        type="button"
        onClick={() => setLocale("es")}
        aria-pressed={isES}
        title="Español"
        style={isES ? activeBtn : baseBtn}
      >
        ES
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={!isES}
        title="English"
        style={!isES ? activeBtn : baseBtn}
      >
        EN
      </button>
    </div>
  );
}
