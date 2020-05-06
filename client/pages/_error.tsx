import { Heading, Text } from "@chakra-ui/core";
import { Spacer } from "@parallel/components/common/Spacer";
import { ErrorPage } from "@parallel/components/public/ErrorPage";
import { NextPageContext } from "next";
import { FormattedMessage } from "react-intl";

export default function CustomError({
  errorCode,
}: ReturnType<typeof CustomError.getInitialProps>) {
  return errorCode === "PUBLIC_PETITION_NOT_AVAILABLE" ? (
    <ErrorPage
      header={
        <FormattedMessage
          id="error.petition-not-available.header"
          defaultMessage="It seems that this petition is no longer available."
        />
      }
      imageUrl={"/static/images/undraw_road_sign.svg"}
    >
      <Text>
        <FormattedMessage
          id="error.petition-not-available.text"
          defaultMessage="If you need to access it, please reach out to the person that sent it to you."
        />
      </Text>
    </ErrorPage>
  ) : (
    <ErrorPage
      header={
        <FormattedMessage
          id="error.unknown-error.header"
          defaultMessage="An error happened and our developers have already been notified."
        />
      }
      imageUrl={"/static/images/undraw_bug_fixing.svg"}
    >
      <Text>
        <FormattedMessage
          id="error.unknown-error.text"
          defaultMessage="Please try again later and if the error persists reach out to support for help."
        />
      </Text>
    </ErrorPage>
  );
}

CustomError.getInitialProps = function ({ res, err }: NextPageContext) {
  const errorCode = (err as any)?.graphQLErrors?.[0]?.extensions.code;
  return { errorCode };
};
