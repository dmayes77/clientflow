import { Card, CardContent } from "@/components/ui/card";
import { Code, HelpCircle, Gift, Lock, Wallet, LifeBuoy } from "lucide-react";

const iconMap = {
  api: Code,
  question: HelpCircle,
  gift: Gift,
  lock: Lock,
  wallet: Wallet,
  lifebuoy: LifeBuoy,
};

export function FAQCard({ icon, title, description }) {
  const Icon = iconMap[icon] || HelpCircle;

  return (
    <Card className="transition-all hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="pt-6">
        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
