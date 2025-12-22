"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Loader2,
  ShieldAlert,
  Code,
  ExternalLink,
} from "lucide-react";

export function APIKeysSettings() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [newKeyDialogOpen, setNewKeyDialogOpen] = useState(false);
  const [showKeyDialogOpen, setShowKeyDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) {
        setApiKeys(await res.json());
      }
    } catch (error) {
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "API Key" }),
      });

      if (res.ok) {
        const newKey = await res.json();
        setNewlyCreatedKey(newKey);
        setNewKeyDialogOpen(false);
        setShowKeyDialogOpen(true);
        setNewKeyName("");
        fetchApiKeys(); // Refresh the list
        toast.success("API key generated successfully");
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to generate API key");
      }
    } catch (error) {
      toast.error("Failed to generate API key");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteKey = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/api-keys?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setApiKeys(apiKeys.filter((key) => key.id !== id));
        toast.success("API key deleted");
      } else {
        toast.error("Failed to delete API key");
      }
    } catch (error) {
      toast.error("Failed to delete API key");
    } finally {
      setDeletingId(null);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
      toast.success("API key copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Alert */}
      <Alert>
        <ShieldAlert className="h-4 w-4" />
        <AlertDescription>
          Keep your API keys secure and never share them publicly. Use separate keys for different
          environments and rotate them regularly.
        </AlertDescription>
      </Alert>

      {/* API Keys Card */}
      <Card>
        <CardHeader className="flex flex-col gap-3 tablet:flex-row tablet:items-center tablet:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              Your API Keys
            </CardTitle>
            <CardDescription className="hig-caption-1">Generate and manage API keys for your integrations</CardDescription>
          </div>
          <Button onClick={() => setNewKeyDialogOpen(true)} className="w-full tablet:w-auto">
            <Plus className="h-4 w-4 mr-1" />
            Generate New Key
          </Button>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="hig-footnote text-muted-foreground">No API keys generated yet</p>
              <p className="hig-caption-1 text-muted-foreground mt-1">
                Generate your first API key to start integrating
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Cards */}
              <div className="space-y-3 tablet:hidden">
                {apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium hig-subheadline">{apiKey.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="success">Active</Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteKey(apiKey.id)}
                          disabled={deletingId === apiKey.id}
                        >
                          {deletingId === apiKey.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <code className="block bg-muted px-2 py-1.5 rounded hig-caption-1 font-mono break-all">
                      {apiKey.key}
                    </code>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                      <div>
                        <p className="hig-caption-2 text-muted-foreground">Created</p>
                        <p className="hig-footnote">{format(new Date(apiKey.createdAt), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <p className="hig-caption-2 text-muted-foreground">Last Used</p>
                        <p className="hig-footnote">
                          {apiKey.lastUsed ? format(new Date(apiKey.lastUsed), "MMM d, yyyy") : "Never"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table */}
              <div className="hidden tablet:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Key</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((apiKey) => (
                      <TableRow key={apiKey.id}>
                        <TableCell className="font-medium">{apiKey.name}</TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded font-mono hig-footnote">
                            {apiKey.key}
                          </code>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(apiKey.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {apiKey.lastUsed
                            ? format(new Date(apiKey.lastUsed), "MMM d, yyyy")
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">Active</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteKey(apiKey.id)}
                            disabled={deletingId === apiKey.id}
                          >
                            {deletingId === apiKey.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Getting Started Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-blue-500" />
            Getting Started
          </CardTitle>
          <CardDescription className="hig-caption-1">Use your API key to authenticate requests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="hig-footnote mb-2">Include your API key in the Authorization header:</p>
            <pre className="bg-muted p-3 tablet:p-4 rounded-lg overflow-x-auto hig-caption1">
              <code>{`curl -X GET "https://api.clientflow.com/v1/bookings" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
            </pre>
          </div>
          <Button variant="outline" asChild className="w-full tablet:w-auto">
            <a href="/api-reference" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full API Documentation
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Generate New Key Dialog */}
      <Dialog open={newKeyDialogOpen} onOpenChange={setNewKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate New API Key</DialogTitle>
            <DialogDescription>
              Give your API key a name to help you identify it later.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="keyName">Key Name</Label>
            <Input
              id="keyName"
              placeholder="e.g., Production Key, Development Key"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewKeyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerateKey} disabled={generating}>
              {generating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show New Key Dialog */}
      <Dialog open={showKeyDialogOpen} onOpenChange={setShowKeyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your New API Key</DialogTitle>
            <DialogDescription>
              Make sure to copy your API key now. You won't be able to see it again!
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Alert variant="destructive" className="mb-4">
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                This is the only time your full API key will be displayed. Store it securely.
              </AlertDescription>
            </Alert>
            <Label>API Key</Label>
            <div className="flex items-center gap-2 mt-2">
              <code className="flex-1 bg-muted px-3 py-2 rounded font-mono break-all hig-footnote">
                {newlyCreatedKey?.key}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(newlyCreatedKey?.key)}
              >
                {copiedKey ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowKeyDialogOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
