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
