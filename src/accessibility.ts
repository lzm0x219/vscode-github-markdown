import { getConfiguration } from "./configuration";

export const section = {
  linkUnderlines: "accessibility.linkUnderlines"
} as const;

export function getLinkUnderlines(): boolean {
  return getConfiguration().get(section.linkUnderlines, true);
}
