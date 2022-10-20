import { usePetitionShouldConfirmNavigation } from "@parallel/components/layout/PetitionLayout";
import { useRouter } from "next/router";
import { MouseEvent, useCallback } from "react";
import { isDefined } from "remeda";
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
  const petitionId = router.query.petitionId as string;
  const fromTemplate = isDefined(router.query.fromTemplate);
  return useCallback(
    function (section: PetitionSection, options?: GoToPetitionOptions) {
      goToPetition(petitionId, section, {
        ...options,
        query:
          fromTemplate || shouldConfirmNavigation || options?.query
            ? {
                ...(fromTemplate ? { fromTemplate: "" } : {}),
                ...(shouldConfirmNavigation ? { new: "" } : {}),
                ...(options?.query ?? {}),
              }
            : undefined,
      });
    },
    [petitionId, fromTemplate, shouldConfirmNavigation]
  );
}
