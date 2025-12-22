import { MediaLibrary } from "./components";

export const metadata = {
  title: "Media Library | ClientFlow",
  description: "Upload and manage your images.",
};

export default function MediaPage() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div>
        <h1 className="font-bold">Media Library</h1>
        <p className="text-muted-foreground mt-0.5 sm:mt-1">
          Upload and manage your images
        </p>
      </div>
      <MediaLibrary />
    </div>
  );
}
