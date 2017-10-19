/* eslint-disable no-unused-expressions */

const chai = require('chai');
const sinon = require('sinon');
const middleware = require('../../src/index');

const should = chai.should();

const NOOP = () => {};
const SOME_IP = '1.3.3.7';

const appKey = '56ea6a370db1bf032c9df5cb';

const buildRequest = (cookies = {}, query = {}) => ({
  cookies,
  query,
  ip: SOME_IP,
});

const buildResponse = () => ({
  locals: {},
  cookie: sinon.spy(),
});

describe('The Express middleware, with basic options', () => {
  const oneMw = middleware({
    appKey,
    gid: 'myGID',
  });

  it('exposes a function', () => {
    middleware.should.be.a('function');
  });

  it('also exposes some defaults as properties of that function', () => {
    middleware.defaultOnDeviceIdGenerated.should.be.a('function');
    middleware.defaultGetRequestInfo.should.be.a('function');
    middleware.defaultOnSessionKeyChanged.should.be.a('function');
    middleware.COOKIE_DEVICE_ID.should.be.a('string');
    middleware.COOKIE_SESSION_KEY.should.be.a('string');
  });

  it('should call the next handler in the Express pipeline', () => {
    const next = sinon.spy();
    oneMw(buildRequest(), buildResponse(), next);
    next.calledOnce.should.be.true;
  });

  it('should attach a configured locals.accedoOneClient response prop as per the parameters and cookies', () => {
    const response = buildResponse();
    const cookies = {
      [middleware.COOKIE_DEVICE_ID]: 'gregTestingSDK',
      [middleware.COOKIE_SESSION_KEY]: 'gregSessionKey',
    };
    oneMw(buildRequest(cookies), response, NOOP);
    const { accedoOneClient } = response.locals;
    accedoOneClient.should.be.an('object');
    accedoOneClient.props.config.appKey.should.equal(appKey);
    accedoOneClient.props.config.gid.should.equal('myGID');
    accedoOneClient.props.config.deviceId.should.equal(
      cookies[middleware.COOKIE_DEVICE_ID]
    );
    accedoOneClient.props.config.sessionKey.should.equal(
      cookies[middleware.COOKIE_SESSION_KEY]
    );
  });

  it('should use the gid from the request if any was found there (even if a gid was set in the middleware config)', () => {
    const response = buildResponse();
    const cookies = {
      [middleware.COOKIE_DEVICE_ID]: 'gregTestingSDK',
      [middleware.COOKIE_SESSION_KEY]: 'gregSessionKey',
    };
    const REQUEST_GID = 'a_cool_gid';
    const query = {
      gid: REQUEST_GID,
    };
    oneMw(buildRequest(cookies, query), response, NOOP);
    const { accedoOneClient } = response.locals;
    accedoOneClient.props.config.gid.should.equal(REQUEST_GID);
  });

  describe('when no deviceId or sessionKey is found in the request cookies', () => {
    const mw = middleware({
      // eslint-disable-line no-shadow
      appKey,
    });
    const response = buildResponse();
    mw(buildRequest(), response, NOOP);
    const { accedoOneClient } = response.locals;

    it('generates the deviceId on invocation and sets the deviceId response cookie', () => {
      const { deviceId } = accedoOneClient.props.config;
      deviceId.should.be.a('string');
      response.cookie.calledWith(middleware.COOKIE_DEVICE_ID, deviceId).should
        .be.true;
    });

    it('does not create a session if not needed', () => {
      const { sessionKey } = accedoOneClient.props.config;
      should.equal(false, !!sessionKey);
      response.cookie.calledWith(middleware.COOKIE_SESSION_KEY).should.be.false;
    });

    it('when a sessionKey is (re)created, sets the sessionKey response cookie', () => {
      return accedoOneClient.getApplicationStatus().then(() => {
        const { sessionKey } = accedoOneClient.props.config;
        sessionKey.should.be.a('string');
        response.cookie.calledWith(middleware.COOKIE_SESSION_KEY, sessionKey)
          .should.be.true;
      });
    });
  });
});

describe('The Express middleware used with the getRequestInfo option', () => {
  describe('when getRequestInfo returns en empty object', () => {
    const mw = middleware({
      appKey,
      gid: 'myGID',
      getRequestInfo: () => ({}),
    });

    it('should ignore the cookies used by the default getRequestInfo', () => {
      const response = buildResponse();
      const cookies = {
        [middleware.COOKIE_DEVICE_ID]: 'gregTestingSDK',
        [middleware.COOKIE_SESSION_KEY]: 'gregSessionKey',
      };
      mw(buildRequest(cookies), response, NOOP);
      const { accedoOneClient } = response.locals;
      accedoOneClient.should.be.an('object');
      // auto-generated deviceId
      accedoOneClient.props.config.deviceId.should.be.a.string;
      accedoOneClient.props.config.deviceId.should.not.equal(
        cookies[middleware.COOKIE_DEVICE_ID]
      );
      // no sessionKey
      should.equal(false, !!accedoOneClient.props.config.sessionKey);
      // gid is set as per the param
      accedoOneClient.props.config.gid.should.equal('myGID');
    });
  });

  describe('when getRequestInfo returns an object with sessionKey', () => {
    const sessionKey = 'MySessionKey';
    const mw = middleware({
      appKey,
      gid: 'myGID',
      getRequestInfo: () => ({
        sessionKey,
      }),
    });

    it('should ignore the cookies used by the default getRequestInfo, NOT use the given sessionKey because the deviceId is missing', () => {
      const response = buildResponse();
      const cookies = {
        [middleware.COOKIE_DEVICE_ID]: 'gregTestingSDK',
        [middleware.COOKIE_SESSION_KEY]: 'gregSessionKey',
      };
      mw(buildRequest(cookies), response, NOOP);
      const { accedoOneClient } = response.locals;
      // deviceId not as per the cookie
      accedoOneClient.props.config.deviceId.should.not.equal(
        cookies[middleware.COOKIE_DEVICE_ID]
      );
      // sessionKey NOT set because it's reset when there's no deviceId reused
      should.equal(false, !!accedoOneClient.props.config.sessionKey);
    });
  });

  describe('when getRequestInfo returns an object with sessionKey and deviceId', () => {
    const sessionKey = 'MyOtherSessionKey';
    const deviceId = 'ABoringDeviceId';
    const gid = 'myGID';
    const mw = middleware({
      appKey,
      gid,
      getRequestInfo: () => ({
        sessionKey,
        deviceId,
      }),
    });

    const response = buildResponse();
    const cookies = {
      [middleware.COOKIE_DEVICE_ID]: 'gregTestingSDK',
      [middleware.COOKIE_SESSION_KEY]: 'gregSessionKey',
    };
    mw(buildRequest(cookies), response, NOOP);
    const { accedoOneClient } = response.locals;

    it('should ignore the cookies used by the default getRequestInfo, use the given sessionKey', () => {
      // deviceId as given (not as per the cookie)
      accedoOneClient.props.config.deviceId.should.equal(deviceId);
      // sessionKey as given because a deviceId was also given
      accedoOneClient.props.config.sessionKey.should.equal(sessionKey);
    });

    it('should keep the gid given in the middleware constructor', () => {
      accedoOneClient.props.config.gid.should.equal(gid);
    });
  });
});
