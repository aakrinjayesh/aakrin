/**
 * Business facts carry a validation status. Only `confirmed` facts may render.
 *
 * Unconfirmed facts are recorded here (rather than deleted) so the team can see
 * what is waiting for validation, but they must never reach the page: always
 * read lists through `confirmed()`. No placeholders are shown to visitors.
 */
export type FactStatus = "confirmed" | "unconfirmed";

export interface Fact {
  status: FactStatus;
  /** Internal note: source of the fact or what is missing. Never rendered. */
  note?: string;
}

export function confirmed<T extends Fact>(items: readonly T[]): T[] {
  return items.filter((item) => item.status === "confirmed");
}

export function isConfirmed<T extends Fact>(item: T | undefined): item is T {
  return item?.status === "confirmed";
}

export interface ImageAsset {
  /** Path under /public */
  src: string;
  width: number;
  height: number;
}
