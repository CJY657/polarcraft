import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getStorageItem, setStorageItem } from "@/lib/storage";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      const saved = getStorageItem("polarcraft-theme");
      if (saved === "light" || saved === "dark") return saved;
    }
    return "light";
  });

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
      // Dark theme CSS variables
      root.style.setProperty("--bg-primary", "#0d1b1d");
      root.style.setProperty("--bg-secondary", "#132a2e");
      root.style.setProperty("--bg-tertiary", "rgba(22, 47, 52, 0.72)");
      root.style.setProperty("--bg-card", "rgba(18, 41, 46, 0.88)");
      root.style.setProperty("--bg-overlay", "rgba(13, 27, 29, 0.84)");
      root.style.setProperty("--text-primary", "#edf8f6");
      root.style.setProperty("--text-secondary", "#a3bdb7");
      root.style.setProperty("--text-muted", "#86a29b");
      root.style.setProperty("--border-color", "rgba(118, 159, 152, 0.28)");
      root.style.setProperty("--accent-cyan", "#82b2ff");
      root.style.setProperty("--accent-purple", "#6e9fff");
      root.style.setProperty("--accent-green", "#38d1a7");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
      // Light theme CSS variables
      root.style.setProperty("--bg-primary", "#f6fbf8");
      root.style.setProperty("--bg-secondary", "#eef7f3");
      root.style.setProperty("--bg-tertiary", "#f4f8ff");
      root.style.setProperty("--bg-card", "#ffffff");
      root.style.setProperty("--bg-overlay", "rgba(246, 251, 248, 0.92)");
      root.style.setProperty("--text-primary", "#243b53");
      root.style.setProperty("--text-secondary", "#61758a");
      root.style.setProperty("--text-muted", "#7b8794");
      root.style.setProperty("--border-color", "#dbe8e4");
      root.style.setProperty("--accent-cyan", "#1865f2");
      root.style.setProperty("--accent-purple", "#3b82f6");
      root.style.setProperty("--accent-green", "#14bf96");
    }

    setStorageItem("polarcraft-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
