import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RoadmapItem({ status, title, description }) {
  return (
    <Card>
      <CardContent className="pt-6 flex items-start gap-4">
        <Badge variant={status === "completed" ? "default" : status === "in-progress" ? "secondary" : "outline"}>
          {status === "completed" ? "Done" : status === "in-progress" ? "In Progress" : "Planned"}
        </Badge>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
