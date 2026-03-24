import { PersistentHeader } from "@/components/shared";
import { useTheme } from "@/contexts/ThemeContext";
import { FeedbackSection } from "@/feature/feedback/FeedbackSection";

export default function FeedbackPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="glass-page min-h-screen text-[var(--paper-foreground)]">
      <PersistentHeader variant="solid" showBreadcrumb={false} />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <FeedbackSection isDark={isDark} />
      </main>
    </div>
  );
}
