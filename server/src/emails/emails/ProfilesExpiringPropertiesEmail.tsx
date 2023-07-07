import { MjmlColumn, MjmlSection, MjmlTable, MjmlText } from "@faire/mjml-react";
import { outdent } from "outdent";
import { FormattedDate, FormattedMessage, IntlShape, useIntl } from "react-intl";
import { groupBy } from "remeda";
import { UserLocale } from "../../db/__types";
import { FORMATS } from "../../util/dates";
import { ExpiringProperty } from "../../workers/emails/profiles-expiring-properties";
import { Email } from "../buildEmail";
import { Button } from "../components/Button";
import { Layout, LayoutProps } from "../components/Layout";

export type ProfilesExpiringPropertiesEmailProps = {
  organizationName: string;
  properties: {
    items: ExpiringProperty[];
    totalCount: number;
  };
} & LayoutProps;

const email: Email<ProfilesExpiringPropertiesEmailProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject({ organizationName }, intl: IntlShape) {
    return intl.formatMessage(
      {
        id: "profiles-expiring-properties.subject",
        defaultMessage: "Expiration alerts in {orgName}",
      },
      { orgName: organizationName },
    );
  },
  text({ properties }: ProfilesExpiringPropertiesEmailProps, intl: IntlShape) {
    const propertyList = Object.entries(groupBy(properties.items, (p) => p.profileId))
      .map(([_, properties]) =>
        [
          properties[0].profileName,
          ...properties.map(
            (p) =>
              `- ${
                p.profileTypeFieldName[intl.locale as UserLocale] ??
                intl.formatMessage({
                  id: "profiles-expiring-properties.untitled-property",
                  defaultMessage: "Untitled property",
                })
              } (${intl.formatDate(p.expiryDate, {
                ...FORMATS.LL,
                timeZone: "UTC",
              })})`,
          ),
        ].join("\n"),
      )
      .join("\n\n");

    return outdent`
    ${intl.formatMessage({
      id: "profiles-expiring-properties.title",
      defaultMessage: "Your pending alerts",
    })}
    ${intl.formatDate(new Date(), { dateStyle: "full" })}

    ${propertyList}

    `;
  },
  html({
    properties,
    parallelUrl,
    assetsUrl,
    logoUrl,
    logoAlt,
    theme,
  }: ProfilesExpiringPropertiesEmailProps) {
    const intl = useIntl();
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        theme={theme}
        omitGdprDisclaimer
        removeLinks
      >
        <MjmlSection padding="10px 0 24px 0">
          <MjmlColumn>
            <MjmlText fontSize="18px" fontWeight="bold" padding={0} paddingBottom={5}>
              <FormattedMessage
                id="profiles-expiring-properties.title"
                defaultMessage="Your pending alerts"
              />
            </MjmlText>
            <MjmlText color="#4A5568" padding={0}>
              <FormattedDate value={new Date()} dateStyle="full" />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlTable>
          {properties.items.map((property, i) => (
            <ExpiringPropertyRow
              key={i}
              property={property}
              assetsUrl={assetsUrl}
              parallelUrl={parallelUrl}
            />
          ))}
        </MjmlTable>

        <MjmlSection padding={0}>
          <MjmlColumn>
            <MjmlText align="right" fontSize="12px" color="#1A202C" padding="12px 8px">
              <FormattedMessage
                id="profiles-expiring-properties.showing-active-alerts-count"
                defaultMessage="Showing {count}/{totalCount} of active alarms"
                values={{
                  count: properties.items.length,
                  totalCount: properties.totalCount,
                }}
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlSection paddingBottom={0}>
          <MjmlColumn>
            <Button href={`${parallelUrl}/${intl.locale}/app/alerts`}>
              <FormattedMessage
                id="profiles-expiring-properties.view-alerts-button"
                defaultMessage="View alerts"
              />
            </Button>
            <MjmlText align="center" fontSize="12px" color="#4A5568">
              <FormattedMessage
                id="profiles-expiring-properties.footer-message-1"
                defaultMessage="This email includes notifications to which you are subscribed."
              />
            </MjmlText>
            <MjmlText align="center" fontSize="12px" color="#4A5568">
              <FormattedMessage
                id="profiles-expiring-properties.footer-message-2"
                defaultMessage="🔔 If this message has ended up in your promotions or spam folder, click on it and drag it to your main inbox to make sure you don't miss the next ones."
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

export interface ExpiringPropertyRowProps {
  property: ExpiringProperty;
  assetsUrl: string;
  parallelUrl: string;
}

export function ExpiringPropertyRow({
  property,
  assetsUrl,
  parallelUrl,
}: ExpiringPropertyRowProps) {
  const intl = useIntl();
  const alarmSrc = assetsUrl + "/static/emails/icons/time-alarm.png";
  const chevronSrc = assetsUrl + "/static/emails/icons/chevron-right.png";
  const propertyHref = `${parallelUrl}/${intl.locale}/app/profiles/${property.profileId}?field=${property.profileTypeFieldId}`;
  const expiryDate = intl.formatDate(new Date(property.expiryDate), {
    dateStyle: "long",
  });

  const propertyName = property.profileTypeFieldName[intl.locale as UserLocale];
  return (
    <tr
      style={{
        fontSize: "12px",
        color: "#1A202C",
        borderBottom: "1px solid #CBD5E0",
      }}
    >
      <td style={{ width: "42px" }}>
        <img src={alarmSrc} style={{ width: "16px", height: "16px" }} />
      </td>
      <td style={{ textAlign: "left", paddingTop: "10px", paddingBottom: "10px" }}>
        <p style={{ padding: "0px", margin: "0px", marginBottom: "3px", fontWeight: 600 }}>
          {property.profileName}
        </p>
        <p
          style={{
            padding: "0px",
            margin: "0px",
            fontWeight: 400,
            fontStyle: propertyName ? "normal" : "italic",
          }}
        >
          {propertyName ?? (
            <FormattedMessage
              id="profiles-expiring-properties.untitled-property"
              defaultMessage="Untitled property"
            />
          )}
        </p>
      </td>
      <td
        style={{
          textAlign: "right",
          color: property.isExpired ? "#E53E3E" : "#1A202C",
          verticalAlign: "middle",
        }}
      >
        <p style={{ margin: "-3px 0px 0px 0px" }}>{expiryDate}</p>
      </td>
      <td style={{ width: "42px", verticalAlign: "middle" }}>
        <a href={propertyHref}>
          <img src={chevronSrc} style={{ width: "24px", height: "24px" }} />
        </a>
      </td>
    </tr>
  );
}

export default email;
