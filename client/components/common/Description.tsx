import Head from "next/head";

interface DescriptionProps {
  key?: string | number;
  children?: string;
}

export function Description({ key, children }: DescriptionProps) {
  return (
    <Head>
      <meta property="description" key={key} content={children} />
    </Head>
  );
}
