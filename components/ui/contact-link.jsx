"use client";

import { Mail, Phone, Globe, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ContactLink - Clickable contact information (email, phone, website)
 *
 * @param {object} props
 * @param {string} props.type - "email" | "phone" | "website" | "address"
 * @param {string} props.value - The contact value
 * @param {boolean} props.showIcon - Show icon before value (default: true)
 * @param {string} props.className - Additional classes
 * @param {string} props.iconClassName - Additional classes for icon
 */
export function ContactLink({
  type,
  value,
  showIcon = true,
  className,
  iconClassName,
}) {
  if (!value) return null;

  const config = {
    email: {
      href: `mailto:${value}`,
      icon: Mail,
      label: "Email",
    },
    phone: {
      href: `tel:${value.replace(/\D/g, "")}`,
      icon: Phone,
      label: "Phone",
    },
    website: {
      href: value.startsWith("http") ? value : `https://${value}`,
      icon: Globe,
      label: "Website",
      external: true,
    },
    address: {
      href: `https://maps.google.com/?q=${encodeURIComponent(value)}`,
      icon: MapPin,
      label: "Address",
      external: true,
    },
  };

  const { href, icon: Icon, external } = config[type] || {};

  if (!href) {
    return <span className={className}>{value}</span>;
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={cn(
        "inline-flex items-center gap-1.5 text-primary hover:underline",
        className
      )}
    >
      {showIcon && Icon && (
        <Icon className={cn("h-3.5 w-3.5 shrink-0", iconClassName)} />
      )}
      <span className="truncate">{value}</span>
    </a>
  );
}

/**
 * EmailLink - Convenience wrapper for email links
 */
export function EmailLink({ email, ...props }) {
  return <ContactLink type="email" value={email} {...props} />;
}

/**
 * PhoneLink - Convenience wrapper for phone links
 */
export function PhoneLink({ phone, ...props }) {
  return <ContactLink type="phone" value={phone} {...props} />;
}

/**
 * WebsiteLink - Convenience wrapper for website links
 */
export function WebsiteLink({ url, ...props }) {
  return <ContactLink type="website" value={url} {...props} />;
}

/**
 * ContactInfo - Display multiple contact methods
 *
 * @param {object} props
 * @param {string} props.email - Email address
 * @param {string} props.phone - Phone number
 * @param {string} props.website - Website URL
 * @param {string} props.address - Physical address
 * @param {string} props.layout - "vertical" | "horizontal" | "inline"
 * @param {string} props.className - Additional classes
 */
export function ContactInfo({
  email,
  phone,
  website,
  address,
  layout = "vertical",
  className,
}) {
  const items = [
    email && { type: "email", value: email },
    phone && { type: "phone", value: phone },
    website && { type: "website", value: website },
    address && { type: "address", value: address },
  ].filter(Boolean);

  if (items.length === 0) return null;

  const layoutClasses = {
    vertical: "flex flex-col gap-2",
    horizontal: "flex flex-wrap gap-4",
    inline: "inline-flex flex-wrap gap-x-4 gap-y-1",
  };

  return (
    <div className={cn(layoutClasses[layout], className)}>
      {items.map((item) => (
        <ContactLink key={item.type} type={item.type} value={item.value} />
      ))}
    </div>
  );
}
