/* eslint-disable @typescript-eslint/no-var-requires */

const https = require("https");
const http = require("http");
const crypto = require("crypto");

const HUBSPOT_ALIAS_REGEX = /^HS(?:IE)?_(.*)$/;

async function httpsRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const module = url.startsWith("https") ? https : http;
    const req = module.request(url, options, (res) => {
      if (res.statusCode < 200 || res.statusCode > 299) {
        return reject(new Error(`HTTP status code ${res.statusCode}`));
      }

      const body = [];
      res.on("data", (chunk) => body.push(chunk));
      res.on("end", () => {
        resolve(JSON.parse(Buffer.concat(body).toString()));
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request time out"));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function verifyRequestSignature(request) {
  const signature1 = request.headers["x-parallel-signature-1"];
  const signature2 = request.headers["x-parallel-signature-2"];

  if (!signature1 && !signature2) {
    return false;
  }

  return [signature1, signature2].some(
    (signature) =>
      signature &&
      crypto.verify(
        null,
        request.body,
        {
          key: Buffer.from(process.env.PUBLIC_SIGNATURE_KEY, "base64"),
          format: "der",
          type: "spki",
        },
        Buffer.from(signature, "base64"),
      ),
  );
}

/**
 *
 * @param {string} petitionId
 */
async function fetchPetition(petitionId) {
  console.debug("fetchPetition");
  const petition = await httpsRequest(
    `${process.env.PARALLEL_BASE_URL}/api/v1/petitions/${petitionId}?${new URLSearchParams({
      include: "recipients,replies,fields",
    })}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.PARALLEL_API_KEY}`,
      },
    },
  );

  console.debug(petition);
  return petition;
}

/**
 *
 * @param {string} email
 * @param {string[]} properties
 */
async function fetchHubspotContact(email, properties) {
  console.debug("fetchHubspotContact", email, properties.join(", "));
  const response = await httpsRequest(
    "https://api.hubapi.com/crm/v3/objects/contacts/search",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
      },
    },
    {
      filterGroups: [
        {
          filters: [
            {
              value: email,
              propertyName: "email",
              operator: "EQ",
            },
          ],
        },
      ],
      properties,
      limit: 1,
    },
  );

  console.debug(JSON.stringify(response, null, 2));
  if (response.total === 0) {
    return null;
  }
  return response.results[0];
}

/**
 *
 * @param {any} properties
 */
async function createContact(properties) {
  console.debug("createContact", properties);
  return await httpsRequest(
    "https://api.hubapi.com/crm/v3/objects/contacts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
      },
    },
    { properties },
  );
}

/**
 *
 * @param {string} id
 * @param {any} properties
 * @returns
 */
async function updateContact(id, properties) {
  console.debug("updateContact", id, properties);
  return await httpsRequest(
    `https://api.hubapi.com/crm/v3/objects/contacts/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
      },
    },
    { properties },
  );
}

/**
 *
 * @param {string} petitionId
 * @param {any} contact
 * @param {string} email
 * @param {any[]} fields
 * @param {any} replies
 */
async function buildHubspotProperties(petitionId, email, fields, replies) {
  console.debug("buildHubspotProperties");
  console.debug(petitionId, email, fields, replies);
  const hsContactProps = await fetchHubspotContactProperties();

  const props = {};
  const hubspotReplies = Object.entries(replies)
    // only keep replies that are mapped to a hubspot property
    .filter(
      ([alias]) =>
        alias.match(HUBSPOT_ALIAS_REGEX) &&
        hsContactProps.some((p) => p.name === alias.replace(HUBSPOT_ALIAS_REGEX, "$1")),
    );

  console.debug("hubspotReplies", hubspotReplies);

  const hsContact = await fetchHubspotContact(
    email,
    hubspotReplies.map(([alias]) => alias.replace(HUBSPOT_ALIAS_REGEX, "$1")),
  );

  for (const [alias, value] of hubspotReplies) {
    const hsAlias = alias.replace(HUBSPOT_ALIAS_REGEX, "$1");
    if (alias.startsWith("HSIE_") && hsContact && hsContact.properties[hsAlias]) {
      // if the alias starts with HSIE_ and the contact already has a value for the property, skip it
      continue;
    }

    const hsProp = hsContactProps.find((p) => p.name === hsAlias);
    const fieldType = fields.find((field) => field.alias === alias).type;
    const values = [];

    console.debug(value, fieldType);
    if (Array.isArray(value)) {
      if (["SELECT", "CHECKBOX"].includes(fieldType)) {
        values.push(...value);
      }
    } else if (typeof value === "object") {
      if (fieldType === "DATE_TIME") {
        // if passing a datetime field to a DATE hs property, remove the "hours" part
        values.push(hsProp.type === "date" ? value.value.split("T")[0] : value.value);
      } else if (["FILE_UPLOAD", "ES_TAX_DOCUMENTS", "DOW_JONES_KYC"].includes(fieldType)) {
        values.push(
          `${
            process.env.PARALLEL_BASE_URL
          }/app/petitions/${petitionId}/replies?${new URLSearchParams({
            field: value.fieldId,
          })}`,
        );
      }
    } else if (typeof value === "string") {
      values.push(value);
    }

    if (values.length > 0 && isValueCompatible(values, hsProp)) {
      props[hsAlias] = values.join(";");
    }
  }

  return {
    contact: hsContact,
    properties: {
      ...props,
      email, // email is hs identifier, don't overwrite this key
    },
  };
}

/**
 *
 * @param {string[]} values
 * @param {{ name: string, type: string, options: { value: string }[]} hsProp
 * @returns {boolean}
 */
function isValueCompatible(values, hsProp) {
  console.debug("isValueCompatible", values, hsProp);
  // if the property is a select or checkbox, check that all values are valid options
  if (hsProp.options.length > 0) {
    if (!values.every((v) => hsProp.options.some((o) => o.value === v))) {
      return false;
    }
  }

  // if the property is a date, check that all values are valid dates
  if (hsProp.type === "datetime") {
    return values.every((v) => isValidDatetime(v) || isValidDate(v));
  } else if (hsProp.type === "date") {
    return values.every(isValidDate);
  } else if (hsProp.type === "file") {
    return values.every(isValidUrl);
  }

  return true;
}

async function fetchHubspotContactProperties() {
  console.debug("fetchHubspotContactProperties");
  const response = await httpsRequest("https://api.hubapi.com/crm/v3/properties/contacts", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
    },
  });

  return response.results;
}

/**
 *
 * @param {string} date
 * @returns {boolean}
 */
function isValidDate(date) {
  return /^\d{4,6}-\d{2}-\d{2}$/.test(date) && !isNaN(new Date(date).getTime());
}

function isValidDatetime(datetime) {
  return (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(datetime) &&
    !isNaN(new Date(datetime).getTime())
  );
}

function isValidUrl(value) {
  try {
    new URL(value);
    return true;
  } catch {}
  return false;
}

module.exports = {
  verifyRequestSignature,
  fetchPetition,
  buildHubspotProperties,
  createContact,
  updateContact,
};
