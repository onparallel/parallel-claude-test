import Head from "next/head";

interface TitleProps {
  children?: string | null;
}

export function Title({ children }: TitleProps) {
  return (
    <Head>
      <title>{(children ? `${children} | ` : "") + "Parallel"}</title>
    </Head>
  );
}
