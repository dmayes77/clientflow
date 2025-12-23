"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  CreditCard,
  Smartphone,
  Bell,
  Receipt,
  Workflow,
  Mail,
  Shield,
  Zap,
  Calendar,
  Users,
  Package,
  Image,
  Code,
  Webhook,
  FileText,
  Activity,
  Link2,
  Boxes,
  Navigation,
  Share2,
  Download,
  Camera,
  Bug,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

// Icon mapping
const ICON_MAP = {
  Sparkles,
  CreditCard,
  Smartphone,
  Bell,
  Receipt,
  Workflow,
  Mail,
  Shield,
  Zap,
  Calendar,
  Users,
  Package,
  Image,
  Code,
  Webhook,
  FileText,
  Activity,
  Link2,
  Boxes,
  Navigation,
  Share2,
  Download,
  Camera,
  Bug,
  AlertTriangle,
};

const TYPE_STYLES = {
  feature: "bg-green-100 text-green-700",
  improvement: "bg-blue-100 text-blue-700",
  fix: "bg-orange-100 text-orange-700",
  breaking: "bg-red-100 text-red-700",
};

const TYPE_LABELS = {
  feature: "New",
  improvement: "Improved",
  fix: "Fixed",
  breaking: "Breaking",
};

export function ChangelogList() {
  const [changelog, setChangelog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/public/changelog")
      .then((res) => res.json())
      .then((data) => {
        if (data.changelog) {
          setChangelog(data.changelog);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch changelog:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Failed to load changelog</p>
          <p className="text-sm text-muted-foreground mt-2">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (changelog.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No releases yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Check back soon for updates!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {changelog.map((release) => (
        <Card key={release.version}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="flex items-center gap-2">
                  {release.isNew && <Sparkles className="h-4 w-4 text-amber-500" />}
                  {release.title}
                </CardTitle>
                {release.isNew && (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Latest</Badge>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-2">
                <span>v{release.version} &middot; {release.date}</span>
                {release.htmlUrl && (
                  <a
                    href={release.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {release.items && release.items.length > 0 ? (
              release.items.map((item, index) => {
                const Icon = ICON_MAP[item.icon] || Sparkles;
                return (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-lg ${TYPE_STYLES[item.type] || TYPE_STYLES.feature}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.title}</span>
                        <Badge variant="outline" className="hig-caption2">
                          {TYPE_LABELS[item.type] || TYPE_LABELS.feature}
                        </Badge>
                      </div>
                      {item.description && item.description !== item.title && (
                        <p className="text-muted-foreground mt-0.5">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-muted-foreground">See full release notes for details.</p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
