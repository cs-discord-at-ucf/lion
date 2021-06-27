/* eslint-disable  @typescript-eslint/no-explicit-any*/

import Winston from 'winston';
import { ILoggerWrapper, Mode } from '../common/types';

// Can't import the typescript way.
const Papertrail = require('winston-papertrail').Papertrail;

export class LoggerService implements ILoggerWrapper {
  private _loggerInstance: Winston.Logger;

  public constructor() {
    this._loggerInstance = Winston.createLogger({
      level: 'info',
      format: Winston.format.combine(Winston.format.timestamp(), Winston.format.json()),
      defaultMeta: {},
      transports: [
        new Winston.transports.File({ filename: 'error.log', level: 'error' }),
        new Winston.transports.File({ filename: 'combined.log' }),
      ],
      exceptionHandlers: [new Winston.transports.File({ filename: 'exceptions.log' })],
    });

    if (process.env.NODE_ENV !== Mode.Production || !process.env.PAPERTRAIL_HOST) {
      this._loggerInstance.add(
        new Winston.transports.Console({
          format: Winston.format.combine(Winston.format.timestamp(), Winston.format.simple()),
        })
      );
    } else {
      const papertrailTransport = new Papertrail({
        host: process.env.PAPERTRAIL_HOST,
        port: +(process.env.PAPERTRAIL_PORT ?? 0),
      });
      papertrailTransport.on('error', console.error);
      this._loggerInstance.add(papertrailTransport);
    }
  }

  public error(message: any, ...args: any[]) {
    this._loggerInstance.error(message, ...args);
  }

  public warn(message: any, ...args: any[]) {
    this._loggerInstance.warn(message, ...args);
  }

  public help(message: any, ...args: any[]) {
    this._loggerInstance.help(message, ...args);
  }

  public data(message: any, ...args: any[]) {
    this._loggerInstance.data(message, ...args);
  }

  public info(message: any, ...args: any[]) {
    this._loggerInstance.info(message, ...args);
  }

  public debug(message: any, ...args: any[]) {
    if (process.env.NODE_ENV === Mode.Production) {
      return;
    }
    this._loggerInstance.debug(message, ...args);
  }

  public prompt(message: any, ...args: any[]) {
    this._loggerInstance.prompt(message, ...args);
  }

  public http(message: any, ...args: any[]) {
    this._loggerInstance.http(message, ...args);
  }

  public verbose(message: any, ...args: any[]) {
    this._loggerInstance.verbose(message, ...args);
  }

  public input(message: any, ...args: any[]) {
    this._loggerInstance.input(message, ...args);
  }

  public silly(message: any, ...args: any[]) {
    this._loggerInstance.silly(message, ...args);
  }
}
