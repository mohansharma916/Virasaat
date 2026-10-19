// @nestjs/schedule ships ES modules only; unit tests never run timers.
export const Cron = (): MethodDecorator => () => undefined;
export const Interval = (): MethodDecorator => () => undefined;
export const Timeout = (): MethodDecorator => () => undefined;
export enum CronExpression {
  EVERY_10_MINUTES = '0 */10 * * * *',
}
export class ScheduleModule {
  static forRoot() {
    return { module: ScheduleModule };
  }
}
