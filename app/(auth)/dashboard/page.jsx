"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, DollarSign, TrendingUp, TrendingDown, Clock, ArrowRight, FileText, Package, Loader2, BarChart3 } from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSameDay, isWithinInterval, subMonths } from "date-fns";

const STATUS_COLORS = {
  inquiry: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  booked: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  completed: { bg: "bg-zinc-100", text: "text-zinc-600", border: "border-zinc-200" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
};

const CHART_COLORS = ["#3b82f6", "#22c55e", "#71717a", "#ef4444", "#f59e0b", "#8b5cf6"];

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
        fetch("/api/clients"),
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

  // Calculate revenue trend (last 30 days)
  const revenueChartData = useMemo(() => {
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map((date) => {
      const dayBookings = bookings.filter((b) => {
        const bookingDate = parseISO(b.scheduledAt);
        return isSameDay(bookingDate, date) && b.status === "completed";
      });

      const revenue = dayBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

      return {
        date: format(date, "MMM d"),
        revenue,
        bookings: dayBookings.length,
      };
    });
  }, [bookings]);

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

  // Calculate monthly comparison
  const monthlyComparison = useMemo(() => {
    const thisMonth = startOfMonth(new Date());
    const lastMonth = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    const thisMonthBookings = bookings.filter((b) => {
      const date = parseISO(b.scheduledAt);
      return date >= thisMonth;
    });

    const lastMonthBookings = bookings.filter((b) => {
      const date = parseISO(b.scheduledAt);
      return isWithinInterval(date, { start: lastMonth, end: lastMonthEnd });
    });

    const thisMonthRevenue = thisMonthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const lastMonthRevenue = lastMonthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

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
  }, [bookings]);

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
      <div className="flex h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          <span className="et-text-xs text-zinc-500">Loading analytics...</span>
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
          <h1 className="et-text-lg font-semibold text-zinc-900">Overview</h1>
          <p className="et-text-xs text-zinc-500">Welcome back! Here's what's happening with your business.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="success" onClick={() => router.push("/dashboard/calendar")}>
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">New Booking</span>
            <span className="sm:hidden">Booking</span>
          </Button>
          <Button
            size="sm"
            className="bg-violet-500 text-white hover:bg-violet-600"
            onClick={() => router.push("/dashboard/contacts")}
          >
            <Users className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Add Contact</span>
            <span className="sm:hidden">Contact</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Revenue Card */}
        <Card className="border-l-4 border-l-green-500 bg-linear-to-r from-green-50/50 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.625rem] font-medium text-green-600 uppercase tracking-wide">Monthly Revenue</p>
                <p className="mt-1 text-xl font-bold text-zinc-900">${monthlyComparison.thisMonthRevenue.toFixed(0)}</p>
                <div className="mt-1 flex items-center gap-1">
                  {monthlyComparison.revenueChange >= 0 ? <TrendingUp className="h-3 w-3 text-green-500" /> : <TrendingDown className="h-3 w-3 text-red-500" />}
                  <span className={cn("text-[0.625rem] font-medium", monthlyComparison.revenueChange >= 0 ? "text-green-600" : "text-red-600")}>
                    {monthlyComparison.revenueChange >= 0 ? "+" : ""}
                    {monthlyComparison.revenueChange.toFixed(1)}%
                  </span>
                  <span className="text-[0.625rem] text-zinc-400">vs last month</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 shadow-lg shadow-green-500/25">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Card */}
        <Card className="border-l-4 border-l-blue-500 bg-linear-to-r from-blue-50/50 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.625rem] font-medium text-blue-600 uppercase tracking-wide">Monthly Bookings</p>
                <p className="mt-1 text-xl font-bold text-zinc-900">{monthlyComparison.thisMonthBookings}</p>
                <div className="mt-1 flex items-center gap-1">
                  {monthlyComparison.bookingsChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                  <span className={cn("text-[0.625rem] font-medium", monthlyComparison.bookingsChange >= 0 ? "text-green-600" : "text-red-600")}>
                    {monthlyComparison.bookingsChange >= 0 ? "+" : ""}
                    {monthlyComparison.bookingsChange.toFixed(1)}%
                  </span>
                  <span className="text-[0.625rem] text-zinc-400">vs last month</span>
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/25">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Card */}
        <Card className="border-l-4 border-l-violet-500 bg-linear-to-r from-violet-50/50 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.625rem] font-medium text-violet-600 uppercase tracking-wide">Total Contacts</p>
                <p className="mt-1 text-xl font-bold text-zinc-900">{clients.length}</p>
                <p className="mt-1 text-[0.625rem] text-zinc-400">{clients.filter((c) => c.status === "active").length} active clients</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500 shadow-lg shadow-violet-500/25">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Card */}
        <Card className="border-l-4 border-l-amber-500 bg-linear-to-r from-amber-50/50 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[0.625rem] font-medium text-amber-600 uppercase tracking-wide">Active Services</p>
                <p className="mt-1 text-xl font-bold text-zinc-900">{services.filter((s) => s.active !== false).length}</p>
                <p className="mt-1 text-[0.625rem] text-zinc-400">{services.length} total services</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 shadow-lg shadow-amber-500/25">
                <Package className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue Trend Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <CardTitle className="et-text-sm font-medium">Revenue Trend (30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "#71717a" }}
                    tickLine={false}
                    axisLine={{ stroke: "#e4e4e7" }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "6px",
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
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <CardTitle className="et-text-sm font-medium">Booking Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={2} dataKey="value">
                    {bookingStatusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.status === "booked" ? "#22c55e" : entry.status === "inquiry" ? "#3b82f6" : entry.status === "completed" ? "#71717a" : "#ef4444"
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-2">
              {bookingStatusData.map((entry) => (
                <div key={entry.status} className="flex items-center gap-1.5">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor:
                        entry.status === "booked" ? "#22c55e" : entry.status === "inquiry" ? "#3b82f6" : entry.status === "completed" ? "#71717a" : "#ef4444",
                    }}
                  />
                  <span className="text-[0.625rem] text-zinc-600">
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
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-indigo-500" />
            <CardTitle className="et-text-sm font-medium">Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyBookingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#71717a" }} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#71717a" }} tickLine={false} axisLine={{ stroke: "#e4e4e7" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e4e4e7",
                      borderRadius: "6px",
                      fontSize: "11px",
                    }}
                  />
                  <Bar dataKey="bookings" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Services */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <CardTitle className="et-text-sm font-medium">Top Services</CardTitle>
          </CardHeader>
          <CardContent>
            {topServices.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center">
                <p className="et-text-xs text-zinc-400">No booking data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topServices.map((service, index) => (
                  <div key={service.name} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-[0.625rem] font-bold text-amber-600">{index + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="et-text-xs font-medium text-zinc-900 truncate">{service.name}</p>
                      <div className="mt-1 h-1.5 rounded-full bg-amber-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${(service.bookings / topServices[0].bookings) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="et-text-xs font-semibold text-amber-600">{service.bookings}</span>
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
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <CardTitle className="et-text-sm font-medium">Upcoming Bookings</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => router.push("/dashboard/calendar")}
            >
              View Calendar
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length === 0 ? (
              <div className="flex h-[180px] flex-col items-center justify-center gap-2">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-400" />
                </div>
                <p className="et-text-xs text-zinc-400">No upcoming bookings</p>
                <Button size="sm" className="mt-2 bg-blue-500 hover:bg-blue-600" onClick={() => router.push("/dashboard/calendar")}>
                  Create Booking
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 rounded-lg border border-blue-100 bg-blue-50/30 p-2.5 hover:bg-blue-50 transition-colors cursor-pointer"
                    onClick={() =>
                      booking.clientId &&
                      router.push(`/dashboard/contacts/${booking.client?.type === "lead" ? "leads" : "clients"}/${booking.clientId}?tab=bookings`)
                    }
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 shadow-sm">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="et-text-xs font-medium text-zinc-900 truncate">{booking.client?.name}</p>
                      <p className="text-[0.625rem] text-zinc-500">{booking.service?.name || booking.package?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="et-text-xs font-medium text-zinc-900">{format(parseISO(booking.scheduledAt), "MMM d")}</p>
                      <p className="text-[0.625rem] text-zinc-500">{format(parseISO(booking.scheduledAt), "h:mm a")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-violet-500" />
              <CardTitle className="et-text-sm font-medium">Recent Contacts</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50"
              onClick={() => router.push("/dashboard/contacts")}
            >
              View All
              <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentClients.length === 0 ? (
              <div className="flex h-[180px] flex-col items-center justify-center gap-2">
                <div className="h-12 w-12 rounded-full bg-violet-50 flex items-center justify-center">
                  <Users className="h-6 w-6 text-violet-400" />
                </div>
                <p className="et-text-xs text-zinc-400">No contacts yet</p>
                <Button size="sm" className="mt-2 bg-violet-500 hover:bg-violet-600" onClick={() => router.push("/dashboard/contacts")}>
                  Add Contact
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentClients.map((client) => (
                  <div
                    key={client.id}
                    className="flex items-center gap-3 rounded-lg border border-violet-100 bg-violet-50/30 p-2.5 hover:bg-violet-50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/dashboard/contacts/${client.type === "lead" ? "leads" : "clients"}/${client.id}`)}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 text-white text-xs font-medium shadow-sm">
                      {client.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="et-text-xs font-medium text-zinc-900 truncate">{client.name}</p>
                      <p className="text-[0.625rem] text-zinc-500 truncate">{client.email}</p>
                    </div>
                    <Badge
                      className={cn(
                        "text-[0.5625rem]",
                        client.status === "active"
                          ? "bg-green-100 text-green-700"
                          : client.status === "lead"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-zinc-100 text-zinc-600"
                      )}
                    >
                      {client.status || "lead"}
                    </Badge>
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
