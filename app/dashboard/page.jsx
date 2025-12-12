"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarPlus, Users, UserPlus, DollarSign, TrendingUp, TrendingDown, Clock, ArrowRight, Package, Loader2, FilePlus2 } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSameDay, isWithinInterval, subMonths } from "date-fns";

const CHART_COLORS = {
  inquiry: "#f59e0b",
  scheduled: "#a855f7",
  confirmed: "#3b82f6",
  completed: "#22c55e",
  cancelled: "#71717a",
};

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalClients: 0,
    totalServices: 0,
    totalRevenue: 0,
    thisMonthBookings: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    lastMonthBookings: 0,
  });
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, bookingsRes, clientsRes, servicesRes, invoicesRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/bookings"),
        fetch("/api/contacts"),
        fetch("/api/services"),
        fetch("/api/invoices"),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (bookingsRes.ok) setBookings(await bookingsRes.json());
      if (clientsRes.ok) setClients(await clientsRes.json());
      if (servicesRes.ok) setServices(await servicesRes.json());
      if (invoicesRes.ok) {
        const data = await invoicesRes.json();
        setInvoices(Array.isArray(data) ? data : data.invoices || []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate revenue trend (last 30 days) from paid invoices
  const revenueChartData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    const paidInvoices = invoices.filter((inv) => inv.status === "paid");

    return last30Days.map((date) => {
      const dayInvoices = paidInvoices.filter((inv) => {
        const paidDate = inv.paidAt ? parseISO(inv.paidAt) : parseISO(inv.updatedAt);
        return isSameDay(paidDate, date);
      });

      const revenue = dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

      return {
        date: format(date, "MMM d"),
        revenue,
        invoices: dayInvoices.length,
      };
    });
  }, [invoices]);

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

  // Calculate monthly comparison (revenue from paid invoices, bookings count from bookings)
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

    // Revenue from paid invoices only
    const paidInvoices = invoices.filter((inv) => inv.status === "paid");

    const thisMonthPaidInvoices = paidInvoices.filter((inv) => {
      const paidDate = inv.paidAt ? parseISO(inv.paidAt) : parseISO(inv.updatedAt);
      return paidDate >= thisMonth;
    });

    const lastMonthPaidInvoices = paidInvoices.filter((inv) => {
      const paidDate = inv.paidAt ? parseISO(inv.paidAt) : parseISO(inv.updatedAt);
      return isWithinInterval(paidDate, { start: lastMonth, end: lastMonthEnd });
    });

    const thisMonthRevenue = thisMonthPaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const lastMonthRevenue = lastMonthPaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

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
  }, [bookings, invoices]);

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
          <span className="text-sm text-muted-foreground">Loading analytics...</span>
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
          <h1 className="text-xl font-semibold">Overview</h1>
          <p className="text-xs text-muted-foreground">Welcome back! Here's what's happening.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button size="sm" className="flex-1 sm:flex-none bg-blue-500 hover:bg-blue-600 text-white" onClick={() => router.push("/dashboard/calendar")}>
            <CalendarPlus className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">Book</span>
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none bg-purple-500 hover:bg-purple-600 text-white" onClick={() => router.push("/dashboard/contacts")}>
            <UserPlus className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">Add Contact</span>
            <span className="sm:hidden">Contact</span>
          </Button>
          <Button
            size="sm"
            className="flex-1 sm:flex-none bg-green-500 hover:bg-green-600 text-white"
            onClick={() => router.push("/dashboard/invoices?new=true")}
          >
            <FilePlus2 className="size-4 sm:mr-1" />
            <span className="hidden sm:inline">New Invoice</span>
            <span className="sm:hidden">Invoice</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards - 2x2 on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Revenue Card */}
        <div className="rounded-lg border bg-card p-4 border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-600 font-medium">Revenue</p>
              <p className="text-xl font-bold mt-1">${monthlyComparison.thisMonthRevenue.toFixed(0)}</p>
              <div className={cn("flex items-center gap-1 text-xs mt-1", monthlyComparison.revenueChange >= 0 ? "text-green-600" : "text-red-600")}>
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
              <p className="text-xs text-blue-600 font-medium">Bookings</p>
              <p className="text-xl font-bold mt-1">{monthlyComparison.thisMonthBookings}</p>
              <div className={cn("flex items-center gap-1 text-xs mt-1", monthlyComparison.bookingsChange >= 0 ? "text-green-600" : "text-red-600")}>
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
              <p className="text-xs text-purple-600 font-medium">Contacts</p>
              <p className="text-xl font-bold mt-1">{clients.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{clients.filter((c) => c.status === "active").length} active</p>
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
              <p className="text-xs text-amber-600 font-medium">Services</p>
              <p className="text-xl font-bold mt-1">{services.filter((s) => s.active !== false).length}</p>
              <p className="text-xs text-muted-foreground mt-1">{services.length} total</p>
            </div>
            <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Package className="size-5 text-amber-600" />
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
            <CardTitle className="text-sm font-medium leading-none">Revenue (30 Days)</CardTitle>
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
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--color-border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "oklch(var(--color-muted-foreground))" }}
                    tickLine={false}
                    axisLine={{ stroke: "oklch(var(--color-border))" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "oklch(var(--color-muted-foreground))" }}
                    tickLine={false}
                    axisLine={{ stroke: "oklch(var(--color-border))" }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(var(--color-card))",
                      border: "1px solid oklch(var(--color-border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
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
            <CardTitle className="text-sm font-medium leading-none">Booking Status</CardTitle>
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
                      backgroundColor: "oklch(var(--color-card))",
                      border: "1px solid oklch(var(--color-border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {bookingStatusData.map((entry) => (
                <div key={entry.status} className="flex items-center gap-1">
                  <div className="size-2 rounded-full" style={{ backgroundColor: CHART_COLORS[entry.status] || "#71717a" }} />
                  <span className="text-xs text-muted-foreground">
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
            <CardTitle className="text-sm font-medium leading-none">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div style={{ height: "180px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBookingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--color-border))" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 10, fill: "oklch(var(--color-muted-foreground))" }}
                    tickLine={false}
                    axisLine={{ stroke: "oklch(var(--color-border))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "oklch(var(--color-muted-foreground))" }}
                    tickLine={false}
                    axisLine={{ stroke: "oklch(var(--color-border))" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(var(--color-card))",
                      border: "1px solid oklch(var(--color-border))",
                      borderRadius: "8px",
                      fontSize: "11px",
                    }}
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
            <CardTitle className="text-sm font-medium leading-none">Top Services</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {topServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No booking data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-3">
                    <div className="size-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-semibold">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{service.name}</p>
                      <div className="h-1.5 w-full bg-muted rounded-full mt-1">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(service.bookings / topServices[0].bookings) * 100}%` }} />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-amber-600">{service.bookings}</span>
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
              <CardTitle className="text-sm font-medium leading-none">Upcoming Bookings</CardTitle>
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
                <p className="text-sm text-muted-foreground mb-3">No upcoming bookings</p>
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
                      <p className="text-sm font-medium truncate">{booking.contact?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{booking.service?.name || booking.package?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">{format(parseISO(booking.scheduledAt), "MMM d")}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(booking.scheduledAt), "h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4 space-y-0">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-purple-500 shrink-0" />
              <CardTitle className="text-sm font-medium leading-none">Recent Contacts</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-purple-600" onClick={() => router.push("/dashboard/contacts")}>
              View All
              <ArrowRight className="size-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            {recentClients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="size-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                  <Users className="size-6 text-purple-600" />
                </div>
                <p className="text-sm text-muted-foreground mb-3">No contacts yet</p>
                <Button size="sm" onClick={() => router.push("/dashboard/contacts")}>
                  Add Contact
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/dashboard/contacts/${client.type === "lead" ? "leads" : "clients"}/${client.id}`)}
                  >
                    <div className="size-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-semibold">
                      {client.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                    </div>
                    <Badge variant={client.status === "active" ? "success" : client.status === "lead" ? "info" : "secondary"}>{client.status || "lead"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
