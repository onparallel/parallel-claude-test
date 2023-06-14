fail2ban is reading from the modsec audit log in /var/log/modsec_audit.log
we use a custom nginx ban action to add the IP into /nfs/parallel/fail2ban/blacklisted-ips.conf

Unban IP

```
sudo /usr/local/bin/fail2ban-client set modsec unbanip xxx.xxx.xxx.xxx
```
