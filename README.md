# Personal Static Website with AWS CDK

This project sets up and deploys a simple, professional, single-page static website using the AWS Cloud Development Kit (CDK) with TypeScript. The website is hosted on AWS S3, served via CloudFront for HTTPS and CDN capabilities, and uses Route 53 for DNS management with a custom domain.

## Features

*   **Static Site Hosting**: Uses an S3 bucket configured for static website hosting.
*   **HTTPS and CDN**: CloudFront distribution to serve content securely over HTTPS and cache it globally.
*   **Custom Domain**: Configures Route 53 to point your custom domain (e.g., `richardstanley.net`) to the CloudFront distribution.
*   **Cross-Region Certificate**: ACM certificate for HTTPS is provisioned in `us-east-1` (required for CloudFront), while the main website resources can be in a different region (e.g., `us-west-2`).
*   **Single-Page Application**: The website content is a responsive single-page design built with HTML, CSS, and vanilla JavaScript, with automatic dark mode via `prefers-color-scheme`.
*   **Security Headers**: A CloudFront `ResponseHeadersPolicy` adds HSTS, a strict Content-Security-Policy, `X-Content-Type-Options`, frame denial, and a referrer policy to every response.
*   **Performance**: HTTP/3 enabled, self-hosted fonts (no third-party requests), and tiered `Cache-Control`: immutable for fonts/images, one day for CSS/JS, no-cache for `index.html`.
*   **AI Search Optimization**: An `llms.txt` summary for AI agents, explicit AI-crawler allowances in `robots.txt`, and rich schema.org structured data (ProfilePage/WebSite/Person graph) for answer engines.
*   **Automated Deployment**: Infrastructure and website content are deployed via AWS CDK, either locally or through the GitHub Actions deploy workflow.

## Project Structure

*   `bin/personal-website.ts`: Entry point for the CDK application. Defines and instantiates the stacks.
*   `lib/`:
    *   `certificate-stack.ts`: CDK stack to create the ACM certificate in `us-east-1`.
    *   `personal-website-stack.ts`: CDK stack for S3 bucket, CloudFront distribution, Route 53 records, and S3 deployment of site content.
*   `site-content/`:
    *   `index.html`: The main HTML file for your single-page website.
    *   `style.css`: CSS styles for the website.
    *   `script.js`: JavaScript for interactivity (smooth scrolling, mobile navigation).
    *   *(You should add your resume PDF and any images like a profile picture or hero background here.)*
*   `cdk.json`: Configuration file for CDK.
*   `package.json`: NPM package manifest.
*   `tsconfig.json`: TypeScript configuration.

## Prerequisites

1.  **AWS Account**: You need an active AWS account.
2.  **Node.js and npm**: Install Node.js (which includes npm). Check the version specified in `package.json` or use a recent LTS version.
3.  **AWS CDK Toolkit**: Install the AWS CDK Toolkit globally: `npm install -g aws-cdk`.
4.  **AWS CLI**: Install and configure the AWS CLI with credentials for your AWS account (`aws configure`). Ensure the profile used has necessary permissions.
5.  **Route 53 Hosted Zone**: You must have a public hosted zone in Route 53 for the domain you intend to use (e.g., `richardstanley.net`).
6.  **Domain Name**: The domain name (e.g., `richardstanley.net`) should be configured in `bin/personal-website.ts`.

## Setup & Configuration

1.  **Clone the Repository (if applicable)**:
    ```bash
    # git clone ...
    # cd personal-website
    ```
2.  **Install Dependencies** (this project uses pnpm — see `packageManager` in `package.json`):
    ```bash
    pnpm install
    ```
3.  **Configure Domain and Regions**:
    *   Open `bin/personal-website.ts`.
    *   Verify or update the `domainName` variable.
    *   The `certificateRegion` is typically fixed to `us-east-1` for CloudFront certificates.
    *   The `websiteRegion` can be set to your preferred AWS region for S3 and other resources (e.g., `us-west-2`).

## Deployment

1.  **Bootstrap CDK (if you haven't used CDK in these account/region combinations before)**:
    Replace `YOUR_ACCOUNT_ID` with your AWS Account ID. You can usually rely on the default AWS profile or specify `--profile YOUR_PROFILE_NAME`.
    ```bash
    cdk bootstrap aws://YOUR_ACCOUNT_ID/us-east-1 # For the certificate stack
    cdk bootstrap aws://YOUR_ACCOUNT_ID/us-west-2 # For the website stack (or your chosen websiteRegion)
    ```
    *Note: `process.env.CDK_DEFAULT_ACCOUNT` is used in `bin/personal-website.ts`, so ensure your environment or AWS CLI is configured correctly.*

2.  **Synthesize (Optional)**:
    Check for errors and see the CloudFormation templates that will be generated.
    ```bash
    cdk synth
    ```

3.  **Deploy Stacks**:
    This command will deploy both the certificate stack and the website stack.
    ```bash
    cdk deploy --all
    ```
    *   CDK will first deploy the `PersonalWebsiteCertificateStack` to `us-east-1`. This involves DNS validation for the certificate, which CDK attempts to handle automatically by creating CNAME records in your Route 53 hosted zone. This step can take 5-30 minutes for AWS to validate the certificate.
    *   Once the certificate is validated, CDK will deploy the `PersonalWebsiteStack` (e.g., to `us-west-2`).

## Updating Website Content

1.  Modify the files in the `site-content/` directory (`index.html`, `style.css`, `script.js`).
2.  Add your images (e.g., profile picture, hero background) and resume PDF to the `site-content/` directory and update references in `index.html` or `style.css` as needed.
3.  After making changes, simply re-run the deployment command:
    ```bash
    cdk deploy PersonalWebsiteStack
    ```
    Or, if you also made changes to the infrastructure code (less common for content updates):
    ```bash
    cdk deploy --all
    ```
    The `BucketDeployment` construct in `PersonalWebsiteStack` will automatically update the files in the S3 bucket and invalidate the CloudFront cache.

## CI/CD (GitHub Actions)

Two workflows live in `.github/workflows/`:

*   `ci.yml`: runs build, lint, and tests on every pull request and push to `main`.
*   `deploy.yml`: on push to `main` (or manual dispatch), re-runs the checks and then `cdk deploy --all` using OIDC — no long-lived AWS keys in GitHub.

One-time setup for deploys:

1.  In the AWS account that hosts the site, create an IAM OIDC identity provider for `token.actions.githubusercontent.com` (audience `sts.amazonaws.com`).
2.  Create an IAM role trusting that provider, with the trust condition scoped to this repo, e.g. `"token.actions.githubusercontent.com:sub": "repo:richardstanley/personal-website:ref:refs/heads/main"`.
3.  Give the role permission to assume the CDK bootstrap roles: `sts:AssumeRole` on `arn:aws:iam::<ACCOUNT_ID>:role/cdk-*`.
4.  Save the role ARN as the repository secret `AWS_DEPLOY_ROLE_ARN`.

## Useful CDK Commands

*   `npm run build`: Compile TypeScript to JavaScript.
*   `npm run watch`: Watch for changes and compile.
*   `npm run test`: Perform Jest unit tests (if any are configured).
*   `cdk deploy <StackName>`: Deploy a specific stack.
*   `cdk deploy --all`: Deploy all stacks.
*   `cdk diff`: Compare deployed stack with current state.
*   `cdk synth`: Emits the synthesized CloudFormation template.
*   `cdk destroy <StackName>`: Destroy a specific stack.
*   `cdk destroy --all`: Destroy all deployed stacks (use with caution).

## Troubleshooting

*   **Certificate Validation Time**: ACM certificate validation can take time. Monitor the CloudFormation console or the output of `cdk deploy`.
*   **DNS Propagation**: After deployment, DNS changes for Route 53 can take some time to propagate globally.
*   **Permissions**: Ensure your AWS CLI user/role has sufficient permissions to create all the necessary resources (IAM, S3, CloudFront, ACM, Route 53).
*   **Region Mismatches**: Double-check that the `env` configurations for regions in `bin/personal-website.ts` are correct, especially for the certificate stack (`us-east-1`) and the main website stack.
