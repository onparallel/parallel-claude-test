import { isApolloError } from "@apollo/client";
import { Text } from "@chakra-ui/react";
import { SupportLink } from "@parallel/components/common/SupportLink";
import { ErrorPage } from "@parallel/components/public/ErrorPage";
import { UnwrapPromise } from "@parallel/utils/types";
import * as Sentry from "@sentry/nextjs";
import { NextPageContext } from "next";
import { FormattedMessage, useIntl } from "react-intl";

const SENTRY_WHITELISTED_ERRORS = ["FORBIDDEN"];

export default function CustomError(
  props: UnwrapPromise<ReturnType<typeof CustomError.getInitialProps>>,
) {
  const { errorCode } = props;
  const intl = useIntl();
  return errorCode === "FORBIDDEN" ? (
    <ErrorPage
      header={
        <FormattedMessage id="error.forbidden-access.header" defaultMessage="Access forbidden" />
      }
      imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/undraw_cancel.svg`}
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
      imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/images/undraw_bug_fixing.svg`}
    >
      <Text>
        <FormattedMessage
          id="error.unknown-error.text"
          defaultMessage="Please try again later and if the error persists <a>reach out to support</a> for help."
          values={{
            a: (chunks: any) => (
              <SupportLink
                message={intl.formatMessage({
                  id: "error.unknown-error.support-message",
                  defaultMessage: "Hi, I am having issues with the application.",
                })}
              >
                {chunks}
              </SupportLink>
            ),
          }}
        />
      </Text>
    </ErrorPage>
  );
}

CustomError.getInitialProps = async ({ err, ...props }: NextPageContext) => {
  let errorCode: string | undefined;
  if (typeof window !== "undefined") {
    if (window.__NEXT_DATA__.page === "/_error") {
      errorCode = window.__NEXT_DATA__.props.pageProps.errorCode;
    } else {
      errorCode =
        err && isApolloError(err)
          ? err.graphQLErrors?.[0]?.extensions!.code
          : (err as any)?.message;
      if (err && !SENTRY_WHITELISTED_ERRORS.includes(errorCode!)) {
        Sentry.captureException(err);
      }
    }
  } else {
    if (err && !SENTRY_WHITELISTED_ERRORS.includes(errorCode!)) {
      Sentry.captureException(err);
    }
    errorCode =
      err && isApolloError(err) ? err.graphQLErrors?.[0]?.extensions!.code : (err as any)?.message;
  }
  return { errorCode };
};
