# AWS

Below there's a description on how the different services of AWS are used:

# EC2

# RDS

# S3

# Cloudfront

# Cloudwatch

# Lambda

# SES

# SQS

## AWS WAF

Web ACL are associated with the app LB to blacklist IP's from known abusers. The ACL `parallel-app` has a rule for blocking IPs in the `blacklist` IP set. If an IP needs to be blocked, add it to this IP set.
