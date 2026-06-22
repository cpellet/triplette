import { YAMLMap, Document, YAMLSeq } from "yaml";
import { TripletteProject } from "./state";

/**
 * Generates a YARRRML string from the Triplette project state.
 */
export function generateYarrrml(project: TripletteProject): string {
  const doc = new Document();
  
  // 1. Define Prefixes (Minimal set for now)
  const prefixes = new YAMLMap();
  prefixes.set("ex", "http://example.org/");
  // Add common vocabularies if they appear in our URIs
  // This could be more sophisticated in the future
  
  doc.set("prefixes", prefixes);

  // 2. Define Sources
  const sources = new YAMLMap();
  for (const source of project.sources) {
    const sourceMap = new YAMLMap();
    if (source.format === "sql_excel_schema") {
      sourceMap.set("access", source.uri);
      sourceMap.set("referenceFormulation", "sqlquery");
      sourceMap.set("query", `SELECT * FROM ${source.iterator}`);
    } else {
      sourceMap.set("access", source.uri);
      sourceMap.set("referenceFormulation", source.format);
      if (source.iterator) {
        sourceMap.set("iterator", source.iterator);
      }
    }
    sources.set(source.id, sourceMap);
  }
  doc.set("sources", sources);

  // 3. Define Mappings
  const mappings = new YAMLMap();
  for (const entity of project.entities) {
    const entityMap = new YAMLMap();
    
    // Source
    entityMap.set("sources", [entity.sourceId]);
    
    // Subject
    entityMap.set("s", entity.subjectTemplate);
    
    // Predicate Objects (including classes)
    const poList: any[] = [];
    
    // Classes are mapped to a
    for (const classUri of entity.classUris) {
      const poItem = new YAMLSeq();
      poItem.flow = true;
      poItem.add("a");
      poItem.add(classUri);
      poList.push(poItem);
    }
    
    // User-defined properties
    for (const prop of entity.properties) {
      if (!prop.predicateUri || !prop.value) continue;
      
      let objectValue: any = prop.value;
      
      // Handle different object types in YARRRML
      if (prop.type === "column") {
        objectValue = `$( ${prop.value} )`;
      } else if (prop.type === "template") {
        objectValue = prop.value; // already contains templates or is a URI
      }
      
      const poItem = new YAMLSeq();
      poItem.flow = true;
      poItem.add(prop.predicateUri);
      poItem.add(objectValue);
      poList.push(poItem);
    }
    
    entityMap.set("po", poList);
    
    mappings.set(entity.id, entityMap);
  }
  doc.set("mappings", mappings);

  return doc.toString();
}

// @ts-ignore
import yarrrml from "@rmlio/yarrrml-parser";
import * as N3 from "n3";

export function generateRML(yarrrmlContent: string): string {
  try {
    const y2r = new (yarrrml as any)();
    const quads = y2r.convert(yarrrmlContent);
    
    const writer = new N3.Writer();
    writer.addQuads(quads);
    let result = "";
    writer.end((err, res) => {
      if (!err) result = res as string;
    });
    return result;
  } catch (e) {
    console.error("YARRRML to RML conversion failed:", e);
    return "";
  }
}
