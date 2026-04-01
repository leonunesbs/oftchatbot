export const assistantModes = ["lumi", "fire"] as const;

export type AssistantMode = (typeof assistantModes)[number];

export const defaultAssistantMode: AssistantMode = "lumi";
