import Winston from 'winston';
import Environment from '../environment';
import { ILoggerWrapper } from '../common/types';

// no typings rn
const Papertrail = require('winston-papertrail').Papertrail;
export class LoggerService implements ILoggerWrapper {
  private _loggerInstance: Winston.Logger;

  public constructor() {
    this._loggerInstance = Winston.createLogger({});

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

    if (process.env.NODE_ENV !== 'production') {
      this._loggerInstance.add(
        new Winston.transports.Console({
          format: Winston.format.combine(Winston.format.timestamp(), Winston.format.simple()),
        })
      );
    } else {
      const papertrailTransport = new Papertrail({
        host: Environment.PapertrailHost,
        port: +(Environment.PapertrailPort || 0),
      });
      papertrailTransport.on('error', console.error);
      this._loggerInstance.add(papertrailTransport);
    }
  }

  public emerg(message: any, ...args: any[]) {
    this._loggerInstance.emerg(message, ...args);
  }

  public alert(message: any, ...args: any[]) {
    this._loggerInstance.alert(message, ...args);
  }

  public crit(message: any, ...args: any[]) {
    this._loggerInstance.crit(message, ...args);
  }

  public error(message: any, ...args: any[]) {
    this._loggerInstance.error(message, ...args);
  }

  public warning(message: any, ...args: any[]) {
    this._loggerInstance.warning(message, ...args);
  }

  public notice(message: any, ...args: any[]) {
    this._loggerInstance.notice(message, ...args);
  }

  public info(message: any, ...args: any[]) {
    this._loggerInstance.info(message, ...args);
  }

  public debug(message: any, ...args: any[]) {
    this._loggerInstance.debug(message, ...args);
  }
}
