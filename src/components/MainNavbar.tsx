import {
  Alignment,
  Button,
  EditableText,
  H5,
  Icon,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  Tab,
  TabId,
  Tabs,
} from "@blueprintjs/core";
import { useStore } from "../lib/store";

interface MainNavbarProps {
  projectName: string;
  setProjectName: (name: string) => void;
  filePath: string | null;
  selectedTabId: TabId;
  setSelectedTabId: (id: TabId) => void;
  TABS_PARENT_ID: string;
  onGenerateTriples: () => void;
  isGenerating: boolean;
}

export function MainNavbar({
  projectName,
  setProjectName,
  filePath,
  selectedTabId,
  setSelectedTabId,
  TABS_PARENT_ID,
  onGenerateTriples,
  isGenerating,
}: MainNavbarProps) {
  const closeProject = useStore((state) => state.closeProject);
  const saveProjectToDisk = useStore((state) => state.saveProjectToDisk);

  return (
    <Navbar fixedToTop>
      <NavbarGroup align={Alignment.START}>
        <Button
          minimal
          icon="cross"
          onClick={closeProject}
          title="Close Project"
          className="mr-2"
        />
        <H5 className="mb-0!">
          <Icon icon="graph" className="text-red-600" /> Triplette
        </H5>
        <NavbarDivider />
        <H5 className="mb-0!">
          <EditableText
            key={filePath ?? "new"}
            value={projectName}
            onChange={(s) => setProjectName(s)}
            placeholder="Project name"
          />
        </H5>
        {filePath && (
          <span className="text-xs text-gray-400 ml-4 italic truncate max-w-[200px]">
            {filePath}
          </span>
        )}
      </NavbarGroup>
      <NavbarGroup align={Alignment.END}>
        <Tabs
          id={TABS_PARENT_ID}
          onChange={setSelectedTabId}
          selectedTabId={selectedTabId}
        >
          <Tab id="configuration" title="Configuration" icon="settings" />
          <Tab id="sources" title="Sources" icon="database" />
          <Tab id="entities" title="Entities" icon="form" />
          <Tab id="yarrrml" title="YARRRML" icon="code" />
        </Tabs>
        <Button
          minimal
          icon="floppy-disk"
          text="Save"
          onClick={saveProjectToDisk}
          className="ml-4!"
        />
        <Button
          intent="primary"
          text="Generate Triples"
          icon="generate"
          className="ml-2!"
          onClick={onGenerateTriples}
          loading={isGenerating}
        />
      </NavbarGroup>
    </Navbar>
  );
}
