import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { getAuthenticatedTenant } from "@/lib/auth";

const prisma = new PrismaClient();

const TAG_TYPES = ["general", "contact", "invoice", "booking", "payment"];
const COLORS = ["blue", "cyan", "teal", "green", "lime", "yellow", "orange", "red", "pink", "purple", "violet", "indigo", "gray"];

const importTagSchema = z.object({
  name: z.string().min(2, "Tag name must be at least 2 characters").max(50),
  color: z.string().optional().default("blue"),
  type: z.enum(TAG_TYPES).optional().default("general"),
  description: z.string().max(500).optional().nullable(),
});

/**
 * Import tags from CSV
 * POST /api/tags/import
 *
 * Expected CSV format:
 * Name,Color,Type,Description
 * VIP,purple,contact,"High value client"
 * Paid,green,invoice,""
 */
export async function POST(request) {
  try {
    // Authenticate
    const tenant = await getAuthenticatedTenant(request);
    if (!tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No file uploaded or invalid file" },
        { status: 400 }
      );
    }

    // Read CSV content
    const text = await file.text();
    const lines = text.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      return NextResponse.json(
        { error: "CSV file must contain at least a header row and one data row" },
        { status: 400 }
      );
    }

    // Parse CSV (simple implementation)
    const parseCSVLine = (line) => {
      const values = [];
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
        } else if (char === "," && !inQuotes) {
          values.push(current);
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current); // Add last value
      return values;
    };

    // Skip header row
    const dataLines = lines.slice(1);

    const results = {
      total: dataLines.length,
      created: 0,
      skipped: 0,
      errors: [],
    };

    // Process each row
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      if (!line.trim()) continue;

      try {
        const values = parseCSVLine(line);
        const [name, color, type, description] = values;

        // Validate
        const tagData = {
          name: name?.trim(),
          color: color?.trim() || "blue",
          type: type?.trim() || "general",
          description: description?.trim() || null,
        };

        // Validate tag data
        const validation = importTagSchema.safeParse(tagData);
        if (!validation.success) {
          results.errors.push({
            row: i + 2, // +2 because we skipped header and arrays are 0-indexed
            error: validation.error.issues[0].message,
            data: tagData,
          });
          results.skipped++;
          continue;
        }

        // Validate color
        if (!COLORS.includes(tagData.color)) {
          results.errors.push({
            row: i + 2,
            error: `Invalid color: ${tagData.color}. Must be one of: ${COLORS.join(", ")}`,
            data: tagData,
          });
          results.skipped++;
          continue;
        }

        // Check for existing tag with same name
        const existingTag = await prisma.tag.findFirst({
          where: {
            tenantId: tenant.id,
            name: tagData.name,
          },
        });

        if (existingTag) {
          results.errors.push({
            row: i + 2,
            error: `Tag "${tagData.name}" already exists`,
            data: tagData,
          });
          results.skipped++;
          continue;
        }

        // Create tag
        await prisma.tag.create({
          data: {
            tenantId: tenant.id,
            name: tagData.name,
            color: tagData.color,
            type: tagData.type,
            description: tagData.description,
          },
        });

        results.created++;
      } catch (error) {
        results.errors.push({
          row: i + 2,
          error: error instanceof Error ? error.message : "Unknown error",
          data: line,
        });
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete: ${results.created} created, ${results.skipped} skipped`,
      results,
    });
  } catch (error) {
    console.error("Error importing tags:", error);
    return NextResponse.json(
      { error: "Failed to import tags" },
      { status: 500 }
    );
  }
}
