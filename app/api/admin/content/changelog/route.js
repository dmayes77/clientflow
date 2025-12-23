import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthenticated } from "@/lib/admin-auth";

// GET - Fetch all changelog entries
export async function GET(request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const published = searchParams.get("published");

    let where = {};
    if (published === "true") {
      where.published = true;
    } else if (published === "false") {
      where.published = false;
    }

    const entries = await prisma.changelogEntry.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Get counts
    const [totalCount, publishedCount, draftCount] = await Promise.all([
      prisma.changelogEntry.count(),
      prisma.changelogEntry.count({ where: { published: true } }),
      prisma.changelogEntry.count({ where: { published: false } }),
    ]);

    return NextResponse.json({
      entries,
      counts: { total: totalCount, published: publishedCount, draft: draftCount },
    });
  } catch (error) {
    console.error("Error fetching changelog:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create changelog entry
export async function POST(request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { version, title, content, type, published } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content required" }, { status: 400 });
    }

    const entry = await prisma.changelogEntry.create({
      data: {
        version,
        title,
        content,
        type: type || "feature",
        published: published || false,
        publishedAt: published ? new Date() : null,
        createdBy: "admin",
      },
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error creating changelog entry:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Update changelog entry
export async function PATCH(request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    const updateData = {};
    const allowedFields = ["version", "title", "content", "type", "published"];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // Handle publishing
    if (updates.published === true) {
      const existing = await prisma.changelogEntry.findUnique({
        where: { id },
        select: { publishedAt: true },
      });
      if (!existing?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const entry = await prisma.changelogEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error updating changelog entry:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete changelog entry
export async function DELETE(request) {
  try {
    if (!(await isAdminAuthenticated())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID required" }, { status: 400 });
    }

    await prisma.changelogEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting changelog entry:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
