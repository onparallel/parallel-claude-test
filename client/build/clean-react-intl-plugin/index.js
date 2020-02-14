const BLACKLISTED = ["description", "defaultMessage"];
const JSX_ELEMENTS = ["FormattedMessage", "FormattedHTMLMessage"];
const METHODS = ["formatMessage", "formatHTMLMessage"];

module.exports = function cleanReactIntl({ types: t }) {
  if (process.env.NODE_ENV !== "production") {
    return {
      name: "clean-react-intl",
      visitor: {}
    };
  }
  return {
    name: "clean-react-intl",
    visitor: {
      JSXElement: {
        enter({ node }) {
          if (JSX_ELEMENTS.includes(node.openingElement.name.name)) {
            node.openingElement.attributes = node.openingElement.attributes.filter(
              attr => !BLACKLISTED.includes(attr.name.name)
            );
          }
        }
      },
      CallExpression: {
        enter({ node }) {
          if (
            node.callee.type === "MemberExpression" &&
            node.callee.object.type === "Identifier" &&
            node.callee.object.name === "intl" &&
            node.callee.property.type === "Identifier" &&
            METHODS.includes(node.callee.property.name) &&
            node.arguments.length &&
            node.arguments[0].type === "ObjectExpression"
          ) {
            node.arguments[0].properties = node.arguments[0].properties.filter(
              prop => {
                if (
                  prop.key.type === "Identifier" &&
                  BLACKLISTED.includes(prop.key.name)
                ) {
                  return false;
                }
                return true;
              }
            );
          }
        }
      }
    }
  };
};
