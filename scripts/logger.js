const dotenv = require('dotenv');
const Papertrail = require('winston-papertrail').Papertrail;
const winston = require('winston');
const through = require('through');
const split = require('split');

dotenv.config();

let logger = null;

function ensureLogger() {
  if (logger != null) {
    return;
  }
  logger = winston.createLogger();
  if (process.env.NODE_ENV === 'production') {
    const papertrailTransport = new Papertrail({
      host: process.env.PAPERTRAIL_HOST,
      port: +(process.env.PAPERTRAIL_PORT ?? 0),
    });
    logger.add(papertrailTransport);
    papertrailTransport.on('error', console.error);
  } else {
    // dev env
    logger.add(new winston.transports.Console());
  }
}

/**
 * Returns a function that accepts a stream.
 * `through` supports the utility of taking in
 * stream and performing any side effects (this case logging)
 */
function join() {
  ensureLogger();
  return through((data) => {
    logger.info(data);
  });
}

/**
 * Incoming streams have an upperbound in size. This means that an incoming stream
 * chunk may have one new line, several new lines, or none. `split` handles the internals
 * of splitting these chunks such that each chunk now represents one line.
 */
process.stdin.pipe(split()).pipe(join()).pipe(process.stdout);
process.stderr.pipe(split()).pipe(join()).pipe(process.stdout);

/**
 * Avoid exiting process on any kill signals so we can
 * pipe logs to Papertrail
 */
process.once('SIGINT', () => {});
process.once('SIGTERM', () => {});
