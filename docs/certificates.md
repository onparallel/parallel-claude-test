Certificates are managed with Letsencrypt certbot.

The certificates for \*.onparallel.com are use the dns challenge instead of the http challenge. This challenge requires the following script `bin/src/manual-renewal-hook.ts` which handles the creation and cleanup of the necessary dns records.

Certbot logs are stored in `/var/log/letsencrypt/letsencrypt.log`. Check with the command

```
sudo less /var/log/letsencrypt/letsencrypt.log
```

# Useful commands

## Delete certificate

```
sudo certbot delete --cert-name onboarding.tryb.agency --config-dir /nfs/parallel/certs/
```

## Renew certificates

```
sudo certbot renew --config-dir /nfs/parallel/certs/ --dry-run
```

## Upgrade certbot

```
sudo /opt/certbot/bin/pip install --upgrade certbot
```
