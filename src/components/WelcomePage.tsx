import { Button, H2, Icon, Text } from "@blueprintjs/core";
import { useStore } from "../lib/store";

export function WelcomePage() {
  const {
    createNewProject,
    openProjectFromDisk,
    openRecentProject,
    recentProjects,
  } = useStore();

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-white overflow-hidden">
      <div className="max-w-3xl w-full flex items-stretch p-8 space-x-12">
        {/* Left Side: Start */}
        <div className="flex-1 flex flex-col justify-center space-y-6">
          <H2 className="flex flex-row items-center gap-2">
            <Icon icon="graph" className="text-red-500" size={24} /> Triplette
          </H2>
          <div className="flex flex-col gap-3 max-w-xs mt-12">
            <Button
              intent="primary"
              icon="plus"
              text="New Project"
              onClick={createNewProject}
              className="justify-start"
            />
            <Button
              icon="folder-open"
              text="Open Project..."
              onClick={openProjectFromDisk}
              className="justify-start"
            />
          </div>
        </div>

        <div className="w-px bg-gray-200 self-stretch" />

        {/* Right Side: Recent */}
        <div className="flex-1 flex flex-col h-[400px]">
          <div className="flex-1 overflow-y-auto pr-4 space-y-1">
            {recentProjects.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 italic">
                No recent projects
              </div>
            ) : (
              recentProjects.map((project) => (
                <button
                  key={project.path}
                  onClick={() => openRecentProject(project.path)}
                  className="w-full text-left p-3 hover:bg-gray-100 transition-colors rounded group flex flex-col"
                >
                  <Text ellipsize className="font-medium text-gray-800">
                    {project.name}
                  </Text>
                  <Text ellipsize className="text-xs text-gray-400 mt-0.5">
                    {project.path}
                  </Text>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
