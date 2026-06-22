import {
  Button,
  Card,
  CardList,
  Dialog,
  DialogBody,
  FormGroup,
  H6,
  HTMLSelect,
  InputGroup,
  Menu,
  MenuDivider,
  MenuItem,
  NonIdealState,
  PopoverNext,
  Section,
  SectionCard,
  TabId,
  TabPanel,
} from "@blueprintjs/core";
import { MultiSelect, Suggest } from "@blueprintjs/select";
import { useEffect, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { loadSampleData, SampleRow, toYarrrmlId } from "../lib/source-utils";
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

  const [sampleRows, setSampleRows] = useState<SampleRow[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (selectedSource && selectedSource.uri) {
      loadSampleData(
        selectedSource.uri,
        selectedSource.format,
        selectedSource.iterator,
      )
        .then((rows) => {
          if (active) setSampleRows(rows);
        })
        .catch(() => {
          if (active) setSampleRows([]);
        });
    } else {
      setSampleRows([]);
    }
    return () => {
      active = false;
    };
  }, [selectedSource?.id, selectedSource?.uri, selectedSource?.iterator]);

  const evaluateTemplate = (template: string, row: SampleRow) => {
    if (!template) return "";
    return template.replace(/\{([^}]+)\}/g, (match, colName) => {
      return row[colName] !== undefined && row[colName] !== null
        ? row[colName]
        : match;
    });
  };

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
          <span className="text-xs text-gray-400 truncate ml-4 max-w-48 block">
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
          <span className="text-xs text-gray-400 truncate ml-4 max-w-36 block">
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

    const samples = sampleRows
      .map((row) => row[item])
      .filter((val) => val !== undefined && val !== "")
      .slice(0, 3)
      .join(", ");

    return (
      <MenuItem
        active={modifiers.active}
        key={item}
        onClick={handleClick}
        text={
          <div className="flex flex-col py-1">
            <span className="font-semibold">{item}</span>
            <span className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
              {samples ? (
                `e.g., ${samples}`
              ) : (
                <span className="italic">no data</span>
              )}
            </span>
          </div>
        }
      />
    );
  };

  const filterColumn = (query: string, item: string) => {
    return item.toLowerCase().includes(query.toLowerCase());
  };

  return (
    <>
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
                        className={`group cursor-pointer flex flex-row justify-between ${
                          entity.id === selectedEntityId
                            ? "bg-blue-50 border-blue-200"
                            : "border-transparent hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedEntityId(entity.id)}
                      >
                        <H6 className="mb-0!">{entity.name}</H6>
                        <Button
                          icon="cross"
                          variant="minimal"
                          size="small"
                          intent="danger"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
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
                            <div className="flex gap-2">
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
                              <Button
                                icon="eye-open"
                                onClick={() => setIsPreviewOpen(true)}
                                disabled={!selectedSource}
                                title="Preview Source Data"
                              />
                            </div>
                          </FormGroup>
                          <FormGroup label="Subject Template">
                            <InputGroup
                              value={selectedEntity.subjectTemplate}
                              onChange={(e) =>
                                updateEntity(selectedEntity.id, {
                                  subjectTemplate: e.target.value,
                                })
                              }
                              rightElement={
                                <PopoverNext
                                  content={
                                    <Menu>
                                      <MenuDivider title="Insert Column" />
                                      {sourceColumns.map((col) => {
                                        const samples = sampleRows
                                          .map((row) => row[col])
                                          .filter(
                                            (val) =>
                                              val !== undefined && val !== "",
                                          )
                                          .slice(0, 3)
                                          .join(", ");

                                        return (
                                          <MenuItem
                                            key={col}
                                            text={
                                              <div className="flex flex-col py-1">
                                                <span className="font-semibold">{`{${col}}`}</span>
                                                <span className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                                                  {samples ? (
                                                    `e.g., ${samples}`
                                                  ) : (
                                                    <span className="italic">
                                                      no data
                                                    </span>
                                                  )}
                                                </span>
                                              </div>
                                            }
                                            onClick={() => {
                                              const current =
                                                selectedEntity.subjectTemplate ||
                                                "";
                                              updateEntity(selectedEntity.id, {
                                                subjectTemplate:
                                                  current +
                                                  (current.endsWith("/") ||
                                                  current.length === 0
                                                    ? ""
                                                    : "") +
                                                  `{${col}}`,
                                              });
                                            }}
                                          />
                                        );
                                      })}
                                      {sourceColumns.length === 0 && (
                                        <MenuItem
                                          disabled
                                          text="No columns found"
                                        />
                                      )}
                                    </Menu>
                                  }
                                  placement="bottom-end"
                                >
                                  <Button
                                    icon="insert"
                                    minimal
                                    title="Insert Column Variable"
                                  />
                                </PopoverNext>
                              }
                            />
                            {sampleRows.length > 0 &&
                              selectedEntity.subjectTemplate && (
                                <div className="text-xs text-green-600 mt-1 truncate">
                                  Preview:{" "}
                                  {evaluateTemplate(
                                    selectedEntity.subjectTemplate,
                                    sampleRows[0],
                                  )}
                                </div>
                              )}
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
                      {selectedEntity.properties.length === 0 ? (
                        <SectionCard padded={false}>
                          <div className="p-4 text-center text-gray-400 text-xs">
                            No property mappings defined. Click (+) to add one.
                          </div>
                        </SectionCard>
                      ) : (
                        <CardList compact>
                          {selectedEntity.properties.map((prop, idx) => (
                            <Card
                              key={idx}
                              className="flex flex-row items-center gap-3 py-2 px-3"
                            >
                              <div className="flex-none">
                                <PopoverNext
                                  content={
                                    <Menu>
                                      <MenuItem
                                        icon="th"
                                        text="Column"
                                        active={prop.type === "column"}
                                        onClick={() =>
                                          updateProp(idx, { type: "column" })
                                        }
                                      />
                                      <MenuItem
                                        icon="tag"
                                        text="Constant"
                                        active={prop.type === "constant"}
                                        onClick={() =>
                                          updateProp(idx, { type: "constant" })
                                        }
                                      />
                                      <MenuItem
                                        icon="code"
                                        text="Template"
                                        active={prop.type === "template"}
                                        onClick={() =>
                                          updateProp(idx, { type: "template" })
                                        }
                                      />
                                    </Menu>
                                  }
                                  placement="bottom-start"
                                >
                                  <Button
                                    minimal
                                    icon={
                                      prop.type === "column"
                                        ? "th"
                                        : prop.type === "constant"
                                          ? "tag"
                                          : "code"
                                    }
                                    title={`Type: ${prop.type}`}
                                  />
                                </PopoverNext>
                              </div>
                              <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
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
                                    placeholder: "Predicate (Ontology)...",
                                  }}
                                />

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
                                      placeholder: "Column...",
                                    }}
                                  />
                                ) : (
                                  <InputGroup
                                    small
                                    fill
                                    placeholder={
                                      prop.type === "constant"
                                        ? "Constant value..."
                                        : "Template string..."
                                    }
                                    value={prop.value}
                                    onChange={(e) =>
                                      updateProp(idx, {
                                        value: e.target.value,
                                      })
                                    }
                                  />
                                )}
                              </div>
                              <div className="flex-none">
                                <Button
                                  icon="cross"
                                  minimal
                                  small
                                  intent="danger"
                                  onClick={() => removeProp(idx)}
                                />
                              </div>
                            </Card>
                          ))}
                        </CardList>
                      )}
                    </Section>
                  </div>
                )}
              </div>
            </Panel>
          </Group>
        }
      />
      <Dialog
        title={`Source Preview: ${selectedSource?.id || ""}`}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        style={{ width: "80vw", maxWidth: "1200px" }}
      >
        <DialogBody>
          <div className="overflow-auto max-h-[60vh]">
            {sampleRows.length === 0 ? (
              <div className="text-center text-xs text-gray-400 py-4 italic">
                No preview records available or file failed to load.
              </div>
            ) : (
              <table className="bp5-html-table bp5-html-table-bordered bp5-html-table-striped bp5-html-table-condensed w-full text-xs">
                <thead>
                  <tr>
                    {sourceColumns.map((col) => (
                      <th
                        key={col}
                        className="font-mono text-gray-800 whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sampleRows.map((row, rIdx) => (
                    <tr key={rIdx}>
                      {sourceColumns.map((col) => (
                        <td
                          key={col}
                          className="font-mono text-gray-600 truncate max-w-[200px]"
                        >
                          {row[col] !== undefined ? (
                            row[col]
                          ) : (
                            <span className="text-gray-300 italic">null</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </DialogBody>
      </Dialog>
    </>
  );
}
