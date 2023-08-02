/* eslint-disable @typescript-eslint/no-var-requires */

const {
  verifyRequestSignature,
  fetchPetition,
  buildHubspotProperties,
  createContact,
  updateContact,
} = require("./helpers");

function response(statusCode, body) {
  return {
    statusCode,
    isBase64Encoded: false,
    headers: {},
    body: JSON.stringify(body),
  };
}

exports.handler = async (request) => {
  try {
    const verified = verifyRequestSignature(request);
    if (!verified) {
      console.log("request signature not verified");
      return response(200, { error: "request signature not verified" });
    }

    const body = JSON.parse(request.body);
    if (!body.petitionId) {
      console.log("petitionId not defined on request body");
      return response(200, { error: "petitionId not defined on request body" });
    }

    const petition = await fetchPetition(body.petitionId);

    if (petition.recipients?.[0]?.contact?.email === undefined) {
      console.log("no recipient defined on petition");
      return response(200, { error: "no recipient defined on petition" });
    }

    const contactEmail = petition.recipients[0].contact.email;

    const { contact, properties } = await buildHubspotProperties(
      petition.id,
      contactEmail,
      petition.fields,
      petition.replies,
    );

    // need to have more than 1 property in order to trigger a hubspot sync ("email" prop will always be set)
    if (Object.entries(properties).length > 1) {
      if (!contact) {
        await createContact(properties);
      } else {
        await updateContact(contact.id, properties);
      }
    }
    return response(200, { success: true });
  } catch (e) {
    console.error(e);
    return response(200, { success: false });
  }
};
