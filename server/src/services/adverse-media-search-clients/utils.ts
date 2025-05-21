import * as mediatopics from "./../../../data/mediatopics/mediatopics.json";

/**
 * Recursively extracts all media topics from the given root codes.
 *
 * This function traverses the media topics hierarchy starting from the provided root codes,
 * and returns a flattened array containing the root codes and all their descendant codes.
 *
 * @param rootCodes - An array of media topic codes to extract from
 * @returns A flattened array containing the root codes and all their descendant codes
 */
export function extractMediaTopics(rootCodes: string[]): string[] {
  return rootCodes.flatMap((code) => {
    const subset = mediatopics.conceptSet.find((c) => c.qcode === code)?.narrower ?? [];
    return [code, ...extractMediaTopics(subset)];
  });
}
