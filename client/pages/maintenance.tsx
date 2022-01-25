import { ErrorPage } from "@parallel/components/public/ErrorPage";
import { FormattedMessage } from "react-intl";

function Maintenance() {
  return (
    <ErrorPage
      header={
        <FormattedMessage
          id="error.maintenance.header"
          defaultMessage="Parallel is under maintenance"
        />
      }
      imageUrl={`${process.env.NEXT_PUBLIC_ASSETS_URL}/static/images/undraw_maintenance.svg`}
    >
      <FormattedMessage
        id="error.maintenance.description"
        defaultMessage="Parallel is under scheduled maintenance and will resume normal activity as soon as possible."
      />
    </ErrorPage>
  );
}

export default Maintenance;
