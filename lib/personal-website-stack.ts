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
  subdomainName?: string; // e.g., 'www'
  certificateArn: string; // ARN of the ACM certificate from us-east-1
}

export class PersonalWebsiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: PersonalWebsiteStackProps) {
    super(scope, id, props);

    const { domainName, subdomainName, certificateArn } = props;
    const siteDomain = subdomainName ? `${subdomainName}.${domainName}` : domainName;
    const wwwDomain = `www.${domainName}`;

    // 1. Look up the Route 53 hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName,
    });

    // 2. Import ACM Certificate from ARN (must be in us-east-1 for CloudFront)
    const certificate = acm.Certificate.fromCertificateArn(this, 'SiteCertificate', certificateArn);

    // 3. S3 Bucket for website content
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `${this.account}-personal-website-${domainName.replace('.', '-')}`, // Globally unique name
      publicReadAccess: false, // Access will be through CloudFront
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT recommended for production
      autoDeleteObjects: true, // NOT recommended for production
    });

    // 4. Origin Access Identity (OAI) for CloudFront
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OAI');
    siteBucket.grantRead(originAccessIdentity);

    // 5. CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [domainName, wwwDomain],
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket, { originAccessIdentity }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        compress: true,
      },
      // Optional: Redirect www to apex (e.g., www.richardstanley.net to richardstanley.net)
      // You can implement this with a second behavior or a CloudFront Function.
      // For simplicity, we'll create records for both and let the user decide or handle client-side.
      // Or, configure one to redirect to the other, e.g. www to non-www:
      // priceClass: cloudfront.PriceClass.PRICE_CLASS_100, // Optional: control cost
    });
    
    // If you want to redirect www.richardstanley.net to richardstanley.net
    // This is a common pattern.
    // You might need a separate distribution or a Lambda@Edge/CloudFront Function for more complex redirects.
    // For simple cases, ensuring both DNS records point to the same distribution often suffices,
    // and you can handle canonical URL preference in your application/HTML.

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

    // 7. Deploy placeholder index.html
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
