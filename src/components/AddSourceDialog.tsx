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
      </DialogBody>
      <DialogFooter
        actions={
          <>
            <Button text="Cancel" onClick={onClose} />
            <Button
              intent="primary"
              text="Register Source"
              onClick={onAddSource}
              disabled={!newSource.id || !newSource.uri}
            />
          </>
        }
      />
    </Dialog>
  );
}
