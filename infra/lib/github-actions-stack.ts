import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';

interface GithubActionsStackProps extends cdk.StackProps {
  buckets: s3.IBucket[];
  distributions: cloudfront.IDistribution[];
  /** GitHub org or username, e.g. "asdfjkalsdfla" */
  githubOrg: string;
  /** GitHub repository name, e.g. "gavotesfrontend" */
  githubRepo: string;
}

export class GithubActionsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: GithubActionsStackProps) {
    super(scope, id, props);

    // GitHub's OIDC provider — only one per account is allowed.
    // If you already have one, replace this with:
    //   iam.OpenIdConnectProvider.fromOpenIdConnectProviderArn(this, ...)
    const provider = new iam.OpenIdConnectProvider(this, 'GithubOidcProvider', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    const role = new iam.Role(this, 'DeployRole', {
      roleName: 'github-build-gavotesfrontend',
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        // Allow any branch/tag/environment in this repo to assume the role.
        // Tighten to a specific branch (e.g. "repo:org/repo:ref:refs/heads/main")
        // if you want to restrict deployments.
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${props.githubOrg}/${props.githubRepo}:*`,
        },
      }),
      description: 'Assumed by GitHub Actions to deploy the GA Votes frontend',
    });

    // S3: allow syncing build output to both buckets
    for (const bucket of props.buckets) {
      bucket.grantReadWrite(role);
      // Also allow ListBucket so `aws s3 sync --delete` can diff the remote
      bucket.grantDelete(role);
    }

    // CloudFront: allow creating cache invalidations on both distributions
    role.addToPolicy(
      new iam.PolicyStatement({
        sid: 'CloudFrontInvalidate',
        actions: ['cloudfront:CreateInvalidation'],
        resources: props.distributions.map(
          (d) =>
            `arn:aws:cloudfront::${this.account}:distribution/${d.distributionId}`,
        ),
      }),
    );

    new cdk.CfnOutput(this, 'RoleArn', {
      description: 'Use this ARN in the GitHub Actions role-to-assume field',
      value: role.roleArn,
    });
  }
}
