import { InferGetServerSidePropsType } from "next";
import { default as nodeFetch } from "node-fetch";
import { RedocStandalone } from "redoc";
import Head from "next/head";

function DeveloperApi({
  spec,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  return (
    <>
      <Head>
        <title>Parallel API | Parallel for developers</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Integrate Parallel into your workflow"
        />
        <link rel="stylesheet" href="/static/styles/api.css" />
      </Head>
      <RedocStandalone
        spec={spec}
        options={{
          noAutoAuth: true,
          expandResponses: "all",
          pathInMiddlePanel: true,
          jsonSampleExpandLevel: 3,
          expandSingleSchemaField: true,
          showExtensions: false,
          hideLoading: true,
          theme: {
            logo: {
              gutter: "16px 36px 8px 24px",
            },
            typography: {
              fontFamily: "'IBM Plex Sans',sans-serif",
              headings: {
                fontFamily: "'IBM Plex Sans',sans-serif",
              },
            },
            spacing: {
              sectionVertical: 20,
            },
          } as any,
        }}
      />
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
