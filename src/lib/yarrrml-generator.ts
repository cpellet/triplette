import { YAMLMap, Document } from "yaml";
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
    sourceMap.set("access", source.uri);
    sourceMap.set("referenceFormulation", source.format);
    if (source.iterator) {
      sourceMap.set("iterator", source.iterator);
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
    
    // Classes are mapped to rdf:type
    for (const classUri of entity.classUris) {
      poList.push({ p: "rdf:type", o: classUri });
    }
    
    // User-defined properties
    for (const prop of entity.properties) {
      let objectValue: any = prop.value;
      
      // Handle different object types in YARRRML
      if (prop.type === "column") {
        objectValue = `$( ${prop.value} )`;
      } else if (prop.type === "template") {
        objectValue = prop.value; // already contains templates or is a URI
      }
      
      poList.push({ p: prop.predicateUri, o: objectValue });
    }
    
    entityMap.set("po", poList);
    
    mappings.set(entity.id, entityMap);
  }
  doc.set("mappings", mappings);

  return doc.toString();
}
