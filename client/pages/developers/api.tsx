import { InferGetServerSidePropsType } from "next";
import { default as nodeFetch } from "node-fetch";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { PublicHeader } from "@parallel/components/public/layout/PublicHeader";

function DeveloperApi({
  spec,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <title>Parallel API | Parallel for developers</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta
        name="description"
        content="Integrate Parallel into your workflow"
      />
      <PublicHeader position="sticky" top={0} zIndex={1} />
      <SwaggerUI spec={spec} />
      <style jsx global>
        {
          /* css */ `
            .swagger-ui,
            .swagger-ui .info h1,
            .swagger-ui .info h2,
            .swagger-ui .info h3,
            .swagger-ui .info h4,
            .swagger-ui .info h5,
            .swagger-ui .info li,
            .swagger-ui .info p,
            .swagger-ui .info table,
            .swagger-ui .info .title,
            .swagger-ui .opblock-tag,
            .swagger-ui .opblock-tag small,
            .swagger-ui .opblock-description-wrapper p,
            .swagger-ui .opblock-external-docs-wrapper p,
            .swagger-ui .opblock-title_normal p,
            .swagger-ui .opblock .opblock-section-header h4 {
              font-family: inherit;
            }
            .parameters-col_description .renderedMarkdown p:first-child,
            .response-col_description .renderedMarkdown p:first-child {
              margin-top: 0;
            }
            .parameters-col_description .renderedMarkdown p:last-child,
            .response-col_description .renderedMarkdown p:last-child {
              margin-bottom: 0;
            }
            .swagger-ui table tbody tr td,
            .swagger-ui table thead tr td,
            .swagger-ui table thead tr th {
              font-size: 14px;
              padding: 0.5rem 0.25rem;
            }
            .swagger-ui table tbody tr td:first-of-type,
            .swagger-ui table thead tr td:first-of-type,
            .swagger-ui table thead tr th:first-of-type {
              padding: 0.5rem 0.25rem;
            }
            .swagger-ui .renderedMarkdown code {
              font-size: inherit;
              color: #444;
            }
            .swagger-ui .opblock-description-wrapper,
            .swagger-ui .opblock-external-docs-wrapper,
            .swagger-ui .opblock-title_normal {
              font-size: 14px;
            }
            .swagger-ui .response-col_description table {
              font-size: 14px;
            }
            .swagger-ui h1,
            .swagger-ui h2,
            .swagger-ui h3,
            .swagger-ui h4,
            .swagger-ui h5,
            .swagger-ui h6 {
              font-weight: 500;
            }
            .swagger-ui h1 {
              font-size: 1.5rem;
              margin: 1rem 0 0.5rem;
            }
            .swagger-ui h2 {
              font-size: 1.25rem;
              margin: 1rem 0 0.5rem;
            }
            .swagger-ui h3 {
              font-size: 1.125rem;
              margin: 1rem 0 0.5rem;
            }
          `
        }
      </style>
    </>
  );
}

export async function getServerSideProps() {
  const res = await nodeFetch("http://localhost/api/docs");
  return {
    props: {
      spec: await res.json(),
    },
  };
}

export default DeveloperApi;
