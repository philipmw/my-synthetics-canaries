import {Duration, Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {Schedule} from "aws-cdk-lib/aws-events";
import {Code} from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import {Canary, Runtime, Test} from "@aws-cdk/aws-synthetics-alpha";
import {Alarm, ComparisonOperator, TreatMissingData} from "aws-cdk-lib/aws-cloudwatch";
import {SnsAction} from "aws-cdk-lib/aws-cloudwatch-actions";
import {Topic} from "aws-cdk-lib/aws-sns";
import {EmailSubscription} from "aws-cdk-lib/aws-sns-subscriptions";

export class CanaryStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const canary = new Canary(this, 'MainCanary', {
      schedule: Schedule.rate(Duration.minutes(15)), // I am not made of money
      test: Test.custom({
        code: Code.fromAsset(path.join(__dirname, '../canary-dist')),
        handler: 'MainCanary.handler',
      }),
      // NodeJS/Puppeteer 3.5 runtime provides puppeteer-core 10.1.0, according to AWS documentation.
      // if you change the runtime, change the version(s) in `package.json`.
      runtime: Runtime.SYNTHETICS_NODEJS_PUPPETEER_3_5,
      timeToLive: Duration.minutes(1),
      environmentVariables: {
        SITE_URL: "https://schreckski.com",
      },
    });

    const alarm = new Alarm(this, 'CanaryAlarm', {
      metric: canary.metricSuccessPercent({
        period: Duration.minutes(15),
      }),
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      threshold: 100,
      comparisonOperator: ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: TreatMissingData.BREACHING,
    });

    const alarmSnsTopic = new Topic(this, 'AlarmSnsTopic');
    alarm.addAlarmAction(new SnsAction(alarmSnsTopic));

    const alarmEmailAddress = this.node.tryGetContext('alarmEmailAddress');
    if (alarmEmailAddress == undefined) throw new Error("Missing email address for the alarm - set `alarmEmailAddress` in CDK context");

    const alarmTopicSub = new EmailSubscription(alarmEmailAddress);
    alarmSnsTopic.addSubscription(alarmTopicSub);
  }
}
