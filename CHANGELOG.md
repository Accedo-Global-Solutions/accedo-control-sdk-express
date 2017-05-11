# 1.1.0

- FEATURE: Add properties to the single exported function.
Those give you access to defaults used, such as the names of the default cookies, or the default `getRequestInfo` function.
This way you can decide to rely on the default `getRequestInfo` but override just the behavior to extract the `deviceId`, for instance.
See what is exported in the docs.

# 1.0.1

- FIX: Update the `appgrid` dependency to version `^3.1.4` as this fixes [an important issue](https://github.com/Accedo-Products/appgrid-sdk-js/blob/master/CHANGELOG.md#314)

# 1.0.0

- First version, extracted from the [AppGrid JS SDK](https://github.com/Accedo-Products/appgrid-sdk-js) v2.3.0 as it is now used for both Node.js and browsers.
