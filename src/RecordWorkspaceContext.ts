import { createContext } from "react";
export const RecordWorkspaceContext = createContext<null | {
  active: string;
  reveal: (node: HTMLElement) => void;
  navigate: (id: string) => void;
}>(null);
