Tailscale needs to be reauthenticated every 180 days on the ops machines. To do so:

- Temporarily add ssh access from your IP to the corresponding security group
- SSH into the instance using the public IP
- `sudo tailscale up --force-reauth --ssh`
- login
- add the corresponding tag to the instance again
