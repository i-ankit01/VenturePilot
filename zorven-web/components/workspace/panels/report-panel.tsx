import { PartialResult } from "@/lib/api";
import { DeckViewer } from "@/components/pitch/DeckViewer";

interface Props {
  data: NonNullable<PartialResult["pitch_output"]>;
  projectId?: string;
}

export function ReportPanel({ data, projectId }: Props) {
  return <DeckViewer data={data} projectId={projectId} />;
}