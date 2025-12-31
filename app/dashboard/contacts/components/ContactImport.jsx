"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useImportContacts } from "@/lib/hooks";
import { useTags } from "@/lib/hooks";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle, CheckCircle2, XCircle, Tag as TagIcon } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function ContactImport({ open, onOpenChange }) {
  const [file, setFile] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);

  const { data: allTagsRaw = [] } = useTags();
  // Filter to only show contact and general type tags
  const allTags = allTagsRaw.filter((tag) => tag.type === "contact" || tag.type === "general");
  const importMutation = useImportContacts();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setFile(selectedFile);
    parseCSV(selectedFile);
  };

  // Helper function to parse a CSV line properly handling quoted fields
  const parseCSVLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    // Add last field
    result.push(current.trim());
    return result;
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        toast.error("CSV file is empty or has no data rows");
        return;
      }

      const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase());
      const parsedContacts = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const contact = {};

        headers.forEach((header, index) => {
          const value = values[index] || "";
          // Map common CSV headers to contact fields
          if (header.includes("name") || header === "contact name") {
            contact.name = value;
          } else if (header.includes("email") || header === "email address") {
            contact.email = value;
          } else if (header.includes("phone") || header === "mobile" || header === "telephone") {
            contact.phone = value;
          } else if (header.includes("company") || header === "business" || header === "organization") {
            contact.company = value;
          } else if (header.includes("website") || header === "url") {
            contact.website = value;
          } else if (header.includes("source")) {
            contact.source = value;
          } else if (header.includes("note") || header === "comments") {
            contact.notes = value;
          }
        });

        if (contact.name && contact.email) {
          parsedContacts.push(contact);
        }
      }

      setContacts(parsedContacts);
      toast.success(`Parsed ${parsedContacts.length} contacts from CSV`);
    };

    reader.onerror = () => {
      toast.error("Failed to read CSV file");
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (contacts.length === 0) {
      toast.error("No contacts to import");
      return;
    }

    setImporting(true);
    setImportResults(null);

    try {
      const result = await importMutation.mutateAsync({
        contacts,
        tags: selectedTags,
        skipDuplicates,
      });

      setImportResults(result);

      if (result.errors.length > 0) {
        toast.warning(`Imported ${result.imported} contacts with ${result.errors.length} errors`);
      } else {
        toast.success(`Successfully imported ${result.imported} contacts`);
      }
    } catch (error) {
      toast.error(error.message || "Failed to import contacts");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setContacts([]);
    setSelectedTags([]);
    setSkipDuplicates(true);
    setImportResults(null);
    onOpenChange(false);
  };

  const toggleTag = (tagName) => {
    if (selectedTags.includes(tagName)) {
      setSelectedTags(selectedTags.filter((t) => t !== tagName));
    } else {
      setSelectedTags([...selectedTags, tagName]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with columns for name, email, phone, company, website, and notes.
            The email and name columns are required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload */}
          {!importResults && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="csv-file" className="flex items-center gap-2 mb-2">
                  <Upload className="h-4 w-4" />
                  CSV File
                </Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={importing}
                />
              </div>

              {file && contacts.length > 0 && (
                <>
                  {/* Preview */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {contacts.length} contacts ready to import
                      </span>
                    </div>
                    <div className="bg-muted p-3 rounded-md text-sm max-h-32 overflow-y-auto">
                      {contacts.slice(0, 5).map((contact, idx) => (
                        <div key={idx} className="mb-1">
                          {contact.name} ({contact.email})
                        </div>
                      ))}
                      {contacts.length > 5 && (
                        <div className="text-muted-foreground italic">
                          ...and {contacts.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags Selection */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <TagIcon className="h-4 w-4" />
                      Apply Tags (Optional)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button
                            onClick={() => toggleTag(tag)}
                            className="ml-1 hover:text-destructive"
                          >
                            <XCircle className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                      <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            + Add Tag
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-0">
                          <Command>
                            <CommandInput placeholder="Search tags..." />
                            <CommandList>
                              <CommandEmpty>No tags found</CommandEmpty>
                              <CommandGroup>
                                {allTags.map((tag) => (
                                  <CommandItem
                                    key={tag.id}
                                    value={tag.name}
                                    onSelect={() => {
                                      toggleTag(tag.name);
                                      setTagPopoverOpen(false);
                                    }}
                                  >
                                    <TagIcon className="h-3 w-3 mr-2" />
                                    {tag.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Duplicate Handling */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="skip-duplicates"
                      checked={skipDuplicates}
                      onCheckedChange={setSkipDuplicates}
                    />
                    <Label htmlFor="skip-duplicates" className="text-sm cursor-pointer">
                      Skip duplicate contacts (by email)
                    </Label>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">
                    Imported: {importResults.imported} contacts
                  </span>
                </div>
                {importResults.skipped > 0 && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Skipped: {importResults.skipped} contacts
                    </span>
                  </div>
                )}
                {importResults.errors.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-destructive">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">
                        Errors: {importResults.errors.length}
                      </span>
                    </div>
                    <div className="bg-destructive/10 p-3 rounded-md text-sm max-h-40 overflow-y-auto space-y-2">
                      {importResults.errors.slice(0, 10).map((err, idx) => (
                        <div key={idx} className="text-destructive">
                          <strong>{err.row.name || err.row.email}:</strong> {err.error}
                        </div>
                      ))}
                      {importResults.errors.length > 10 && (
                        <div className="text-muted-foreground italic">
                          ...and {importResults.errors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!importResults ? (
            <>
              <Button variant="outline" onClick={handleClose} disabled={importing}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!file || contacts.length === 0 || importing}
              >
                {importing ? "Importing..." : `Import ${contacts.length} Contacts`}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
