import { useRouter } from "next/router";
import { useCallback } from "react";

export function useGoToPetition() {
  const router = useRouter();
  return useCallback(
    (id: string, section: "compose" | "replies" | "activity") => {
      router.push(`/${router.query.locale}/app/petitions/${id}/${section}`);
    },
    [router.query.locale]
  );
}
