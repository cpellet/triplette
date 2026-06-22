export interface OntologyClass {
  uri: string;
  label: string;
  comment?: string;
  parents: string[];
}

export interface OntologyProperty {
  uri: string;
  label: string;
  comment?: string;
  type: "ObjectProperty" | "DatatypeProperty";
  domains: string[];
  ranges: string[];
}

export type ReferenceFormulation = "csv" | "json" | "xml" | "sql_excel_schema";

export interface SQLExcelSchemaConfig {
  tablesSheetName: string;
  tableNameColumn: string;
  propertiesSheetName: string;
  propertiesTableNameColumn: string;
  propertiesColumnNameColumn: string;
}

export interface RMLSource {
  id: string;
  uri: string;
  format: ReferenceFormulation;
  iterator?: string;
  columns?: string[];
  schemaConfig?: SQLExcelSchemaConfig;
}

export interface PropertyMapping {
  predicateUri: string;
  value: string;
  type: "column" | "constant" | "template";
}

export interface RMLEntity {
  id: string;
  name: string;
  sourceId: string;
  subjectTemplate: string;
  classUris: string[];
  properties: PropertyMapping[];
}

export interface TripletteProject {
  name: string;
  ontologyFilePath: string | null;
  yarrrmlContent: string;
  rmlContent: string;
  generatedTriples: string | null;

  // Extracted from ontology
  classes: OntologyClass[];
  properties: OntologyProperty[];

  sources: RMLSource[];
  entities: RMLEntity[];
}

export interface RecentProject {
  name: string;
  path: string;
  lastOpened: number;
}

export interface TripletteState {
  // Meta State (Not saved to disk)
  filePath: string | null;
  isDirty: boolean;
  isGenerating: boolean;
  isProjectActive: boolean;
  recentProjects: RecentProject[];

  project: TripletteProject;
}
