# My Synthetics canaries #

This is a CDK package that sets up several canaries for web properties I own and manage.
The canaries will notify me if these properties go down or break.

I use AWS CloudWatch Synthetics as my canary technology, and AWS CDK for deployment.

## Structure

This is one git repository with two node packages, one nested in the other.
Both are individual node projects, with their own dependencies and build process.

1. in root package, a TypeScript node package with CDK for infrastructure-as-code.
2. in `PhraseShopCanary` and `SchreckCanaries`, TypeScript node packages for the NodeJS/Puppeteer canary.

This CDK deploys the canary code to AWS and creates a supporting alarm.

## Building

One-time: set project-specific settings in CDK context:

    echo '{ "alarmEmailAddress": "<YOUR-EMAIL-ADDRESS>" }' > cdk.context.json

* Build canary: `npm run build-canaries`
* Build CDK: `npm run build`

## Deploying to AWS

Install AWS CDK tooling.

1. Create an IAM user with attached *AdministratorAccess* policy and set environment variables for its credentials.
2. `cdk bootstrap`. This creates the *CDKToolkit* CloudFormation stack.
3. Disable or delete the IAM user.
4. Visit the newly created *CDKToolkit* stack in the console, and make note of its Resource ID prefix to use in the next step.
5. Create an IAM user with the following policy:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sts:AssumeRole"
            ],
            "Resource": [
                "arn:aws:iam::101804781795:role/cdk-hnb659fds-*"
            ]
        }
    ]
}
```

5. Get credentials for the new IAM user from above and set the environment variables.
6. `cdk deploy`. This should succeed without any warnings or errors.

## On versions of dependencies

In the CDK, we specify a runtime for Synthetics. This affects the version of NodeJS and Puppeteer
the canary uses. Hence, keep `package.json` of MainCanary in sync with Synthetics runtime value.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## Resources I used

* https://blog.simonireilly.com/posts/experimental-aws-cdk-v2
* https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries_WritingCanary_Nodejs.html
* https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries_Library_Nodejs.html
* https://docs.aws.amazon.com/cdk/v2/guide/reference.html
* https://docs.aws.amazon.com/cdk/v2/guide/context.html
* https://www.npmjs.com/package/@aws-cdk/aws-synthetics-alpha
* https://github.com/puppeteer/puppeteer/blob/v13.7.0/docs/api.md#

