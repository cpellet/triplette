import {
  Button,
  Card,
  CardList,
  EntityTitle,
  H5,
  NonIdealState,
  TabId,
  TabPanel,
  Tag,
} from "@blueprintjs/core";
import { TripletteProject } from "../lib/state";

interface SourcesTabProps {
  project: TripletteProject;
  selectedTabId: TabId;
  parentId: string;
  onRemoveSource: (id: string) => void;
  onAddSourceClick: () => void;
}

export function SourcesTab({
  project,
  selectedTabId,
  parentId,
  onRemoveSource,
  onAddSourceClick,
}: SourcesTabProps) {
  return (
    <TabPanel
      id="sources"
      selectedTabId={selectedTabId}
      parentId={parentId}
      className="h-full"
      panel={
        <div className="flex flex-col h-full box-border p-4 gap-4 overflow-hidden">
          <div className="flex justify-between items-center flex-none">
            <H5 className="mb-0!">Data Sources</H5>
            <Button
              icon="plus"
              text="Register Source"
              intent="primary"
              onClick={onAddSourceClick}
            />
          </div>

          {project.sources.length === 0 ? (
            <NonIdealState
              icon="database"
              title="No sources registered"
              description="Map entities to CSV, JSON or XML data."
              action={
                <Button
                  icon="plus"
                  text="Add first source"
                  onClick={onAddSourceClick}
                />
              }
            />
          ) : (
            <div className="flex-1 overflow-y-auto pr-2">
              <CardList>
                {project.sources.map((source) => (
                  <Card
                    key={source.id}
                    elevation={0}
                    className="border border-gray-200"
                  >
                    <div className="flex justify-between items-start w-full">
                      <EntityTitle
                        title={source.id}
                        subtitle={source.uri}
                        tags={<Tag>{source.format}</Tag>}
                      />
                      <Button
                        icon="trash"
                        minimal
                        intent="danger"
                        onClick={() => onRemoveSource(source.id)}
                      />
                    </div>
                  </Card>
                ))}
              </CardList>
            </div>
          )}
        </div>
      }
    />
  );
}
