import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';

export interface CertificateStackProps extends cdk.StackProps {
  domainName: string;
  subdomainName?: string; // e.g., 'www'
}

export class CertificateStack extends cdk.Stack {
  public readonly certificateArn: string;

  constructor(scope: Construct, id: string, props: CertificateStackProps) {
    super(scope, id, props);

    const { domainName, subdomainName } = props;
    const wwwDomain = subdomainName ? `${subdomainName}.${domainName}` : `www.${domainName}`;

    // Look up the Route 53 hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZoneForCertificate', {
      domainName: domainName,
    });

    // Create ACM Certificate (must be in us-east-1 for CloudFront)
    const certificate = new acm.Certificate(this, 'WebServiceCertificate', {
      domainName: domainName,
      subjectAlternativeNames: [wwwDomain],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    this.certificateArn = certificate.certificateArn;

    new cdk.CfnOutput(this, 'CertificateArn', {
      value: certificate.certificateArn,
    });
  }
} 