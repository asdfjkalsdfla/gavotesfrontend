import * as cdk from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

interface CertificateStackProps extends cdk.StackProps {
  hostedZone: route53.IHostedZone;
}

export class CertificateStack extends cdk.Stack {
  public readonly certificate: acm.Certificate;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    // CloudFront requires ACM certificates to be in us-east-1.
    // Ensure this stack is deployed with env.region = 'us-east-1'.
    this.certificate = new acm.Certificate(this, 'Certificate', {
      domainName: 'georgiavotesvisual.com',
      // Wildcard covers latest.georgiavotesvisual.com and any future subdomains
      subjectAlternativeNames: ['*.georgiavotesvisual.com'],
      validation: acm.CertificateValidation.fromDns(props.hostedZone),
    });

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: this.certificate.certificateArn,
    });
  }
}
