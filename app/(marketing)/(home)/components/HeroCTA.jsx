import Link from "next/link";
import { Button } from "@/components/ui/button";

const DASHBOARD_URL = process.env.NEXT_PUBLIC_DASHBOARD_URL || "/dashboard";

export function HeroCTA() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
      <Link href={`${DASHBOARD_URL}/sign-up`} className="w-full sm:w-auto">
        <Button size="lg" className="w-full">Start Free Trial</Button>
      </Link>
      <Link href="/book" className="w-full sm:w-auto">
        <Button size="lg" variant="outline" className="w-full">
          Book a Call
        </Button>
      </Link>
    </div>
  );
}
