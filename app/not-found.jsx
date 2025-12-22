import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, HelpCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-b from-background to-muted/30 px-4">
      <div className="text-center max-w-md">
        {/* Simple styled 404 */}
        <h1 className="text-8xl sm:text-9xl font-black bg-linear-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent mb-4">
          404
        </h1>

        {/* Message */}
        <h2 className="text-xl sm:text-2xl font-semibold mb-3">
          Page not found
        </h2>
        <p className="text-muted-foreground mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button asChild size="lg">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
        </div>

        {/* Help link */}
        <p className="text-sm text-muted-foreground">
          Need help?{" "}
          <Link href="/support" className="text-primary hover:underline inline-flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
