"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  Plus,
  Trash2,
  Wifi,
  WifiOff,
  CreditCard,
  RefreshCw,
  Smartphone,
  MapPin,
  AlertTriangle,
} from "lucide-react";

function formatDeviceType(type) {
  const deviceNames = {
    stripe_s700: "Stripe Reader S700",
    bbpos_wisepos_e: "BBPOS WisePOS E",
    verifone_P400: "Verifone P400",
    bbpos_chipper2x: "BBPOS Chipper 2X BT",
    stripe_m2: "Stripe Reader M2",
  };
  return deviceNames[type] || type || "Card Reader";
}

export function TerminalReaders({ isStripeConnected = false }) {
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  const [readers, setReaders] = useState([]);
  const [location, setLocation] = useState(null);
  const [addReaderOpen, setAddReaderOpen] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [newReader, setNewReader] = useState({
    registrationCode: "",
    label: "",
  });

  useEffect(() => {
    if (isStripeConnected) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [isStripeConnected]);

  const fetchData = async () => {
    try {
      const [locationRes, readersRes] = await Promise.all([
        fetch("/api/stripe/terminal/location"),
        fetch("/api/stripe/terminal/readers"),
      ]);

      if (locationRes.ok) {
        const data = await locationRes.json();
        setLocation(data.hasLocation ? data.location : null);
      }

      if (readersRes.ok) {
        const data = await readersRes.json();
        setReaders(data.readers || []);
      }
    } catch (error) {
      console.error("Error fetching terminal data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLocation = async () => {
    setLocationLoading(true);
    try {
      const res = await fetch("/api/stripe/terminal/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const data = await res.json();
        setLocation(data.location);
        toast.success("Terminal location created");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create location");
      }
    } catch (error) {
      toast.error("Failed to create location");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleAddReader = async () => {
    if (!newReader.registrationCode.trim()) {
      toast.error("Please enter the registration code");
      return;
    }
    if (!newReader.label.trim()) {
      toast.error("Please enter a label for the reader");
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch("/api/stripe/terminal/readers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReader),
      });

      if (res.ok) {
        const data = await res.json();
        setReaders((prev) => [data.reader, ...prev]);
        setAddReaderOpen(false);
        setNewReader({ registrationCode: "", label: "" });
        toast.success("Reader registered successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to register reader");
      }
    } catch (error) {
      toast.error("Failed to register reader");
    } finally {
      setRegistering(false);
    }
  };

  const handleDeleteReader = async (readerId) => {
    setDeleting(readerId);
    try {
      const res = await fetch(`/api/stripe/terminal/readers/${readerId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReaders((prev) => prev.filter((r) => r.id !== readerId));
        toast.success("Reader removed");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to remove reader");
      }
    } catch (error) {
      toast.error("Failed to remove reader");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
              <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Card Readers</CardTitle>
              <CardDescription className="hig-caption-1">Accept in-person payments with Stripe Terminal</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!isStripeConnected) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
              <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>Card Readers</CardTitle>
              <CardDescription className="hig-caption-1">Accept in-person payments with Stripe Terminal</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Connect your Stripe account above to set up card readers for in-person payments.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Card Readers</CardTitle>
                <CardDescription className="hig-caption-1">Accept in-person payments with Stripe Terminal</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 pl-11 tablet:pl-0">
              <Button variant="outline" size="sm" onClick={fetchData}>
                <RefreshCw className="h-4 w-4 mr-1" />
                <span className="hidden fold:inline">Refresh</span>
              </Button>
              {location && (
                <Button size="sm" onClick={() => setAddReaderOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Reader
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Location Status */}
          {!location ? (
            <div className="space-y-4">
              <Alert>
                <MapPin className="h-4 w-4" />
                <AlertDescription>
                  Set up a Terminal location to start registering card readers. This represents your business location.
                </AlertDescription>
              </Alert>
              <Button onClick={handleCreateLocation} disabled={locationLoading}>
                {locationLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2" />
                )}
                Set Up Location
              </Button>
            </div>
          ) : (
            <>
              {/* Location Info */}
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{location.displayName}</span>
                <Badge variant="success" className="ml-auto">Active</Badge>
              </div>

              {/* Readers List */}
              {readers.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <div>
                    <p className="font-medium">No readers registered</p>
                    <p className="text-muted-foreground">
                      Add a Stripe Terminal reader to accept in-person card payments
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setAddReaderOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Reader
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {readers.map((reader) => (
                    <div
                      key={reader.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${reader.status === "online" ? "bg-green-100 dark:bg-green-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                          {reader.status === "online" ? (
                            <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <WifiOff className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{reader.label}</p>
                          <p className="hig-caption2 text-muted-foreground">
                            {formatDeviceType(reader.deviceType)}
                            {reader.serialNumber && ` · ${reader.serialNumber}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={reader.status === "online" ? "success" : "secondary"}>
                          {reader.status === "online" ? "Online" : "Offline"}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteReader(reader.id)}
                          disabled={deleting === reader.id}
                        >
                          {deleting === reader.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Reader Dialog */}
      <Dialog open={addReaderOpen} onOpenChange={setAddReaderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Card Reader</DialogTitle>
            <DialogDescription>
              Enter the registration code displayed on your Stripe Terminal reader.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="registrationCode">Registration Code</Label>
              <Input
                id="registrationCode"
                placeholder="simulated-wpe"
                value={newReader.registrationCode}
                onChange={(e) => setNewReader((prev) => ({ ...prev, registrationCode: e.target.value }))}
              />
              <p className="hig-caption2 text-muted-foreground">
                Find this code on your reader's display during setup
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Reader Label</Label>
              <Input
                id="label"
                placeholder="Front Desk"
                value={newReader.label}
                onChange={(e) => setNewReader((prev) => ({ ...prev, label: e.target.value }))}
              />
              <p className="hig-caption2 text-muted-foreground">
                A name to identify this reader (e.g., "Front Desk", "Room 1")
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddReaderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddReader} disabled={registering}>
              {registering && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Register Reader
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
