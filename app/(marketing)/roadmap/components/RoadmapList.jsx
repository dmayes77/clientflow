"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  Rocket,
  Lightbulb,
  ChevronUp,
} from "lucide-react";

const STATUS_CONFIG = {
  completed: {
    color: "bg-green-500",
    badgeClass: "bg-green-100 text-green-700 hover:bg-green-100",
    label: "Shipped",
    icon: Check,
    description: "Live and available to all users",
  },
  in_progress: {
    color: "bg-blue-500",
    badgeClass: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    label: "Building Now",
    icon: Rocket,
    description: "Currently in active development",
  },
  planned: {
    color: "bg-zinc-400",
    badgeClass: "bg-zinc-100 text-zinc-600 hover:bg-zinc-100",
    label: "Planned",
    icon: Lightbulb,
    description: "Ideas we're considering",
  },
};

export function RoadmapList() {
  const [items, setItems] = useState([]);
  const [grouped, setGrouped] = useState({ completed: [], in_progress: [], planned: [] });
  const [loading, setLoading] = useState(true);
  const [votedItems, setVotedItems] = useState(new Set());

  useEffect(() => {
    // Load voted items from localStorage
    const stored = localStorage.getItem("roadmap_votes");
    if (stored) {
      setVotedItems(new Set(JSON.parse(stored)));
    }

    // Fetch roadmap items
    fetch("/api/public/roadmap")
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setGrouped(data.grouped || { completed: [], in_progress: [], planned: [] });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch roadmap:", err);
        setLoading(false);
      });
  }, []);

  const handleVote = async (itemId) => {
    if (votedItems.has(itemId)) return;

    try {
      const res = await fetch("/api/public/roadmap/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });

      if (res.ok) {
        const { item } = await res.json();

        // Update local state
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, votes: item.votes } : i))
        );
        setGrouped((prev) => {
          const newGrouped = { ...prev };
          Object.keys(newGrouped).forEach((key) => {
            newGrouped[key] = newGrouped[key].map((i) =>
              i.id === itemId ? { ...i, votes: item.votes } : i
            );
          });
          return newGrouped;
        });

        // Mark as voted
        const newVoted = new Set(votedItems);
        newVoted.add(itemId);
        setVotedItems(newVoted);
        localStorage.setItem("roadmap_votes", JSON.stringify([...newVoted]));
      }
    } catch (err) {
      console.error("Failed to vote:", err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-16 py-16">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-4">
            <div className="h-8 bg-zinc-200 rounded animate-pulse w-48" />
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((j) => (
                <div key={j} className="h-32 bg-zinc-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const sections = [
    { key: "in_progress", title: "Building Now", subtitle: "Features currently in active development" },
    { key: "planned", title: "Planned Features", subtitle: "Vote for the features you want most" },
    { key: "completed", title: "Shipped", subtitle: "Features that are live and available to all users" },
  ];

  return (
    <div className="space-y-16 py-16">
      {sections.map((section) => {
        const sectionItems = grouped[section.key] || [];
        if (sectionItems.length === 0) return null;

        const config = STATUS_CONFIG[section.key];
        const Icon = config.icon;

        return (
          <div key={section.key} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`h-1 w-12 rounded ${config.color}`} />
              <div>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  <h2 className="text-2xl font-bold">{section.title}</h2>
                  <Badge className={config.badgeClass}>
                    {sectionItems.length}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {sectionItems.map((item) => {
                const hasVoted = votedItems.has(item.id);
                const canVote = section.key !== "completed";

                return (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        {canVote && (
                          <Button
                            variant={hasVoted ? "secondary" : "outline"}
                            size="sm"
                            className="flex flex-col h-auto py-2 px-3"
                            onClick={() => handleVote(item.id)}
                            disabled={hasVoted}
                          >
                            <ChevronUp className={`h-4 w-4 ${hasVoted ? "text-blue-600" : ""}`} />
                            <span className="text-xs font-semibold">{item.votes || 0}</span>
                          </Button>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold leading-relaxed">{item.title}</h3>
                            {item.category && (
                              <Badge variant="outline" className="text-xs shrink-0">
                                {item.category}
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {item.description}
                            </p>
                          )}
                          {!canVote && item.votes > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                              <ChevronUp className="h-3 w-3" />
                              <span>{item.votes} votes</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
