/**
 * Tag-Based Status Management
 *
 * This module provides utilities for managing entity status through tags.
 * Tags are the source of truth for status - the status field is deprecated.
 */

import { prisma } from "./prisma";

// Status tag definitions by entity type
export const STATUS_TAGS = {
  invoice: ["Draft", "Sent", "Viewed", "Deposit Paid", "Paid", "Overdue", "Cancelled"],
  booking: ["Pending", "Scheduled", "Confirmed", "Completed", "Cancelled", "No Show"],
  contact: ["Lead", "Client", "Inactive"],
  payment: ["Succeeded", "Failed", "Refunded", "Disputed"],
};

/**
 * Get all status tags for an entity type
 */
export function getStatusTagsForType(type) {
  return STATUS_TAGS[type] || [];
}

/**
 * Check if a tag name is a status tag for a given entity type
 */
export function isStatusTag(tagName, entityType) {
  const statusTags = getStatusTagsForType(entityType);
  return statusTags.some((name) => name.toLowerCase() === tagName.toLowerCase());
}

/**
 * Get the current status tag for an entity
 * Returns the first status tag found (entities should only have one status tag)
 */
export function getStatusTag(entity, entityType) {
  if (!entity.tags || entity.tags.length === 0) return null;

  const statusTagNames = getStatusTagsForType(entityType);
  const statusTag = entity.tags.find((tag) =>
    statusTagNames.some((name) => name.toLowerCase() === tag.name.toLowerCase())
  );

  return statusTag || null;
}

/**
 * Add a status tag to an entity (removes any existing status tags first)
 * This ensures entities only have ONE status tag at a time
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} entityType - Type of entity ("invoice", "booking", "contact")
 * @param {string} entityId - ID of the entity
 * @param {string} statusTagName - Name of the status tag to apply
 * @param {string} tenantId - Tenant ID (for finding the tag)
 * @returns {Promise<Object>} The created tag association
 */
export async function setStatusTag(prisma, entityType, entityId, statusTagName, tenantId) {
  // Validate entity type
  const validTypes = ["invoice", "booking", "contact", "payment"];
  if (!validTypes.includes(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  // Validate status tag name
  if (!isStatusTag(statusTagName, entityType)) {
    throw new Error(`Invalid status tag "${statusTagName}" for entity type "${entityType}"`);
  }

  // Find the status tag
  const statusTag = await prisma.tag.findFirst({
    where: {
      tenantId,
      name: {
        equals: statusTagName,
        mode: "insensitive",
      },
    },
  });

  if (!statusTag) {
    throw new Error(`Status tag "${statusTagName}" not found for tenant`);
  }

  // Get all status tag IDs for this entity type
  const statusTagNames = getStatusTagsForType(entityType);
  const allStatusTags = await prisma.tag.findMany({
    where: {
      tenantId,
      name: { in: statusTagNames },
    },
    select: { id: true },
  });

  const statusTagIds = allStatusTags.map((t) => t.id);

  // Determine the junction table and foreign key based on entity type
  const junctionConfig = {
    invoice: { table: "invoiceTag", fk: "invoiceId" },
    booking: { table: "bookingTag", fk: "bookingId" },
    contact: { table: "contactTag", fk: "contactId" },
    payment: { table: "paymentTag", fk: "paymentId" },
  };

  const { table, fk } = junctionConfig[entityType];

  // Remove ALL existing status tags for this entity
  await prisma[table].deleteMany({
    where: {
      [fk]: entityId,
      tagId: { in: statusTagIds },
    },
  });

  // Add the new status tag
  const result = await prisma[table].create({
    data: {
      [fk]: entityId,
      tagId: statusTag.id,
    },
  });

  return result;
}

/**
 * Add a non-status tag to an entity (doesn't affect status tags)
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} entityType - Type of entity ("invoice", "booking", "contact")
 * @param {string} entityId - ID of the entity
 * @param {string} tagId - ID of the tag to add
 * @returns {Promise<Object>} The created tag association
 */
export async function addTag(prisma, entityType, entityId, tagId) {
  const validTypes = ["invoice", "booking", "contact", "payment"];
  if (!validTypes.includes(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  const junctionConfig = {
    invoice: { table: "invoiceTag", fk: "invoiceId" },
    booking: { table: "bookingTag", fk: "bookingId" },
    contact: { table: "contactTag", fk: "contactId" },
    payment: { table: "paymentTag", fk: "paymentId" },
  };

  const { table, fk } = junctionConfig[entityType];

  // Check if tag is already attached
  const existing = await prisma[table].findUnique({
    where: {
      [`${fk}_tagId`]: { [fk]: entityId, tagId },
    },
  });

  if (existing) {
    return existing; // Already exists, return it
  }

  // Add the tag
  const result = await prisma[table].create({
    data: {
      [fk]: entityId,
      tagId,
    },
  });

  return result;
}

/**
 * Remove a tag from an entity
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} entityType - Type of entity ("invoice", "booking", "contact")
 * @param {string} entityId - ID of the entity
 * @param {string} tagId - ID of the tag to remove
 * @returns {Promise<Object>} The deleted tag association
 */
export async function removeTag(prisma, entityType, entityId, tagId) {
  const validTypes = ["invoice", "booking", "contact", "payment"];
  if (!validTypes.includes(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  const junctionConfig = {
    invoice: { table: "invoiceTag", fk: "invoiceId" },
    booking: { table: "bookingTag", fk: "bookingId" },
    contact: { table: "contactTag", fk: "contactId" },
    payment: { table: "paymentTag", fk: "paymentId" },
  };

  const { table, fk } = junctionConfig[entityType];

  const result = await prisma[table].deleteMany({
    where: {
      [fk]: entityId,
      tagId,
    },
  });

  return result;
}

/**
 * Get entities filtered by tag IDs
 * This is the tag-based equivalent of filtering by status field
 *
 * @param {Object} prisma - Prisma client instance
 * @param {string} entityType - Type of entity ("invoice", "booking", "contact")
 * @param {string} tenantId - Tenant ID to filter by
 * @param {string[]} tagIds - Array of tag IDs to filter by (OR logic)
 * @param {Object} additionalWhere - Additional where conditions
 * @returns {Promise<Array>} Array of entities with the specified tags
 */
export async function getEntitiesByTags(prisma, entityType, tenantId, tagIds = [], additionalWhere = {}) {
  const validTypes = ["invoice", "booking", "contact", "payment"];
  if (!validTypes.includes(entityType)) {
    throw new Error(`Invalid entity type: ${entityType}`);
  }

  const modelName = entityType.charAt(0).toUpperCase() + entityType.slice(1);

  if (tagIds.length === 0) {
    // No tag filter, return all entities
    return prisma[entityType].findMany({
      where: {
        tenantId,
        ...additionalWhere,
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });
  }

  // Filter by tags
  return prisma[entityType].findMany({
    where: {
      tenantId,
      ...additionalWhere,
      tags: {
        some: {
          tagId: { in: tagIds },
        },
      },
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

