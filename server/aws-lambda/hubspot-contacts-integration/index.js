/* eslint-disable @typescript-eslint/no-var-requires */

const {
  verifyRequestSignature,
  fetchPetition,
  buildHubspotProperties,
  createContact,
  updateContact,
} = require("./helpers");

exports.handler = async (request, context, callback) => {
  try {
    const verified = verifyRequestSignature(request);
    if (!verified) {
      console.log("request signature not verified");
      callback(null, request);
      return;
    }

    const body = JSON.parse(request.body);
    if (!body.petitionId) {
      console.log("petitionId not defined on request body");
      callback(null, request);
      return;
    }

    const petition = await fetchPetition(body.petitionId);

    if (petition.recipients?.[0]?.contact?.email === undefined) {
      console.log("no recipient defined on petition");
      callback(null, request);
      return;
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
    callback(null, request);
  } catch (e) {
    console.error(e);
    callback(e);
  }
};
