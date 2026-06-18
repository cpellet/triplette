import {
  Button,
  H6,
  NonIdealState,
  Spinner,
  Tab,
  Tabs,
  TextArea,
} from "@blueprintjs/core";
import { useState } from "react";
import { Panel } from "react-resizable-panels";
import { useStore } from "../lib/store";

export function OutputTabs({
  onGenerateTriples,
  isGenerating,
}: {
  onGenerateTriples: () => void;
  isGenerating: boolean;
}) {
  const generatedTriples = useStore((state) => state.project.generatedTriples);
  const yarrrmlContent = useStore((state) => state.project.yarrrmlContent);
  const [selectedTabId, setSelectedTabId] = useState<string>("triples");

  return (
    <Panel
      collapsible
      minSize="30%"
      maxSize="80%"
      defaultSize="30%"
      className="flex flex-col"
    >
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-row justify-between px-3 py-1.5 border-b border-gray-200 bg-white">
          <Tabs
            id="output-tabs"
            onChange={(id) => setSelectedTabId(id as string)}
            selectedTabId={selectedTabId}
          >
            <H6 className="mb-1.5!">Output</H6>
            <Tab id="triples" title="RDF Triples" icon="layout-linear" />
            <Tab id="yarrrml" title="YARRRML" icon="code" />
          </Tabs>

          <Button
            intent="primary"
            text="Generate Triples"
            icon="generate"
            className="ml-2!"
            onClick={onGenerateTriples}
            loading={isGenerating}
          />
        </div>

        <div className="flex-1 overflow-hidden">
          {selectedTabId === "triples" ? (
            isGenerating ? (
              <div className="h-full flex items-center justify-center">
                <NonIdealState
                  icon={<Spinner />}
                  title="Generating triples..."
                  description="Please wait while the RML engine processes your mappings."
                />
              </div>
            ) : !generatedTriples ? (
              <div className="h-full flex items-center justify-center">
                <NonIdealState
                  icon="circle"
                  title="Nothing to show yet"
                  description="Generate triples to preview them here"
                />
              </div>
            ) : (
              <div className="h-full p-4 box-border overflow-hidden flex flex-col">
                <TextArea
                  fill
                  className="font-mono flex-1 resize-none"
                  style={{ height: "100%" }}
                  value={generatedTriples}
                  readOnly
                />
              </div>
            )
          ) : (
            <div className="h-full p-4 box-border flex flex-col overflow-hidden">
              <TextArea
                fill
                placeholder="Preview YARRRML rules here"
                className="font-mono flex-1 resize-none"
                style={{ height: "100%" }}
                value={yarrrmlContent}
                readOnly
              />
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
