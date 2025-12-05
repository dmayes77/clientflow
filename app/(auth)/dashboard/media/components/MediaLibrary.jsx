"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Image, Upload } from "lucide-react";

export function MediaLibrary() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Image className="h-5 w-5 text-cyan-500" />
          Media Library
        </CardTitle>
        <Button size="sm" variant="success">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Upload and manage images for your business. All files are delivered via CDN for fast loading.
        </p>
      </CardContent>
    </Card>
  );
}
