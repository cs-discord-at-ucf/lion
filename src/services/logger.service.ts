import Winston from 'winston';

export class LoggerService {
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
    }
  }

  public get() {
    return this._loggerInstance;
  }
}
