import { Doc } from "./Doc";

export interface DocGroup {
  heading: string;
  droppable: boolean;
  dropOffCompleted: boolean;
  showDropOffButton: boolean;
  expandGroupByDefault: boolean;
  docs: Doc[];
}
