import {
  Button,
  Card,
  CardList,
  FormGroup,
  H6,
  HTMLSelect,
  InputGroup,
  MenuItem,
  NonIdealState,
  Section,
  SectionCard,
  TabId,
  TabPanel,
} from "@blueprintjs/core";
import { MultiSelect, Suggest } from "@blueprintjs/select";
import { useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { toYarrrmlId } from "../lib/source-utils";
import {
  OntologyClass,
  OntologyProperty,
  PropertyMapping,
  RMLEntity,
  TripletteProject,
} from "../lib/state";

interface EntitiesTabProps {
  project: TripletteProject;
  selectedTabId: TabId;
  parentId: string;
  addEntity: (entity: RMLEntity) => void;
  updateEntity: (id: string, entity: Partial<RMLEntity>) => void;
  removeEntity: (id: string) => void;
}

export function EntitiesTab({
  project,
  selectedTabId,
  parentId,
  addEntity,
  updateEntity,
  removeEntity,
}: EntitiesTabProps) {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    project.entities[0]?.id || null,
  );

  const selectedEntity = project.entities.find(
    (e) => e.id === selectedEntityId,
  );
  const selectedSource = project.sources.find(
    (s) => s.id === selectedEntity?.sourceId,
  );
  const sourceColumns = selectedSource?.columns || [];

  const handleAddEntity = () => {
    const newId = `entity_${Date.now()}`;
    const entity: RMLEntity = {
      id: newId,
      name: "New Entity",
      sourceId: project.sources[0]?.id || "",
      subjectTemplate: "http://example.org/resource/{id}",
      classUris: [],
      properties: [],
    };
    addEntity(entity);
    setSelectedEntityId(newId);
  };

  const updateProp = (propIndex: number, fields: Partial<PropertyMapping>) => {
    if (!selectedEntity) return;
    const nextProps = [...selectedEntity.properties];
    nextProps[propIndex] = { ...nextProps[propIndex], ...fields };
    updateEntity(selectedEntity.id, { properties: nextProps });
  };

  const addProp = () => {
    if (!selectedEntity) return;
    updateEntity(selectedEntity.id, {
      properties: [
        ...selectedEntity.properties,
        { predicateUri: "", value: "", type: "column" },
      ],
    });
  };

  const removeProp = (index: number) => {
    if (!selectedEntity) return;
    const nextProps = selectedEntity.properties.filter((_, i) => i !== index);
    updateEntity(selectedEntity.id, { properties: nextProps });
  };

  const renderClassItem = (
    item: OntologyClass,
    { handleClick, modifiers }: any,
  ) => {
    if (!modifiers.matchesPredicate) return null;
    return (
      <MenuItem
        active={modifiers.active}
        key={item.uri}
        onClick={handleClick}
        text={<span className="font-semibold">{item.label}</span>}
        labelElement={
          <span className="text-xs text-gray-400 truncate ml-4 max-w-64 block">
            {item.uri}
          </span>
        }
        shouldDismissPopover={false}
      />
    );
  };

  const filterClass = (query: string, item: OntologyClass) => {
    return (
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.uri.toLowerCase().includes(query.toLowerCase())
    );
  };

  const renderPropertyItem = (
    item: OntologyProperty,
    { handleClick, modifiers }: any,
  ) => {
    if (!modifiers.matchesPredicate) return null;
    return (
      <MenuItem
        active={modifiers.active}
        key={item.uri}
        onClick={handleClick}
        text={<span className="font-semibold">{item.label}</span>}
        labelElement={
          <span className="text-xs text-gray-400 truncate ml-4 max-w-64 block">
            {item.uri}
          </span>
        }
      />
    );
  };

  const filterProperty = (query: string, item: OntologyProperty) => {
    return (
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.uri.toLowerCase().includes(query.toLowerCase())
    );
  };

  const renderColumnItem = (item: string, { handleClick, modifiers }: any) => {
    if (!modifiers.matchesPredicate) return null;
    return (
      <MenuItem
        active={modifiers.active}
        key={item}
        onClick={handleClick}
        text={item}
      />
    );
  };

  const filterColumn = (query: string, item: string) => {
    return item.toLowerCase().includes(query.toLowerCase());
  };

  return (
    <TabPanel
      id="entities"
      selectedTabId={selectedTabId}
      parentId={parentId}
      className="h-full"
      panel={
        <Group className="h-full" orientation="horizontal">
          <Panel defaultSize={20} minSize={15} className="px-2 py-0.5">
            <Section
              title="Entities"
              icon="cube"
              rightElement={
                <Button icon="plus" minimal onClick={handleAddEntity} />
              }
              compact
              className="my-2"
            >
              <CardList>
                {project.entities.length === 0 ? (
                  <div className="text-gray-400 text-xs italic p-4 text-center">
                    No entities defined yet
                  </div>
                ) : (
                  project.entities.map((entity) => (
                    <Card
                      key={entity.id}
                      interactive
                      compact
                      elevation={entity.id === selectedEntityId ? 1 : 0}
                      className={`cursor-pointer flex flex-row justify-between ${
                        entity.id === selectedEntityId
                          ? "bg-blue-50 border-blue-200"
                          : "border-transparent hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedEntityId(entity.id)}
                    >
                      <H6 className="mb-0!">{entity.name}</H6>
                      <Button
                        icon="trash"
                        variant="minimal"
                        size="small"
                        intent="danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEntity(entity.id);
                          if (selectedEntityId === entity.id)
                            setSelectedEntityId(null);
                        }}
                      />
                    </Card>
                  ))
                )}
              </CardList>
            </Section>
          </Panel>

          <Separator className="w-1 h-full bg-gray-100 hover:bg-blue-500 transition-colors cursor-col-resize" />

          {/* Detail View */}
          <Panel defaultSize={80} minSize={30} className="py-0.5">
            <div className="h-full overflow-y-auto py-2 pl-2 box-border pr-2">
              {!selectedEntity ? (
                <NonIdealState
                  icon="graph"
                  title="Select an entity"
                  description="Choose an entity from the list or create a new one to start mapping."
                  action={
                    <Button
                      icon="plus"
                      text="Create Entity"
                      onClick={handleAddEntity}
                    />
                  }
                />
              ) : (
                <div className="flex flex-col gap-2">
                  <Section title="Entity Configuration" compact icon="cog">
                    <SectionCard>
                      <div className="grid grid-cols-2 gap-4">
                        <FormGroup label="Display Name">
                          <InputGroup
                            value={selectedEntity.name}
                            onChange={(e) => {
                              const newName = e.target.value;
                              const newId = toYarrrmlId(newName);
                              updateEntity(selectedEntity.id, {
                                name: newName,
                                id: newId,
                              });
                              setSelectedEntityId(newId);
                            }}
                          />
                        </FormGroup>
                        <FormGroup label="YARRRML ID">
                          <InputGroup
                            value={selectedEntity.id}
                            onChange={(e) =>
                              updateEntity(selectedEntity.id, {
                                id: e.target.value,
                              })
                            }
                            className="font-mono"
                          />
                        </FormGroup>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormGroup label="Source">
                          <HTMLSelect
                            fill
                            value={selectedEntity.sourceId}
                            onChange={(e) =>
                              updateEntity(selectedEntity.id, {
                                sourceId: e.target.value,
                              })
                            }
                          >
                            <option value="" disabled>
                              Select source...
                            </option>
                            {project.sources.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.id} ({s.format})
                              </option>
                            ))}
                          </HTMLSelect>
                        </FormGroup>
                        <FormGroup
                          label="Subject Template"
                          helperText="Use {column_name} for variables"
                        >
                          <InputGroup
                            value={selectedEntity.subjectTemplate}
                            onChange={(e) =>
                              updateEntity(selectedEntity.id, {
                                subjectTemplate: e.target.value,
                              })
                            }
                          />
                        </FormGroup>
                      </div>

                      <FormGroup label="Entity Classes">
                        <MultiSelect<OntologyClass>
                          fill
                          placeholder="Select classes..."
                          items={project.classes}
                          itemRenderer={renderClassItem}
                          itemPredicate={filterClass}
                          selectedItems={project.classes.filter((c) =>
                            selectedEntity.classUris.includes(c.uri),
                          )}
                          onItemSelect={(item) => {
                            const isSelected =
                              selectedEntity.classUris.includes(item.uri);
                            const nextUris = isSelected
                              ? selectedEntity.classUris.filter(
                                  (u) => u !== item.uri,
                                )
                              : [...selectedEntity.classUris, item.uri];
                            updateEntity(selectedEntity.id, {
                              classUris: nextUris,
                            });
                          }}
                          tagRenderer={(c) => c.label}
                          onRemove={(item) => {
                            updateEntity(selectedEntity.id, {
                              classUris: selectedEntity.classUris.filter(
                                (u) => u !== item.uri,
                              ),
                            });
                          }}
                          noResults={
                            <MenuItem disabled text="No classes found" />
                          }
                        />
                      </FormGroup>
                    </SectionCard>
                  </Section>

                  <Section
                    title="Property Mappings"
                    icon="exchange"
                    rightElement={
                      <Button icon="plus" minimal small onClick={addProp} />
                    }
                    compact
                  >
                    <SectionCard padded={false}>
                      {selectedEntity.properties.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-xs">
                          No property mappings defined. Click (+) to add one.
                        </div>
                      ) : (
                        <table className="bp5-html-table bp5-html-table-bordered bp5-html-table-condensed w-full">
                          <thead>
                            <tr>
                              <th className="w-1/3">Predicate (Ontology)</th>
                              <th>Type</th>
                              <th>Value / Column</th>
                              <th className="w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEntity.properties.map((prop, idx) => (
                              <tr key={idx}>
                                <td>
                                  <Suggest<OntologyProperty>
                                    fill
                                    items={project.properties}
                                    itemRenderer={renderPropertyItem}
                                    itemPredicate={filterProperty}
                                    inputValueRenderer={(p) => p.uri}
                                    onItemSelect={(p) =>
                                      updateProp(idx, { predicateUri: p.uri })
                                    }
                                    noResults={
                                      <MenuItem
                                        disabled
                                        text="No properties found"
                                      />
                                    }
                                    query={prop.predicateUri}
                                    onQueryChange={(q) =>
                                      updateProp(idx, { predicateUri: q })
                                    }
                                    inputProps={{
                                      small: true,
                                    }}
                                  />
                                </td>
                                <td>
                                  <HTMLSelect
                                    minimal
                                    value={prop.type}
                                    onChange={(e) =>
                                      updateProp(idx, {
                                        type: e.target.value as any,
                                      })
                                    }
                                  >
                                    <option value="column">Column</option>
                                    <option value="constant">Constant</option>
                                    <option value="template">Template</option>
                                  </HTMLSelect>
                                </td>
                                <td>
                                  {prop.type === "column" ? (
                                    <Suggest<string>
                                      fill
                                      items={sourceColumns}
                                      itemRenderer={renderColumnItem}
                                      itemPredicate={filterColumn}
                                      inputValueRenderer={(c) => c}
                                      onItemSelect={(c) =>
                                        updateProp(idx, { value: c })
                                      }
                                      noResults={
                                        <MenuItem
                                          disabled
                                          text="No columns found"
                                        />
                                      }
                                      query={prop.value}
                                      onQueryChange={(q) =>
                                        updateProp(idx, { value: q })
                                      }
                                      inputProps={{
                                        small: true,
                                      }}
                                    />
                                  ) : (
                                    <InputGroup
                                      small
                                      placeholder="value..."
                                      value={prop.value}
                                      onChange={(e) =>
                                        updateProp(idx, {
                                          value: e.target.value,
                                        })
                                      }
                                    />
                                  )}
                                </td>
                                <td>
                                  <Button
                                    icon="cross"
                                    minimal
                                    small
                                    intent="danger"
                                    onClick={() => removeProp(idx)}
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </SectionCard>
                  </Section>
                </div>
              )}
            </div>
          </Panel>
        </Group>
      }
    />
  );
}
