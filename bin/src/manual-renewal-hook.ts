/**
 * This script is run by certbot when trying to renew the certificate for *.onparallel.com
 * and onparallel.com.
 * Certbot calls the script with a given challenge that needs to go as a TXT record on
 * _acme-challenge.onparallel.com
 *
 * The following lines have been added to the renewal conf for the domain at
 * /nfs/parallel/certs/renewal/onparallel.com.conf
 *
 * ```
 * manual_auth_hook = node /home/ec2-user/parallel/bin/dist/manual-renewal-hook.js
 * manual_cleanup_hook = node /home/ec2-user/parallel/bin/dist/manual-renewal-hook.js
 * ```
 */

import {
  ChangeResourceRecordSetsCommand,
  GetChangeCommand,
  ListResourceRecordSetsCommand,
  Route53Client,
} from "@aws-sdk/client-route-53";
import { fromIni } from "@aws-sdk/credential-providers"; // ES6 import
import { isDefined } from "remeda";
import { run } from "./utils/run";
import { waitFor } from "./utils/wait";

const ZONE_MAP: Record<string, string> = {
  "onparallel.com": "Z06439012HTRIULUNI0UO",
};

const route53 = new Route53Client({
  credentials: fromIni({ profile: "default" }),
});

async function main() {
  const {
    CERTBOT_AUTH_OUTPUT: output,
    CERTBOT_DOMAIN: domain,
    CERTBOT_VALIDATION: challenge,
  } = process.env;
  const isCleanup = isDefined(output);
  if (isCleanup) {
    await removeRecord(domain!, challenge!);
  } else {
    await addRecord(domain!, challenge!);
  }
}

async function addRecord(domain: string, challenge: string) {
  const hostedZoneId = ZONE_MAP[domain];
  const recordName = `_acme-challenge.${domain}`;
  const response = await route53.send(
    new ListResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      StartRecordName: recordName,
      StartRecordType: "TXT",
    })
  );
  console.log(`Adding TXT with value ${challenge} record to ${recordName}`);
  const response2 = await route53.send(
    new ChangeResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Comment: "Add records for certbot domain validation",
        Changes: [
          {
            Action: "UPSERT",
            ResourceRecordSet: {
              Name: `_acme-challenge.${domain}`,
              Type: "TXT",
              TTL: 300,
              ResourceRecords: [
                ...(response.ResourceRecordSets?.[0]?.ResourceRecords ?? []),
                { Value: `"${challenge}"` },
              ],
            },
          },
        ],
      },
    })
  );
  await waitForChange(response2.ChangeInfo!.Id!);
}

async function removeRecord(domain: string, challenge: string) {
  const hostedZoneId = ZONE_MAP[domain];
  const recordName = `_acme-challenge.${domain}`;
  const response = await route53.send(
    new ListResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      StartRecordName: recordName,
      StartRecordType: "TXT",
    })
  );
  if (isDefined(response.ResourceRecordSets)) {
    if (
      response.ResourceRecordSets[0]?.ResourceRecords?.length === 1 &&
      response.ResourceRecordSets[0].ResourceRecords[0].Value === `"${challenge}"`
    ) {
      console.log(`Removing TXT record from ${recordName}`);
      const response2 = await route53.send(
        new ChangeResourceRecordSetsCommand({
          HostedZoneId: hostedZoneId,
          ChangeBatch: {
            Comment: "Remove records from certbot validation",
            Changes: [
              {
                Action: "DELETE",
                ResourceRecordSet: {
                  TTL: 300,
                  Name: recordName,
                  Type: "TXT",
                  ResourceRecords: [{ Value: `"${challenge}"` }],
                },
              },
            ],
          },
        })
      );
      await waitForChange(response2.ChangeInfo!.Id!);
    } else {
      console.log(`Removing ${challenge} from TXT record on ${recordName}`);
      const response2 = await route53.send(
        new ChangeResourceRecordSetsCommand({
          HostedZoneId: hostedZoneId,
          ChangeBatch: {
            Comment: "Remove records from certbot validation",
            Changes: [
              {
                Action: "UPSERT",
                ResourceRecordSet: {
                  Name: recordName,
                  Type: "TXT",
                  TTL: 300,
                  ResourceRecords: [
                    ...(response.ResourceRecordSets?.[0]?.ResourceRecords ?? []).filter(
                      (r) => r.Value !== `"${challenge}"`
                    ),
                  ],
                },
              },
            ],
          },
        })
      );
      await waitForChange(response2.ChangeInfo!.Id!);
    }
  }
}

async function waitForChange(changeId: string) {
  await waitFor(async () => {
    const response = await route53.send(new GetChangeCommand({ Id: changeId }));
    return response.ChangeInfo?.Status === "INSYNC";
  }, 3000);
}

run(main);
