"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function CustomFieldsGuidePage() {
  return (
    <div className="space-y-3 pb-8">
      <Link href="/dashboard/how-to">
        <Button variant="ghost" size="sm" className="-ml-2">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </Link>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8 space-y-6">
          <div>
            <h1 className="text-xl font-bold">How to Use Custom Fields</h1>
            <p className="text-muted-foreground mt-1">
              Collect additional information about your contacts beyond the basics.
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">What are custom fields?</h2>
            <p className="text-muted-foreground">
              Custom fields let you track any information specific to your business. Examples:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li><strong>Photographers</strong> — Event date, venue, wedding colors</li>
              <li><strong>Contractors</strong> — Property type, square footage, project scope</li>
              <li><strong>Consultants</strong> — Company size, industry, goals</li>
              <li><strong>Personal trainers</strong> — Fitness level, health conditions, goals</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Creating a custom field</h2>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Go to Custom Fields</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>Settings</strong> in the sidebar, then <strong>Custom Fields</strong>.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Add a new field</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click <strong>New Field</strong> and enter a name. A unique key is
                    generated automatically (useful for API integrations).
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Choose the field type</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select how the field should behave:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm mt-2 ml-2">
                    <li><strong>Text</strong> — Short answer (name, address)</li>
                    <li><strong>Long Text</strong> — Multiple lines (notes, descriptions)</li>
                    <li><strong>Number</strong> — Numeric values (quantity, budget)</li>
                    <li><strong>Date</strong> — Calendar date picker</li>
                    <li><strong>Dropdown</strong> — Single choice from a list</li>
                    <li><strong>Checkboxes</strong> — Multiple choices from a list</li>
                    <li><strong>Checkbox</strong> — Yes/no toggle</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  4
                </div>
                <div>
                  <p className="font-medium">Configure options (if applicable)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    For dropdown and checkbox fields, add the choices your contacts
                    can select from.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  5
                </div>
                <div>
                  <p className="font-medium">Set as required (optional)</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Mark a field as required if it must be filled in before saving
                    a contact.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                  6
                </div>
                <div>
                  <p className="font-medium">Organize with groups</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Group related fields together to keep contact pages organized.
                    Fields in the same group appear together with a shared heading.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Using groups</h2>
            <p className="text-muted-foreground">
              Groups help organize related fields under a common heading. For example,
              a car detailer might create a "Vehicle Information" group:
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mt-2">
              <p className="font-medium text-sm mb-2">Vehicle Information</p>
              <ul className="text-sm text-muted-foreground space-y-1 ml-2">
                <li>• Year (number field)</li>
                <li>• Make (dropdown: Toyota, Honda, Ford...)</li>
                <li>• Model (text field)</li>
                <li>• Color (text field)</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              On the contact page, these fields appear together under the "Vehicle
              Information" heading. You can reorder fields within a group using the
              up/down arrows.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Using custom fields</h2>
            <p className="text-muted-foreground">
              Once you create custom fields, they appear on every contact's detail page.
              Fill in the values when:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Creating a new contact</li>
              <li>Editing an existing contact</li>
              <li>After a discovery call when you learn more about them</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">API integration</h2>
            <p className="text-muted-foreground">
              Custom fields are available through our API, so you can:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Display custom field questions on your own website forms</li>
              <li>Submit custom field data when someone books through your website</li>
              <li>Build integrations with other tools you use</li>
            </ul>

            <div className="bg-muted/50 rounded-lg p-4 mt-3 space-y-4">
              <div>
                <p className="text-sm font-medium">Get field definitions</p>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs block mt-1">GET /api/public/[your-slug]/custom-fields</code>
                <p className="text-xs text-muted-foreground mt-1">
                  Returns all active fields. The response includes both a flat <code className="bg-muted px-1 rounded">fields</code> array
                  and a <code className="bg-muted px-1 rounded">fieldsByGroup</code> object organized by group name.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Submit field values</p>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs block mt-1">POST /api/public/[your-slug]/custom-fields</code>
                <p className="text-xs text-muted-foreground mt-1">
                  Submit values for an existing contact. Send <code className="bg-muted px-1 rounded">contactEmail</code> and
                  an array of <code className="bg-muted px-1 rounded">customFields</code> with fieldKey and value.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Include with bookings</p>
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs block mt-1">POST /api/public/[your-slug]/book</code>
                <p className="text-xs text-muted-foreground mt-1">
                  Include a <code className="bg-muted px-1 rounded">customFields</code> array when creating a booking
                  to save field values for the contact.
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mt-3">
              <p className="text-sm font-medium mb-2">Example: Accessing groups via API</p>
              <pre className="text-xs text-muted-foreground overflow-x-auto">
{`// Response from GET /api/public/your-slug/custom-fields
{
  "fields": [...],  // Flat array of all fields
  "fieldsByGroup": {
    "Vehicle Information": [
      { "key": "year", "name": "Year", "type": "number" },
      { "key": "make", "name": "Make", "type": "select" },
      { "key": "model", "name": "Model", "type": "text" }
    ],
    "Other": [...]  // Fields without a group
  }
}`}
              </pre>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Tips</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
              <li>Start simple — add fields as you discover what information you actually need</li>
              <li>Use groups to organize fields logically for faster data entry</li>
              <li>Deactivate fields you no longer need instead of deleting (preserves existing data)</li>
              <li>Use the field key for API integrations — it stays the same even if you rename the field</li>
            </ul>
          </section>

          <div className="pt-4 border-t">
            <Link href="/dashboard/settings/custom-fields">
              <Button>Manage Custom Fields</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
