import { usePetitionShouldConfirmNavigation } from "@parallel/components/layout/PetitionLayout";
import { useRouter } from "next/router";
import { MouseEvent, useCallback, useRef } from "react";
import { isDefined } from "remeda";
import { useHandleNavigation } from "./navigation";

export type PetitionSection = "compose" | "replies" | "activity" | "preview";

export function useBuildUrlToPetition() {
  return useCallback(function (
    id: string,
    section: PetitionSection,
    query?: Record<string, string>
  ) {
    let url = `/app/petitions/${id}/${section}`;
    const params = new URLSearchParams(query).toString();
    if (params) {
      url += `?${params}`;
    }
    return url;
  },
  []);
}

interface GoToPetitionOptions {
  event?: MouseEvent;
  query?: Record<string, string>;
}

export function useGoToPetition() {
  const navigate = useHandleNavigation();
  const buildUrlToPetition = useBuildUrlToPetition();
  return useCallback(function (
    id: string,
    section: PetitionSection,
    options?: GoToPetitionOptions
  ) {
    const url = buildUrlToPetition(id, section, options?.query);
    navigate(url, options?.event);
  },
  []);
}

export function useBuildUrlToPetitionSection() {
  const routerRef = useRef(useRouter());
  const [shouldConfirmNavigation, _] = usePetitionShouldConfirmNavigation();
  const shouldConfirmNavigationRef = useRef(shouldConfirmNavigation);
  const buildUrlToPetition = useBuildUrlToPetition();
  return useCallback(function (section: PetitionSection, query?: Record<string, string>) {
    const router = routerRef.current;
    const petitionId = router.query.petitionId as string;
    const fromTemplate = isDefined(router.query.fromTemplate);
    return buildUrlToPetition(petitionId, section, {
      ...(fromTemplate ? { fromTemplate: "" } : {}),
      ...(shouldConfirmNavigationRef.current ? { new: "" } : {}),
      ...(query ?? {}),
    });
  }, []);
}

export function useGoToPetitionSection() {
  const navigate = useHandleNavigation();
  const buildUrlToPetitionSection = useBuildUrlToPetitionSection();
  return useCallback(function (section: PetitionSection, options?: GoToPetitionOptions) {
    const url = buildUrlToPetitionSection(section, options?.query);
    navigate(url, options?.event);
  }, []);
}
