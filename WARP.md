# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

# Project Overview

This is a personal static website project built with **AWS CDK** and **TypeScript**. It deploys a single-page application hosted on **S3**, served via **CloudFront** (HTTPS), with DNS managed by **Route 53**.

# Environment & Prerequisites

- **Package Manager**: `pnpm` (User Rule: Use pnpm instead of npm)
- **Node.js**: Compatible with `package.json` requirements.
- **AWS CLI**: Configured with appropriate credentials (`aws configure`).
- **AWS CDK**: Accessible via `pnpm cdk`.
- **AWS Regions**:
    -   `us-east-1`: Required for ACM Certificates used by CloudFront.
    -   `us-west-2` (or configured region): Primary region for S3 and other resources.

# Common Commands

## Setup
- `pnpm install`: Install dependencies.

## Development & Build
- `pnpm build`: Compile TypeScript to JavaScript.
- `pnpm watch`: Watch for changes and recompile.
- `pnpm test`: Run Jest unit tests.

## Deployment (CDK)
- `pnpm cdk deploy --all`: Deploy all stacks (Certificate & Website). **Recommended for first deployment.**
- `pnpm cdk deploy PersonalWebsiteStack`: Deploy only the website stack (use for content updates or website-infra changes).
- `pnpm cdk diff`: Compare deployed stack with current state.
- `pnpm cdk synth`: Synthesize CloudFormation templates.
- `pnpm cdk destroy <StackName>`: Destroy a specific stack.

# Architecture

## Entry Point
- `bin/personal-website.ts`: The CDK application entry point. It defines the `App` and instantiates the stacks.
    -   **Configuration**: Domain name (`richardstanley.net`) and regions are defined here.

## Stacks
1.  **CertificateStack** (`lib/certificate-stack.ts`)
    -   **Region**: `us-east-1` (Mandatory for CloudFront).
    -   **Resources**: ACM Certificate with DNS validation.
    -   **Outputs**: Exports the Certificate ARN.
2.  **PersonalWebsiteStack** (`lib/personal-website-stack.ts`)
    -   **Region**: Primary region (e.g., `us-west-2`).
    -   **Resources**:
        -   S3 Bucket (Static website hosting).
        -   CloudFront Distribution (CDN, HTTPS).
        -   Route 53 Records (A/AAAA records pointing to CloudFront).
        -   Bucket Deployment (Syncs `site-content/` to S3).

## Content
- `site-content/`: Contains the static website assets (`index.html`, `style.css`, `script.js`, images).
    -   **Modifying Content**: Edit files here and run `pnpm cdk deploy PersonalWebsiteStack` to update the site. The `BucketDeployment` construct handles the upload and cache invalidation.

# Development Workflow

1.  **Content Updates**:
    -   Modify files in `site-content/`.
    -   Deploy: `pnpm cdk deploy PersonalWebsiteStack`.

2.  **Infrastructure Updates**:
    -   Modify stacks in `lib/`.
    -   If changing the certificate, deploy `PersonalWebsiteCertificateStack` first or use `--all`.
    -   Otherwise, deploy the relevant stack or `--all`.

3.  **Cross-Region Dependency**:
    -   `PersonalWebsiteStack` depends on the certificate ARN from `PersonalWebsiteCertificateStack`.
    -   When deploying from scratch, `CertificateStack` must be deployed and validated (DNS validation) before `PersonalWebsiteStack` can proceed. `cdk deploy --all` handles this dependency order.

# Guidelines

- **Package Management**: Always use `pnpm` for installing dependencies and running scripts.
- **Secrets**: Do not commit secrets. Use environment variables or AWS Secrets Manager if needed.
- **Validation**: ACM Certificate validation via DNS can take 5-30 minutes on initial creation.
