import { TabId } from "@blueprintjs/core";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useEffect, useId, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { RMLSource, ReferenceFormulation } from "./lib/state";
import { useStore } from "./lib/store";
import { toYarrrmlId, importExcelSchema } from "./lib/source-utils";

import { AddSourceDialog } from "./components/AddSourceDialog";
import { ConfigurationTab } from "./components/ConfigurationTab";
import { EntitiesTab } from "./components/EntitiesTab";
import { MainNavbar } from "./components/MainNavbar";
import { OutputTabs } from "./components/OutputTabs";
import { SourcesTab } from "./components/SourcesTab";
import { Updater } from "./components/Updater";
import { WelcomePage } from "./components/WelcomePage";
import { MappingGraph } from "./components/MappingGraph";

function App() {
  const isGraphWindow = window.location.search.includes("window=graph");
  if (isGraphWindow) {
    return <MappingGraph isPopout={true} />;
  }
  const isProjectActive = useStore((state) => state.isProjectActive);
  const project = useStore((state) => state.project);
  const {
    setProjectName,
    loadOntology,
    addSource,
    removeSource,
    addEntity,
    updateEntity,
    removeEntity,
    runTripleGeneration,
  } = useStore();
  const filePath = useStore((state) => state.filePath);
  const isGenerating = useStore((state) => state.isGenerating);

  const projectName = project.name ?? "";

  const TABS_PARENT_ID = useId();
  const [selectedTabId, setSelectedTabId] = useState<TabId>("configuration");

  const [isAddSourceDialogOpen, setIsAddSourceDialogOpen] = useState(false);
  const [newSource, setNewSource] = useState<Partial<RMLSource>>({
    id: "",
    uri: "",
    format: "csv",
    iterator: "",
  });

  useEffect(() => {
    const setupMenuListeners = async () => {
      const unlistenOpen = await listen("menu-open-project", () => {
        useStore.getState().openProjectFromDisk();
      });

      const unlistenSave = await listen("menu-save-project", () => {
        useStore.getState().saveProjectToDisk();
      });

      return () => {
        unlistenOpen();
        unlistenSave();
      };
    };

    const listenerPromise = setupMenuListeners();
    return () => {
      listenerPromise.then((cleanup) => cleanup());
    };
  }, []);

  const handleOntologySelect = async () => {
    const selected = await openDialog({
      multiple: false,
      filters: [{ name: "Ontology", extensions: ["rdf", "owl", "ttl", "n3"] }],
    });

    if (selected && !Array.isArray(selected)) {
      await loadOntology(selected);
    }
  };

  const handleFileSourceSelect = async () => {
    const selected = await openDialog({
      multiple: false,
      filters: [
        { name: "Data Source", extensions: ["csv", "json", "xml", "jsonld", "xlsx"] },
      ],
    });

    if (selected && !Array.isArray(selected)) {
      const extension = selected.split(".").pop()?.toLowerCase();
      let format: ReferenceFormulation = "csv";
      if (extension === "json" || extension === "jsonld") format = "json";
      if (extension === "xml") format = "xml";
      if (extension === "xlsx") format = "sql_excel_schema";

      const id = selected.split(/[/\\]/).pop()?.split(".")[0] || "source";

      setNewSource({
        ...newSource,
        uri: selected,
        format,
        id: toYarrrmlId(id),
        schemaConfig: format === "sql_excel_schema" ? {
          tablesSheetName: "tables",
          tableNameColumn: "table_name",
          propertiesSheetName: "properties",
          propertiesTableNameColumn: "table_name",
          propertiesColumnNameColumn: "column_name",
        } : undefined
      });
    }
  };

  const handleAddSource = async () => {
    if (newSource.format === "sql_excel_schema" && newSource.uri && newSource.schemaConfig) {
      try {
        const sources = await importExcelSchema(newSource.uri, newSource.schemaConfig);
        sources.forEach(source => addSource(source));
        setIsAddSourceDialogOpen(false);
        setNewSource({ id: "", uri: "", format: "csv", iterator: "" });
      } catch (e) {
        console.error("Failed to import schema:", e);
        alert("Failed to import Excel Schema. Check the developer console for details.");
      }
    } else if (newSource.id && newSource.uri && newSource.format) {
      addSource(newSource as RMLSource);
      setIsAddSourceDialogOpen(false);
      setNewSource({ id: "", uri: "", format: "csv", iterator: "" });
    }
  };

  return (
    <>
      <Updater />
      {!isProjectActive ? (
        <WelcomePage />
      ) : (
        <main className="h-screen bg-gray-50">
          <MainNavbar
            projectName={projectName}
            setProjectName={setProjectName}
            filePath={filePath}
            selectedTabId={selectedTabId}
            setSelectedTabId={setSelectedTabId}
            TABS_PARENT_ID={TABS_PARENT_ID}
          />
          <Group className="w-full h-full" orientation="vertical">
            <Panel defaultSize="70%" className="mt-12">
              <ConfigurationTab
                project={project}
                selectedTabId={selectedTabId}
                parentId={TABS_PARENT_ID}
                onOntologySelect={handleOntologySelect}
              />
              <SourcesTab
                project={project}
                selectedTabId={selectedTabId}
                parentId={TABS_PARENT_ID}
                onRemoveSource={removeSource}
                onAddSourceClick={() => setIsAddSourceDialogOpen(true)}
              />
              <EntitiesTab
                project={project}
                selectedTabId={selectedTabId}
                parentId={TABS_PARENT_ID}
                addEntity={addEntity}
                updateEntity={updateEntity}
                removeEntity={removeEntity}
              />
            </Panel>
            <Separator className="w-full h-1 bg-gray-200 hover:bg-blue-500 transition-colors cursor-row-resize" />
            <OutputTabs
              isGenerating={isGenerating}
              onGenerateTriples={runTripleGeneration}
            />
          </Group>

          <AddSourceDialog
            isOpen={isAddSourceDialogOpen}
            onClose={() => setIsAddSourceDialogOpen(false)}
            newSource={newSource}
            setNewSource={setNewSource}
            onAddSource={handleAddSource}
            onFileSelect={handleFileSourceSelect}
          />
        </main>
      )}
    </>
  );
}

export default App;
