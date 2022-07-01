import { outdent } from "outdent";

export const description = outdent`
## Introduction
Parallel is a document process solution that helps its users collect documents 
and information efficiently, giving them control over what their recipients
have replied and the launched processes' status.

By opening our API, we want to empower organizations with our technology. While
organizations focus on their core business, we help them streamline their
document workflows.

## Authentication
In order to authenticate your requests, first, you need generate a token on the
[API tokens](https://www.onparallel.com/en/app/settings/tokens) section of your
account settings.

When you make any requests to the Parallel API pass the generated token in the
\`Authorization\` header as follows:
~~~
Authorization: Bearer QrUV6NYDk2KcXg96KrHCQTTuKyt5oU8ETHueF5awWZe6
~~~
<SecurityDefinitions />

## Getting started
To quick start on Parallel, we have prepared a brief tutorial that will guide
you through the basics of our API. Once completed, you should be able to manage
your document workflows through our API.

To start you will need the following:

- An **API token**: You can generate one on the [API tokens section](https://www.onparallel.com/en/app/settings/tokens)
  under your account settings.
- At least **one Parallel Template**. Make sure to write down the ID so we can
  create a parallel based on it. You can find this ID on the [browser URL](https://help.onparallel.com/en/articles/6076363)
  or by using the [GET /templates](#operation/GetTemplates) endpoint.

### Step 1: Create the parallel
Create the parallel with the [POST /petitions](#operation/CreatePetition)
endpoint using the template ID you wrote down earlier.
~~~bash
curl -s -XPOST \\
  -H 'Authorization: Bearer <your API token>' \\
  -H 'Content-Type: application/json' \\
  -d '{
  "templateId": "<your template ID>",
  "name": "<an optional name>"
}' \\
'https://www.onparallel.com/api/v1/petitions'
~~~

If everything goes well, you should have received the created parallel. Write
down the ID because we will need it in the next step.

### Step 2: Send the parallel
Send the parallel using the [(POST /petitions/{petitionId}/recipients)](#operation/CreatePetitionRecipients)
endpoint.

~~~bash
curl -s -XPOST \\
  -H 'Authorization: Bearer <your API token>' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "contacts": [
      {
        "email": "morty@smith.com",
        "firstName": "Morty",
        "lastName": "Smith"
      }
    ],
    "message": {
      "format": "PLAIN_TEXT",
      "content": "Hi Morty,\\nPlease fill the following information\\n\\nRegards,\\nRick"
    },
    "subject": "Please fill this parallel"
  }' \\
  'https://www.onparallel.com/api/v1/petitions/{petitionId}/recipients'
~~~

If everything went correctly, you should have received an email with your first
parallel. Congrats! Now fill it out and complete it as a recipient would do.  

### Step 3: Get the replies
Finally, use the [GET /petitions/{petitionId}/fields](#operation/PetitionFields)
endpoint in order to get the different replies. For \`TEXT\` replies you will get
them right there on the same call under the \`content\` field but for \`FILE_UPLOAD\`
replies you will need to call another endpoint.

~~~bash
curl -s -XGET \\
  -H 'Authorization: Bearer <your API token>' \\
  'https://www.onparallel.com/api/v1/petitions/{petitionId}/fields' 
~~~

### Step 4: Download files
If the parallel you created had any uploaded files you will have to use the
[GET /petitions/{petitionId}/replies/{replyId}/download](#operation/DownloadFileReply)
in order to get the uploaded file.

~~~bash
curl -s -L -XGET \\
  -H 'Authorization: Bearer <your API token>' \\
  'https://www.onparallel.com/api/v1/petitions/{petitionId}/replies/{replyId}/download' \\
  > file.png
~~~

*Note that you need to configure your HTTP client to follow redirects, hence
the \`-L\` flag in the previous example.*

## Support
In case you need any help with your integration, please drop an email to
[devs@onparallel.com](mailto:devs@onparallel.com?subject=Parallel%20API%20support).
We will be pleased to help you with any problem.
`;
