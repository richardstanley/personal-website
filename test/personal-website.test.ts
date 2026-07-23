import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { PersonalWebsiteStack } from '../lib/personal-website-stack';
import { CertificateStack } from '../lib/certificate-stack';

const DOMAIN = 'example.com';
const CERT_ARN = 'arn:aws:acm:us-east-1:123456789012:certificate/abc123';
const ENV = { account: '123456789012', region: 'us-west-2' };

function buildStack(): Template {
  const app = new cdk.App();
  const stack = new PersonalWebsiteStack(app, 'TestStack', {
    domainName: DOMAIN,
    certificateArn: CERT_ARN,
    env: ENV,
    crossRegionReferences: true,
  });
  return Template.fromStack(stack);
}

describe('PersonalWebsiteStack', () => {
  let template: Template;

  beforeEach(() => {
    template = buildStack();
  });

  test('S3 bucket blocks all public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('CloudFront distribution redirects HTTP to HTTPS with compression', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
          Compress: true,
        },
        DefaultRootObject: 'index.html',
      },
    });
  });

  test('CloudFront distribution uses TLS 1.2 minimum', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        ViewerCertificate: {
          MinimumProtocolVersion: 'TLSv1.2_2021',
          SslSupportMethod: 'sni-only',
        },
      },
    });
  });

  test('CloudFront distribution serves both apex and www domains', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Aliases: [DOMAIN, `www.${DOMAIN}`],
      },
    });
  });

  test('CloudFront distribution returns index.html for 403 and 404', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        CustomErrorResponses: [
          { ErrorCode: 403, ResponseCode: 404, ResponsePagePath: '/index.html' },
          { ErrorCode: 404, ResponseCode: 404, ResponsePagePath: '/index.html' },
        ],
      },
    });
  });

  test('www redirect CloudFront Function uses JS 2.0 runtime', () => {
    template.resourceCountIs('AWS::CloudFront::Function', 1);
    template.hasResourceProperties('AWS::CloudFront::Function', {
      FunctionConfig: { Runtime: 'cloudfront-js-2.0' },
    });
  });

  test('OAC is used instead of legacy OAI', () => {
    template.resourceCountIs('AWS::CloudFront::OriginAccessControl', 1);
    template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 0);
  });

  test('CloudFront distribution enables HTTP/3', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        HttpVersion: 'http2and3',
      },
    });
  });

  test('security headers policy sets HSTS, CSP, nosniff, and frame denial', () => {
    template.hasResourceProperties('AWS::CloudFront::ResponseHeadersPolicy', {
      ResponseHeadersPolicyConfig: {
        SecurityHeadersConfig: {
          StrictTransportSecurity: {
            AccessControlMaxAgeSec: 63072000,
            IncludeSubdomains: true,
            Preload: true,
            Override: true,
          },
          ContentSecurityPolicy: {
            ContentSecurityPolicy: Match.stringLikeRegexp("default-src 'none'"),
            Override: true,
          },
          ContentTypeOptions: { Override: true },
          FrameOptions: { FrameOption: 'DENY', Override: true },
          ReferrerPolicy: {
            ReferrerPolicy: 'strict-origin-when-cross-origin',
            Override: true,
          },
        },
      },
    });
  });

  test('security headers policy is attached to the default behavior', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          ResponseHeadersPolicyId: Match.anyValue(),
        },
      },
    });
  });

  test('site deploys with tiered Cache-Control (immutable assets, daily assets, no-cache html)', () => {
    template.resourceCountIs('Custom::CDKBucketDeployment', 3);
    template.hasResourceProperties('Custom::CDKBucketDeployment', {
      SystemMetadata: { 'cache-control': 'public, max-age=31536000, immutable' },
    });
    template.hasResourceProperties('Custom::CDKBucketDeployment', {
      SystemMetadata: { 'cache-control': 'public, max-age=86400' },
    });
    template.hasResourceProperties('Custom::CDKBucketDeployment', {
      SystemMetadata: { 'cache-control': 'public, max-age=0, must-revalidate' },
      DistributionId: Match.anyValue(),
    });
  });

  test('four Route53 alias records created (apex + www, A + AAAA)', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', { Type: 'A', Name: `${DOMAIN}.` });
    template.hasResourceProperties('AWS::Route53::RecordSet', { Type: 'AAAA', Name: `${DOMAIN}.` });
    template.hasResourceProperties('AWS::Route53::RecordSet', { Type: 'A', Name: `www.${DOMAIN}.` });
    template.hasResourceProperties('AWS::Route53::RecordSet', { Type: 'AAAA', Name: `www.${DOMAIN}.` });
  });

  test('domain hardening records: CAA, null MX, SPF, and DMARC', () => {
    template.resourceCountIs('AWS::Route53::RecordSet', 8);
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'CAA',
      Name: `${DOMAIN}.`,
      ResourceRecords: ['0 issue "amazon.com"'],
    });
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'MX',
      Name: `${DOMAIN}.`,
      ResourceRecords: ['0 .'],
    });
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'TXT',
      Name: `${DOMAIN}.`,
      ResourceRecords: ['"v=spf1 -all"'],
    });
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Type: 'TXT',
      Name: `_dmarc.${DOMAIN}.`,
      ResourceRecords: ['"v=DMARC1; p=reject; sp=reject; adkim=s; aspf=s"'],
    });
  });
});

describe('CertificateStack', () => {
  test('certificate covers apex and www SANs', () => {
    const app = new cdk.App();
    const stack = new CertificateStack(app, 'TestCertStack', {
      domainName: DOMAIN,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::CertificateManager::Certificate', {
      DomainName: DOMAIN,
      SubjectAlternativeNames: [`www.${DOMAIN}`],
      ValidationMethod: 'DNS',
    });
  });

  test('certificateArn is exposed as a stack property', () => {
    const app = new cdk.App();
    const stack = new CertificateStack(app, 'TestCertStack2', {
      domainName: DOMAIN,
      env: { account: '123456789012', region: 'us-east-1' },
    });
    expect(stack.certificateArn).toBeDefined();
  });
});
