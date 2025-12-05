import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function DocCard({ icon: Icon, title, description, href }) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <Icon className="h-8 w-8 text-primary mb-4" />
        <h3 className="font-semibold text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        <Link href={href}>
          <Button variant="outline" size="sm">Read More</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
