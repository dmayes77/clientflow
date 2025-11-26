import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const f = createUploadthing();

export const ourFileRouter = {
  imageUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 10 } })
    .middleware(async () => {
      const { userId, orgId } = await auth();

      if (!userId) throw new Error("Unauthorized");
      if (!orgId) throw new Error("No organization selected");

      // Get tenant from orgId
      const tenant = await prisma.tenant.findUnique({
        where: { clerkOrgId: orgId },
        select: { id: true },
      });

      if (!tenant) throw new Error("Tenant not found");

      return { userId, tenantId: tenant.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This runs on the server after upload completes
      console.log("Upload complete for tenantId:", metadata.tenantId);
      console.log("File URL:", file.url);

      return { uploadedBy: metadata.userId, url: file.url, key: file.key };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
