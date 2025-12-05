"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";

export function CalendarView() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-500" />
          Calendar
        </CardTitle>
        <Button size="sm" variant="success">
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          View and manage your bookings in calendar format. See appointments by day, week, or month.
        </p>
      </CardContent>
    </Card>
  );
}
