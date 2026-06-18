import {
  Alignment,
  EditableText,
  EntityTitle,
  H5,
  Icon,
  Navbar,
  NavbarDivider,
  NavbarGroup,
  Tab,
  TabId,
  Tabs,
  Tag,
} from "@blueprintjs/core";
import { useStore } from "../lib/store";

interface MainNavbarProps {
  projectName: string;
  setProjectName: (name: string) => void;
  filePath: string | null;
  selectedTabId: TabId;
  setSelectedTabId: (id: TabId) => void;
  TABS_PARENT_ID: string;
}

export function MainNavbar({
  projectName,
  setProjectName,
  filePath,
  selectedTabId,
  setSelectedTabId,
  TABS_PARENT_ID,
}: MainNavbarProps) {
  const isDirty = useStore((state) => state.isDirty);

  return (
    <Navbar fixedToTop>
      <NavbarGroup align={Alignment.START}>
        <H5 className="mb-0!">
          <Icon icon="graph" className="text-red-600" /> Triplette
        </H5>
        <NavbarDivider />
        <EntityTitle
          title={
            <H5 className="mb-0!">
              <EditableText
                key={filePath ?? "new"}
                value={projectName}
                onChange={(s) => setProjectName(s)}
                placeholder="Project name"
              />
            </H5>
          }
          subtitle={
            filePath ? (
              <span className="text-[7pt] text-gray-00 italic truncate max-w-[150px]">
                {filePath}
              </span>
            ) : undefined
          }
        />
        <NavbarDivider />
        <Tabs
          id={TABS_PARENT_ID}
          onChange={setSelectedTabId}
          selectedTabId={selectedTabId}
        >
          <Tab id="configuration" title="Ontology" icon="layout-hierarchy" />
          <Tab id="sources" title="Sources" icon="database" />
          <Tab id="entities" title="Mappings" icon="exchange" />
        </Tabs>
      </NavbarGroup>
      <NavbarGroup align={Alignment.END}>
        {isDirty ? (
          <Tag minimal intent="warning" round icon="dot" className="mr-2">
            Unsaved Changes
          </Tag>
        ) : (
          <Tag minimal intent="success" round icon="tick" className="mr-2">
            Saved
          </Tag>
        )}
      </NavbarGroup>
    </Navbar>
  );
}
