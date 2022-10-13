import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {SnsAction} from "aws-cdk-lib/aws-cloudwatch-actions";
import {AlarmRule, CompositeAlarm} from "aws-cdk-lib/aws-cloudwatch";
import {Topic} from "aws-cdk-lib/aws-sns";
import {EmailSubscription} from "aws-cdk-lib/aws-sns-subscriptions";

import {SchreckConstruct} from "./SchreckConstruct";

export class MyCanariesStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const schreck = new SchreckConstruct(this, "Schreck");

    const allCanariesAlarm = new CompositeAlarm(this, "AllCanariesAlarm", {
      alarmRule: AlarmRule.anyOf(schreck.alarm),
    });

    const alarmSnsTopic = new Topic(this, 'AlarmSnsTopic');
    allCanariesAlarm.addAlarmAction(new SnsAction(alarmSnsTopic));

    const alarmEmailAddress = this.node.tryGetContext('alarmEmailAddress');
    if (alarmEmailAddress == undefined) throw new Error("Missing email address for the alarm - set `alarmEmailAddress` in CDK context");

    const alarmTopicSub = new EmailSubscription(alarmEmailAddress);
    alarmSnsTopic.addSubscription(alarmTopicSub);
  }
}
