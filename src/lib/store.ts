import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import { create } from "zustand";
import { parseOntology } from "./ontology";
import {
  RecentProject,
  RMLEntity,
  RMLSource,
  TripletteProject,
  TripletteState,
} from "./state";
import { generateYarrrml, generateRML } from "./yarrrml-generator";
import { extractColumns } from "./source-utils";
import { generateTriples } from "./rml-processor";

const RECENT_PROJECTS_KEY = "triplette_recent_projects";

interface Store extends TripletteState {
  setProjectName: (name: string) => void;
  loadOntology: (filePath: string, silent?: boolean) => Promise<void>;

  addSource: (source: RMLSource) => Promise<void>;
  removeSource: (id: string) => void;
  updateSource: (id: string, source: Partial<RMLSource>) => Promise<void>;

  addEntity: (entity: RMLEntity) => void;
  removeEntity: (id: string) => void;
  updateEntity: (id: string, entity: Partial<RMLEntity>) => void;

  runTripleGeneration: () => Promise<void>;

  // Project Lifecycle
  createNewProject: () => void;
  openRecentProject: (path: string) => Promise<void>;
  closeProject: () => void;

  // Async Native Actions
  saveProjectToDisk: () => Promise<boolean>;
  openProjectFromDisk: () => Promise<void>;
}

const DEFAULT_PROJECT: TripletteProject = {
  name: "My mapping",
  ontologyFilePath: null,
  yarrrmlContent: "",
  rmlContent: "",
  generatedTriples: null,
  classes: [],
  properties: [],
  sources: [],
  entities: [],
};

const loadRecentProjects = (): RecentProject[] => {
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load recent projects", e);
    return [];
  }
};

const saveRecentProjects = (recents: RecentProject[]) => {
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recents));
};

export const useStore = create<Store>((set, get) => {
  // Internal helper to sync YARRRML whenever sources or entities change
  const syncYarrrml = (project: TripletteProject) => {
    try {
      const yarrrml = generateYarrrml(project);
      const rml = generateRML(yarrrml);
      return { ...project, yarrrmlContent: yarrrml, rmlContent: rml };
    } catch (e) {
      console.error("Failed to sync YARRRML:", e);
      return project;
    }
  };

  const updateRecentProject = (name: string, path: string) => {
    const currentRecents = get().recentProjects;
    const filtered = currentRecents.filter((r) => r.path !== path);
    const newRecents = [
      { name, path, lastOpened: Date.now() },
      ...filtered,
    ].slice(0, 10);
    set({ recentProjects: newRecents });
    saveRecentProjects(newRecents);
  };

  return {
    filePath: null,
    isDirty: false,
    isGenerating: false,
    isProjectActive: false,
    recentProjects: loadRecentProjects(),
    project: { ...DEFAULT_PROJECT },

    setProjectName: (name) => {
      if (get().project.name === name) return;
      set((state) => ({
        project: { ...state.project, name },
        isDirty: true,
      }));
    },

    addSource: async (source) => {
      // Auto-extract columns
      if (source.uri && source.format) {
        source.columns = await extractColumns(source.uri, source.format);
      }

      set((state) => {
        const nextProject = {
          ...state.project,
          sources: [...state.project.sources, source],
        };
        return {
          project: syncYarrrml(nextProject),
          isDirty: true,
        };
      });
    },

    removeSource: (id) =>
      set((state) => {
        const nextProject = {
          ...state.project,
          sources: state.project.sources.filter((s) => s.id !== id),
        };
        return {
          project: syncYarrrml(nextProject),
          isDirty: true,
        };
      }),

    updateSource: async (id, updatedFields) => {
      const currentSource = get().project.sources.find((s) => s.id === id);
      if (currentSource && (updatedFields.uri || updatedFields.format)) {
        const uri = updatedFields.uri || currentSource.uri;
        const format = updatedFields.format || currentSource.format;
        updatedFields.columns = await extractColumns(uri, format);
      }

      set((state) => {
        const nextProject = {
          ...state.project,
          sources: state.project.sources.map((s) =>
            s.id === id ? { ...s, ...updatedFields } : s,
          ),
        };
        return {
          project: syncYarrrml(nextProject),
          isDirty: true,
        };
      });
    },

    addEntity: (entity) =>
      set((state) => {
        const nextProject = {
          ...state.project,
          entities: [...state.project.entities, entity],
        };
        return {
          project: syncYarrrml(nextProject),
          isDirty: true,
        };
      }),

    removeEntity: (id) =>
      set((state) => {
        const nextProject = {
          ...state.project,
          entities: state.project.entities.filter((e) => e.id !== id),
        };
        return {
          project: syncYarrrml(nextProject),
          isDirty: true,
        };
      }),

    updateEntity: (id, updatedFields) =>
      set((state) => {
        const nextProject = {
          ...state.project,
          entities: state.project.entities.map((e) =>
            e.id === id ? { ...e, ...updatedFields } : e,
          ),
        };
        return {
          project: syncYarrrml(nextProject),
          isDirty: true,
        };
      }),

    runTripleGeneration: async () => {
      set({ isGenerating: true });
      try {
        const triples = await generateTriples(get().project);
        set((state) => ({
          project: { ...state.project, generatedTriples: triples },
          isGenerating: false,
        }));
      } catch (e) {
        console.error("Triple generation failed:", e);
        set({ isGenerating: false });
      }
    },

    loadOntology: async (filePath: string, silent = false) => {
      try {
        const content = await readTextFile(filePath);
        const { classes, properties } = parseOntology(content);
        set((state) => ({
          project: {
            ...state.project,
            ontologyFilePath: filePath,
            classes,
            properties,
          },
          isDirty: silent ? state.isDirty : true,
        }));
      } catch (error) {
        console.error("Failed to load ontology:", error);
      }
    },

    createNewProject: () => {
      set({
        isProjectActive: true,
        filePath: null,
        isDirty: false,
        project: { ...DEFAULT_PROJECT },
      });
    },

    closeProject: () => {
      set({ isProjectActive: false });
    },

    openRecentProject: async (path: string) => {
      try {
        const contents = await invoke<string>("read_file_content", { path });
        const projectData: TripletteProject = JSON.parse(contents);

        if (!projectData.name) {
          projectData.name = "Untitled Project";
        }

        set({
          filePath: path,
          project: projectData,
          isDirty: false,
          isProjectActive: true,
        });

        updateRecentProject(projectData.name, path);

        if (projectData.ontologyFilePath) {
          get().loadOntology(projectData.ontologyFilePath, true);
        }
      } catch (error) {
        console.error("Failed to load recent project:", error);
        // Remove from recents if it fails (e.g. file moved/deleted)
        const newRecents = get().recentProjects.filter((r) => r.path !== path);
        set({ recentProjects: newRecents });
        saveRecentProjects(newRecents);
      }
    },

    saveProjectToDisk: async () => {
      try {
        const { filePath, project } = get();
        let targetPath = filePath;

        if (!targetPath) {
          targetPath = await save({
            title: "Save Project",
            defaultPath: `${project.name}.3plette`,
            filters: [
              {
                name: "Triplette Project",
                extensions: ["3plette", "triplette", "json"],
              },
            ],
          });
        }

        if (!targetPath) return false;

        const fileContent = JSON.stringify(project, null, 2);
        await invoke("write_file_content", { path: targetPath, content: fileContent });

        set({ filePath: targetPath, isDirty: false });
        updateRecentProject(project.name, targetPath);
        return true;
      } catch (error) {
        console.error("Failed to save project:", error);
        return false;
      }
    },

    openProjectFromDisk: async () => {
      try {
        const selectedPath = await open({
          title: "Open Project",
          multiple: false,
          filters: [
            {
              name: "Triplette Project",
              extensions: ["3plette", "triplette", "json"],
            },
          ],
        });

        if (selectedPath === null || Array.isArray(selectedPath)) return;

        const contents = await readTextFile(selectedPath);
        const projectData: TripletteProject = JSON.parse(contents);

        // Ensure name is present
        if (!projectData.name) {
          projectData.name = "Untitled Project";
        }

        set({
          filePath: selectedPath,
          project: projectData,
          isDirty: false,
          isProjectActive: true,
        });

        updateRecentProject(projectData.name, selectedPath);

        // If project has an ontology, reload it to populate classes/properties
        if (projectData.ontologyFilePath) {
          get().loadOntology(projectData.ontologyFilePath, true);
        }
      } catch (error) {
        console.error("Failed to load project:", error);
      }
    },
  };
});
