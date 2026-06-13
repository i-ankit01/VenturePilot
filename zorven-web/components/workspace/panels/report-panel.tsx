import { PartialResult } from "@/lib/api";
import { DeckViewer } from "@/components/pitch/DeckViewer";

interface Props {
  data: NonNullable<PartialResult["pitch_output"]>;
}

export function ReportPanel({ data}: Props) {
  return <DeckViewer data={data}/>;
}