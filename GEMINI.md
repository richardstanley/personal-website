# Personal Website Project Context

## Project Overview

This project is a personal static website hosted on AWS, defined and deployed using the AWS Cloud Development Kit (CDK) with TypeScript. It serves a single-page application secured by HTTPS via CloudFront, with content hosted in an S3 bucket and DNS managed by Route 53.

## Architecture

The infrastructure consists of two main CDK stacks designed to handle cross-region requirements for CloudFront:

1.  **Certificate Stack (`PersonalWebsiteCertificateStack`)**:
    *   **Region:** `us-east-1` (Required for CloudFront).
    *   **Resources:** AWS Certificate Manager (ACM) certificate for `richardstanley.net` and `*.richardstanley.net`.
    *   **Function:** Validates domain ownership via DNS and provides the certificate ARN to the website stack.

2.  **Website Stack (`PersonalWebsiteStack`)**:
    *   **Region:** `us-west-2` (Configurable).
    *   **Resources:**
        *   **S3 Bucket:** Stores website assets (`index.html`, `style.css`, images). Configured with `BLOCK_ALL` public access; only accessible via CloudFront.
        *   **CloudFront Distribution:** Global CDN that serves the S3 content over HTTPS. Redirects HTTP to HTTPS.
        *   **Route 53 Records:** `A` and `AAAA` alias records pointing the custom domain to the CloudFront distribution.
        *   **Bucket Deployment:** Automatically uploads contents from `site-content/` to S3 and invalidates the CloudFront cache during deployment.

## Tech Stack

*   **Infrastructure as Code:** AWS CDK (TypeScript).
*   **Frontend:** Static HTML, CSS, and Vanilla JavaScript.
*   **Package Manager:** `pnpm`.
*   **Testing:** Jest (via `ts-jest`).

## Key Files & Directories

*   `bin/personal-website.ts`: CDK application entry point. Defines the AWS environment (Account/Region) and stack dependencies.
*   `lib/personal-website-stack.ts`: Defines the core website infrastructure (S3, CloudFront, Route53, Deployment).
*   `lib/certificate-stack.ts`: Defines the ACM certificate infrastructure.
*   `site-content/`: Source directory for the static website. Any files here are deployed to the S3 bucket.
    *   `index.html`: Main entry point.
    *   `style.css`: Stylesheet.
*   `cdk.json`: CDK context and configuration.

## Development Workflow

### Prerequisites
*   AWS CLI configured with appropriate credentials.
*   `pnpm` installed.

### Build & Deploy Commands

*   **Install Dependencies:**
    ```bash
    pnpm install
    ```

*   **Build TypeScript:**
    ```bash
    pnpm build
    ```
    *Compiles TypeScript files to JavaScript.*

*   **Watch Mode:**
    ```bash
    pnpm watch
    ```
    *Watches for changes and recompiles.*

*   **Deploy All Stacks:**
    ```bash
    cdk deploy --all
    ```
    *Deploys both the certificate and website stacks. Essential for first-time setup or infrastructure changes.*

*   **Deploy Website Content Only:**
    ```bash
    cdk deploy PersonalWebsiteStack
    ```
    *Fastest way to update content in `site-content/`. Triggers S3 upload and CloudFront invalidation.*

*   **Run Tests:**
    ```bash
    pnpm test
    ```

### Conventions

*   **Cross-Region References:** The project uses `crossRegionReferences: true` to pass the Certificate ARN from `us-east-1` to the website stack in another region.
*   **Content Updates:** Edit files in `site-content/` and run `cdk deploy PersonalWebsiteStack`. No manual S3 upload is required.
*   **Domain Configuration:** The domain name is hardcoded in `bin/personal-website.ts` as `richardstanley.net`.

## Troubleshooting

*   **Certificate Validation:** If deployment hangs on the certificate stack, check Route 53 or the ACM console to ensure DNS validation records were created and propagated.
*   **Cache Invalidation:** CloudFront cache invalidation is automatic on deploy, but changes might take a few minutes to be globally visible.
