import {Duration} from 'aws-cdk-lib';
import { Construct } from "constructs";
import {Alarm, ComparisonOperator, TreatMissingData} from "aws-cdk-lib/aws-cloudwatch";
import {Schedule} from "aws-cdk-lib/aws-events";
import {Code} from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import {Canary, Runtime, Test} from "@aws-cdk/aws-synthetics-alpha";

export class SchreckConstruct extends Construct {
  public alarm: Alarm;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const canary = new Canary(this, 'Canary', {
      schedule: Schedule.rate(Duration.minutes(15)), // I am not made of money
      test: Test.custom({
        code: Code.fromAsset(path.join(__dirname, '../canary-dist')),
        handler: 'SchreckCanary.handler',
      }),
      // NodeJS/Puppeteer 3.5 runtime provides puppeteer-core 10.1.0, according to AWS documentation.
      // if you change the runtime, change the version(s) in `package.json`.
      runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_5,
      timeToLive: Duration.minutes(1),
      environmentVariables: {
        SITE_URL: "https://schreckski.com",
      },
    });

    this.alarm = new Alarm(this, 'Alarm', {
      metric: canary.metricSuccessPercent({
        period: Duration.minutes(15),
      }),
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      threshold: 100,
      comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.BREACHING,
    });

  }
}