/* eslint-disable no-unused-expressions */

const chai = require('chai');
const sinon = require('sinon');
const appgridMiddleware = require('../../src/index');

const should = chai.should();

const NOOP = () => {};
const SOME_IP = '1.3.3.7';

const appKey = '56ea6a370db1bf032c9df5cb';

const buildRequest = (cookies = {}, query = {}) => ({
  cookies,
  query,
  ip: SOME_IP
});

const buildResponse = () => ({
  locals: {},
  cookie: sinon.spy()
});

describe('The Express middleware, with basic options', () => {
  const mw = appgridMiddleware({
    appKey,
    gid: 'myGID',
  });

  it('exposes a function', () => {
    appgridMiddleware.should.be.a('function');
  });

  it('also exposes some defaults as properties of that function', () => {
    appgridMiddleware.defaultOnDeviceIdGenerated.should.be.a('function');
    appgridMiddleware.defaultGetRequestInfo.should.be.a('function');
    appgridMiddleware.defaultOnSessionKeyChanged.should.be.a('function');
    appgridMiddleware.COOKIE_DEVICE_ID.should.be.a('string');
    appgridMiddleware.COOKIE_SESSION_KEY.should.be.a('string');
  });

  it('should call the next handler in the Express pipeline', () => {
    const next = sinon.spy();
    mw(buildRequest(), buildResponse(), next);
    next.calledOnce.should.be.true;
  });

  it('should attach a configured locals.appgridClient response prop as per the parameters and cookies', () => {
    const response = buildResponse();
    const cookies = {
      [appgridMiddleware.COOKIE_DEVICE_ID]: 'gregTestingSDK',
      [appgridMiddleware.COOKIE_SESSION_KEY]: 'gregSessionKey'
    };
    mw(buildRequest(cookies), response, NOOP);
    const { appgridClient } = response.locals;
    appgridClient.should.be.an('object');
    appgridClient.props.config.appKey.should.equal(appKey);
    appgridClient.props.config.gid.should.equal('myGID');
    appgridClient.props.config.deviceId.should.equal(cookies[appgridMiddleware.COOKIE_DEVICE_ID]);
    appgridClient.props.config.sessionKey.should.equal(cookies[appgridMiddleware.COOKIE_SESSION_KEY]);
  });

  it('should use the gid from the request if any was found there (even if a gid was set in the middleware config)', () => {
    const response = buildResponse();
    const cookies = {
      [appgridMiddleware.COOKIE_DEVICE_ID]: 'gregTestingSDK',
      [appgridMiddleware.COOKIE_SESSION_KEY]: 'gregSessionKey'
    };
    const REQUEST_GID = 'a_cool_gid';
    const query = {
      gid: REQUEST_GID
    };
    mw(buildRequest(cookies, query), response, NOOP);
    const { appgridClient } = response.locals;
    appgridClient.props.config.gid.should.equal(REQUEST_GID);
  });

  describe('when no deviceId or sessionKey is found in the request cookies', () => {
    const mw = appgridMiddleware({ // eslint-disable-line no-shadow
      appKey,
    });
    const response = buildResponse();
    mw(buildRequest(), response, NOOP);
    const { appgridClient } = response.locals;

    it('generates the deviceId on invocation and sets the deviceId response cookie', () => {
      const { deviceId } = appgridClient.props.config;
      deviceId.should.be.a('string');
      response.cookie.calledWith(appgridMiddleware.COOKIE_DEVICE_ID, deviceId).should.be.true;
    });

    it('does not create a session if not needed', () => {
      const { sessionKey } = appgridClient.props.config;
      should.equal(false, !!sessionKey);
      response.cookie.calledWith(appgridMiddleware.COOKIE_SESSION_KEY).should.be.false;
    });

    it('when a sessionKey is (re)created, sets the sessionKey response cookie', () => {
      return appgridClient.getApplicationStatus().then(() => {
        const { sessionKey } = appgridClient.props.config;
        sessionKey.should.be.a('string');
        response.cookie.calledWith(appgridMiddleware.COOKIE_SESSION_KEY, sessionKey).should.be.true;
      });
    });
  });
});

describe('The Express middleware used with the getRequestInfo option', () => {
  describe('when getRequestInfo returns en empty object', () => {
    const mw = appgridMiddleware({
      appKey,
      gid: 'myGID',
      getRequestInfo: () => ({})
    });

    it('should ignore the cookies used by the default getRequestInfo', () => {
      const response = buildResponse();
      const cookies = {
        [appgridMiddleware.COOKIE_DEVICE_ID]: 'gregTestingSDK',
        [appgridMiddleware.COOKIE_SESSION_KEY]: 'gregSessionKey'
      };
      mw(buildRequest(cookies), response, NOOP);
      const { appgridClient } = response.locals;
      appgridClient.should.be.an('object');
      // auto-generated deviceId
      appgridClient.props.config.deviceId.should.be.a.string;
      appgridClient.props.config.deviceId.should.not.equal(cookies[appgridMiddleware.COOKIE_DEVICE_ID]);
      // no sessionKey
      should.equal(false, !!appgridClient.props.config.sessionKey);
      // gid is set as per the param
      appgridClient.props.config.gid.should.equal('myGID');
    });
  });

  describe('when getRequestInfo returns an object with sessionKey', () => {
    const sessionKey = 'MySessionKey';
    const mw = appgridMiddleware({
      appKey,
      gid: 'myGID',
      getRequestInfo: () => ({
        sessionKey
      })
    });

    it('should ignore the cookies used by the default getRequestInfo, NOT use the given sessionKey because the deviceId is missing', () => {
      const response = buildResponse();
      const cookies = {
        [appgridMiddleware.COOKIE_DEVICE_ID]: 'gregTestingSDK',
        [appgridMiddleware.COOKIE_SESSION_KEY]: 'gregSessionKey'
      };
      mw(buildRequest(cookies), response, NOOP);
      const { appgridClient } = response.locals;
      // deviceId not as per the cookie
      appgridClient.props.config.deviceId.should.not.equal(cookies[appgridMiddleware.COOKIE_DEVICE_ID]);
      // sessionKey NOT set because it's reset when there's no deviceId reused
      should.equal(false, !!appgridClient.props.config.sessionKey);
    });
  });

  describe('when getRequestInfo returns an object with sessionKey and deviceId', () => {
    const sessionKey = 'MyOtherSessionKey';
    const deviceId = 'ABoringDeviceId';
    const gid = 'myGID';
    const mw = appgridMiddleware({
      appKey,
      gid,
      getRequestInfo: () => ({
        sessionKey,
        deviceId
      })
    });

    const response = buildResponse();
    const cookies = {
      [appgridMiddleware.COOKIE_DEVICE_ID]: 'gregTestingSDK',
      [appgridMiddleware.COOKIE_SESSION_KEY]: 'gregSessionKey'
    };
    mw(buildRequest(cookies), response, NOOP);
    const { appgridClient } = response.locals;

    it('should ignore the cookies used by the default getRequestInfo, use the given sessionKey', () => {
      // deviceId as given (not as per the cookie)
      appgridClient.props.config.deviceId.should.equal(deviceId);
      // sessionKey as given because a deviceId was also given
      appgridClient.props.config.sessionKey.should.equal(sessionKey);
    });

    it('should keep the gid given in the middleware constructor', () => {
      appgridClient.props.config.gid.should.equal(gid);
    });
  });
});
