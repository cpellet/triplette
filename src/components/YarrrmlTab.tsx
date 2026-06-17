import { TabId, TabPanel, TextArea } from "@blueprintjs/core";

interface YarrrmlTabProps {
  selectedTabId: TabId;
  parentId: string;
  yarrrmlContent: string;
}

export function YarrrmlTab({
  selectedTabId,
  parentId,
  yarrrmlContent,
}: YarrrmlTabProps) {
  return (
    <TabPanel
      id="yarrrml"
      selectedTabId={selectedTabId}
      parentId={parentId}
      className="h-full"
      panel={
        <div className="h-full w-full p-4 box-border flex flex-col">
          <TextArea
            fill
            placeholder="Preview YARRRML rules here"
            className="font-mono flex-1 resize-none"
            value={yarrrmlContent}
            readOnly
          />
        </div>
      }
    />
  );
}
