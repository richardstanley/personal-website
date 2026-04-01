import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as path from 'path';

export interface PersonalWebsiteStackProps extends cdk.StackProps {
  domainName: string;
  certificateArn: string; // ARN of the ACM certificate from us-east-1
}

export class PersonalWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PersonalWebsiteStackProps) {
    super(scope, id, props);

    const { domainName, certificateArn } = props;
    const wwwDomain = `www.${domainName}`;

    // 1. Look up the Route 53 hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,
    });

    // 2. Import ACM Certificate from ARN (must be in us-east-1 for CloudFront)
    const certificate = acm.Certificate.fromCertificateArn(this, 'SiteCertificate', certificateArn);

    // 3. S3 Bucket for website content
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `${this.account}-personal-website-${domainName.replace('.', '-')}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 4. CloudFront Function: redirect www to apex
    const wwwRedirectFunction = new cloudfront.Function(this, 'WwwRedirectFunction', {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var host = event.request.headers.host.value;
  if (host === '${wwwDomain}') {
    return {
      statusCode: 301,
      statusDescription: 'Moved Permanently',
      headers: { location: { value: 'https://${domainName}' + event.request.uri } }
    };
  }
  return event.request;
}
      `.trim()),
    });

    // 5. CloudFront Distribution (OAC via S3BucketOrigin — replaces legacy OAI)
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [domainName, wwwDomain],
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        compress: true,
        functionAssociations: [{
          function: wwwRedirectFunction,
          eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
        }],
      },
      errorResponses: [
        { httpStatus: 403, responseHttpStatus: 404, responsePagePath: '/index.html' },
        { httpStatus: 404, responseHttpStatus: 404, responsePagePath: '/index.html' },
      ],
    });

    // 6. Route 53 Alias Records for CloudFront Distribution
    new route53.ARecord(this, 'SiteApexARecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
    });

    new route53.AaaaRecord(this, 'SiteApexAaaaRecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
    });

    new route53.ARecord(this, 'SiteWwwARecord', {
      zone: hostedZone,
      recordName: wwwDomain,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
    });

    new route53.AaaaRecord(this, 'SiteWwwAaaaRecord', {
      zone: hostedZone,
      recordName: wwwDomain,
      target: route53.RecordTarget.fromAlias(new route53targets.CloudFrontTarget(distribution)),
    });

    // 7. Deploy site content to S3
    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset(path.join(__dirname, '..', 'site-content'))],
      destinationBucket: siteBucket,
      distribution: distribution, // Invalidate CloudFront cache on deploy
      distributionPaths: ['/*'],
    });

    // Output the CloudFront distribution domain name
    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: distribution.distributionDomainName,
    });
    new cdk.CfnOutput(this, 'SiteURL', {
      value: `https://${domainName}`,
    });
    new cdk.CfnOutput(this, 'WwwSiteURL', {
      value: `https://${wwwDomain}`,
    });
  }
}
