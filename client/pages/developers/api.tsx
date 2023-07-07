import { InferGetServerSidePropsType } from "next";
import { default as nodeFetch } from "node-fetch";
import Head from "next/head";
import { useEffect, useRef } from "react";
import Script from "next/script";

function DeveloperApi({ spec }: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    (window as any).Redoc?.init(
      spec,
      {
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
      },
      ref.current,
    );
  }, []);
  return (
    <>
      <Head>
        <title>Parallel API | Parallel for developers</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Integrate Parallel into your workflow" />
        <link
          rel="stylesheet"
          href={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/styles/api.css`}
        />
      </Head>
      <Script
        src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"
        strategy="beforeInteractive"
      />
      <div ref={ref} />
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
