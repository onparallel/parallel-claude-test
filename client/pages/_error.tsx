import { Text } from "@chakra-ui/core";
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
      imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_road_sign.svg`}
    >
      <Text>
        <FormattedMessage
          id="error.petition-not-available.text"
          defaultMessage="If you need to access it, please reach out to the person that sent it to you."
        />
      </Text>
    </ErrorPage>
  ) : errorCode === "FORBIDDEN" ? (
    <ErrorPage
      header={
        <FormattedMessage
          id="error.forbidden-access.header"
          defaultMessage="Access forbidden"
        />
      }
      imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_cancel.svg`}
    >
      <Text>
        <FormattedMessage
          id="error.forbidden-access.text"
          defaultMessage="You don't seem to have access to this page. If you think you should, please reach out to support for help."
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
      imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_bug_fixing.svg`}
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
  const errorCode =
    (err as any)?.graphQLErrors?.[0]?.extensions.code ?? (err as any)?.message;
  return { errorCode };
};
