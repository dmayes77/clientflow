"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStats, useBookings, useContacts, useServices, useInvoices, usePayments } from "@/lib/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarPlus, Users, UserPlus, DollarSign, TrendingUp, TrendingDown, Clock, ArrowRight, Package, Loader2, FilePlus2, ChevronRight, FileText, ChevronUp, Lightbulb, ExternalLink } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, formatDistanceToNow, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSameDay, isWithinInterval, subMonths } from "date-fns";

import { formatCompactCurrency } from "@/lib/formatters";

const CHART_COLORS = {
  pending: "#f59e0b",
  inquiry: "#f59e0b", // Legacy - treat as pending
  scheduled: "#a855f7",
  confirmed: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#71717a",
};

// Roadmap Voting Component
function RoadmapVoting() {
  const [roadmapItems, setRoadmapItems] = useState([]);
  const [votedItems, setVotedItems] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Load voted items from localStorage
    const stored = localStorage.getItem("roadmap_votes");
    if (stored) {
      setVotedItems(new Set(JSON.parse(stored)));
    }

    // Fetch top roadmap items
    fetch("/api/public/roadmap")
      .then((res) => res.json())
      .then((data) => {
        // Get top 5 items by votes, excluding completed
        const top = (data.items || [])
          .filter((item) => item.status !== "completed")
          .sort((a, b) => b.votes - a.votes)
          .slice(0, 5);
        setRoadmapItems(top);
        setLoading(false);
      })
      .catch(() => {
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
        setRoadmapItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, votes: item.votes } : i))
        );

        // Mark as voted
        const newVoted = new Set(votedItems);
        newVoted.add(itemId);
        setVotedItems(newVoted);
        localStorage.setItem("roadmap_votes", JSON.stringify([...newVoted]));
      }
    } catch {
      // Vote failed silently
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0 border-b">
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-blue-500 shrink-0" />
          <CardTitle className="font-medium leading-none">Vote on Features</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => router.push("/roadmap")}>
          View Roadmap
          <ExternalLink className="size-3 ml-1" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : roadmapItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
              <Lightbulb className="size-6 text-blue-600" />
            </div>
            <p className="text-muted-foreground mb-3">No features to vote on yet</p>
            <Button size="sm" onClick={() => router.push("/roadmap")}>
              View Roadmap
            </Button>
          </div>
        ) : (
          <div>
            {roadmapItems.map((item, index) => {
              const hasVoted = votedItems.has(item.id);
              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors",
                    index < roadmapItems.length - 1 && "border-b border-border"
                  )}
                  onClick={() => !hasVoted && handleVote(item.id)}
                >
                  <Button
                    variant={hasVoted ? "secondary" : "outline"}
                    size="sm"
                    className="flex flex-col h-auto py-2 px-3 shrink-0"
                    disabled={hasVoted}
                  >
                    <ChevronUp className={cn("h-4 w-4", hasVoted && "text-blue-600")} />
                    <span className="text-xs font-semibold">{item.votes || 0}</span>
                  </Button>
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="font-medium text-sm truncate">{item.title}</div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.category && (
                      <Badge variant="outline" className="text-xs mt-2">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  // TanStack Query hooks - all requests run in parallel automatically
  const { data: stats = {
    totalBookings: 0,
    totalClients: 0,
    totalServices: 0,
    totalRevenue: 0,
    thisMonthBookings: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    lastMonthBookings: 0,
  }, isLoading: statsLoading } = useStats();
  const { data: bookingsData = [], isLoading: bookingsLoading } = useBookings();
  const { data: clients = [], isLoading: clientsLoading } = useContacts();
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: invoicesData = [], isLoading: invoicesLoading } = useInvoices();
  const { data: paymentsData = [], isLoading: paymentsLoading } = usePayments();

  // Normalize data formats
  const bookings = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || [];
  const invoices = Array.isArray(invoicesData) ? invoicesData : invoicesData.invoices || [];
  const payments = Array.isArray(paymentsData) ? paymentsData : paymentsData.payments || [];

  const loading = statsLoading || bookingsLoading || clientsLoading || servicesLoading || invoicesLoading || paymentsLoading;

  // Calculate revenue trend (last 30 days) from actual payments
  const revenueChartData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    const succeededPayments = payments.filter((p) => p.status === "succeeded");

    return last30Days.map((date) => {
      const dayPayments = succeededPayments.filter((p) => {
        const paymentDate = parseISO(p.createdAt);
        return isSameDay(paymentDate, date);
      });

      const revenue = dayPayments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100; // Convert cents to dollars

      return {
        date: format(date, "MMM d"),
        revenue,
        payments: dayPayments.length,
      };
    });
  }, [payments]);

  // Calculate booking status distribution
  const bookingStatusData = useMemo(() => {
    const statusCounts = bookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      status,
    }));
  }, [bookings]);

  // Calculate monthly comparison (revenue from payments, bookings count from bookings)
  const monthlyComparison = useMemo(() => {
    const thisMonth = startOfMonth(new Date());
    const lastMonth = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    // Bookings count
    const thisMonthBookings = bookings.filter((b) => {
      const date = parseISO(b.scheduledAt);
      return date >= thisMonth;
    });

    const lastMonthBookings = bookings.filter((b) => {
      const date = parseISO(b.scheduledAt);
      return isWithinInterval(date, { start: lastMonth, end: lastMonthEnd });
    });

    // Revenue from actual payments (succeeded only)
    const succeededPayments = payments.filter((p) => p.status === "succeeded");

    const thisMonthPayments = succeededPayments.filter((p) => {
      const paymentDate = parseISO(p.createdAt);
      return paymentDate >= thisMonth;
    });

    const lastMonthPayments = succeededPayments.filter((p) => {
      const paymentDate = parseISO(p.createdAt);
      return isWithinInterval(paymentDate, { start: lastMonth, end: lastMonthEnd });
    });

    const thisMonthRevenue = thisMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const lastMonthRevenue = lastMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const revenueChange = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : thisMonthRevenue > 0 ? 100 : 0;

    const bookingsChange =
      lastMonthBookings.length > 0
        ? ((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100
        : thisMonthBookings.length > 0
        ? 100
        : 0;

    return {
      thisMonthRevenue,
      lastMonthRevenue,
      thisMonthBookings: thisMonthBookings.length,
      lastMonthBookings: lastMonthBookings.length,
      revenueChange,
      bookingsChange,
    };
  }, [bookings, payments]);

  // Calculate average invoice value from paid invoices only (kept in cents for formatCurrency)
  const averageInvoice = useMemo(() => {
    const paidInvoices = invoices.filter((inv) => inv.status === "paid");
    if (paidInvoices.length === 0) return 0;
    const totalValue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    return totalValue / paidInvoices.length; // Keep in cents
  }, [invoices]);

  // Count of paid invoices for display
  const paidInvoiceCount = useMemo(() => {
    return invoices.filter((inv) => inv.status === "paid").length;
  }, [invoices]);

  // Top services by bookings
  const topServices = useMemo(() => {
    const serviceCounts = {};
    bookings.forEach((b) => {
      const serviceName = b.service?.name || b.package?.name || "Other";
      serviceCounts[serviceName] = (serviceCounts[serviceName] || 0) + 1;
    });

    return Object.entries(serviceCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, bookings: count }));
  }, [bookings]);

  // Weekly booking trend
  const weeklyBookingData = useMemo(() => {
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return last7Days.map((date) => {
      const count = bookings.filter((b) => isSameDay(parseISO(b.scheduledAt), date)).length;

      return {
        day: format(date, "EEE"),
        bookings: count,
      };
    });
  }, [bookings]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: "500px" }}>
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading analytics...</span>
        </div>
      </div>
    );
  }

  // Upcoming bookings (next 7 days)
  const upcomingBookings = bookings
    .filter((b) => {
      const date = parseISO(b.scheduledAt);
      return date >= new Date() && b.status !== "cancelled";
    })
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 5);

  // Recent clients
  const recentClients = clients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Page Header with Quick Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold">Overview</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button size="sm" className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white" onClick={() => router.push("/dashboard/bookings/new")}>
            <CalendarPlus className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">Book</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none bg-purple-500 hover:bg-purple-600 text-white" onClick={() => router.push("/dashboard/contacts/new")}>
            <UserPlus className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">Add Contact</span>
            <span className="sm:hidden">Contact</span>
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white"
            onClick={() => router.push("/dashboard/invoices/new")}
          >
            <FilePlus2 className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">Invoice</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - 2 cols on mobile, 5 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Revenue Card */}
        <div className="rounded-lg border bg-card p-4 border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-green-600 font-medium">Revenue</p>
              <p className="font-bold mt-1">{formatCompactCurrency(monthlyComparison.thisMonthRevenue)}</p>
              <div className={cn("flex items-center gap-1 hig-caption-2 mt-1", monthlyComparison.revenueChange >= 0 ? "text-green-600" : "text-red-600")}>
                {monthlyComparison.revenueChange >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                <span>
                  {monthlyComparison.revenueChange >= 0 ? "+" : ""}
                  {monthlyComparison.revenueChange.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="size-5 text-green-600" />
            </div>
          </div>
        </div>

        {/* Bookings Card */}
        <div className="rounded-lg border bg-card p-4 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-blue-600 font-medium">Bookings</p>
              <p className="font-bold mt-1">{monthlyComparison.thisMonthBookings}</p>
              <div className={cn("flex items-center gap-1 hig-caption-2 mt-1", monthlyComparison.bookingsChange >= 0 ? "text-green-600" : "text-red-600")}>
                {monthlyComparison.bookingsChange >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                <span>
                  {monthlyComparison.bookingsChange >= 0 ? "+" : ""}
                  {monthlyComparison.bookingsChange.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="size-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Clients Card */}
        <div className="rounded-lg border bg-card p-4 border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-purple-600 font-medium">Contacts</p>
              <p className="font-bold mt-1">{clients.length}</p>
              <p className="text-muted-foreground mt-1">{clients.filter((c) => c.status === "active").length} active</p>
            </div>
            <div className="size-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Users className="size-5 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Services Card */}
        <div className="rounded-lg border bg-card p-4 border-l-4 border-l-amber-500">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-amber-600 font-medium">Services</p>
              <p className="font-bold mt-1">{services.filter((s) => s.active !== false).length}</p>
              <p className="text-muted-foreground mt-1">{services.length} total</p>
            </div>
            <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Package className="size-5 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Average Invoice Card */}
        <div className="rounded-lg border bg-card p-4 border-l-4 border-l-teal-500 col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-teal-600 font-medium">Avg Invoice</p>
              <p className="font-bold mt-1">{formatCompactCurrency(averageInvoice)}</p>
              <p className="text-muted-foreground mt-1">{paidInvoiceCount} paid</p>
            </div>
            <div className="size-10 rounded-full bg-teal-100 flex items-center justify-center">
              <FileText className="size-5 text-teal-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row - Stack on mobile, side by side on desktop */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center gap-2 py-3 px-4 space-y-0">
            <div className="size-2 rounded-full bg-green-500 shrink-0" />
            <CardTitle className="font-medium leading-none">Revenue (30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div style={{ height: "200px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    width={45}
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    labelStyle={{ color: "var(--color-foreground)" }}
                    itemStyle={{ color: "var(--color-foreground)" }}
                    formatter={(value) => [`$${value}`, "Revenue"]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} fill="url(#revenueGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Booking Status Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 py-3 px-4 space-y-0">
            <div className="size-2 rounded-full bg-blue-500 shrink-0" />
            <CardTitle className="font-medium leading-none">Booking Status</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div style={{ height: "160px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2} dataKey="value">
                    {bookingStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.status] || "#71717a"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    labelStyle={{ color: "var(--color-foreground)" }}
                    itemStyle={{ color: "var(--color-foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {bookingStatusData.map((entry) => (
                <div key={entry.status} className="flex items-center gap-1">
                  <div className="size-2 rounded-full" style={{ backgroundColor: CHART_COLORS[entry.status] || "#71717a" }} />
                  <span className="text-muted-foreground hig-caption-2">
                    {entry.name} ({entry.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row: Weekly Activity & Top Services */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly Booking Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 py-3 px-4 space-y-0">
            <div className="size-2 rounded-full bg-blue-500 shrink-0" />
            <CardTitle className="font-medium leading-none">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div style={{ height: "180px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBookingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                  />
                  <YAxis
                    width={30}
                    tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    tickLine={false}
                    axisLine={{ stroke: "var(--color-border)" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-card)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                    labelStyle={{ color: "var(--color-foreground)" }}
                    itemStyle={{ color: "var(--color-foreground)" }}
                  />
                  <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 py-3 px-4 space-y-0">
            <div className="size-2 rounded-full bg-amber-500 shrink-0" />
            <CardTitle className="font-medium leading-none">Top Services</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {topServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground">No booking data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-3">
                    <div className="size-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center hig-caption-2 font-semibold">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{service.name}</p>
                      <div className="h-1.5 w-full bg-muted rounded-full mt-1">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(service.bookings / topServices[0].bookings) * 100}%` }} />
                      </div>
                    </div>
                    <span className="font-semibold text-amber-600 hig-caption-2">{service.bookings}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Third Row: Upcoming Bookings & Recent Contacts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-blue-500 shrink-0" />
              <CardTitle className="font-medium leading-none">Upcoming Bookings</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600" onClick={() => router.push("/dashboard/calendar")}>
              View All
              <ArrowRight className="size-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {upcomingBookings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                  <Calendar className="size-6 text-blue-600" />
                </div>
                <p className="text-muted-foreground mb-3">No upcoming bookings</p>
                <Button size="sm" variant="success" onClick={() => router.push("/dashboard/calendar")}>
                  Create Booking
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() =>
                      booking.contactId &&
                      router.push(`/dashboard/contacts/${booking.contact?.type === "lead" ? "leads" : "clients"}/${booking.contactId}?tab=bookings`)
                    }
                  >
                    <div className="size-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Clock className="size-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{booking.contact?.name}</p>
                      <p className="text-muted-foreground truncate">{booking.service?.name || booking.package?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium hig-caption-2">{format(parseISO(booking.scheduledAt), "MMM d")}</p>
                      <p className="text-muted-foreground">{format(parseISO(booking.scheduledAt), "h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contacts - iOS Messages Style */}
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0 border-b">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-purple-500 shrink-0" />
              <CardTitle className="font-medium leading-none">Recent Contacts</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-purple-600" onClick={() => router.push("/dashboard/contacts")}>
              View All
              <ArrowRight className="size-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recentClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="size-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <Users className="size-6 text-purple-600" />
                </div>
                <p className="text-muted-foreground mb-3">No contacts yet</p>
                <Button size="sm" onClick={() => router.push("/dashboard/contacts")}>
                  Add Contact
                </Button>
              </div>
            ) : (
              <div>
                {recentClients.map((client, index) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 pl-4 hover:bg-muted/50 active:bg-muted cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/contacts/${client.id}`)}
                  >
                    {/* iOS-style Avatar */}
                    <div className="size-11 rounded-full bg-linear-to-br from-gray-400 to-gray-500 text-white flex items-center justify-center text-base font-medium shrink-0">
                      {client.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    {/* Content with iOS-style divider */}
                    <div className={cn(
                      "flex-1 min-w-0 flex items-center gap-2 py-3 pr-4",
                      index < recentClients.length - 1 && "border-b border-border"
                    )}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-semibold truncate">{client.name}</p>
                          <span className="hig-caption-2 text-muted-foreground shrink-0">
                            {formatDistanceToNow(parseISO(client.createdAt), { addSuffix: false })}
                          </span>
                        </div>
                        <p className="text-muted-foreground truncate">{client.email}</p>
                      </div>
                      <ChevronRight className="size-5 text-muted-foreground/50 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Roadmap Voting */}
        <RoadmapVoting />
      </div>
    </div>
  );
}
