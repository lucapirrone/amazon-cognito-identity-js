'use strict';

exports.__esModule = true;

var _awsSdkReactNative = require('aws-sdk/dist/aws-sdk-react-native');

var _BigInteger = require('./BigInteger');

var _BigInteger2 = _interopRequireDefault(_BigInteger);

var _AuthenticationHelper = require('./AuthenticationHelper');

var _AuthenticationHelper2 = _interopRequireDefault(_AuthenticationHelper);

var _CognitoAccessToken = require('./CognitoAccessToken');

var _CognitoAccessToken2 = _interopRequireDefault(_CognitoAccessToken);

var _CognitoIdToken = require('./CognitoIdToken');

var _CognitoIdToken2 = _interopRequireDefault(_CognitoIdToken);

var _CognitoRefreshToken = require('./CognitoRefreshToken');

var _CognitoRefreshToken2 = _interopRequireDefault(_CognitoRefreshToken);

var _CognitoUserSession = require('./CognitoUserSession');

var _CognitoUserSession2 = _interopRequireDefault(_CognitoUserSession);

var _DateHelper = require('./DateHelper');

var _DateHelper2 = _interopRequireDefault(_DateHelper);

var _CognitoUserAttribute = require('./CognitoUserAttribute');

var _CognitoUserAttribute2 = _interopRequireDefault(_CognitoUserAttribute);

var _StorageHelper = require('./StorageHelper');

var _StorageHelper2 = _interopRequireDefault(_StorageHelper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } } /*!
                                                                                                                                                           * Copyright 2016 Amazon.com,
                                                                                                                                                           * Inc. or its affiliates. All Rights Reserved.
                                                                                                                                                           *
                                                                                                                                                           * Licensed under the Amazon Software License (the "License").
                                                                                                                                                           * You may not use this file except in compliance with the
                                                                                                                                                           * License. A copy of the License is located at
                                                                                                                                                           *
                                                                                                                                                           *     http://aws.amazon.com/asl/
                                                                                                                                                           *
                                                                                                                                                           * or in the "license" file accompanying this file. This file is
                                                                                                                                                           * distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
                                                                                                                                                           * CONDITIONS OF ANY KIND, express or implied. See the License
                                                                                                                                                           * for the specific language governing permissions and
                                                                                                                                                           * limitations under the License.
                                                                                                                                                           */

/**
 * @callback nodeCallback
 * @template T result
 * @param {*} err The operation failure reason, or null.
 * @param {T} result The operation result.
 */

/**
 * @callback onFailure
 * @param {*} err Failure reason.
 */

/**
 * @callback onSuccess
 * @template T result
 * @param {T} result The operation result.
 */

/**
 * @callback mfaRequired
 * @param {*} details MFA challenge details.
 */

/**
 * @callback customChallenge
 * @param {*} details Custom challenge details.
 */

/**
 * @callback inputVerificationCode
 * @param {*} data Server response.
 */

/**
 * @callback authSuccess
 * @param {CognitoUserSession} session The new session.
 * @param {bool=} userConfirmationNecessary User must be confirmed.
 */

/** @class */
var CognitoUser = function () {
  /**
   * Constructs a new CognitoUser object
   * @param {object} data Creation options
   * @param {string} data.Username The user's username.
   * @param {CognitoUserPool} data.Pool Pool containing the user.
   * @param {object} data.Storage Optional storage object.
   */
  function CognitoUser(data) {
    _classCallCheck(this, CognitoUser);

    if (data == null || data.Username == null || data.Pool == null) {
      throw new Error('Username and pool information are required.');
    }

    this.username = data.Username || '';
    this.pool = data.Pool;
    this.Session = null;

    this.client = data.Pool.client;

    this.signInUserSession = null;
    this.authenticationFlowType = 'USER_SRP_AUTH';

    this.storage = data.Storage || new _StorageHelper2.default().getStorage();
  }

  /**
   * @returns {CognitoUserSession} the current session for this user
   */


  CognitoUser.prototype.getSignInUserSession = function getSignInUserSession() {
    return this.signInUserSession;
  };

  /**
   * @returns {string} the user's username
   */


  CognitoUser.prototype.getUsername = function getUsername() {
    return this.username;
  };

  /**
   * @returns {String} the authentication flow type
   */


  CognitoUser.prototype.getAuthenticationFlowType = function getAuthenticationFlowType() {
    return this.authenticationFlowType;
  };

  /**
   * sets authentication flow type
   * @param {string} authenticationFlowType New value.
   * @returns {void}
   */


  CognitoUser.prototype.setAuthenticationFlowType = function setAuthenticationFlowType(authenticationFlowType) {
    this.authenticationFlowType = authenticationFlowType;
  };

  /**
   * This is used for authenticating the user. it calls the AuthenticationHelper for SRP related
   * stuff
   * @param {AuthenticationDetails} authDetails Contains the authentication data
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {newPasswordRequired} callback.newPasswordRequired new
   *        password and any required attributes are required to continue
   * @param {mfaRequired} callback.mfaRequired MFA code
   *        required to continue.
   * @param {customChallenge} callback.customChallenge Custom challenge
   *        response required to continue.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @returns {void}
   */


  CognitoUser.prototype.authenticateUser = function authenticateUser(authDetails, callback) {
    var _this = this;

    var authenticationHelper = new _AuthenticationHelper2.default(this.pool.getUserPoolId().split('_')[1]);
    var dateHelper = new _DateHelper2.default();

    var serverBValue = void 0;
    var salt = void 0;
    var authParameters = {};

    if (this.deviceKey != null) {
      authParameters.DEVICE_KEY = this.deviceKey;
    }

    authParameters.USERNAME = this.username;
    authParameters.SRP_A = authenticationHelper.getLargeAValue().toString(16);

    if (this.authenticationFlowType === 'CUSTOM_AUTH') {
      authParameters.CHALLENGE_NAME = 'SRP_A';
    }

    this.client.makeUnauthenticatedRequest('initiateAuth', {
      AuthFlow: this.authenticationFlowType,
      ClientId: this.pool.getClientId(),
      AuthParameters: authParameters,
      ClientMetadata: authDetails.getValidationData()
    }, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }

      var challengeParameters = data.ChallengeParameters;

      _this.username = challengeParameters.USER_ID_FOR_SRP;
      serverBValue = new _BigInteger2.default(challengeParameters.SRP_B, 16);
      salt = new _BigInteger2.default(challengeParameters.SALT, 16);
      _this.getCachedDeviceKeyAndPassword();

      var hkdf = authenticationHelper.getPasswordAuthenticationKey(_this.username, authDetails.getPassword(), serverBValue, salt);

      var dateNow = dateHelper.getNowString();

      var signatureString = _awsSdkReactNative.util.crypto.hmac(hkdf, _awsSdkReactNative.util.buffer.concat([new _awsSdkReactNative.util.Buffer(_this.pool.getUserPoolId().split('_')[1], 'utf8'), new _awsSdkReactNative.util.Buffer(_this.username, 'utf8'), new _awsSdkReactNative.util.Buffer(challengeParameters.SECRET_BLOCK, 'base64'), new _awsSdkReactNative.util.Buffer(dateNow, 'utf8')]), 'base64', 'sha256');

      var challengeResponses = {};

      challengeResponses.USERNAME = _this.username;
      challengeResponses.PASSWORD_CLAIM_SECRET_BLOCK = challengeParameters.SECRET_BLOCK;
      challengeResponses.TIMESTAMP = dateNow;
      challengeResponses.PASSWORD_CLAIM_SIGNATURE = signatureString;

      if (_this.deviceKey != null) {
        challengeResponses.DEVICE_KEY = _this.deviceKey;
      }

      var respondToAuthChallenge = function respondToAuthChallenge(challenge, challengeCallback) {
        return _this.client.makeUnauthenticatedRequest('respondToAuthChallenge', challenge, function (errChallenge, dataChallenge) {
          if (errChallenge && errChallenge.code === 'ResourceNotFoundException' && errChallenge.message.toLowerCase().indexOf('device') !== -1) {
            challengeResponses.DEVICE_KEY = null;
            _this.deviceKey = null;
            _this.randomPassword = null;
            _this.deviceGroupKey = null;
            _this.clearCachedDeviceKeyAndPassword();
            return respondToAuthChallenge(challenge, challengeCallback);
          }
          return challengeCallback(errChallenge, dataChallenge);
        });
      };

      respondToAuthChallenge({
        ChallengeName: 'PASSWORD_VERIFIER',
        ClientId: _this.pool.getClientId(),
        ChallengeResponses: challengeResponses,
        Session: data.Session
      }, function (errAuthenticate, dataAuthenticate) {
        if (errAuthenticate) {
          return callback.onFailure(errAuthenticate);
        }

        var challengeName = dataAuthenticate.ChallengeName;
        if (challengeName === 'NEW_PASSWORD_REQUIRED') {
          _this.Session = dataAuthenticate.Session;
          var userAttributes = null;
          var rawRequiredAttributes = null;
          var requiredAttributes = [];
          var userAttributesPrefix = authenticationHelper.getNewPasswordRequiredChallengeUserAttributePrefix();

          if (dataAuthenticate.ChallengeParameters) {
            userAttributes = JSON.parse(dataAuthenticate.ChallengeParameters.userAttributes);
            rawRequiredAttributes = JSON.parse(dataAuthenticate.ChallengeParameters.requiredAttributes);
          }

          if (rawRequiredAttributes) {
            for (var i = 0; i < rawRequiredAttributes.length; i++) {
              requiredAttributes[i] = rawRequiredAttributes[i].substr(userAttributesPrefix.length);
            }
          }
          return callback.newPasswordRequired(userAttributes, requiredAttributes);
        }
        return _this.authenticateUserInternal(dataAuthenticate, authenticationHelper, callback);
      });
      return undefined;
    });
  };

  /**
  * PRIVATE ONLY: This is an internal only method and should not
  * be directly called by the consumers.
  * @param {object} dataAuthenticate authentication data
  * @param {object} authenticationHelper helper created
  * @param {callback} callback passed on from caller
  * @returns {void}
  */


  CognitoUser.prototype.authenticateUserInternal = function authenticateUserInternal(dataAuthenticate, authenticationHelper, callback) {
    var _this2 = this;

    var challengeName = dataAuthenticate.ChallengeName;
    var challengeParameters = dataAuthenticate.ChallengeParameters;

    if (challengeName === 'SMS_MFA') {
      this.Session = dataAuthenticate.Session;
      return callback.mfaRequired(challengeName, challengeParameters);
    }

    if (challengeName === 'CUSTOM_CHALLENGE') {
      this.Session = dataAuthenticate.Session;
      return callback.customChallenge(challengeParameters);
    }

    if (challengeName === 'DEVICE_SRP_AUTH') {
      this.getDeviceResponse(callback);
      return undefined;
    }

    this.signInUserSession = this.getCognitoUserSession(dataAuthenticate.AuthenticationResult);
    this.cacheTokens();

    var newDeviceMetadata = dataAuthenticate.AuthenticationResult.NewDeviceMetadata;
    if (newDeviceMetadata == null) {
      return callback.onSuccess(this.signInUserSession);
    }

    authenticationHelper.generateHashDevice(dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceGroupKey, dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceKey);

    var deviceSecretVerifierConfig = {
      Salt: new _awsSdkReactNative.util.Buffer(authenticationHelper.getSaltDevices(), 'hex').toString('base64'),
      PasswordVerifier: new _awsSdkReactNative.util.Buffer(authenticationHelper.getVerifierDevices(), 'hex').toString('base64')
    };

    this.verifierDevices = deviceSecretVerifierConfig.PasswordVerifier;
    this.deviceGroupKey = newDeviceMetadata.DeviceGroupKey;
    this.randomPassword = authenticationHelper.getRandomPassword();

    this.client.makeUnauthenticatedRequest('confirmDevice', {
      DeviceKey: newDeviceMetadata.DeviceKey,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      DeviceSecretVerifierConfig: deviceSecretVerifierConfig,
      DeviceName: navigator.userAgent
    }, function (errConfirm, dataConfirm) {
      if (errConfirm) {
        return callback.onFailure(errConfirm);
      }

      _this2.deviceKey = dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceKey;
      _this2.cacheDeviceKeyAndPassword();
      if (dataConfirm.UserConfirmationNecessary === true) {
        return callback.onSuccess(_this2.signInUserSession, dataConfirm.UserConfirmationNecessary);
      }
      return callback.onSuccess(_this2.signInUserSession);
    });
    return undefined;
  };

  /**
  * This method is user to complete the NEW_PASSWORD_REQUIRED challenge.
  * Pass the new password with any new user attributes to be updated.
  * User attribute keys must be of format userAttributes.<attribute_name>.
  * @param {string} newPassword new password for this user
  * @param {object} requiredAttributeData map with values for all required attributes
  * @param {object} callback Result callback map.
  * @param {onFailure} callback.onFailure Called on any error.
  * @param {mfaRequired} callback.mfaRequired MFA code required to continue.
  * @param {customChallenge} callback.customChallenge Custom challenge
  *         response required to continue.
  * @param {authSuccess} callback.onSuccess Called on success with the new session.
  * @returns {void}
  */


  CognitoUser.prototype.completeNewPasswordChallenge = function completeNewPasswordChallenge(newPassword, requiredAttributeData, callback) {
    var _this3 = this;

    if (!newPassword) {
      return callback.onFailure(new Error('New password is required.'));
    }
    var authenticationHelper = new _AuthenticationHelper2.default(this.pool.getUserPoolId().split('_')[1]);
    var userAttributesPrefix = authenticationHelper.getNewPasswordRequiredChallengeUserAttributePrefix();

    var finalUserAttributes = {};
    if (requiredAttributeData) {
      Object.keys(requiredAttributeData).forEach(function (key) {
        finalUserAttributes[userAttributesPrefix + key] = requiredAttributeData[key];
      });
    }

    finalUserAttributes.NEW_PASSWORD = newPassword;
    finalUserAttributes.USERNAME = this.username;
    this.client.makeUnauthenticatedRequest('respondToAuthChallenge', {
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      ClientId: this.pool.getClientId(),
      ChallengeResponses: finalUserAttributes,
      Session: this.Session
    }, function (errAuthenticate, dataAuthenticate) {
      if (errAuthenticate) {
        return callback.onFailure(errAuthenticate);
      }
      return _this3.authenticateUserInternal(dataAuthenticate, authenticationHelper, callback);
    });
    return undefined;
  };

  /**
   * This is used to get a session using device authentication. It is called at the end of user
   * authentication
   *
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @returns {void}
   * @private
   */


  CognitoUser.prototype.getDeviceResponse = function getDeviceResponse(callback) {
    var _this4 = this;

    var authenticationHelper = new _AuthenticationHelper2.default(this.deviceGroupKey);
    var dateHelper = new _DateHelper2.default();

    var authParameters = {};

    authParameters.USERNAME = this.username;
    authParameters.DEVICE_KEY = this.deviceKey;
    authParameters.SRP_A = authenticationHelper.getLargeAValue().toString(16);

    this.client.makeUnauthenticatedRequest('respondToAuthChallenge', {
      ChallengeName: 'DEVICE_SRP_AUTH',
      ClientId: this.pool.getClientId(),
      ChallengeResponses: authParameters
    }, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }

      var challengeParameters = data.ChallengeParameters;

      var serverBValue = new _BigInteger2.default(challengeParameters.SRP_B, 16);
      var salt = new _BigInteger2.default(challengeParameters.SALT, 16);

      var hkdf = authenticationHelper.getPasswordAuthenticationKey(_this4.deviceKey, _this4.randomPassword, serverBValue, salt);

      var dateNow = dateHelper.getNowString();

      var signatureString = _awsSdkReactNative.util.crypto.hmac(hkdf, _awsSdkReactNative.util.buffer.concat([new _awsSdkReactNative.util.Buffer(_this4.deviceGroupKey, 'utf8'), new _awsSdkReactNative.util.Buffer(_this4.deviceKey, 'utf8'), new _awsSdkReactNative.util.Buffer(challengeParameters.SECRET_BLOCK, 'base64'), new _awsSdkReactNative.util.Buffer(dateNow, 'utf8')]), 'base64', 'sha256');

      var challengeResponses = {};

      challengeResponses.USERNAME = _this4.username;
      challengeResponses.PASSWORD_CLAIM_SECRET_BLOCK = challengeParameters.SECRET_BLOCK;
      challengeResponses.TIMESTAMP = dateNow;
      challengeResponses.PASSWORD_CLAIM_SIGNATURE = signatureString;
      challengeResponses.DEVICE_KEY = _this4.deviceKey;

      _this4.client.makeUnauthenticatedRequest('respondToAuthChallenge', {
        ChallengeName: 'DEVICE_PASSWORD_VERIFIER',
        ClientId: _this4.pool.getClientId(),
        ChallengeResponses: challengeResponses,
        Session: data.Session
      }, function (errAuthenticate, dataAuthenticate) {
        if (errAuthenticate) {
          return callback.onFailure(errAuthenticate);
        }

        _this4.signInUserSession = _this4.getCognitoUserSession(dataAuthenticate.AuthenticationResult);
        _this4.cacheTokens();

        return callback.onSuccess(_this4.signInUserSession);
      });
      return undefined;
    });
  };

  /**
   * This is used for a certain user to confirm the registration by using a confirmation code
   * @param {string} confirmationCode Code entered by user.
   * @param {bool} forceAliasCreation Allow migrating from an existing email / phone number.
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.confirmRegistration = function confirmRegistration(confirmationCode, forceAliasCreation, callback) {
    this.client.makeUnauthenticatedRequest('confirmSignUp', {
      ClientId: this.pool.getClientId(),
      ConfirmationCode: confirmationCode,
      Username: this.username,
      ForceAliasCreation: forceAliasCreation
    }, function (err) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, 'SUCCESS');
    });
  };

  /**
   * This is used by the user once he has the responses to a custom challenge
   * @param {string} answerChallenge The custom challange answer.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {customChallenge} callback.customChallenge
   *    Custom challenge response required to continue.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @returns {void}
   */


  CognitoUser.prototype.sendCustomChallengeAnswer = function sendCustomChallengeAnswer(answerChallenge, callback) {
    var _this5 = this;

    var challengeResponses = {};
    challengeResponses.USERNAME = this.username;
    challengeResponses.ANSWER = answerChallenge;

    this.client.makeUnauthenticatedRequest('respondToAuthChallenge', {
      ChallengeName: 'CUSTOM_CHALLENGE',
      ChallengeResponses: challengeResponses,
      ClientId: this.pool.getClientId(),
      Session: this.Session
    }, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }

      var challengeName = data.ChallengeName;

      if (challengeName === 'CUSTOM_CHALLENGE') {
        _this5.Session = data.Session;
        return callback.customChallenge(data.ChallengeParameters);
      }

      _this5.signInUserSession = _this5.getCognitoUserSession(data.AuthenticationResult);
      _this5.cacheTokens();
      return callback.onSuccess(_this5.signInUserSession);
    });
  };

  /**
   * This is used by the user once he has an MFA code
   * @param {string} confirmationCode The MFA code entered by the user.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {authSuccess} callback.onSuccess Called on success with the new session.
   * @returns {void}
   */


  CognitoUser.prototype.sendMFACode = function sendMFACode(confirmationCode, callback) {
    var _this6 = this;

    var challengeResponses = {};
    challengeResponses.USERNAME = this.username;
    challengeResponses.SMS_MFA_CODE = confirmationCode;

    if (this.deviceKey != null) {
      challengeResponses.DEVICE_KEY = this.deviceKey;
    }

    this.client.makeUnauthenticatedRequest('respondToAuthChallenge', {
      ChallengeName: 'SMS_MFA',
      ChallengeResponses: challengeResponses,
      ClientId: this.pool.getClientId(),
      Session: this.Session
    }, function (err, dataAuthenticate) {
      if (err) {
        return callback.onFailure(err);
      }

      var challengeName = dataAuthenticate.ChallengeName;

      if (challengeName === 'DEVICE_SRP_AUTH') {
        _this6.getDeviceResponse(callback);
        return undefined;
      }

      _this6.signInUserSession = _this6.getCognitoUserSession(dataAuthenticate.AuthenticationResult);
      _this6.cacheTokens();

      if (dataAuthenticate.AuthenticationResult.NewDeviceMetadata == null) {
        return callback.onSuccess(_this6.signInUserSession);
      }

      var authenticationHelper = new _AuthenticationHelper2.default(_this6.pool.getUserPoolId().split('_')[1]);
      authenticationHelper.generateHashDevice(dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceGroupKey, dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceKey);

      var deviceSecretVerifierConfig = {
        Salt: new _awsSdkReactNative.util.Buffer(authenticationHelper.getSaltDevices(), 'hex').toString('base64'),
        PasswordVerifier: new _awsSdkReactNative.util.Buffer(authenticationHelper.getVerifierDevices(), 'hex').toString('base64')
      };

      _this6.verifierDevices = deviceSecretVerifierConfig.PasswordVerifier;
      _this6.deviceGroupKey = dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceGroupKey;
      _this6.randomPassword = authenticationHelper.getRandomPassword();

      _this6.client.makeUnauthenticatedRequest('confirmDevice', {
        DeviceKey: dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceKey,
        AccessToken: _this6.signInUserSession.getAccessToken().getJwtToken(),
        DeviceSecretVerifierConfig: deviceSecretVerifierConfig,
        DeviceName: navigator.userAgent
      }, function (errConfirm, dataConfirm) {
        if (errConfirm) {
          return callback.onFailure(errConfirm);
        }

        _this6.deviceKey = dataAuthenticate.AuthenticationResult.NewDeviceMetadata.DeviceKey;
        _this6.cacheDeviceKeyAndPassword();
        if (dataConfirm.UserConfirmationNecessary === true) {
          return callback.onSuccess(_this6.signInUserSession, dataConfirm.UserConfirmationNecessary);
        }
        return callback.onSuccess(_this6.signInUserSession);
      });
      return undefined;
    });
  };

  /**
   * This is used by an authenticated user to change the current password
   * @param {string} oldUserPassword The current password.
   * @param {string} newUserPassword The requested new password.
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.changePassword = function changePassword(oldUserPassword, newUserPassword, callback) {
    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.makeUnauthenticatedRequest('changePassword', {
      PreviousPassword: oldUserPassword,
      ProposedPassword: newUserPassword,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, 'SUCCESS');
    });
    return undefined;
  };

  /**
   * This is used by an authenticated user to enable MFA for himself
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.enableMFA = function enableMFA(callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback(new Error('User is not authenticated'), null);
    }

    var mfaOptions = [];
    var mfaEnabled = {
      DeliveryMedium: 'SMS',
      AttributeName: 'phone_number'
    };
    mfaOptions.push(mfaEnabled);

    this.client.makeUnauthenticatedRequest('setUserSettings', {
      MFAOptions: mfaOptions,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, 'SUCCESS');
    });
    return undefined;
  };

  /**
   * This is used by an authenticated user to disable MFA for himself
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.disableMFA = function disableMFA(callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback(new Error('User is not authenticated'), null);
    }

    var mfaOptions = [];

    this.client.makeUnauthenticatedRequest('setUserSettings', {
      MFAOptions: mfaOptions,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, 'SUCCESS');
    });
    return undefined;
  };

  /**
   * This is used by an authenticated user to delete himself
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.deleteUser = function deleteUser(callback) {
    var _this7 = this;

    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.makeUnauthenticatedRequest('deleteUser', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback(err, null);
      }
      _this7.clearCachedTokens();
      return callback(null, 'SUCCESS');
    });
    return undefined;
  };

  /**
   * @typedef {CognitoUserAttribute | { Name:string, Value:string }} AttributeArg
   */
  /**
   * This is used by an authenticated user to change a list of attributes
   * @param {AttributeArg[]} attributes A list of the new user attributes.
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.updateAttributes = function updateAttributes(attributes, callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.makeUnauthenticatedRequest('updateUserAttributes', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      UserAttributes: attributes
    }, function (err) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, 'SUCCESS');
    });
    return undefined;
  };

  /**
   * This is used by an authenticated user to get a list of attributes
   * @param {nodeCallback<CognitoUserAttribute[]>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.getUserAttributes = function getUserAttributes(callback) {
    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.makeUnauthenticatedRequest('getUser', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err, userData) {
      if (err) {
        return callback(err, null);
      }

      var attributeList = [];

      for (var i = 0; i < userData.UserAttributes.length; i++) {
        var attribute = {
          Name: userData.UserAttributes[i].Name,
          Value: userData.UserAttributes[i].Value
        };
        var userAttribute = new _CognitoUserAttribute2.default(attribute);
        attributeList.push(userAttribute);
      }

      return callback(null, attributeList);
    });
    return undefined;
  };

  /**
   * This is used by an authenticated user to get the MFAOptions
   * @param {nodeCallback<MFAOptions>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.getMFAOptions = function getMFAOptions(callback) {
    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.makeUnauthenticatedRequest('getUser', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err, userData) {
      if (err) {
        return callback(err, null);
      }

      return callback(null, userData.MFAOptions);
    });
    return undefined;
  };

  /**
   * This is used by an authenticated user to delete a list of attributes
   * @param {string[]} attributeList Names of the attributes to delete.
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.deleteAttributes = function deleteAttributes(attributeList, callback) {
    if (!(this.signInUserSession != null && this.signInUserSession.isValid())) {
      return callback(new Error('User is not authenticated'), null);
    }

    this.client.makeUnauthenticatedRequest('deleteUserAttributes', {
      UserAttributeNames: attributeList,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, 'SUCCESS');
    });
    return undefined;
  };

  /**
   * This is used by a user to resend a confirmation code
   * @param {nodeCallback<string>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.resendConfirmationCode = function resendConfirmationCode(callback) {
    this.client.makeUnauthenticatedRequest('resendConfirmationCode', {
      ClientId: this.pool.getClientId(),
      Username: this.username
    }, function (err, result) {
      if (err) {
        return callback(err, null);
      }
      return callback(null, result);
    });
  };

  /**
   * This is used to get a session, either from the session object
   * or from  the local storage, or by using a refresh token
   *
   * @param {nodeCallback<CognitoUserSession>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.getSession = function getSession(callback) {
    if (this.username == null) {
      return callback(new Error('Username is null. Cannot retrieve a new session'), null);
    }

    if (this.signInUserSession != null && this.signInUserSession.isValid()) {
      return callback(null, this.signInUserSession);
    }

    var keyPrefix = 'CognitoIdentityServiceProvider.' + this.pool.getClientId() + '.' + this.username;
    var idTokenKey = keyPrefix + '.idToken';
    var accessTokenKey = keyPrefix + '.accessToken';
    var refreshTokenKey = keyPrefix + '.refreshToken';

    if (this.storage.getItem(idTokenKey)) {
      var idToken = new _CognitoIdToken2.default({
        IdToken: this.storage.getItem(idTokenKey)
      });
      var accessToken = new _CognitoAccessToken2.default({
        AccessToken: this.storage.getItem(accessTokenKey)
      });
      var refreshToken = new _CognitoRefreshToken2.default({
        RefreshToken: this.storage.getItem(refreshTokenKey)
      });

      var sessionData = {
        IdToken: idToken,
        AccessToken: accessToken,
        RefreshToken: refreshToken
      };
      var cachedSession = new _CognitoUserSession2.default(sessionData);
      if (cachedSession.isValid()) {
        this.signInUserSession = cachedSession;
        return callback(null, this.signInUserSession);
      }

      if (refreshToken.getToken() == null) {
        return callback(new Error('Cannot retrieve a new session. Please authenticate.'), null);
      }

      this.refreshSession(refreshToken, callback);
    } else {
      callback(new Error('Local storage is missing an ID Token, Please authenticate'), null);
    }

    return undefined;
  };

  /**
   * This uses the refreshToken to retrieve a new session
   * @param {CognitoRefreshToken} refreshToken A previous session's refresh token.
   * @param {nodeCallback<CognitoUserSession>} callback Called on success or error.
   * @returns {void}
   */


  CognitoUser.prototype.refreshSession = function refreshSession(refreshToken, callback) {
    var _this8 = this;

    var authParameters = {};
    authParameters.REFRESH_TOKEN = refreshToken.getToken();
    var keyPrefix = 'CognitoIdentityServiceProvider.' + this.pool.getClientId();
    var lastUserKey = keyPrefix + '.LastAuthUser';

    if (this.storage.getItem(lastUserKey)) {
      this.username = this.storage.getItem(lastUserKey);
      var deviceKeyKey = keyPrefix + '.' + this.username + '.deviceKey';
      this.deviceKey = this.storage.getItem(deviceKeyKey);
      authParameters.DEVICE_KEY = this.deviceKey;
    }

    this.client.makeUnauthenticatedRequest('initiateAuth', {
      ClientId: this.pool.getClientId(),
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: authParameters
    }, function (err, authResult) {
      if (err) {
        if (err.code === 'NotAuthorizedException') {
          _this8.clearCachedTokens();
        }
        return callback(err, null);
      }
      if (authResult) {
        var authenticationResult = authResult.AuthenticationResult;
        if (!Object.prototype.hasOwnProperty.call(authenticationResult, 'RefreshToken')) {
          authenticationResult.RefreshToken = refreshToken.getToken();
        }
        _this8.signInUserSession = _this8.getCognitoUserSession(authenticationResult);
        _this8.cacheTokens();
        return callback(null, _this8.signInUserSession);
      }
      return undefined;
    });
  };

  /**
   * This is used to save the session tokens to local storage
   * @returns {void}
   */


  CognitoUser.prototype.cacheTokens = function cacheTokens() {
    var keyPrefix = 'CognitoIdentityServiceProvider.' + this.pool.getClientId();
    var idTokenKey = keyPrefix + '.' + this.username + '.idToken';
    var accessTokenKey = keyPrefix + '.' + this.username + '.accessToken';
    var refreshTokenKey = keyPrefix + '.' + this.username + '.refreshToken';
    var lastUserKey = keyPrefix + '.LastAuthUser';

    this.storage.setItem(idTokenKey, this.signInUserSession.getIdToken().getJwtToken());
    this.storage.setItem(accessTokenKey, this.signInUserSession.getAccessToken().getJwtToken());
    this.storage.setItem(refreshTokenKey, this.signInUserSession.getRefreshToken().getToken());
    this.storage.setItem(lastUserKey, this.username);
  };

  /**
   * This is used to cache the device key and device group and device password
   * @returns {void}
   */


  CognitoUser.prototype.cacheDeviceKeyAndPassword = function cacheDeviceKeyAndPassword() {
    var keyPrefix = 'CognitoIdentityServiceProvider.' + this.pool.getClientId() + '.' + this.username;
    var deviceKeyKey = keyPrefix + '.deviceKey';
    var randomPasswordKey = keyPrefix + '.randomPasswordKey';
    var deviceGroupKeyKey = keyPrefix + '.deviceGroupKey';

    this.storage.setItem(deviceKeyKey, this.deviceKey);
    this.storage.setItem(randomPasswordKey, this.randomPassword);
    this.storage.setItem(deviceGroupKeyKey, this.deviceGroupKey);
  };

  /**
   * This is used to get current device key and device group and device password
   * @returns {void}
   */


  CognitoUser.prototype.getCachedDeviceKeyAndPassword = function getCachedDeviceKeyAndPassword() {
    var keyPrefix = 'CognitoIdentityServiceProvider.' + this.pool.getClientId() + '.' + this.username;
    var deviceKeyKey = keyPrefix + '.deviceKey';
    var randomPasswordKey = keyPrefix + '.randomPasswordKey';
    var deviceGroupKeyKey = keyPrefix + '.deviceGroupKey';

    if (this.storage.getItem(deviceKeyKey)) {
      this.deviceKey = this.storage.getItem(deviceKeyKey);
      this.randomPassword = this.storage.getItem(randomPasswordKey);
      this.deviceGroupKey = this.storage.getItem(deviceGroupKeyKey);
    }
  };

  /**
   * This is used to clear the device key info from local storage
   * @returns {void}
   */


  CognitoUser.prototype.clearCachedDeviceKeyAndPassword = function clearCachedDeviceKeyAndPassword() {
    var keyPrefix = 'CognitoIdentityServiceProvider.' + this.pool.getClientId() + '.' + this.username;
    var deviceKeyKey = keyPrefix + '.deviceKey';
    var randomPasswordKey = keyPrefix + '.randomPasswordKey';
    var deviceGroupKeyKey = keyPrefix + '.deviceGroupKey';

    this.storage.removeItem(deviceKeyKey);
    this.storage.removeItem(randomPasswordKey);
    this.storage.removeItem(deviceGroupKeyKey);
  };

  /**
   * This is used to clear the session tokens from local storage
   * @returns {void}
   */


  CognitoUser.prototype.clearCachedTokens = function clearCachedTokens() {
    var keyPrefix = 'CognitoIdentityServiceProvider.' + this.pool.getClientId();
    var idTokenKey = keyPrefix + '.' + this.username + '.idToken';
    var accessTokenKey = keyPrefix + '.' + this.username + '.accessToken';
    var refreshTokenKey = keyPrefix + '.' + this.username + '.refreshToken';
    var lastUserKey = keyPrefix + '.LastAuthUser';

    this.storage.removeItem(idTokenKey);
    this.storage.removeItem(accessTokenKey);
    this.storage.removeItem(refreshTokenKey);
    this.storage.removeItem(lastUserKey);
  };

  /**
   * This is used to build a user session from tokens retrieved in the authentication result
   * @param {object} authResult Successful auth response from server.
   * @returns {CognitoUserSession} The new user session.
   * @private
   */


  CognitoUser.prototype.getCognitoUserSession = function getCognitoUserSession(authResult) {
    var idToken = new _CognitoIdToken2.default(authResult);
    var accessToken = new _CognitoAccessToken2.default(authResult);
    var refreshToken = new _CognitoRefreshToken2.default(authResult);

    var sessionData = {
      IdToken: idToken,
      AccessToken: accessToken,
      RefreshToken: refreshToken
    };

    return new _CognitoUserSession2.default(sessionData);
  };

  /**
   * This is used to initiate a forgot password request
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {inputVerificationCode?} callback.inputVerificationCode
   *    Optional callback raised instead of onSuccess with response data.
   * @param {onSuccess<void>?} callback.onSuccess Called on success.
   * @returns {void}
   */


  CognitoUser.prototype.forgotPassword = function forgotPassword(callback) {
    this.client.makeUnauthenticatedRequest('forgotPassword', {
      ClientId: this.pool.getClientId(),
      Username: this.username
    }, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }
      if (typeof callback.inputVerificationCode === 'function') {
        return callback.inputVerificationCode(data);
      }
      return callback.onSuccess();
    });
  };

  /**
   * This is used to confirm a new password using a confirmationCode
   * @param {string} confirmationCode Code entered by user.
   * @param {string} newPassword Confirm new password.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<void>} callback.onSuccess Called on success.
   * @returns {void}
   */


  CognitoUser.prototype.confirmPassword = function confirmPassword(confirmationCode, newPassword, callback) {
    this.client.makeUnauthenticatedRequest('confirmForgotPassword', {
      ClientId: this.pool.getClientId(),
      Username: this.username,
      ConfirmationCode: confirmationCode,
      Password: newPassword
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }
      return callback.onSuccess();
    });
  };

  /**
   * This is used to initiate an attribute confirmation request
   * @param {string} attributeName User attribute that needs confirmation.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {inputVerificationCode} callback.inputVerificationCode Called on success.
   * @returns {void}
   */


  CognitoUser.prototype.getAttributeVerificationCode = function getAttributeVerificationCode(attributeName, callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.makeUnauthenticatedRequest('getUserAttributeVerificationCode', {
      AttributeName: attributeName,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }
      if (typeof callback.inputVerificationCode === 'function') {
        return callback.inputVerificationCode(data);
      }
      return callback.onSuccess();
    });
    return undefined;
  };

  /**
   * This is used to confirm an attribute using a confirmation code
   * @param {string} attributeName Attribute being confirmed.
   * @param {string} confirmationCode Code entered by user.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */


  CognitoUser.prototype.verifyAttribute = function verifyAttribute(attributeName, confirmationCode, callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.makeUnauthenticatedRequest('verifyUserAttribute', {
      AttributeName: attributeName,
      Code: confirmationCode,
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }
      return callback.onSuccess('SUCCESS');
    });
    return undefined;
  };

  /**
   * This is used to get the device information using the current device key
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<*>} callback.onSuccess Called on success with device data.
   * @returns {void}
   */


  CognitoUser.prototype.getDevice = function getDevice(callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.makeUnauthenticatedRequest('getDevice', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      DeviceKey: this.deviceKey
    }, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }
      return callback.onSuccess(data);
    });
    return undefined;
  };

  /**
   * This is used to forget a specific device
   * @param {string} deviceKey Device key.
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */


  CognitoUser.prototype.forgetSpecificDevice = function forgetSpecificDevice(deviceKey, callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.makeUnauthenticatedRequest('forgetDevice', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      DeviceKey: deviceKey
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }
      return callback.onSuccess('SUCCESS');
    });
    return undefined;
  };

  /**
   * This is used to forget the current device
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */


  CognitoUser.prototype.forgetDevice = function forgetDevice(callback) {
    var _this9 = this;

    this.forgetSpecificDevice(this.deviceKey, {
      onFailure: callback.onFailure,
      onSuccess: function onSuccess(result) {
        _this9.deviceKey = null;
        _this9.deviceGroupKey = null;
        _this9.randomPassword = null;
        _this9.clearCachedDeviceKeyAndPassword();
        return callback.onSuccess(result);
      }
    });
  };

  /**
   * This is used to set the device status as remembered
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */


  CognitoUser.prototype.setDeviceStatusRemembered = function setDeviceStatusRemembered(callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.makeUnauthenticatedRequest('updateDeviceStatus', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      DeviceKey: this.deviceKey,
      DeviceRememberedStatus: 'remembered'
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }
      return callback.onSuccess('SUCCESS');
    });
    return undefined;
  };

  /**
   * This is used to set the device status as not remembered
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */


  CognitoUser.prototype.setDeviceStatusNotRemembered = function setDeviceStatusNotRemembered(callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.makeUnauthenticatedRequest('updateDeviceStatus', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      DeviceKey: this.deviceKey,
      DeviceRememberedStatus: 'not_remembered'
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }
      return callback.onSuccess('SUCCESS');
    });
    return undefined;
  };

  /**
   * This is used to list all devices for a user
   *
   * @param {int} limit the number of devices returned in a call
   * @param {string} paginationToken the pagination token in case any was returned before
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<*>} callback.onSuccess Called on success with device list.
   * @returns {void}
   */


  CognitoUser.prototype.listDevices = function listDevices(limit, paginationToken, callback) {
    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.makeUnauthenticatedRequest('listDevices', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken(),
      Limit: limit,
      PaginationToken: paginationToken
    }, function (err, data) {
      if (err) {
        return callback.onFailure(err);
      }
      return callback.onSuccess(data);
    });
    return undefined;
  };

  /**
   * This is used to globally revoke all tokens issued to a user
   * @param {object} callback Result callback map.
   * @param {onFailure} callback.onFailure Called on any error.
   * @param {onSuccess<string>} callback.onSuccess Called on success.
   * @returns {void}
   */


  CognitoUser.prototype.globalSignOut = function globalSignOut(callback) {
    var _this10 = this;

    if (this.signInUserSession == null || !this.signInUserSession.isValid()) {
      return callback.onFailure(new Error('User is not authenticated'));
    }

    this.client.makeUnauthenticatedRequest('globalSignOut', {
      AccessToken: this.signInUserSession.getAccessToken().getJwtToken()
    }, function (err) {
      if (err) {
        return callback.onFailure(err);
      }
      _this10.clearCachedTokens();
      return callback.onSuccess('SUCCESS');
    });
    return undefined;
  };

  /**
   * This is used for the user to signOut of the application and clear the cached tokens.
   * @returns {void}
   */


  CognitoUser.prototype.signOut = function signOut() {
    this.signInUserSession = null;
    this.clearCachedTokens();
  };

  return CognitoUser;
}();

exports.default = CognitoUser;