import { MjmlText } from "mjml-react";
import { FormattedMessage } from "react-intl";

export function GdprDisclaimer() {
  return (
    <MjmlText align="justify" fontSize="12px" lineHeight="18px" color="#718096">
      <FormattedMessage
        id="gdpr.processor-disclaimer"
        defaultMessage="Under the provisions of Regulation (EU) 2016/679 of the European Parliament and of the Council of April 27, 2016 regarding the protection of natural persons with regard to the processing of personal data and on the free movement of such data, you are informed that Parallel Solutions, SL has sent you this email in fulfillment of the order received for the provision of services regarding the management of information workflows. You can contact the data controller to exercise your rights."
      />
    </MjmlText>
  );
}
