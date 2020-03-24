import { Dispatch, SetStateAction, useCallback, useState } from "react";

export type PetitionState = "SAVED" | "SAVING" | "ERROR";

export function usePetitionState() {
  return useState<"SAVED" | "SAVING" | "ERROR">("SAVED");
}

export type PetitionUpdaterWrapper = ReturnType<typeof useWrapPetitionUpdater>;

export function useWrapPetitionUpdater(
  setState: Dispatch<SetStateAction<PetitionState>>
) {
  return useCallback(function <T extends (...args: any[]) => Promise<any>>(
    updater: T
  ) {
    return async function (...args: any[]) {
      setState("SAVING");
      try {
        const result = await updater(...args);
        setState("SAVED");
        return result;
      } catch (error) {
        setState("ERROR");
        console.log(error);
      }
    } as T;
  },
  []);
}

export type FileUploadAccepts = "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT";

export type FieldOptions = {
  FILE_UPLOAD: {
    accepts: FileUploadAccepts[] | null;
    multiple: boolean;
  };
  TEXT: {
    multiline: boolean;
  };
};
