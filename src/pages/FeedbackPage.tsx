import { PersistentHeader } from "@/components/shared";
import { FeedbackSection } from "@/feature/feedback/FeedbackSection";

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-[#fffaf0] text-[#0a0a0a]">
      <PersistentHeader variant="solid" showBreadcrumb={false} />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <FeedbackSection />
      </main>
    </div>
  );
}
