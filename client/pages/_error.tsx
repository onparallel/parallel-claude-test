import { Text } from "@chakra-ui/core";
import { ErrorPage } from "@parallel/components/public/ErrorPage";
import { NextPageContext } from "next";
import { FormattedMessage } from "react-intl";
import * as Sentry from "@sentry/node";
import { UnwrapPromise } from "@parallel/utils/types";

const SENTRY_WHITELISTED_ERRORS = [
  "PUBLIC_PETITION_NOT_AVAILABLE",
  "FORBIDDEN",
];

export default function CustomError({
  err,
  errorCode,
  hasGetInitialPropsRun,
}: UnwrapPromise<ReturnType<typeof CustomError.getInitialProps>>) {
  if (
    !hasGetInitialPropsRun &&
    err &&
    !SENTRY_WHITELISTED_ERRORS.includes(errorCode)
  ) {
    Sentry.captureException(err);
  }
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

CustomError.getInitialProps = async ({ res, err, asPath }: NextPageContext) => {
  const errorCode =
    (err as any)?.graphQLErrors?.[0]?.extensions.code ?? (err as any)?.message;

  if (!err || (err && !SENTRY_WHITELISTED_ERRORS.includes(errorCode))) {
    Sentry.captureException(
      err ?? `_error.js getInitialProps missing data at path: ${asPath}`
    );
    await Sentry.flush(2000);
  }

  return { errorCode, err, hasGetInitialPropsRun: true };
};
