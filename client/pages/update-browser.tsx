import { Image } from "@chakra-ui/image";
import { Link, Stack, Text } from "@chakra-ui/layout";
import { ErrorPage } from "@parallel/components/public/ErrorPage";
import { FormattedMessage } from "react-intl";

export default function UpdateBrowser() {
  const browsers = [
    {
      code: "edge",
      name: "Microsoft Edge",
      url: "https://www.microsoft.com/edge",
    },
    {
      code: "chrome",
      name: "Google Chrome",
      url: "https://www.google.com/chrome/browser/desktop/",
    },
    {
      code: "firefox",
      name: "Mozilla Firefox",
      url: "https://www.mozilla.org/firefox/new",
    },
  ];
  return (
    <ErrorPage
      header={
        <FormattedMessage id="view.update-browser.header" defaultMessage="Unsupported browser" />
      }
      imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_back_in_the_day.svg`}
    >
      <Stack spacing={6}>
        <Text>
          <FormattedMessage
            id="view.update-browser.text-1"
            defaultMessage="You are using an old browser. We recommend updating your browser or download the latest version of one of the following:"
          />
        </Text>
        <Stack direction="row" justifyContent="center" spacing={{ base: 4, sm: 8, md: 12 }}>
          {browsers.map((browser) => (
            <Link
              key={browser.code}
              isExternal
              href={browser.url}
              borderRadius="md"
              border="1px solid"
              borderColor="transparent"
              padding={2}
              _hover={{
                borderColor: "gray.200",
              }}
              _focus={{
                borderColor: "gray.200",
              }}
            >
              <Stack alignItems="center">
                <Image
                  boxSize={10}
                  src={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/browsers/${browser.code}.png`}
                />
                <Text as="span" whiteSpace="nowrap">
                  {browser.name}
                </Text>
              </Stack>
            </Link>
          ))}
        </Stack>
        <Text>
          <FormattedMessage
            id="view.update-browser.text-2"
            defaultMessage="If the error persists, please contact the person who sent you this link."
          />
        </Text>
      </Stack>
    </ErrorPage>
  );
}
