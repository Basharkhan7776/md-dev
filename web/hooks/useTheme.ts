import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

function getSystemDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(mode: ThemeMode) {
  const dark = mode === "dark" || (mode === "system" && getSystemDark());
  document.documentElement.classList.toggle("dark", dark);
  return dark;
}

/**
 * Theme is driven only by the CLI (`--theme`).
 * Default is system; no UI toggle / localStorage.
 */
export function useTheme(mode: ThemeMode = "system") {
  const [isDark, setIsDark] = useState(() =>
    typeof window !== "undefined" ? applyTheme(mode) : false,
  );

  useEffect(() => {
    setIsDark(applyTheme(mode));

    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setIsDark(applyTheme("system"));
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mode]);

  return { mode, isDark };
}
