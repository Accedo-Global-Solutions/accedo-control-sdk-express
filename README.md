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
|Yarn|`yarn add appgrid-express`
|NPM|`npm install --save appgrid-express`

Then you can get the default export to use the middleware:

<table>
  <tr>
    <td>
      <pre lang="js">CommonJS</pre>
    </td>
    <td>
      <pre lang="js">const appgrid = require('appgrid-express')</pre>
    </td>
  </tr>
  <tr>
    <td>
      <pre lang="js">ES6 Module</pre>
    </td>
    <td>
      <pre lang="js">import appgrid from 'appgrid-express'</pre>
    </td>
  </tr>
</table>

| Method | Code
|------|------
|CommonJS| <pre lang="js">const appgrid = require('appgrid-express')</pre>
|ES6 Module| <pre lang="js">import appgrid from 'appgrid-express'</pre>


```js
const appgrid = require('appgrid-express')
```
Or, using the ES6 module syntax:
```js
import appgrid from 'appgrid-express'
```

## Examples

### Use the middleware to persist deviceId and sessionKey via cookies

```js
const appgrid = require('appgrid-express');
const express = require('express');

const PORT = 3000;

express()
// handle proxy servers if needed, to pass the user's IP instead of the proxy's.
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

## Unit Tests

Mocha (with Chai) unit tests have been written to cover all of the exported APIs from this module. Follow the following steps in order to run them:

  * Follow the **Getting Started** steps above.
  * Run `npm test`

## License

See the [LICENSE file](./LICENSE.md) for license rights and limitations (Apache 2.0)
