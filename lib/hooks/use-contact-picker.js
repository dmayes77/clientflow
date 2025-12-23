"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook for Contact Picker API
 * Import contacts from device
 */
export function useContactPicker() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(
      typeof navigator !== "undefined" &&
      "contacts" in navigator &&
      "ContactsManager" in window
    );
  }, []);

  /**
   * Pick contacts from device
   * @param {Object} options - Picker options
   * @param {Array} [options.properties=['name', 'email', 'tel']] - Contact properties to retrieve
   * @param {boolean} [options.multiple=true] - Allow multiple contact selection
   */
  const pickContacts = async (options = {}) => {
    if (!isSupported) {
      return {
        success: false,
        error: "Contact Picker API not supported on this device",
        isSupported: false,
      };
    }

    try {
      const props = options.properties || ["name", "email", "tel"];
      const opts = {
        multiple: options.multiple !== false,
      };

      // Check which properties are actually supported
      const supportedProperties = await navigator.contacts.getProperties();
      const availableProps = props.filter(prop =>
        supportedProperties.includes(prop)
      );

      if (availableProps.length === 0) {
        return {
          success: false,
          error: "No requested contact properties are supported",
        };
      }

      const contacts = await navigator.contacts.select(availableProps, opts);

      // Transform contacts to our format
      const transformedContacts = contacts.map(contact => ({
        name: contact.name?.[0] || "",
        email: contact.email?.[0] || "",
        phone: contact.tel?.[0] || "",
        address: contact.address?.[0] || null,
      }));

      return {
        success: true,
        contacts: transformedContacts,
        rawContacts: contacts,
      };
    } catch (error) {
      if (error.name === "AbortError") {
        return { success: false, cancelled: true };
      }
      return { success: false, error: error.message };
    }
  };

  /**
   * Get supported contact properties
   */
  const getSupportedProperties = async () => {
    if (!isSupported) {
      return [];
    }

    try {
      return await navigator.contacts.getProperties();
    } catch (error) {
      console.error("Failed to get supported properties:", error);
      return [];
    }
  };

  return { pickContacts, getSupportedProperties, isSupported };
}
