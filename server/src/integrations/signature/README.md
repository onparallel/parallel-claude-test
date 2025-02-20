# TO CREATE A NEW DOCUSIGN APPLICATION (ON DOCUSIGN DASHBOARD)

Applications are configured with user devs@onparallel.com

- Login on docusign admin dashboard
- Go to Integrations->Apps and Keys
- Click on 'Add App and Integration Key'
  - Under 'General Info'
    - Give App a name
    - Copy the Integration Key (DOCUSIGN_INTEGRATION_KEY env)
  - Under 'Authentication':
    - make sure "Authorization Code Grant" is selected
    - click on 'Add Secret Key' and copy its value (DOCUSIGN_SECRET_KEY env)
  - Under 'Additional Settings':
    - add a redirect uri: https://www.onparallel.com/api/integrations/signature/docusign/oauth/redirect
      This URL may be different but must match with env variable DOCUSIGN_REDIRECT_URI and point to OauthIntegration /redirect endpoint
    - Add links to Parallel's Terms of Use (https://www.onparallel.com/legal/terms) and Privacy Policy (https://www.onparallel.com/legal/privacy)
