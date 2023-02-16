import { Knex } from "knex";
import { isDefined } from "remeda";

const validEnvironments = ["local", "staging", "production"];
// for each environment, an object where key: first 6 chars of decrypted signaturit API_KEY; value: encrypted CREDENTIALS object containing that API_KEY
const encryptedCredentialsMap: { [key: string]: Record<string, string> } = {
  local: {
    OWjTPU:
      "0c01753ca6d3e5aa9e41c586c7487fa622990b5e036ecc8e870a3306214a759a3799367486b1a0b2269287d60060b5e0244e3e6fe84f7db69eced90df3638ea808fb239d27721c35c6470833a57ae9cf88ae5697ee5112f169b5123e5bd0d7675265546ff3aad1049637538ef05d080ff12d92207ae7f0ad8481a694cb92669aeb9c6c46f594",
  },
  staging: {
    OWjTPU:
      "0cebba3e0c8b59ec27a263f3d9b8e7f4d170554c297cb2de7b2e777e1f57796a64e4c2d06f86a5c2e51b683529b1c3c1d91c0bce24fe8a4363d6f37fe9b0933b709556833c8ee853b425a1d0d177a34b4752a83d908121999de56c785455d54aa03fa2b5f1e1175bc47d1df79bc2443e1472d6a3bbbea0091d69d134a04661906bddd80606b1",
  },
  production: {
    gArtER:
      "0c046ba549ed0cbe5c3ad035518c1e9fe6a190af9789eb928ac6da50e761d0df8adeeb2970921ef0e02c391b51be7718c166a152a510092d7ca3ba9fa8d48d083c100022fc6bb326dcff4006fb4db0b8d56827abdc987f45232427f1b8f813cbc48e58ab3733a35cf838308e5a3bd84c6a142cf072cdc83b1d7f1d9ac237c42e97",
    zCrvVl:
      "0cbb1274341dee2adff17a04923aba7f4e3bf0805688508e791b4ace6a902955d09680d75841656191eb893a6f99e09638a68f5b59f99ecd2d313df48c7b57a241777db3d51038d8542f11054890d54b068e5e04df5fd1c79b87a8429085f3f64714462de885b30516d170fbf7264eaad0234e7e468ac4a4c7da06d258f3b84fcd15",
    edamWx:
      "0c5e9c5cfafdac0b4a66ec492333daa8373307c205ae58501eec14f96142945f9d552b64abfb3f902079acca618c0c73ac161da246d2af84cc776b6e8aead097d5e9676934b287dbc59ffc327d00551b359612b3319bd07296a6bf5ccc45b085a0379bf9f13a1f8ada87c25130fa388338f18dfccabe44900f9ed458487bf5a3364c",
    KzvcFy:
      "0c9bfeaeb1cfb95675af3ea02dadba23a594893367f3457ececf0a2f1961e85b7aa2bbd1c7d5e2cfb5b5b7243867b82aa6395cc6ba63a21c85f52de3298bc7f987c821e55a84e30bf3114a63f8d6ffc202e5e68d3e428829b809f3c83f525534b6cf92f5d1605c3e626ce1558c4c2b01904d14e2630e9f1e5a5c6c5d207aa544a0bd",
    MBSlxA:
      "0cb5a95f00f69c628348e51b67ff72929830100410c982571e17a178245586a32912fe06e1411a78903d6c3fdc52e6ee4ff19f954f359825c9363c843ee5408e2e77da94ce1feea7c4aa29f266d75d8c4a48fca7f6f1ab64b1e5cda7919db8180145d64463a0b67d1fd1bdfb4a0b2c3e9d359b9ceb2460f2b140220ae519b4cf0502",
    OWjTPU:
      "0c388decb67292229195a16c81507cb4c84bd9accfbea6035db24cd4e4f46c2bda7146a80a95ad5cf4d29298ebe56b8378620060b3a5555bc2e1601d47e2e3dc8ab7aecddaf88cad0fd047fb7fa229e35f674d5504b0a6423c16877f30a59259ec8e480d4201cd4d4137dff0ab40d0a9ded7c43dedd0b5d2ea38d6c17c6492e44994",
    MpHsqa:
      "0cc8222377102572e92899f11facc6c49aa88b899aca56b42921294b6c8b75a8f67c9bc1edb29a8af2a6ce83dd0e5bbb69f637d96ca54206ca565fac21aa19f3a68d2be9952fc2359d7e94214251f6ab3975df5dbb8f62260e9b8e8b8a9b5c5a3c488336c8e37265e009a8857efa11532504dfc016f3ff2cbfb87a446c8b88151f92",
    GXKczz:
      "0ce1a5c057843ace61612d0a2e6f4d5f98c6b867176e4af4f477f3153c54e2c95c86452a574269f4314e5a8f4183a4b82330aafdf6f7984ee9dfed9cab2bd48705a41356a57a1f0a788a9d6b290a428dd23ea0e74f831e44d297cb6e7c18f5fbe86f0b74292ecf6d61db493f3335fb77162d20093fde65d17bd607edfc17209e3208",
    nFThyl:
      "0cb28769f8ff7a39fc81b1115164f04478d6ba677e1ca631ce504b1f4630879efc972ec03e067fc2856c44f26e17bd2e9619a02a08308965a911957b2517cf46ae8a792df354297886268dbafa3a6ab61f0a44342f331f228b51f4eec88dd3530e6f5d6ec43b8096c16c27a82fd7293695a0c5dcb8ba78429a4bb445b3013e213452",
    UQWPrh:
      "0cd391aa664dada9bdfe969baa913ba70613a14eba19a7581fba098d7e63826276a6ec8c1377afb44aad0cab44d49d99cc1e247820e284c3828eb4a5108d6651c46d771208f313496f0cb999cf8ed5fe8d55948c46ed9e760716e98666670583b06246b452caaba8964f9a8a3e2f8f3d11edbccd0b52c92dc26dd10fdfd9ebbb3475",
    fgJKJT:
      "0c7a6207cc11480ba18314cda49ea3b1103c502f7f5b251614f0f3bc3591a851eef646408d599a7fc29d5728d591fa551ffb7336af895a46d9866987e5cea20546575e88f7163ba514a7807296be8670973f7b5efbb51ea23c6f959a5686babcb5ed65e745c670ad652a32476c89a946f204101ddd9954bb5cebd47baa0dba15f0d8",
  },
};

export async function up(knex: Knex): Promise<void> {
  const environment = process.env.MIGRATION_ENV;
  if (!isDefined(environment) || !validEnvironments.includes(environment)) {
    throw new Error(
      `run this migration as: MIGRATION_ENV=<env> yarn migrate. <env>: ${validEnvironments.join(
        " | "
      )}`
    );
  }

  const encryptedKeys = Object.entries(encryptedCredentialsMap[environment]);

  const { rows } = await knex.raw<{ rows: { key: string }[] }>(/* sql */ `
    select distinct(settings->'CREDENTIALS'->>'API_KEY') as "key" from org_integration oi where provider = 'SIGNATURIT';
  `);

  // make sure every key in database is defined on the encryptedKeys map
  rows
    .filter(({ key }) => isDefined(key))
    .forEach(({ key }) => {
      const encrypted = encryptedKeys.find(([hint]) => key.startsWith(hint));
      if (!encrypted) {
        throw new Error(
          `key (${key.slice(
            0,
            6
          )}...) is not defined on encryptedCredentialsMap. Update the migration and try again.`
        );
      }
    });

  await knex.raw(
    /* sql */ `
        with encrypted_keys("hint", "encrypted") 
        as (values ${encryptedKeys.map(() => "(?::text, ?::text)").join(", ")})
        update "org_integration" oi
        set settings = settings || jsonb_build_object(
                '_CREDENTIALS', "settings"->'CREDENTIALS', -- just in case, will be removed in future migration
                'CREDENTIALS', ek.encrypted,
                'IS_PARALLEL_MANAGED', starts_with("settings"->'CREDENTIALS'->>'API_KEY', 'nFThyl')
            )
        from "encrypted_keys" ek
        where "provider" = 'SIGNATURIT' and starts_with("settings"->'CREDENTIALS'->>'API_KEY', ek.hint);
    `,
    encryptedKeys.flat()
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(/* sql */ `
    update org_integration
    set settings = (settings || jsonb_build_object('CREDENTIALS', settings->'_CREDENTIALS')) - '_CREDENTIALS'
    where "provider" = 'SIGNATURIT' and settings->'_CREDENTIALS' is not null
  `);
}
