import {Duration} from 'aws-cdk-lib';
import { Construct } from "constructs";
import {Alarm, ComparisonOperator, TreatMissingData} from "aws-cdk-lib/aws-cloudwatch";
import {Schedule} from "aws-cdk-lib/aws-events";
import {Code} from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import {Canary, Runtime, Test} from "@aws-cdk/aws-synthetics-alpha";

const CANARY_PERIOD = Duration.minutes(30);

export class SchreckConstruct extends Construct {
  public alarm: Alarm;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const canary = new Canary(this, 'Canary', {
      schedule: Schedule.rate(CANARY_PERIOD),
      test: Test.custom({
        code: Code.fromAsset(path.join(__dirname, '../dist/schreck-canary')),
        handler: 'SchreckCanary.handler',
      }),
      // NodeJS/Puppeteer 3.8 runtime provides puppeteer-core 10.1.0, according to AWS documentation.
      // if you change the runtime, change the version(s) in `package.json`.
      runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_8,
      environmentVariables: {
        SITE_URL: "https://schreckski.com",
      },
    });

    this.alarm = new Alarm(this, 'Alarm', {
      metric: canary.metricSuccessPercent({
        period: CANARY_PERIOD,
      }),
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      threshold: 100,
      comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.BREACHING,
    });

  }
}
