## Server image

The server image is built by copying all files inside `ops/prod/image` in a vanilla Amazon Linux instance and running

```
sudo bash build.sh
```

This script will install all the dependencies needed, including:

- node.js
- yarn
- nginx with nginx_accept_language_module

To create a new image, launch a new vanilla Amazon Linux and copy the files inside `ops/prod/image`.

```
scp ops/prod/image/* ec2-user@[INSTANCE_IP]:~
ssh ec2-user@[INSTANCE_IP]
sudo bash build.sh
```

## Release

The release process has the following steps defined in different scripts on `bin`

- `build-release`: Checks out the code at the specified commit hash and builds both the client and the server. It also uploads the statics to the corresponding statics s3 bucket (and creates the corresponding invalidation on Cloudfront). Finally it tars everything and uploads the build to the builds bucket `parallel-builds`.
- `launch-instance`: It launches a new instance using the parallel-server AMI. It then uploads the `install.sh` and `workers.sh` scripts to it and runs the first one in order to pull out the build artifact from s3 and start the server.
- `switch-release`:
  - Stops the workers on the current release.
  - Switches the target group of the specified load balancer.
  - Starts the workers on the new release.
- Optional `prune-instances`: Stops/terminates the instances that are not used by the load balancer and deleted any stale target groups.

### Additional scripts

- `full-release`: Runs `build-release`, `launch-instance`, `switch-release` and `prune-instances` in sequence.
- `list-instances`: Shows the relevant instances with information: ID, IP, name, release, State, Attached LB and Health
