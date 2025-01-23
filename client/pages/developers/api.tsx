import { untranslated } from "@parallel/utils/untranslated";
import { InferGetServerSidePropsType } from "next";
import Head from "next/head";
import Script from "next/script";
import { useEffect, useRef } from "react";

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
        <title>{untranslated("Parallel API | Parallel for developers")}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="Integrate Parallel into your workflow" />
        <link
          rel="stylesheet"
          href={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/styles/api.css`}
        />
      </Head>
      <Script
        src={`${process.env.NEXT_PUBLIC_ASSETS_URL ?? ""}/static/js/redoc.standalone.js`}
        strategy="beforeInteractive"
      />
      <div ref={ref} />
    </>
  );
}

export async function getServerSideProps() {
  const res = await fetch("http://localhost/api/docs");
  return {
    props: {
      spec: await res.json(),
    },
  };
}

export default DeveloperApi;
