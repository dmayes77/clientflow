import { MediaLibrary } from "./components";

export const metadata = {
  title: "Media Library | ClientFlow",
  description: "Upload and manage your images.",
};

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Media Library</h1>
        <p className="text-muted-foreground">Upload and manage your images</p>
      </div>
      <MediaLibrary />
    </div>
  );
}
