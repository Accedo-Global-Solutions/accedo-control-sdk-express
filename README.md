# The AppGrid Express middleware [![npm](https://img.shields.io/npm/v/appgrid-express.svg?maxAge=3600)](https://www.npmjs.com/package/appgrid-express)

```
*******************************************************************************

       $$$$$$\                       $$$$$$\            $$\       $$\
      $$  __$$\                     $$  __$$\           \__|      $$ |
      $$ /  $$ | $$$$$$\   $$$$$$\  $$ /  \__| $$$$$$\  $$\  $$$$$$$ |
      $$$$$$$$ |$$  __$$\ $$  __$$\ $$ |$$$$\ $$  __$$\ $$ |$$  __$$ |
      $$  __$$ |$$ /  $$ |$$ /  $$ |$$ |\_$$ |$$ |  \__|$$ |$$ /  $$ |
      $$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |      $$ |$$ |  $$ |
      $$ |  $$ |$$$$$$$  |$$$$$$$  |\$$$$$$  |$$ |      $$ |\$$$$$$$ |
      \__|  \__|$$  ____/ $$  ____/  \______/ \__|      \__| \_______|
                $$ |      $$ |
                $$ |      $$ |
                \__|      \__|

*******************************************************************************
```

## Summary

This is the official [Accedo AppGrid](https://www.accedo.tv/appgrid/) middleware for Express.

The [AppGrid SDK](https://github.com/Accedo-Products/appgrid-sdk-js/) provides an easy way to make use of AppGrid APIs.
This middleware provides additional benefits and makes things even easier in the context of an Express app.

We follow [semantic versioning](http://semver.org/), and you may have a look at our change log [here](./CHANGELOG.md).

## Compatibility

This middleware is written in ES6 as supported in Node 6 LTS (the recommended Node.js version).

It should be usable starting from Node 4.

For earlier Node versions, you may try introducing a compilation step to ES5 (through Babel or Buble, for instance). Note we did not test this and **strongly suggest using the current Node LTS (Long Term Support) version**.

Regarding Express, we support and test against version 4.

## Features

Features inherited from the AppGrid SDK :
 - easy access to AppGrid APIs
 - automatic deviceId creation when none was provided
 - automatic session creation when none was provided (lazy - only when needed)
 - automatic session re-creation when the existing one has expired (lazy)
 - ensures only one session will be created at a time, even if a request triggers concurrent AppGrid calls

Extra features provided by this Express middleware :
 - automatic creation of AppGrid client instances for each request, attached to the response object for further use
 - automatically passes the requester's IP onto AppGrid calls for analytics and geolocated services
 - automatic reuse of the deviceId through cookies (can be customized to use anything else based on requests)
 - automatic reuse of the sessionKey through cookies (can be customized to use anything else based on requests)

Note when you use the middleware, you should also [configure Express to handle proxies correctly](http://expressjs.com/en/4x/api.html#trust.proxy.options.table) as we rely on the IP it gives us.
Do read the Express doc, and the note on this further below.

For instance: `app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])`

## Documentation

| What | Link
|------|------
| The AppGrid Express middleware (this project) | https://accedo-products.github.io/appgrid-sdk-express/
| The AppGrid JS SDK | https://accedo-products.github.io/appgrid-sdk-js/
| The AppGrid REST APIs | http://docs.appgrid.apiary.io/

Each Express response gets associated to an AppGrid client instance, found in `res.locals.appgridClient` (when `res` is the response variable name).

To find what methods are available on these instances, refer to the API docs for the AppGrid JS SDK listed above.

The doc for the REST APIs is also listed as AppGrid-specific terminology is defined there.

## Installation

| Your preferred CLI tool | Command
|------|------
|Yarn|`yarn add appgrid appgrid-express`
|NPM|`npm install --save appgrid appgrid-express`

Then you can get the default export to use the middleware:

| Method | Code
|------|------
|CommonJS| <pre lang="js">const appgrid = require('appgrid-express')</pre>
|ES6 Module| <pre lang="js">import appgrid from 'appgrid-express'</pre>

## Examples

### Use the middleware to persist deviceId and sessionKey via cookies

```js
const appgrid = require('appgrid-express');
const express = require('express');

const PORT = 3000;

express()
// handle proxy servers if needed, to pass the user's IP instead of the proxy's. Read more about this further.
.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal'])
// place the appgrid middleware before your request handlers
.use(appgrid({ appKey: '56ea6a370db1bf032c9df5cb' }))
.get('/test', (req, res) => {
   // access your client instance, it's already linked to the deviceId and sessionKey via cookies
   res.locals.appgridClient.getEntryById('56ea7bd6935f75032a2fd431')
   .then(entry => res.send(entry))
   .catch(err => res.status(500).send('Failed to get the result'));
})
.listen(PORT, () => console.log(`Server is on ! Try http://localhost:${PORT}/test`));
```

See also examples in the documentation linked above.

## SDK development

  * Clone/fork this repo
  * Run `yarn` (install it first if needed)
  * Develop !
  * Before pushing, remember to:
    - add tests and check they all pass (`npm test`)
    - document any public API with JSDoc comments and generate the new doc (`npm run doc`)

## More information & Links

* [AppGrid homepage](http://appgrid.accedo.tv/)
* [AppGrid knowledge base and API documentation](http://docs.appgrid.accedo.tv)

## On the Express `trust proxy` setting, and propagating the right IP

The express-appgrid will set the incoming request IP (let's call it `∑`) in the x-forwarded-for (XFF) header, when sending requests to appgrid. The value of `∑` is what Express decides is the user’s IP.

1/ Express just acts normally when no trust proxy is set, using the incoming connection IP. So it sets `∑` to the proper IP on direct user access, and the proxy (or CDN, or such)'s IP when the user went through that.

You want to avoid reporting any proxy's IP, because it would prevent AppGrid's analytics and geolocation features from working reliably.

2/ When setting trust proxy to true (or enabling it, which does the same thing), the behaviour changes.
Now, the value of `∑` will be the first value given in the incoming request's XFF header. “First value” is the left-most value.
So what we are saying is that we trust every single proxy, and whatever ends up in XFF is trusted, so we pick the value that was first set (which is the user's IP when everybody plays nice and respects that order).
Also note, if there is no XFF header, then the connection’s IP is used as a fallback (that’s good ! it means we can handle both CDN and direct connections).

3/ When setting trust proxy to a CSV or array of IPs, those IPs are the proxies we trust. So Express looks at the XFF's right-most IP that does not match any of those trusted proxy: this would be the first “untrusted” IP, and we consider that anything that comes before that is garbage. In that case, the right-most untrusted IP is used as the value of `∑`. Here again, if there’s no XFF, the connection IP is used.

In conclusion, we recommend setting the `trust proxy` value to trust `loopback`, `linklocal`, `uniquelocal`, **AND** all IPs that are part of your proxying / CDN network ahead of the server running appgrid-express.
Depending on your infrastructure, it may sometimes be more suitable to just set the trust proxy setting to true, or to use a custom function to recover the proper IP with a custom strategy.

## Unit Tests

Mocha (with Chai) unit tests have been written to cover all of the exported APIs from this module. Follow the following steps in order to run them:

  * Follow the **Getting Started** steps above.
  * Run `npm test`

## License

See the [LICENSE file](./LICENSE.md) for license rights and limitations (Apache 2.0)
