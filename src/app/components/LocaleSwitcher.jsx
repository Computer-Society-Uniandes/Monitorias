"use client";

import React from "react";
import { useI18n } from "app/lib/i18n";

export default function LocaleSwitcher() {
  const { locale, setLocale } = useI18n();
  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 50, background: "#fff", border: "1px solid #eee", borderRadius: 8, padding: 8 }}>
      <button
        onClick={() => setLocale(locale === "es" ? "en" : "es")}
        style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6 }}
        aria-label="toggle-locale"
      >
        {locale === "es" ? "EN" : "ES"}
      </button>
    </div>
  );
}
