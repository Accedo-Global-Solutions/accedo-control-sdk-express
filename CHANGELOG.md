# 3.0.0

- BREAKING: New name for this library and the main dependency under GitHub and NPM
- Now using Prettier to style the code

:sparkles: This is the first release published in NPM as `@accedo/accedo-one-express`. It replaces `appgrid-express`.

Accedo One is the new product that replaces AppGrid, and will bring additional possibilities

This library is now depending on `@accedo/accedo-one`, which replaces the obsolete `appgrid`.

We expect this major update to be painless for most people - just make sure to use the `res.locals.accedoOne` variable instead of `res.locals.appgrid` on browsers.

# 2.0.0

TLDR: if you upgrade from `appgrid-express` v1, just make sure to run `npm i -S appgrid` or `yarn add appgrid`.

- BREAKING: `appgrid` is moved from `dependencies` to `devDependencies` and `peerDependencies`.
Users still do not need to import (or require) `appgrid`, but they now must add it to their own project's dependencies.

This small hassle has a larger benefit: NPM and Yarn will be able to tell users when a new version of `appgrid` is available, and to update it independently. Previously, you could miss important bugfixes in `appgrid`.

# 1.1.0

- FEATURE: Add properties to the single exported function.
Those give you access to defaults used, such as the names of the default cookies, or the default `getRequestInfo` function.
This way you can decide to rely on the default `getRequestInfo` but override just the behavior to extract the `deviceId`, for instance.
See what is exported in the docs.

# 1.0.1

- FIX: Update the `appgrid` dependency to version `^3.1.4` as this fixes [an important issue](https://github.com/Accedo-Products/appgrid-sdk-js/blob/master/CHANGELOG.md#314)

# 1.0.0

- First version, extracted from the [AppGrid JS SDK](https://github.com/Accedo-Products/appgrid-sdk-js) v2.3.0 as it is now used for both Node.js and browsers.
