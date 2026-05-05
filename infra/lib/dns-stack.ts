import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export class DnsStack extends cdk.Stack {
  public readonly hostedZone: route53.PublicHostedZone;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: 'georgiavotesvisual.com',
    });

    // After first deploy, update your domain registrar's nameservers
    // to the NS values printed here.
    new cdk.CfnOutput(this, 'NameServers', {
      description: 'Update your registrar to use these nameservers',
      value: cdk.Fn.join(', ', this.hostedZone.hostedZoneNameServers!),
    });

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
    });
  }
}
