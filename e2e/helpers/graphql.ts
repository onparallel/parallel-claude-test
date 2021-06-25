import { Page } from "playwright";

interface GraphQLOperation {
  operationName: string;
  query: string;
  variables: Record<string, any>;
}

export async function waitForGraphQL(
  page: Page,
  predicate: (operation: GraphQLOperation) => boolean
) {
  await page.waitForResponse((response) => {
    const request = response.request();
    const data = request.postData();
    if (!data || !request.url().endsWith("/graphql")) {
      return false;
    }
    try {
      return predicate(JSON.parse(data));
    } catch {}
    return false;
  });
}
