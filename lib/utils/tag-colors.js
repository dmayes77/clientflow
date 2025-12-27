/**
 * Single source of truth for tag color mappings
 * Maps tag color names from database to Tailwind classes
 * Uses light backgrounds with darker text for consistency across the app
 */

export const TAG_COLOR_MAP = {
  red: "bg-red-100 text-red-800 border-red-300",
  orange: "bg-orange-100 text-orange-800 border-orange-300",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-300",
  green: "bg-green-100 text-green-800 border-green-300",
  teal: "bg-teal-100 text-teal-800 border-teal-300",
  cyan: "bg-cyan-100 text-cyan-800 border-cyan-300",
  blue: "bg-blue-100 text-blue-800 border-blue-300",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-300",
  violet: "bg-violet-100 text-violet-800 border-violet-300",
  purple: "bg-purple-100 text-purple-800 border-purple-300",
  pink: "bg-pink-100 text-pink-800 border-pink-300",
  gray: "bg-gray-100 text-gray-800 border-gray-300",
  slate: "bg-slate-100 text-slate-800 border-slate-300",
};

/**
 * Get Tailwind color classes for a tag
 * @param {Object} tag - Tag object with color property
 * @returns {string} Tailwind color classes
 */
export function getTagColor(tag) {
  const color = tag?.color || "gray";
  return TAG_COLOR_MAP[color] || TAG_COLOR_MAP.blue;
}

/**
 * Check if tag is a Lead tag
 * @param {Object} tag - Tag object
 * @returns {boolean}
 */
export function isLeadTag(tag) {
  return tag?.name?.toLowerCase() === "lead";
}

/**
 * Check if tag is a VIP tag
 * @param {Object} tag - Tag object
 * @returns {boolean}
 */
export function isVIPTag(tag) {
  return tag?.name?.toLowerCase().includes("vip");
}
