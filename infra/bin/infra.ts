#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DnsStack } from '../lib/dns-stack.ts';
import { CertificateStack } from '../lib/certificate-stack.ts';
import { HostingStack } from '../lib/hosting-stack.ts';
import { GithubActionsStack } from '../lib/github-actions-stack.ts';

const app = new cdk.App();

// All stacks deploy to us-east-1 — required for CloudFront + ACM.
const env: cdk.Environment = {
  account: '123871754011',
  region: 'us-east-1',
};

// 1. Route53 hosted zone for georgiavotesvisual.com
//    After first deploy, update your registrar's nameservers to the NS output.
const dns = new DnsStack(app, 'GaVotesDns', { env });

// 2. Wildcard ACM certificate (covers *.georgiavotesvisual.com + apex)
//    DNS validation records are written automatically to the hosted zone.
const cert = new CertificateStack(app, 'GaVotesCertificate', {
  env,
  hostedZone: dns.hostedZone,
});
cert.addDependency(dns);

// 3. Production: georgiavotesvisual.com
const prod = new HostingStack(app, 'GaVotesProd', {
  env,
  hostedZone: dns.hostedZone,
  certificate: cert.certificate,
  bucketName: 'georgiavotesvisual',
  domainName: 'georgiavotesvisual.com',
});
prod.addDependency(cert);

// 4. Staging / latest: latest.georgiavotesvisual.com
const latest = new HostingStack(app, 'GaVotesLatest', {
  env,
  hostedZone: dns.hostedZone,
  certificate: cert.certificate,
  bucketName: 'georgiavotesvisual-latest',
  domainName: 'latest.georgiavotesvisual.com',
});
latest.addDependency(cert);

// 5. IAM OIDC role used by GitHub Actions to deploy
new GithubActionsStack(app, 'GaVotesGithubActions', {
  env,
  buckets: [prod.bucket, latest.bucket],
  distributions: [prod.distribution, latest.distribution],
  githubOrg: 'asdfjkalsdfla',
  githubRepo: 'gavotesfrontend',
});
