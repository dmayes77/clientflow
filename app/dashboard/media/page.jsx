import { MediaLibrary } from "./components";

export const metadata = {
  title: "Media Library | ClientFlow",
  description: "Upload and manage your images.",
};

export default function MediaPage() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h1 className="text-[22px] sm:text-2xl font-bold">Media Library</h1>
        <p className="text-[13px] sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
          Upload and manage your images
        </p>
      </div>
      <MediaLibrary />
    </div>
  );
}
