import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  FormGroup,
  HTMLSelect,
  InputGroup,
} from "@blueprintjs/core";
import { RMLSource, ReferenceFormulation } from "../lib/state";
import { toYarrrmlId } from "../lib/source-utils";

interface AddSourceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  newSource: Partial<RMLSource>;
  setNewSource: (source: Partial<RMLSource>) => void;
  onAddSource: () => void;
  onFileSelect: () => void;
}

export function AddSourceDialog({
  isOpen,
  onClose,
  newSource,
  setNewSource,
  onAddSource,
  onFileSelect,
}: AddSourceDialogProps) {
  return (
    <Dialog
      title="Register Data Source"
      isOpen={isOpen}
      onClose={onClose}
      canOutsideClickClose
    >
      <DialogBody>
        {newSource.format !== "sql_excel_schema" && (
          <FormGroup
            label="Source ID (alias)"
            labelInfo="(required)"
            helperText="Used to refer to this source in mappings"
          >
            <InputGroup
              placeholder="e.g. users_data"
              value={newSource.id}
              onChange={(e) =>
                setNewSource({ ...newSource, id: toYarrrmlId(e.target.value) })
              }
            />
          </FormGroup>
        )}

        <FormGroup label="File Path" labelInfo="(required)">
          <div className="flex gap-2">
            <InputGroup
              className="flex-1"
              placeholder="Choose or enter path..."
              value={newSource.uri}
              onChange={(e) =>
                setNewSource({ ...newSource, uri: e.target.value })
              }
            />
            <Button icon="folder-open" onClick={onFileSelect} />
          </div>
        </FormGroup>

        <div className="flex gap-4">
          <FormGroup label="Format" className="flex-1">
            <HTMLSelect
              fill
              value={newSource.format}
              onChange={(e) =>
                setNewSource({
                  ...newSource,
                  format: e.target.value as ReferenceFormulation,
                })
              }
            >
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="sql_excel_schema">SQL Excel Schema</option>
            </HTMLSelect>
          </FormGroup>

          {(newSource.format === "json" || newSource.format === "xml") && (
            <FormGroup
              label="Iterator"
              className="flex-1"
              helperText={
                newSource.format === "json"
                  ? "JSONPath (e.g. $.items[*])"
                  : "XPath (e.g. /root/item)"
              }
            >
              <InputGroup
                placeholder={newSource.format === "json" ? "$.[*]" : "/"}
                value={newSource.iterator}
                onChange={(e) =>
                  setNewSource({ ...newSource, iterator: e.target.value })
                }
              />
            </FormGroup>
          )}
        </div>

        {newSource.format === "sql_excel_schema" && (
          <div className="flex flex-col gap-2 mt-4">
            <h6 className="bp5-heading">Excel Schema Configuration</h6>
            <div className="grid grid-cols-2 gap-4">
              <FormGroup label="Tables Sheet Name">
                <InputGroup
                  value={newSource.schemaConfig?.tablesSheetName || ""}
                  onChange={(e) =>
                    setNewSource({
                      ...newSource,
                      schemaConfig: { ...newSource.schemaConfig, tablesSheetName: e.target.value } as any,
                    })
                  }
                  placeholder="e.g. tables"
                />
              </FormGroup>
              <FormGroup label="Table Name Column">
                <InputGroup
                  value={newSource.schemaConfig?.tableNameColumn || ""}
                  onChange={(e) =>
                    setNewSource({
                      ...newSource,
                      schemaConfig: { ...newSource.schemaConfig, tableNameColumn: e.target.value } as any,
                    })
                  }
                  placeholder="e.g. table_name"
                />
              </FormGroup>
              <FormGroup label="Properties Sheet Name">
                <InputGroup
                  value={newSource.schemaConfig?.propertiesSheetName || ""}
                  onChange={(e) =>
                    setNewSource({
                      ...newSource,
                      schemaConfig: { ...newSource.schemaConfig, propertiesSheetName: e.target.value } as any,
                    })
                  }
                  placeholder="e.g. properties"
                />
              </FormGroup>
              <FormGroup label="Properties Table Name Column">
                <InputGroup
                  value={newSource.schemaConfig?.propertiesTableNameColumn || ""}
                  onChange={(e) =>
                    setNewSource({
                      ...newSource,
                      schemaConfig: { ...newSource.schemaConfig, propertiesTableNameColumn: e.target.value } as any,
                    })
                  }
                  placeholder="e.g. table_name"
                />
              </FormGroup>
              <FormGroup label="Properties Column Name Column">
                <InputGroup
                  value={newSource.schemaConfig?.propertiesColumnNameColumn || ""}
                  onChange={(e) =>
                    setNewSource({
                      ...newSource,
                      schemaConfig: { ...newSource.schemaConfig, propertiesColumnNameColumn: e.target.value } as any,
                    })
                  }
                  placeholder="e.g. column_name"
                />
              </FormGroup>
            </div>
          </div>
        )}
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Cancel" onClick={onClose} />
            <Button
              intent="primary"
              text={newSource.format === "sql_excel_schema" ? "Import Schema" : "Register Source"}
              onClick={onAddSource}
              disabled={(!newSource.id && newSource.format !== "sql_excel_schema") || !newSource.uri}
            />
          </>
        }
      />
    </Dialog>
  );
}
