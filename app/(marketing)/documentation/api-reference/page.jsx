import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight, Shield, Zap } from "lucide-react";
import { CodeBlock, APISection } from "./components";

export const metadata = {
  title: "API Reference | ClientFlow Documentation",
  description: "Complete REST API documentation for ClientFlow. Learn how to integrate bookings, clients, services, and payments into your custom application.",
  keywords: ["ClientFlow API", "booking API", "REST API documentation", "client management API"],
};

const baseUrl = "https://api.getclientflow.com/v1";

// Bookings Endpoints
const bookingsEndpoints = [
  {
    method: "GET",
    path: "/bookings",
    description: "List all bookings with optional filters",
    params: [
      { name: "status", type: "string", required: false, description: "Filter by status: inquiry, booked, completed, cancelled" },
      { name: "client_id", type: "string", required: false, description: "Filter by client ID" },
      { name: "start_date", type: "string", required: false, description: "Filter bookings after this date (ISO 8601)" },
      { name: "end_date", type: "string", required: false, description: "Filter bookings before this date (ISO 8601)" },
      { name: "limit", type: "integer", required: false, description: "Number of results (default: 50, max: 100)" },
      { name: "offset", type: "integer", required: false, description: "Pagination offset" },
    ],
    response: `{
  "data": [
    {
      "id": "bkg_abc123",
      "client_id": "cli_xyz789",
      "service_id": "srv_def456",
      "status": "booked",
      "date": "2025-01-15",
      "start_time": "10:00",
      "end_time": "11:00",
      "amount": 15000,
      "currency": "usd"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}`,
  },
  {
    method: "POST",
    path: "/bookings",
    description: "Create a new booking",
    request: `{
  "client_id": "cli_xyz789",
  "service_id": "srv_def456",
  "date": "2025-01-15",
  "start_time": "10:00",
  "amount": 15000,
  "notes": "First-time client consultation"
}`,
    response: `{
  "id": "bkg_abc123",
  "client_id": "cli_xyz789",
  "service_id": "srv_def456",
  "status": "inquiry",
  "date": "2025-01-15",
  "start_time": "10:00",
  "end_time": "11:00",
  "amount": 15000,
  "currency": "usd",
  "created_at": "2025-01-10T14:30:00Z"
}`,
  },
  {
    method: "GET",
    path: "/bookings/:id",
    description: "Retrieve a specific booking",
    response: `{
  "id": "bkg_abc123",
  "client_id": "cli_xyz789",
  "service_id": "srv_def456",
  "status": "booked",
  "date": "2025-01-15",
  "start_time": "10:00",
  "end_time": "11:00",
  "amount": 15000,
  "currency": "usd",
  "client": {
    "id": "cli_xyz789",
    "name": "John Smith",
    "email": "john@example.com"
  },
  "service": {
    "id": "srv_def456",
    "name": "Strategy Consultation",
    "duration": 60
  }
}`,
  },
  {
    method: "PATCH",
    path: "/bookings/:id",
    description: "Update a booking",
    request: `{
  "status": "completed",
  "notes": "Great session, follow-up scheduled"
}`,
    response: `{
  "id": "bkg_abc123",
  "status": "completed",
  "notes": "Great session, follow-up scheduled",
  "updated_at": "2025-01-15T11:05:00Z"
}`,
  },
  {
    method: "DELETE",
    path: "/bookings/:id",
    description: "Delete a booking",
    response: `{
  "deleted": true,
  "id": "bkg_abc123"
}`,
  },
];

// Clients Endpoints
const clientsEndpoints = [
  {
    method: "GET",
    path: "/clients",
    description: "List all clients",
    params: [
      { name: "search", type: "string", required: false, description: "Search by name or email" },
      { name: "limit", type: "integer", required: false, description: "Number of results (default: 50, max: 100)" },
      { name: "offset", type: "integer", required: false, description: "Pagination offset" },
    ],
    response: `{
  "data": [
    {
      "id": "cli_xyz789",
      "name": "John Smith",
      "email": "john@example.com",
      "phone": "+1 555-123-4567",
      "total_bookings": 5,
      "total_spent": 75000
    }
  ],
  "pagination": {
    "total": 342,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}`,
  },
  {
    method: "POST",
    path: "/clients",
    description: "Create a new client",
    request: `{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555-987-6543",
  "notes": "Referred by John Smith"
}`,
    response: `{
  "id": "cli_new456",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555-987-6543",
  "notes": "Referred by John Smith",
  "created_at": "2025-01-10T14:30:00Z"
}`,
  },
  {
    method: "GET",
    path: "/clients/:id",
    description: "Retrieve a specific client with booking history",
    response: `{
  "id": "cli_xyz789",
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "+1 555-123-4567",
  "total_bookings": 5,
  "total_spent": 75000,
  "recent_bookings": [
    {
      "id": "bkg_abc123",
      "date": "2025-01-15",
      "service": "Strategy Consultation",
      "status": "completed"
    }
  ]
}`,
  },
  {
    method: "PATCH",
    path: "/clients/:id",
    description: "Update a client",
    request: `{
  "phone": "+1 555-999-8888",
  "notes": "Updated phone number"
}`,
    response: `{
  "id": "cli_xyz789",
  "name": "John Smith",
  "phone": "+1 555-999-8888",
  "updated_at": "2025-01-10T15:00:00Z"
}`,
  },
  {
    method: "DELETE",
    path: "/clients/:id",
    description: "Delete a client",
    response: `{
  "deleted": true,
  "id": "cli_xyz789"
}`,
  },
];

// Services Endpoints
const servicesEndpoints = [
  {
    method: "GET",
    path: "/services",
    description: "List all services",
    response: `{
  "data": [
    {
      "id": "srv_def456",
      "name": "Strategy Consultation",
      "description": "1-on-1 business strategy session",
      "duration": 60,
      "price": 15000,
      "currency": "usd",
      "active": true
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/services",
    description: "Create a new service",
    request: `{
  "name": "Quick Check-in",
  "description": "30-minute follow-up session",
  "duration": 30,
  "price": 7500
}`,
    response: `{
  "id": "srv_new789",
  "name": "Quick Check-in",
  "description": "30-minute follow-up session",
  "duration": 30,
  "price": 7500,
  "currency": "usd",
  "active": true,
  "created_at": "2025-01-10T14:30:00Z"
}`,
  },
  {
    method: "PATCH",
    path: "/services/:id",
    description: "Update a service",
    request: `{
  "price": 17500,
  "description": "Premium 1-on-1 strategy session"
}`,
    response: `{
  "id": "srv_def456",
  "price": 17500,
  "description": "Premium 1-on-1 strategy session",
  "updated_at": "2025-01-10T15:00:00Z"
}`,
  },
  {
    method: "DELETE",
    path: "/services/:id",
    description: "Delete a service",
    response: `{
  "deleted": true,
  "id": "srv_def456"
}`,
  },
];

// Webhooks Endpoints
const webhooksEndpoints = [
  {
    method: "GET",
    path: "/webhooks",
    description: "List all webhook endpoints",
    response: `{
  "data": [
    {
      "id": "whk_abc123",
      "url": "https://your-app.com/webhooks/clientflow",
      "events": ["booking.created", "booking.updated", "payment.received"],
      "active": true,
      "created_at": "2024-06-01T00:00:00Z"
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/webhooks",
    description: "Create a webhook endpoint",
    request: `{
  "url": "https://your-app.com/webhooks/clientflow",
  "events": [
    "booking.created",
    "booking.updated",
    "payment.received"
  ]
}`,
    response: `{
  "id": "whk_new456",
  "url": "https://your-app.com/webhooks/clientflow",
  "events": ["booking.created", "booking.updated", "payment.received"],
  "secret": "whsec_live_abc123xyz...",
  "active": true,
  "created_at": "2025-01-10T14:30:00Z"
}`,
  },
  {
    method: "DELETE",
    path: "/webhooks/:id",
    description: "Delete a webhook endpoint",
    response: `{
  "deleted": true,
  "id": "whk_abc123"
}`,
  },
];

// Media Endpoints
const mediaEndpoints = [
  {
    method: "GET",
    path: "/media",
    description: "List all media files",
    response: `{
  "data": [
    {
      "id": "med_abc123",
      "filename": "logo.png",
      "url": "https://cdn.getclientflow.com/t_abc123/logo.png",
      "alt_text": "Company Logo",
      "size": 45678,
      "width": 400,
      "height": 100
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/media",
    description: "Upload a new media file",
    params: [
      { name: "file", type: "file", required: true, description: "The image file to upload (multipart/form-data)" },
      { name: "alt_text", type: "string", required: false, description: "Alt text for accessibility" },
    ],
    response: `{
  "id": "med_new456",
  "filename": "hero-image.jpg",
  "url": "https://cdn.getclientflow.com/t_abc123/hero-image.jpg",
  "alt_text": "Hero banner image",
  "size": 125000,
  "width": 1920,
  "height": 1080
}`,
  },
  {
    method: "DELETE",
    path: "/media/:id",
    description: "Delete a media file",
    response: `{
  "deleted": true,
  "id": "med_abc123"
}`,
  },
];

const navItems = [
  { id: "authentication", label: "Authentication" },
  { id: "bookings", label: "Bookings" },
  { id: "clients", label: "Clients" },
  { id: "services", label: "Services" },
  { id: "webhooks", label: "Webhooks" },
  { id: "media", label: "Media" },
  { id: "errors", label: "Errors" },
  { id: "rate-limits", label: "Rate Limits" },
];

export default function APIReferencePage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="et-text-2xs px-1.5 py-0">Reference</Badge>
          <Badge variant="outline" className="et-text-2xs px-1.5 py-0 font-mono">v1</Badge>
        </div>
        <h1 className="et-h3 text-zinc-900 mb-2">
          REST API Reference
        </h1>
        <p className="et-small text-zinc-500 mb-3">
          Build custom booking experiences with full programmatic access to your data.
        </p>
        <div className="flex flex-wrap gap-3 et-text-2xs">
          <div className="flex items-center gap-1 text-zinc-400">
            <Shield className="w-3 h-3" />
            <span>API Key Auth</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <Zap className="w-3 h-3" />
            <span>JSON</span>
          </div>
          <div className="flex items-center gap-1 text-zinc-400">
            <BookOpen className="w-3 h-3" />
            <span>RESTful</span>
          </div>
        </div>
      </section>

      {/* Quick Nav */}
      <section className="border rounded-lg p-3">
        <p className="et-text-2xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Jump to</p>
        <div className="flex flex-wrap gap-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="px-2 py-1 et-caption text-zinc-600 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </section>

      {/* Base URL */}
      <section>
        <h2 className="et-body font-semibold text-zinc-900 mb-2">Base URL</h2>
        <div className="p-2.5 bg-zinc-900 rounded font-mono et-caption">
          <span className="text-emerald-400">{baseUrl}</span>
        </div>
      </section>

      {/* Authentication Section */}
      <section id="authentication" className="scroll-mt-20">
        <h2 className="et-body font-semibold text-zinc-900 mb-2">Authentication</h2>
        <p className="et-small text-zinc-500 mb-3">
          All API requests require two headers for authentication:
        </p>

        <div className="border rounded divide-y mb-3">
          <div className="flex items-center gap-2 p-2.5">
            <code className="et-text-2xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded font-medium">X-API-Key</code>
            <span className="et-caption text-zinc-500">Your secret API key</span>
            <Badge variant="outline" className="ml-auto et-text-2xs h-4 px-1">required</Badge>
          </div>
          <div className="flex items-center gap-2 p-2.5">
            <code className="et-text-2xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded font-medium">X-Tenant-ID</code>
            <span className="et-caption text-zinc-500">Your tenant identifier</span>
            <Badge variant="outline" className="ml-auto et-text-2xs h-4 px-1">required</Badge>
          </div>
        </div>

        <CodeBlock
          title="Example Request"
          code={`curl -X GET "${baseUrl}/bookings" \\
  -H "X-API-Key: cf_live_abc123xyz..." \\
  -H "X-Tenant-ID: tenant_xyz789" \\
  -H "Content-Type: application/json"`}
        />

        <div className="mt-3 p-2.5 border border-amber-200 bg-amber-50 rounded">
          <p className="et-text-2xs text-amber-800">
            <strong>Security:</strong> Never expose your API key in client-side code. Make all API calls from your server.
          </p>
        </div>
      </section>

      {/* Bookings */}
      <APISection
        id="bookings"
        title="Bookings"
        description="Create, retrieve, update, and delete bookings."
        endpoints={bookingsEndpoints}
      />

      {/* Clients */}
      <APISection
        id="clients"
        title="Clients"
        description="Manage your client database and booking history."
        endpoints={clientsEndpoints}
      />

      {/* Services */}
      <APISection
        id="services"
        title="Services"
        description="Define service offerings with pricing and duration."
        endpoints={servicesEndpoints}
      />

      {/* Webhooks */}
      <APISection
        id="webhooks"
        title="Webhooks"
        description="Receive real-time event notifications."
        endpoints={webhooksEndpoints}
      />

      {/* Media */}
      <APISection
        id="media"
        title="Media"
        description="Upload and manage images with CDN delivery."
        endpoints={mediaEndpoints}
      />

      {/* Error Handling */}
      <section id="errors" className="scroll-mt-20">
        <h2 className="et-body font-semibold text-zinc-900 mb-2">Errors</h2>
        <p className="et-small text-zinc-500 mb-3">
          Standard HTTP status codes with JSON error details.
        </p>

        <div className="border rounded divide-y mb-3">
          {[
            { code: "200", status: "OK", desc: "Success" },
            { code: "201", status: "Created", desc: "Resource created" },
            { code: "400", status: "Bad Request", desc: "Invalid parameters" },
            { code: "401", status: "Unauthorized", desc: "Invalid API key" },
            { code: "403", status: "Forbidden", desc: "Access denied" },
            { code: "404", status: "Not Found", desc: "Resource not found" },
            { code: "429", status: "Too Many Requests", desc: "Rate limited" },
            { code: "500", status: "Server Error", desc: "Internal error" },
          ].map((item) => (
            <div key={item.code} className="flex items-center gap-2 p-2">
              <code className={`et-text-2xs font-mono px-1.5 py-0.5 rounded ${
                item.code.startsWith("2")
                  ? "bg-emerald-100 text-emerald-700"
                  : item.code.startsWith("4")
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-700"
              }`}>
                {item.code}
              </code>
              <span className="et-caption font-medium text-zinc-700 w-28">{item.status}</span>
              <span className="et-text-2xs text-zinc-400">{item.desc}</span>
            </div>
          ))}
        </div>

        <CodeBlock
          title="Error Response"
          code={`{
  "error": {
    "code": "invalid_request",
    "message": "The 'email' field is required",
    "field": "email"
  }
}`}
        />
      </section>

      {/* Rate Limits */}
      <section id="rate-limits" className="scroll-mt-20">
        <h2 className="et-body font-semibold text-zinc-900 mb-2">Rate Limits</h2>
        <div className="border rounded divide-y">
          <div className="flex items-center justify-between p-2.5">
            <span className="et-caption text-zinc-700">Request Limit</span>
            <span className="et-caption text-zinc-400">1,000 / minute</span>
          </div>
          <div className="flex items-center justify-between p-2.5">
            <span className="et-caption text-zinc-700">Header</span>
            <code className="et-text-2xs font-mono bg-zinc-100 px-1.5 py-0.5 rounded">X-RateLimit-Remaining</code>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t pt-6">
        <div className="border rounded p-4 bg-zinc-50">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h3 className="et-small font-semibold text-zinc-900 mb-1">Ready to integrate?</h3>
              <p className="et-caption text-zinc-500">
                Start your free trial and get API credentials.
              </p>
            </div>
            <Link href="/pricing">
              <Button size="sm" className="h-8 et-caption">
                Get API Access
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
