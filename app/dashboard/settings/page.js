"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { notifications } from "@mantine/notifications";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
} from "@/components/ui";
import {
  Key,
  Plus,
  Copy,
  Check,
  Info,
  ExternalLink,
  AlertCircle,
  Loader2,
} from "lucide-react";

export default function SettingsPage() {
  const { orgId } = useAuth();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const generateApiKey = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Production" }),
      });

      if (!response.ok) throw new Error("Failed to generate API key");

      const newKey = await response.json();
      setApiKeys([...apiKeys, newKey]);

      notifications.show({
        title: "Success",
        message: "API key generated successfully. Copy it now!",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Failed to generate API key",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, keyId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(keyId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  useEffect(() => {
    fetch("/api/api-keys")
      .then((res) => {
        if (res.ok) {
          return res.json();
        }
        return [];
      })
      .then((data) => setApiKeys(data || []))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-900">API Keys</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Build custom booking experiences with full API access
          </p>
        </div>
        <Button
          size="sm"
          onClick={generateApiKey}
          disabled={loading}
          className="text-xs"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5 mr-1.5" />
          )}
          Generate Key
        </Button>
      </div>

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
              <Key className="h-6 w-6 text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-900">No API keys generated</p>
              <p className="text-xs text-zinc-500 mt-1">
                Generate an API key to start building custom booking experiences
              </p>
            </div>
            <Button
              size="sm"
              onClick={generateApiKey}
              disabled={loading}
              className="mt-2 text-xs"
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5 mr-1.5" />
              )}
              Generate Your First API Key
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-zinc-900">{key.name}</span>
                      <Badge className="bg-green-100 text-green-700 text-[0.625rem]">
                        Active
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-[0.625rem] text-zinc-500 mb-1">API Key</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono text-zinc-700">
                            {key.key || "••••••••••••"}
                          </code>
                          {key.key && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => copyToClipboard(key.key, key.id)}
                            >
                              {copiedId === key.id ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-zinc-400" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      <p className="text-[0.625rem] text-zinc-400">
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* API Usage Instructions */}
      {apiKeys.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-zinc-500" />
              Getting Started with the API
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Separator />

            <div>
              <p className="text-xs font-medium text-zinc-900 mb-1">Authentication</p>
              <p className="text-[0.625rem] text-zinc-500 mb-2">
                Include your API key in the request header:
              </p>
              <code className="block text-[0.625rem] bg-zinc-900 text-zinc-100 px-3 py-2 rounded font-mono">
                Authorization: Bearer YOUR_API_KEY
              </code>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-900 mb-1">Base URL</p>
              <code className="block text-[0.625rem] bg-zinc-900 text-zinc-100 px-3 py-2 rounded font-mono">
                {process.env.NEXT_PUBLIC_APP_URL || "https://your-app.com"}/api
              </code>
            </div>

            <div>
              <p className="text-xs font-medium text-zinc-900 mb-1">Example Request</p>
              <p className="text-[0.625rem] text-zinc-500 mb-2">
                Fetch your bookings:
              </p>
              <code className="block text-[0.625rem] bg-zinc-900 text-zinc-100 px-3 py-2 rounded font-mono whitespace-pre-wrap">
{`curl -X GET \\
  ${process.env.NEXT_PUBLIC_APP_URL || "https://your-app.com"}/api/bookings \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
              </code>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex gap-2">
                <AlertCircle className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-blue-900 mb-1">Important Security Notes:</p>
                  <ul className="text-[0.625rem] text-blue-800 space-y-0.5 list-disc list-inside">
                    <li>Keep your API keys secure and never share them publicly</li>
                    <li>API keys provide full access to your account data</li>
                    <li>Rotate keys regularly for better security</li>
                    <li>Use different keys for development and production</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              asChild
            >
              <a href="/api-reference" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                View Full API Documentation
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
