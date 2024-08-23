import { MjmlColumn, MjmlSection, MjmlTable, MjmlText } from "@faire/mjml-react";
import { outdent } from "outdent";
import { FormattedMessage, IntlShape, useIntl } from "react-intl";
import { isNonNullish, isNullish } from "remeda";
import { Email } from "../../buildEmail";
import { GreetingUser } from "../../components/Greeting";
import { Layout, LayoutProps } from "../../components/Layout";
import { greetingUser } from "../../components/texts";

export type BackgroundCheckMonitoringChangesProps = {
  userName: string | null;
  properties: {
    content: {
      query?: { name: string; date: string };
      entity?: { name: string; type: string };
    };
    profileId: string;
    profileTypeFieldId: string;
  }[];
} & LayoutProps;

const email: Email<BackgroundCheckMonitoringChangesProps> = {
  from({}, intl) {
    return intl.formatMessage({
      id: "from.parallel-team",
      defaultMessage: "Parallel",
    });
  },
  subject(_, intl: IntlShape) {
    return intl.formatMessage({
      id: "background-check-monitoring-changes-email.subject",
      defaultMessage: "There have been changes to your saved entities/searches",
    });
  },
  text({ properties, userName }: BackgroundCheckMonitoringChangesProps, intl: IntlShape) {
    const propertyList = properties
      .map((value) => {
        const title =
          isNonNullish(value.content.query) && isNullish(value.content.entity)
            ? [value.content.query.name, value.content.query.date].filter(isNonNullish).join(" | ")
            : isNonNullish(value.content.entity)
              ? value.content.entity.name
              : "";

        const subtitle =
          value.content.entity?.type === "Company"
            ? intl.formatMessage({
                id: "background-check-monitoring-changes-email.company",
                defaultMessage: "Company",
              })
            : value.content.entity?.type === "Person"
              ? intl.formatMessage({
                  id: "background-check-monitoring-changes-email.person",
                  defaultMessage: "Person",
                })
              : intl.formatMessage({
                  id: "background-check-monitoring-changes-email.search",
                  defaultMessage: "Search",
                });
        return [title, subtitle].join("\n");
      })
      .join("\n\n");

    return outdent`
    ${greetingUser({ name: userName }, intl)}

    ${intl.formatMessage({
      id: "background-check-monitoring-changes-email.text",
      defaultMessage: "We have detected changes or new results in your saved entities/searches.",
    })}

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
    userName,
  }: BackgroundCheckMonitoringChangesProps) {
    return (
      <Layout
        assetsUrl={assetsUrl}
        parallelUrl={parallelUrl}
        logoUrl={logoUrl}
        logoAlt={logoAlt}
        theme={theme}
        logoProps={{
          width: "340px",
          align: "left",
        }}
      >
        <MjmlSection padding="10px 0 24px 0">
          <MjmlColumn>
            <GreetingUser name={userName} />
            <MjmlText>
              <FormattedMessage
                id="background-check-monitoring-changes-email.text"
                defaultMessage="We have detected changes or new results in your saved entities/searches."
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
        <MjmlTable>
          {properties.map((value, i) => (
            <MonitoredValueRow
              key={i}
              value={value}
              assetsUrl={assetsUrl}
              parallelUrl={parallelUrl}
            />
          ))}
        </MjmlTable>
        <MjmlSection paddingBottom={0}>
          <MjmlColumn>
            <MjmlText align="center" fontSize="12px" color="#4A5568">
              <FormattedMessage
                id="subscription-email.footer-message-1"
                defaultMessage="This email includes notifications to which you are subscribed."
              />
            </MjmlText>
            <MjmlText align="center" fontSize="12px" color="#4A5568">
              <FormattedMessage
                id="subscription-email.footer-message-2"
                defaultMessage="🔔 If this message has ended up in your promotions or spam folder, click on it and drag it to your main inbox to make sure you don't miss the next ones."
              />
            </MjmlText>
          </MjmlColumn>
        </MjmlSection>
      </Layout>
    );
  },
};

interface MonitoredValueRowProps {
  value: { content: any; profileId: string; profileTypeFieldId: string };
  assetsUrl: string;
  parallelUrl: string;
}

function MonitoredValueRow({ value, assetsUrl, parallelUrl }: MonitoredValueRowProps) {
  const intl = useIntl();

  const orgIconSrc = assetsUrl + "/static/emails/icons/organization.png";
  const userIconSrc = assetsUrl + "/static/emails/icons/user.png";
  const searchIconSrc = assetsUrl + "/static/emails/icons/search.png";

  const chevronSrc = assetsUrl + "/static/emails/icons/chevron-right.png";
  const propertyHref = `${parallelUrl}/${intl.locale}/app/profiles/${value.profileId}?profileTypeField=${value.profileTypeFieldId}`;

  const title =
    isNonNullish(value.content.query) && isNullish(value.content.entity)
      ? [value.content.query.name, value.content.query.date].filter(isNonNullish).join(" | ")
      : isNonNullish(value.content.entity)
        ? value.content.entity.name
        : "";

  const isCompany = value.content.entity?.type === "Company";
  const isPerson = value.content.entity?.type === "Person";

  const subtitle =
    value.content.entity?.type === "Company"
      ? intl.formatMessage({
          id: "background-check-monitoring-changes-email.company",
          defaultMessage: "Company",
        })
      : value.content.entity?.type === "Person"
        ? intl.formatMessage({
            id: "background-check-monitoring-changes-email.person",
            defaultMessage: "Person",
          })
        : intl.formatMessage({
            id: "background-check-monitoring-changes-email.search",
            defaultMessage: "Search",
          });

  const iconSrc = isCompany ? orgIconSrc : isPerson ? userIconSrc : searchIconSrc;
  return (
    <tr
      style={{
        fontSize: "12px",
        color: "#1A202C",
        borderBottom: "1px solid #CBD5E0",
      }}
    >
      <td style={{ width: "42px" }}>
        <img src={iconSrc} style={{ width: "16px", height: "16px" }} />
      </td>
      <td style={{ textAlign: "left", paddingTop: "10px", paddingBottom: "10px" }}>
        <p style={{ padding: "0px", margin: "0px", marginBottom: "2px", fontWeight: 600 }}>
          {title}
        </p>
        <p
          style={{
            padding: "0px",
            margin: "0px",
            fontWeight: 400,
          }}
        >
          {subtitle}
        </p>
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
