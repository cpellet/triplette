import yarrrml from "@rmlio/yarrrml-parser";
import * as rocketrml from "rocketrml";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { TripletteProject } from "./state";

/**
 * Generates RDF triples from the project's YARRRML and sources.
 */
export async function generateTriples(project: TripletteProject): Promise<string> {
  const y2r = new yarrrml();
  
  // 1. Convert YARRRML to RML (Quads)
  const rmlQuads = y2r.convert(project.yarrrmlContent);
  
  // 2. Prepare data for each source.
  const inputFiles: Record<string, string> = {};
  for (const source of project.sources) {
    try {
      inputFiles[source.uri] = await readTextFile(source.uri);
    } catch (e) {
      console.error(`Failed to read source ${source.id} at ${source.uri}:`, e);
    }
  }

  // 3. Serialize RML quads to Turtle for rocketrml
  const rmlString = await serializeQuads(rmlQuads);

  // 4. Run RocketRML
  try {
    // rocketrml.parseFileLive(mapFile, inputFiles, options)
    // We set toRDF: true to get N-Quads/Triples
    const result = await rocketrml.parseFileLive(rmlString, inputFiles, {
      toRDF: true,
      replace: true
    });
    
    return typeof result === "string" ? result : JSON.stringify(result, null, 2);
  } catch (e) {
    console.error("Triple generation failed:", e);
    throw e;
  }
}

async function serializeQuads(quads: any[]): Promise<string> {
  // Use N3 to serialize quads to Turtle
  // Since yarrrml-parser depends on N3, it should be available.
  const N3 = await import("n3");
  const writer = new N3.Writer();
  writer.addQuads(quads);
  return new Promise((resolve, reject) => {
    writer.end((error, result) => {
      if (error) reject(error);
      else resolve(result);
    });
  });
}
