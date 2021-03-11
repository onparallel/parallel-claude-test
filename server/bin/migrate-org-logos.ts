import "./../src/init";
import { Knex } from "knex";
import fetch from "node-fetch";
import pMap from "p-map";
import { Readable } from "stream";
import { createContainer } from "../src/container";
import { KNEX } from "../src/db/knex";
import { FileRepository } from "../src/db/repositories/FileRepository";
import { OrganizationRepository } from "../src/db/repositories/OrganizationRepository";
import { UserRepository } from "../src/db/repositories/UserRepository";
import { Organization } from "../src/db/__types";
import { AWS_SERVICE, IAws } from "../src/services/aws";
import { random } from "../src/util/token";

const container = createContainer();
const aws = container.get<IAws>(AWS_SERVICE);
const orgs = container.get<OrganizationRepository>(OrganizationRepository);
const knex = container.get<Knex>(KNEX);
const filesRepo = container.get<FileRepository>(FileRepository);
const users = container.get<UserRepository>(UserRepository);
const identifiers = [
  "adplegal",
  "altamar",
  "andersen",
  "atadvocats",
  "brickbro",
  "cecamagan",
  "cscorporateadvisors",
  "cuatrecasas",
  "doctoralia",
  "encomenda",
  "iomed",
  "kantox",
  "l4law",
  "leica",
  "meetmaps",
  "osborneclarke",
  "payfit",
  "prontopiso",
  "santalucia",
  "spin",
  "targetglobal",
  "themillandpartners",
  "treinta",
];

(async () => {
  const organizations = await knex
    .from<Organization>("organization")
    .whereIn("identifier", identifiers)
    .whereNull("deleted_at")
    .select("*");
  const user = await users.loadUserByEmail("mariano@onparallel.com");
  if (!user) {
    return;
  }
  await pMap(
    organizations,
    async (org) => {
      try {
        // 2. Download logo from static URL
        console.log(org.identifier, "downloading logo...");
        const data = await fetch(
          `https://static.onparallel.com/static/logos/${org.identifier}.png`
        );

        // 3. Upload logo to public S3 bucket
        console.log(org.identifier, "uploading logo to S3...");
        const filename = random(16);
        const path = `uploads/${filename}`;
        const res = await aws.publicFiles.uploadFile(
          path,
          "image/png",
          Readable.from(data.body)
        );

        // 4. Update database
        console.log(org.identifier, "updating database...");
        const file = await filesRepo.createPublicFile(
          {
            filename,
            path,
            content_type: "image/png",
            size: res.ContentLength!.toString(),
          },
          `User:${user.id}`
        );

        await orgs.updateOrganization(
          org.id,
          {
            public_file_logo_id: file.id,
          },
          user
        );

        console.log(org.identifier, "migrated.");
      } catch (e) {
        console.error(`Error processing ${org.identifier}`);
        console.error(e);
      }
      return Promise.resolve();
    },
    { concurrency: 1 }
  );

  process.exit(0);
})();
