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

    // 5. Security headers applied to every response.
    // CSP can be fully self-referential because fonts/styles/scripts are all self-hosted.
    const securityHeaders = new cloudfront.ResponseHeadersPolicy(this, 'SecurityHeaders', {
      securityHeadersBehavior: {
        contentSecurityPolicy: {
          contentSecurityPolicy: [
            "default-src 'none'",
            "script-src 'self'",
            "style-src 'self'",
            "img-src 'self'",
            "font-src 'self'",
            "manifest-src 'self'",
            "base-uri 'none'",
            "form-action 'none'",
            "frame-ancestors 'none'",
          ].join('; '),
          override: true,
        },
        contentTypeOptions: { override: true },
        frameOptions: { frameOption: cloudfront.HeadersFrameOption.DENY, override: true },
        referrerPolicy: {
          referrerPolicy: cloudfront.HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
          override: true,
        },
        strictTransportSecurity: {
          accessControlMaxAge: cdk.Duration.days(730),
          includeSubdomains: true,
          preload: true,
          override: true,
        },
      },
    });

    // 6. CloudFront Distribution (OAC via S3BucketOrigin — replaces legacy OAI)
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [domainName, wwwDomain],
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        compress: true,
        responseHeadersPolicy: securityHeaders,
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

    // 7. Route 53 Alias Records for CloudFront Distribution
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

    // 8. Domain hardening DNS records.
    // CAA: only Amazon's CA may issue certificates for this domain.
    new route53.CaaAmazonRecord(this, 'CaaAmazonRecord', {
      zone: hostedZone,
    });

    // The domain sends no email: null MX (RFC 7505) + SPF -all + DMARC reject
    // stop anyone from spoofing mail from @richardstanley.net.
    new route53.MxRecord(this, 'NullMxRecord', {
      zone: hostedZone,
      values: [{ priority: 0, hostName: '.' }],
    });

    // Apex TXT record set holds both values — DNS allows one TXT set per name.
    new route53.TxtRecord(this, 'SpfRecord', {
      zone: hostedZone,
      values: [
        'v=spf1 -all',
        'google-site-verification=NGNdKOAZZbY6xtR0IXFTOfxgEpaBiMsZ2YiKFcZlPe8',
      ],
    });

    new route53.TxtRecord(this, 'DmarcRecord', {
      zone: hostedZone,
      recordName: `_dmarc.${domainName}`,
      values: ['v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s'],
    });

    // 9. Deploy site content to S3 with tiered Cache-Control.
    // Three deployments share one source asset; prune is off so they don't delete each other's files.
    const siteSource = s3deploy.Source.asset(path.join(__dirname, '..', 'site-content'), {
      exclude: ['.DS_Store'],
    });
    const longLivedPatterns = ['fonts/*', '*.png', '*.jpg', '*.webp', '*.svg', '*.ico'];

    new s3deploy.BucketDeployment(this, 'DeployLongLivedAssets', {
      sources: [siteSource],
      destinationBucket: siteBucket,
      exclude: ['*'],
      include: longLivedPatterns,
      cacheControl: [s3deploy.CacheControl.fromString('public, max-age=31536000, immutable')],
      prune: false,
    });

    new s3deploy.BucketDeployment(this, 'DeployShortLivedAssets', {
      sources: [siteSource],
      destinationBucket: siteBucket,
      exclude: ['index.html', ...longLivedPatterns],
      cacheControl: [s3deploy.CacheControl.fromString('public, max-age=86400')],
      prune: false,
    });

    new s3deploy.BucketDeployment(this, 'DeployIndexHtml', {
      sources: [siteSource],
      destinationBucket: siteBucket,
      exclude: ['*'],
      include: ['index.html'],
      cacheControl: [s3deploy.CacheControl.fromString('public, max-age=0, must-revalidate')],
      prune: false,
      distribution: distribution, // one invalidation per deploy — all three deployments update together
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
