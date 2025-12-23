const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function updateInfrastructureStatus() {
  try {
    console.log("Updating infrastructure items to in_progress status...\n");

    // Update Geolocation API and Zapier Integration to in_progress
    const result = await prisma.roadmapItem.updateMany({
      where: {
        title: {
          in: ["Geolocation API", "Zapier Integration"],
        },
      },
      data: {
        status: "in_progress",
        category: "Infrastructure",
      },
    });

    console.log(`✅ Updated ${result.count} infrastructure items to in_progress status`);
    console.log("\nThese items now show as 'Building Now' (backend ready, UI pending):");
    console.log("  - Geolocation API");
    console.log("  - Zapier Integration");
  } catch (error) {
    console.error("❌ Error updating infrastructure status:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateInfrastructureStatus();
