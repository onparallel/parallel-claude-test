import { PublicLayout } from "@parallel/components/public/layout/PublicLayout";
import { useIntl } from "react-intl";

export default function Home() {
  const intl = useIntl();

  return (
    <PublicLayout
      title={intl.formatMessage({
        id: "public.home.title",
        defaultMessage: "Automate your workflows with clients",
      })}
    ></PublicLayout>
  );
}
