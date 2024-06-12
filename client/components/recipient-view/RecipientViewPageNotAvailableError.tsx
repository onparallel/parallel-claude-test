import { Text } from "@chakra-ui/react";
import { FormattedMessage } from "react-intl";
import { ErrorPage } from "../public/ErrorPage";

export function RecipientViewPageNotAvailableError() {
  return (
    <ErrorPage
      header={
        <FormattedMessage
          id="recipient-view.petition-not-available-error.header"
          defaultMessage="It seems that this page is no longer available."
        />
      }
      imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/undraw_road_sign.svg`}
    >
      <Text>
        <FormattedMessage
          id="recipient-view.petition-not-available-error.text"
          defaultMessage="If you need to access it, please reach out to the person that sent it to you."
        />
      </Text>
    </ErrorPage>
  );
}
