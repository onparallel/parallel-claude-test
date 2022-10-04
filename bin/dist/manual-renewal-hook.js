"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const client_route_53_1 = require("@aws-sdk/client-route-53");
const credential_providers_1 = require("@aws-sdk/credential-providers"); // ES6 import
const remeda_1 = require("remeda");
const run_1 = require("./utils/run");
const wait_1 = require("./utils/wait");
const ZONE_MAP = {
    "onparallel.com": "Z06439012HTRIULUNI0UO",
};
const route53 = new client_route_53_1.Route53Client({
    credentials: (0, credential_providers_1.fromIni)({ profile: "default" }),
});
async function main() {
    const { CERTBOT_AUTH_OUTPUT: output, CERTBOT_DOMAIN: domain, CERTBOT_VALIDATION: challenge, } = process.env;
    const isCleanup = (0, remeda_1.isDefined)(output);
    if (isCleanup) {
        await removeRecord(domain, challenge);
    }
    else {
        await addRecord(domain, challenge);
    }
}
async function addRecord(domain, challenge) {
    var _a, _b, _c;
    const hostedZoneId = ZONE_MAP[domain];
    const recordName = `_acme-challenge.${domain}`;
    const response = await route53.send(new client_route_53_1.ListResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        StartRecordName: recordName,
        StartRecordType: "TXT",
    }));
    console.log(`Adding TXT with value ${challenge} record to ${recordName}`);
    const response2 = await route53.send(new client_route_53_1.ChangeResourceRecordSetsCommand({
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
                            ...((_c = (_b = (_a = response.ResourceRecordSets) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.ResourceRecords) !== null && _c !== void 0 ? _c : []),
                            { Value: `"${challenge}"` },
                        ],
                    },
                },
            ],
        },
    }));
    await waitForChange(response2.ChangeInfo.Id);
}
async function removeRecord(domain, challenge) {
    var _a, _b, _c, _d, _e;
    const hostedZoneId = ZONE_MAP[domain];
    const recordName = `_acme-challenge.${domain}`;
    const response = await route53.send(new client_route_53_1.ListResourceRecordSetsCommand({
        HostedZoneId: hostedZoneId,
        StartRecordName: recordName,
        StartRecordType: "TXT",
    }));
    if ((0, remeda_1.isDefined)(response.ResourceRecordSets)) {
        if (((_b = (_a = response.ResourceRecordSets[0]) === null || _a === void 0 ? void 0 : _a.ResourceRecords) === null || _b === void 0 ? void 0 : _b.length) === 1 &&
            response.ResourceRecordSets[0].ResourceRecords[0].Value === `"${challenge}"`) {
            console.log(`Removing TXT record from ${recordName}`);
            const response2 = await route53.send(new client_route_53_1.ChangeResourceRecordSetsCommand({
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
            }));
            await waitForChange(response2.ChangeInfo.Id);
        }
        else {
            console.log(`Removing ${challenge} from TXT record on ${recordName}`);
            const response2 = await route53.send(new client_route_53_1.ChangeResourceRecordSetsCommand({
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
                                    ...((_e = (_d = (_c = response.ResourceRecordSets) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.ResourceRecords) !== null && _e !== void 0 ? _e : []).filter((r) => r.Value !== `"${challenge}"`),
                                ],
                            },
                        },
                    ],
                },
            }));
            await waitForChange(response2.ChangeInfo.Id);
        }
    }
}
async function waitForChange(changeId) {
    await (0, wait_1.waitFor)(async () => {
        var _a;
        const response = await route53.send(new client_route_53_1.GetChangeCommand({ Id: changeId }));
        return ((_a = response.ChangeInfo) === null || _a === void 0 ? void 0 : _a.Status) === "INSYNC";
    }, 3000);
}
(0, run_1.run)(main);
