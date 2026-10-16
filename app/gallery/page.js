import GalleryGrid from "@/components/GalleryGrid";

export const metadata = {
  title: "Public Gallery | Aghori Share",
  description: "Browse active ephemeral images shared across the public network on Aghori Share.",
};

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <GalleryGrid limit={16} />
    </div>
  );
}
