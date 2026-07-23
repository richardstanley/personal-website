#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { PersonalWebsiteStack } from '../lib/personal-website-stack';
import { CertificateStack } from '../lib/certificate-stack';

const app = new cdk.App();

const domainName = 'richardstanley.net';
const account = process.env.CDK_DEFAULT_ACCOUNT;
const certificateRegion = 'us-east-1';
const websiteRegion = 'us-west-2';

// Stack for the ACM Certificate (must be in us-east-1)
const certificateStack = new CertificateStack(app, 'PersonalWebsiteCertificateStack', {
  domainName: domainName,
  env: {
    account: account,
    region: certificateRegion
  },
  crossRegionReferences: true, // Important for cross-region certificate usage
});

// Stack for the Website (e.g., in us-west-2)
new PersonalWebsiteStack(app, 'PersonalWebsiteStack', {
  domainName: domainName,
  certificateArn: certificateStack.certificateArn,
  env: {
    account: account,
    region: websiteRegion
  },
  crossRegionReferences: true, // Important for cross-region certificate usage
});

app.synth();