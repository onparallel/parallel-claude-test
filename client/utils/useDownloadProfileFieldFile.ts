import { gql, useMutation } from "@apollo/client";
import { useDownloadProfileFieldFile_profileFieldFileDownloadLinkDocument } from "@parallel/graphql/__types";
import { openNewWindow } from "@parallel/utils/openNewWindow";
import { withError } from "@parallel/utils/promises/withError";
import { useCallback } from "react";

export function useDownloadProfileFieldFile() {
  const [mutate] = useMutation(useDownloadProfileFieldFile_profileFieldFileDownloadLinkDocument);

  return useCallback(
    async function downloadProfileFieldFile(
      profileId: string,
      profileTypeFieldId: string,
      profileFieldFileId: string,
      preview?: boolean,
    ) {
      await withError(
        openNewWindow(async () => {
          const { data } = await mutate({
            variables: { profileId, profileTypeFieldId, profileFieldFileId, preview },
          });
          const { url } = data!.profileFieldFileDownloadLink;
          return url!;
        }),
      );
    },
    [mutate],
  );
}

const _mutations = [
  gql`
    mutation useDownloadProfileFieldFile_profileFieldFileDownloadLink(
      $profileId: GID!
      $profileTypeFieldId: GID!
      $profileFieldFileId: GID!
      $preview: Boolean
    ) {
      profileFieldFileDownloadLink(
        profileId: $profileId
        profileTypeFieldId: $profileTypeFieldId
        profileFieldFileId: $profileFieldFileId
        preview: $preview
      ) {
        result
        url
      }
    }
  `,
];
