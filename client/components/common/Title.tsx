import Head from "next/head";

interface TitleProps {
  children?: string;
}

export function Title({ children }: TitleProps) {
  return (
    <Head>
      <title>{"Parallel" + (children ? ` - ${children}` : "")}</title>
    </Head>
  );
}
