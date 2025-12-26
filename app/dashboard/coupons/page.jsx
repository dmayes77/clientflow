import { CouponsList } from "./components";

export const metadata = {
  title: "Coupons | ClientFlow",
  description: "Create and manage discount codes.",
};

export default function CouponsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-bold">Coupons</h1>
        <p className="text-muted-foreground">Create and manage discount codes</p>
      </div>
      <CouponsList />
    </div>
  );
}
