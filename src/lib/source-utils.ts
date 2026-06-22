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

export type SampleRow = Record<string, string>;

export async function loadSampleData(
  uri: string,
  format: ReferenceFormulation,
  iterator?: string,
  limit: number = 3
): Promise<SampleRow[]> {
  try {
    const content = await readTextFile(uri);
    
    if (format === "csv") {
      const lines = content.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length === 0) return [];
      
      const headers = lines[0].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      const rows: SampleRow[] = [];
      
      for (let i = 1; i < Math.min(lines.length, limit + 1); i++) {
        const cells = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
        const row: SampleRow = {};
        headers.forEach((header, index) => {
          row[header] = cells[index] || "";
        });
        rows.push(row);
      }
      return rows;
    }
    
    if (format === "json") {
      try {
        const data = JSON.parse(content);
        let list: any[] = [];
        
        if (Array.isArray(data)) {
          list = data;
        } else if (typeof data === "object" && data !== null) {
          if (iterator) {
            const match = iterator.match(/\$?\.?([a-zA-Z0-9_-]+)/);
            const key = match ? match[1] : null;
            if (key && Array.isArray(data[key])) {
              list = data[key];
            }
          }
          if (list.length === 0) {
            const arrayKey = Object.keys(data).find((k) => Array.isArray(data[k]));
            if (arrayKey) list = data[arrayKey];
            else list = [data]; // Treat root object as single row if no array found
          }
        }
        
        return list.slice(0, limit).map((item) => {
          if (typeof item === "object" && item !== null) {
            const row: SampleRow = {};
            Object.keys(item).forEach((key) => {
              row[key] = typeof item[key] === "object" ? JSON.stringify(item[key]) : String(item[key]);
            });
            return row;
          }
          return { value: String(item) };
        });
      } catch (e) {
        console.warn("Failed to parse JSON for sample data:", e);
      }
    }

    if (format === "xml") {
      try {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, "text/xml");
        
        let nodes: NodeListOf<Element> | HTMLCollection;
        if (iterator) {
          const tagName = iterator.split("/").pop() || "";
          nodes = xmlDoc.getElementsByTagName(tagName);
        } else {
          nodes = xmlDoc.documentElement.children;
        }
        
        const rows: SampleRow[] = [];
        for (let i = 0; i < Math.min(nodes.length, limit); i++) {
          const node = nodes[i];
          const row: SampleRow = {};
          Array.from(node.children).forEach((child) => {
            row[child.tagName] = child.textContent || "";
          });
          rows.push(row);
        }
        return rows;
      } catch(e) {
        console.warn("Failed to parse XML for sample data:", e);
      }
    }
  } catch (e) {
    console.error("Failed to read source for sample data:", e);
  }
  
  return [];
}

import { readFile } from "@tauri-apps/plugin-fs";
import * as xlsx from "xlsx";
import { SQLExcelSchemaConfig, RMLSource } from "./state";

export async function importExcelSchema(
  uri: string,
  config: SQLExcelSchemaConfig,
): Promise<RMLSource[]> {
  try {
    const data = await readFile(uri);
    const workbook = xlsx.read(data, { type: "array" });

    const tablesSheet = workbook.Sheets[config.tablesSheetName];
    const propertiesSheet = workbook.Sheets[config.propertiesSheetName];

    if (!tablesSheet) {
      throw new Error(`Sheet '${config.tablesSheetName}' not found`);
    }
    if (!propertiesSheet) {
      throw new Error(`Sheet '${config.propertiesSheetName}' not found`);
    }

    const tablesData = xlsx.utils.sheet_to_json<any>(tablesSheet);
    const propertiesData = xlsx.utils.sheet_to_json<any>(propertiesSheet);

    const sources: RMLSource[] = [];

    const tableColumns = new Map<string, string[]>();
    for (const propRow of propertiesData) {
      const tableName = propRow[config.propertiesTableNameColumn];
      const columnName = propRow[config.propertiesColumnNameColumn];
      if (tableName && columnName) {
        if (!tableColumns.has(tableName)) {
          tableColumns.set(tableName, []);
        }
        tableColumns.get(tableName)!.push(columnName);
      }
    }

    for (const tableRow of tablesData) {
      const tableName = tableRow[config.tableNameColumn];
      if (tableName) {
        const columns = tableColumns.get(tableName) || [];
        sources.push({
          id: toYarrrmlId(tableName),
          uri: uri,
          format: "sql_excel_schema",
          iterator: tableName,
          columns,
          schemaConfig: config,
        });
      }
    }

    return sources;
  } catch (e) {
    console.error("Failed to parse Excel schema:", e);
    throw e;
  }
}
