const accedoOne = require('@accedo/accedo-one');
const cookieParser = require('cookie-parser')();

const SIXTY_YEARS_IN_MS = 2147483647000;
const COOKIE_DEVICE_ID = 'ag_d';
const COOKIE_SESSION_KEY = 'ag_s';

// default functions for the cookie persistency strategy (deviceId and sessionKey) and gid passed as a query param
const defaultGetRequestInfo = req => ({
  deviceId: req.cookies[COOKIE_DEVICE_ID],
  sessionKey: req.cookies[COOKIE_SESSION_KEY],
  gid: req.query.gid,
});
const defaultOnDeviceIdGenerated = (id, res) =>
  res.cookie(COOKIE_DEVICE_ID, id, {
    maxAge: SIXTY_YEARS_IN_MS,
    httpOnly: true,
  });
const defaultOnSessionKeyChanged = (key, res) =>
  res.cookie(COOKIE_SESSION_KEY, key, {
    maxAge: SIXTY_YEARS_IN_MS,
    httpOnly: true,
  });

/**
 * An express-compatible middleware. This is the only export on this library.
 *
 * It's a function but has some properties attached to it that let you access some defaults:
 *
 * - 3 functions are the default ones for optional parameters detailed below:
 * `defaultOnDeviceIdGenerated`, `defaultGetRequestInfo`, `defaultOnSessionKeyChanged`
 * - 2 strings are the default cookie names:
 * `COOKIE_DEVICE_ID`, `COOKIE_SESSION_KEY`
 *
 * It uses the cookie-parser middleware, so you can also take advantage of the `req.cookies` array.
 *
 * This middleware takes care of creating an Accedo One client instance for each request automatically.
 * By default, it will also reuse and persist the deviceId and sessionKey using the request and response cookies.
 * That strategy can be changed by passing the optional callbacks,
 * so you could make use of headers or request parameters for instance.
 *
 * Each instance is attached to the response object and available to the next express handlers as `res.locals.accedoOneClient`.
 *
 * Note any extra argument provided in the config object will be passed onto the Accedo One client factory during instanciation.
 *
 * @function
 * @param  {object} config the configuration
 * @param  {string} config.appKey the application Key that will be used for all Accedo One clients
 * @param  {function} [config.getRequestInfo] callback that receives the request and returns an object with optional deviceId, sessionKey and gid properties.
 * @param  {function} [config.onDeviceIdGenerated] callback that receives the new deviceId (if one was not returned by getRequestInfo) and the response
 * @param  {function} [config.onSessionKeyChanged] callback that receives the new sessionKey (anytime a new one gets generated) and the response
 * @param  {any} [config.log/gid/etc] You can also pass any extra option accepted by the accedoOne factory function (log, gid, ...)
 * @return {function} a middleware function compatible with express
 * @example <caption>Using the default cookie strategy</caption>
 * const accedoOne = require('@accedo/accedo-one-express');
 * const express = require('express');
 *
 * const PORT = 3000;
 *
 * express()
 * // handle proxy servers if needed, to pass the user's IP instead of the proxy's.
 * .set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])
 * // place the accedoOne middleware before your request handlers
 * .use(accedoOne({ appKey: '56ea6a370db1bf032c9df5cb' }))
 * .get('/test', (req, res) => {
 *    // access your client instance, it's already linked to the deviceId and sessionKey via cookies
 *    res.locals.accedoOneClient.getEntryById('56ea7bd6935f75032a2fd431')
 *    .then(entry => res.send(entry))
 *    .catch(err => res.status(500).send('Failed to get the result'));
 * })
 * .listen(PORT, () => console.log(`Server is on ! Try http://localhost:${PORT}/test`));
 *
 * @example <caption>Using custom headers to extract deviceId and sessionKey and to pass down any change</caption>
 * const accedoOne = require('@accedo/accedo-one-express');
 * const express = require('express');
 *
 * const PORT = 3000;
 * const HEADER_DEVICE_ID = 'X-AG-DEVICE-ID';
 * const HEADER_SESSION_KEY = 'X-AG-SESSION-KEY';
 * const HEADER_GID = 'X-AG-GID';
 *
 * express()
 * .use(accedoOne({
 *   appKey: '56ea6a370db1bf032c9df5cb',
 *   // extract deviceId, sessionKey and gid from custom headers
 *   getRequestInfo: req => ({ deviceId: req.get(HEADER_DEVICE_ID), sessionKey: req.get(HEADER_SESSION_KEY), gid: req.get(HEADER_GID) }),
 *   // pass down any change on the deviceId (the header won't be set if unchanged compared to the value in getRequestInfo)
 *   onDeviceIdGenerated: (id, res) => res.set(HEADER_DEVICE_ID, id),
 *   // pass down any change on the sessionKey (the header won't be set if unchanged compared to the value in getRequestInfo)
 *   onSessionKeyChanged: (key, res) => res.set(HEADER_SESSION_KEY, key),
 *   log(...args) { console.log(...args) }
 * }))
 *
 * @example <caption>Using getRequestInfo and the defaultGetRequestInfo together</caption>
 * const accedoOne = require('@accedo/accedo-one-express');
 * const express = require('express');
 *
 * const PORT = 3000;
 * const HEADER_GID = 'X-AG-GID';
 *
 * express()
 * .use(accedoOne({
 *   appKey: '56ea6a370db1bf032c9df5cb',
 *   // extract the gid from custom headers, but use the default strategy for the deviceId and sessionKey
 *   getRequestInfo: req => Object.assign(accedoOne.defaultGetRequestInfo(req), { gid: req.get(HEADER_GID) }),
 *   log(...args) { console.log(...args) }
 * }))
 */
const accedoOneExpress = config => {
  const {
    getRequestInfo = defaultGetRequestInfo,
    onDeviceIdGenerated = defaultOnDeviceIdGenerated,
    onSessionKeyChanged = defaultOnSessionKeyChanged,
  } = config;
  return (req, res, next) =>
    cookieParser(req, res, () => {
      const { deviceId, sessionKey, gid } = getRequestInfo(req);
      const clientOptions = {
        deviceId,
        sessionKey,
        ip: req.ip,
        onDeviceIdGenerated: id => onDeviceIdGenerated(id, res),
        onSessionKeyChanged: key => onSessionKeyChanged(key, res),
      };
      // Add the gid if it was found by getRequestInfo, and not an empty string (otherwise, we will use the one passed in the config if any)
      if (gid) {
        clientOptions.gid = gid;
      }
      // Let anything given in config pass through as a client option as well
      const client = accedoOne(Object.assign({}, config, clientOptions));
      // res.locals is a good place to store response-scoped data
      res.locals.accedoOneClient = client;
      next();
    });
};

// Export useful defaults so users can wrap them, refer to them, etc
// This is done as members of the `accedoOneExpress` exported function so it's not a breaking change
Object.assign(accedoOneExpress, {
  defaultOnDeviceIdGenerated,
  defaultGetRequestInfo,
  defaultOnSessionKeyChanged,
  COOKIE_DEVICE_ID,
  COOKIE_SESSION_KEY,
});

module.exports = accedoOneExpress;
