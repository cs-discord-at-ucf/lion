/* eslint-disable  @typescript-eslint/no-explicit-any*/

import Winston from 'winston';
import { Mode } from '../common/types';

// Can't import the typescript way.
const Papertrail = require('winston-papertrail').Papertrail;

export const LoggerService = {
  init() {
    Winston.createLogger({
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
      Winston.add(
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
      Winston.add(papertrailTransport);
    }
  }
};
