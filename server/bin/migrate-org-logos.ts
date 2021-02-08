import "./../src/init";
import { createContainer } from "../src/container";
import { AWS_SERVICE, IAws } from "../src/services/aws";
import fetch from "node-fetch";
import { Readable } from "stream";
import { OrganizationRepository } from "../src/db/repositories/OrganizationRepository";
import { UserRepository } from "../src/db/repositories/UserRepository";
import pMap from "p-map";
import { random } from "../src/util/token";
import { FileRepository } from "../src/db/repositories/FileRepository";

const container = createContainer();
const aws = container.get<IAws>(AWS_SERVICE);
const orgs = container.get<OrganizationRepository>(OrganizationRepository);
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
  const organizations = (await orgs.loadOrganizations({ limit: 100 })).items;
  const user = await users.loadUserByEmail("mariano@parallel.so");
  if (!user) {
    return;
  }
  await pMap(
    identifiers,
    async (identifier) => {
      try {
        //1. get org data
        const org = organizations.find((o) => o.identifier === identifier);
        if (!org) {
          console.error(`${identifier} not found`);
          return Promise.resolve();
        }

        // 2. Download logo from static URL
        console.log(identifier, "downloading logo...");
        const data = await fetch(
          `https://static.onparallel.com/static/logos/${identifier}.png`
        );

        // 3. Upload logo to public S3 bucket
        console.log(identifier, "uploading logo to S3...");
        const filename = random(16);
        const path = `uploads/${filename}`;
        await aws.publicFiles.uploadFile(
          path,
          "image/png",
          Readable.from(data.body)
        );

        // 4. Update database
        console.log(identifier, "updating database...");
        const file = await filesRepo.createPublicFile(
          {
            filename,
            path,
            content_type: "image/png",
            size: data.size.toString(),
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

        console.log(identifier, "migrated.");
      } catch (e) {
        console.error(`Error processing ${identifier}`);
        console.error(e);
      }
      return Promise.resolve();
    },
    { concurrency: 5 }
  );

  process.exit(0);
})();
