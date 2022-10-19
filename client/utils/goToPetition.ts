import { usePetitionShouldConfirmNavigation } from "@parallel/components/layout/PetitionLayout";
import { useRouter } from "next/router";
import { MouseEvent, useCallback } from "react";
import { useHandleNavigation } from "./navigation";

export type PetitionSection = "compose" | "replies" | "activity" | "preview";

interface GoToPetitionOptions {
  event?: MouseEvent;
  query?: Record<string, string>;
}

export function useGoToPetition() {
  const navigate = useHandleNavigation();
  return useCallback(function (
    id: string,
    section: PetitionSection,
    options?: GoToPetitionOptions
  ) {
    let url = `/app/petitions/${id}/${section}`;
    if (options?.query) {
      url += `?${new URLSearchParams(options.query)}`;
    }
    navigate(url, options?.event);
  },
  []);
}

export function useGoToPetitionSection() {
  const goToPetition = useGoToPetition();
  const router = useRouter();
  const [shouldConfirmNavigation, _] = usePetitionShouldConfirmNavigation();
  return useCallback(
    function (section: PetitionSection, options?: GoToPetitionOptions) {
      goToPetition(router.query.petitionId as string, section, {
        ...options,
        query:
          shouldConfirmNavigation || options?.query
            ? {
                ...(shouldConfirmNavigation ? { new: "" } : {}),
                ...(options?.query ?? {}),
              }
            : undefined,
      });
    },
    [router.query.petitionId, shouldConfirmNavigation]
  );
}
