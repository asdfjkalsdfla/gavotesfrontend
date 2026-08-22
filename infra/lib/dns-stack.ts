import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export class DnsStack extends cdk.Stack {
  // Temporarily cast — populated after `cdk import` adopts the existing zone.
  public readonly hostedZone: route53.PublicHostedZone = undefined as unknown as route53.PublicHostedZone;

  constructor(scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    // IMPORT WORKFLOW: resources are intentionally absent so the CF stack
    // is created empty. After `cdk deploy GaVotesDns`, restore these and
    // run `cdk import GaVotesDns` to adopt the existing hosted zone.

    // this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
    //   zoneName: 'georgiavotesvisual.com',
    // });
    // new cdk.CfnOutput(this, 'NameServers', {
    //   description: 'Update your registrar to use these nameservers',
    //   value: cdk.Fn.join(', ', this.hostedZone.hostedZoneNameServers!),
    // });
    // new cdk.CfnOutput(this, 'HostedZoneId', {
    //   value: this.hostedZone.hostedZoneId,
    // });
  }
}
