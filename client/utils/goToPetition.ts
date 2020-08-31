import { useRouter } from "next/router";

export function useGoToPetition() {
  const router = useRouter();
  return (id: string, section: "compose" | "replies" | "activity") => {
    router.push(
      `/[locale]/app/petitions/[petitionId]/${section}`,
      `/${router.query.locale}/app/petitions/${id}/${section}`
    );
  };
}
