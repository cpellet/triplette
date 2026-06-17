import {
  FileInput,
  FormGroup,
  Section,
  SectionCard,
  TabId,
  TabPanel,
} from "@blueprintjs/core";
import { TripletteProject } from "../lib/state";

interface ConfigurationTabProps {
  project: TripletteProject;
  selectedTabId: TabId;
  parentId: string;
  onOntologySelect: () => void;
}

export function ConfigurationTab({
  project,
  selectedTabId,
  parentId,
  onOntologySelect,
}: ConfigurationTabProps) {
  return (
    <TabPanel
      id="configuration"
      selectedTabId={selectedTabId}
      parentId={parentId}
      className="h-full"
      panel={
        <div className="flex flex-col h-full box-border p-4">
          <div className="flex-none">
            <FormGroup label="Ontology RDF file" labelInfo="(required)">
              <FileInput
                text={project.ontologyFilePath ?? "Choose file..."}
                onClick={(e) => {
                  e.preventDefault();
                  onOntologySelect();
                }}
                fill
              />
            </FormGroup>
          </div>

          {project.classes.length > 0 && (
            <div className="flex gap-4 flex-1 min-h-0">
              <Section
                title="Classes"
                className="flex-1 flex flex-col min-h-0"
                compact
              >
                <SectionCard padded={false} className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    {project.classes.map((c) => (
                      <div
                        key={c.uri}
                        className="px-3 py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="font-semibold text-sm">{c.label}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {c.uri}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </Section>
              <Section
                title="Properties"
                className="flex-1 flex flex-col min-h-0"
                compact
              >
                <SectionCard padded={false} className="flex-1 overflow-hidden">
                  <div className="h-full overflow-y-auto">
                    {project.properties.map((p) => (
                      <div
                        key={p.uri}
                        className="px-3 py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="font-semibold text-sm">{p.label}</div>
                        <div className="text-xs text-gray-400">{p.type}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {p.uri}
                        </div>
                      </div>
                    ))}
                  </div>
                </SectionCard>
              </Section>
            </div>
          )}
        </div>
      }
    />
  );
}
