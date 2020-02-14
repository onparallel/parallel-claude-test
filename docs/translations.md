# Translations

The Parallel fully supports the following languages:

- English
- Spanish

In order to do this we use the [react-intl](https://github.com/formatjs/react-intl). Both the `client` and the `emails` workspaces have the same 2 commands

- `yarn extract-i18n-terms`: Extracts the translation terms.
- `yarn generate-i18n-files`: Generates the translations files.

## Message Syntax

The library uses the ICU Message syntax. Check [this](https://formatjs.io/guides/message-syntax/) for more information.

## Use in React

In order to use from React you can use the `<FormattedMessage/>` or you can inject the `intl` service with the `useIntl` hook. Check the examples at the end to see how use them.

If you have used any of these 2 methods to localize some text:

- Run the `extract-i18n-terms` and make sure to populate the new translations in the files.
- Run the `generate-i18n-files` and make sure the texts render fine in the different languages.

### Examples

Simple interpolations

```tsx
<FormattedMessage
  id="greeting"
  defaultMessage="Hello {name}"
  values={{ name }}
/>
```

```json
  "greeting": "Hola {name}"
```

Pluralization

```tsx
<FormattedMessage
  id="users-online"
  defaultMessage="There is {count, plural,
    =0 {no users}
    =1 {1 user}
    other {# users}
  } online"
  values={{ count }}
/>
```

```json
  "users-online": "{count, plural, =0 {No hay ningún usuario conectado} =1 {Hay 1 usuario conectado} other {Hay # usuarios conectados}}"
```

Embeeding React

```tsx
<FormattedMessage
  id="marketing-cta"
  defaultMessage="Click <a>here</a> to get a <b>free prize</b>!"
  values={{
    a: (...chunks: any[]) => <Link href="foo">{chunks}</Link>,
    b: (...chunks: any[]) => <b>{chunks}</b>
  }}
/>
```

```json
  "marketing-cta": "¡Haz click <a>aquí</a> para conseguir un <b>premio gratis</b>!"
```

Intl service

```tsx
import { useIntl } from "react-intl";

export function MyComponent() {
  const intl = useIntl();
  const links = [
    {
      link: "...",
      text: intl.formatMessage({
        id: "links.home",
        defaultMessage: "Home"
      })
    },
    ...{
      link: "...",
      text: intl.formatMessage({
        id: "links.account",
        defaultMessage: "Account"
      })
    }
  ];
  return (
    <>
      {links.map(({ link, text }, i) => (
        <Link href={link}>{text}</Link>
      ))}
    </>
  );
}
```

```json
"links.home": "Inicio",
...
"links.account": "Cuenta",
```
