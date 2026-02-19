# Client Certificate (mTLS)

How to generate a PFX client certificate from an AWS ACM export, for use in integrations that require mutual TLS (e.g., SAP S/4HANA OData API). The generated PFX and its passphrase are stored in AWS Secrets Manager under `ops/certificate`.

## Prerequisites

- An issued certificate in AWS ACM
- `openssl` installed locally

## Exported Files from ACM

When you export a certificate from ACM, you get three files:

| File                    | Description        |
| ----------------------- | ------------------ |
| `certificate.txt`       | Public certificate |
| `private_key.txt`       | Private key        |
| `certificate_chain.txt` | CA chain           |

## Generate the PFX

Combine the three files into a single `.pfx` bundle:

```bash
openssl pkcs12 -export \
  -out certificate.pfx \
  -inkey private_key.txt \
  -in certificate.txt \
  -certfile certificate_chain.txt
```

You will be prompted for an export password — save it securely (e.g., in AWS Secrets Manager alongside the PFX).

## Provider-Side Setup

If the remote provider needs to trust our certificate (as is the case with SAP), send them the public certificate file (`certificate.txt`, renamed to `certificate.pem`).

## Usage Example

```js
const agent = new Agent({
  connect: {
    pfx: fs.readFileSync("certificate.pfx"),
    passphrase: "your-passphrase",
  },
});

const res = await fetch(
  "https://example.s4hana.ondemand.com/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_BusinessPartner?$top=10",
  {
    dispatcher: agent,
    headers: { Accept: "application/json" },
  },
);

console.log(await res.json());
```

## Certificate Renewal

When the certificate expires, repeat the process: export from ACM, regenerate the PFX, update the stored secret, and send the new public certificate to the provider if needed.
