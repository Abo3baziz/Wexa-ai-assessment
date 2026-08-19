import type { NodeType } from "@/types";

/** Node-type → fill color, shared by the graph canvas and the legend. */
export const NODE_TYPE_COLORS: Record<NodeType, string> = {
  Patient: "#5b8cff",
  Visit: "#22c1a4",
  Doctor: "#f4a259",
  Department: "#a06cd5",
  Disease: "#ef6f6c",
  Medication: "#4cc9f0",
  Diagnosis: "#f6c453",
  Prescription: "#7bd389",
};

/** Node-type → human label for the legend and detail panel. */
export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  Patient: "Patient",
  Visit: "Visit",
  Doctor: "Doctor",
  Department: "Department",
  Disease: "Disease",
  Medication: "Medication",
  Diagnosis: "Diagnosis",
  Prescription: "Prescription",
};

export const NODE_TYPES = Object.keys(NODE_TYPE_COLORS) as NodeType[];
