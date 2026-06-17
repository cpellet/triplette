import {
  NonIdealState,
  Spinner,
  SpinnerSize,
  TextArea,
} from "@blueprintjs/core";
import { Panel } from "react-resizable-panels";
import { useStore } from "../lib/store";

export function TripletsPreview() {
  const generatedTriples = useStore((state) => state.project.generatedTriples);
  const isGenerating = useStore((state) => state.isGenerating);

  return (
    <Panel
      collapsible
      minSize="25%"
      maxSize="80%"
      defaultSize="30%"
      className="flex flex-col bg-gray-50 border-t border-gray-200 overflow-hidden box-border"
    >
      {isGenerating ? (
        <div className="flex-1 flex items-center justify-center">
          <NonIdealState
            icon={<Spinner size={SpinnerSize.LARGE} />}
            title="Generating triples..."
            description="Please wait while the RML engine processes your mappings."
          />
        </div>
      ) : !generatedTriples ? (
        <div className="flex-1 flex items-center justify-center">
          <NonIdealState
            icon="circle"
            title="No content yet"
            description="Generate triples to preview them here"
          />
        </div>
      ) : (
        <div className="flex-1 p-4 box-border overflow-hidden flex flex-col">
          <TextArea
            fill
            className="font-mono flex-1 resize-none"
            style={{ height: "100%" }}
            value={generatedTriples}
            readOnly
          />
        </div>
      )}
    </Panel>
  );
}
