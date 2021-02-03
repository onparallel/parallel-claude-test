import "../src/init";
import { createContainer } from "../src/container";
import { AWS_SERVICE, IAws } from "../src/services/aws";
import pMap from "p-map";
import { Config, CONFIG } from "../src/config";
import { KNEX } from "../src/db/knex";
import Knex from "knex";

const container = createContainer();
const knex = container.get<Knex>(KNEX);
const aws = container.get<IAws>(AWS_SERVICE);
const config = container.get<Config>(CONFIG);
(async () => {
  const users: { email: string }[] = await knex
    .select("email")
    .from("user")
    .where({
      deleted_at: null,
    });

  await pMap(
    users,
    async ({ email }) => {
      try {
        console.log(`updating ${email}...`);
        await aws.cognitoIdP
          .adminUpdateUserAttributes({
            Username: email,
            UserPoolId: config.cognito.defaultPoolId,
            UserAttributes: [
              {
                Name: "email_verified",
                Value: "True",
              },
            ],
          })
          .promise();
      } catch (e) {
        console.error(`error updating ${email}:`);
        console.error(e);
      }
    },
    { concurrency: 5 }
  );
  process.exit(0);
})();
