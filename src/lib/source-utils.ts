import { readTextFile } from "@tauri-apps/plugin-fs";
import { ReferenceFormulation } from "./state";

/**
 * Attempts to extract column names/keys from a data source.
 */
export async function extractColumns(
  uri: string,
  format: ReferenceFormulation,
): Promise<string[]> {
  try {
    const content = await readTextFile(uri); // Should ideally only read first N bytes
    
    if (format === "csv") {
      const firstLine = content.split(/\r?\n/)[0];
      if (firstLine) {
        // Simple CSV split - doesn't handle escaped commas but good enough for mapping
        return firstLine.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      }
    } else if (format === "json") {
      try {
        const data = JSON.parse(content);
        let sample = data;
        if (Array.isArray(data)) {
          sample = data[0];
        } else if (typeof data === "object" && data !== null) {
          // If it's a root object, maybe it has a property that is an array
          const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
          if (arrayKey) sample = data[arrayKey][0];
        }
        
        if (typeof sample === "object" && sample !== null) {
          return Object.keys(sample);
        }
      } catch (e) {
        console.warn("Failed to parse JSON for column extraction:", e);
      }
    }
  } catch (e) {
    console.error("Failed to read source for column extraction:", e);
  }
  
  return [];
}

/**
 * Converts a string into a human-readable ID suitable for YARRRML.
 */
export function toYarrrmlId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

