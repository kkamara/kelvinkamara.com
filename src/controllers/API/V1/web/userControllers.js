"use strict";
const db = require("../../../../models/V1");
const { status, } = require("http-status");
const {
  message400,
  message500,
  message200,
} = require("../../../../utils/httpResponses");
const { encrypt } = require("../../../../utils/tokens");
const asyncHandler = require("express-async-handler");

const createUser = asyncHandler(async (req, res) => {
  const inputError = db.sequelize.models
    .user
    .getRegisterError(req.body);
  if (false !== inputError) {
    res.status(status.BAD_REQUEST);
    throw new Error(inputError);
  }
  
  const cleanData = db.sequelize.models
    .user
    .getCreateUserData({
      firstName: req.bodyString("firstName"),
      lastName: req.bodyString("lastName"),
      email: req.bodyEmail("email"),
      password: req.body.password, // Uncleaned password
    });
  if (false === cleanData) {
    res.status(status.BAD_REQUEST);
    throw new Error(message400);
  }
  
  const emailExists = await db.sequelize.models
    .user
    .emailExists(
      cleanData.email,
    );
  if (true === emailExists) {
    res.status(status.BAD_REQUEST);
    throw new Error(
      "The email field has already been taken."
    );
  }
  
  const userInsert = await db.sequelize.models
    .user
    .createUser(
      cleanData,
    );
  if (false === userInsert) {
    res.status(status.INTERNAL_SERVER_ERROR);
    throw new Error(message500);
  }

  const newUser = await db.sequelize.models.user.getUser(
    userInsert.userId,
    req.session.timezone,
  );
  if (false === newUser) {
    res.status(status.INTERNAL_SERVER_ERROR);
    throw new Error(message500);
  }

  res.status(status.OK);
  return res.json({
    user: newUser,
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const inputError = db.sequelize.models
    .user
    .getLoginError(req.body);
  if (false !== inputError) {
    res.status(status.BAD_REQUEST);
    throw new Error(inputError);
  }

  const cleanData = db.sequelize.models
    .user
    .getCleanLoginData(
      req.bodyEmail("email"),
      req.body.password, // Uncleaned password
    );
  if (false === cleanData) {
    res.status(status.BAD_REQUEST);
    throw new Error(message400);
  }

  const emailExists = await db.sequelize.models.user
    .emailExists(cleanData.email);
  if (false === emailExists) {
    res.status(status.BAD_REQUEST);
    throw new Error(
      "The email given does not exist in our records.",
    );
  }
    
  const userRaw = await db.sequelize.models.user
    .getUserByEmailRaw(
      cleanData.email,
    );
  if (false === userRaw) {
    res.status(status.BAD_REQUEST);
    throw new Error(
      "The email is not in our records."
    );
  }
  
  const successLogin = await db.sequelize.models.user
    .loginUser(
      cleanData.password,
      userRaw.password,
      userRaw.passwordSalt,
    );
  if (false === successLogin) {
    res.status(status.BAD_REQUEST);
    throw new Error(
      "The email and password combination did not match."
    );
  }

  const authTokenInsert = await db.sequelize.models
    .userToken
    .createAuthToken(userRaw.id);
  if (false === authTokenInsert) {
    res.status(status.BAD_REQUEST);
    throw new Error(message500);
  }

  const authTokenResult = await db.sequelize.models
    .userToken
    .getAuthToken(
      authTokenInsert.authTokenId,
    );
  if (false === authTokenResult) {
    res.status(status.BAD_REQUEST);
    throw new Error(message500);
  }
  
  const user = await db.sequelize.models.user
    .getUser(
      userRaw.id,
      req.session.timezone,
    );
  if (false === userRaw) {
    res.status(status.BAD_REQUEST);
    throw new Error(
      "The email is not in our records."
    );
  }

  await db.sequelize.models.user.updateUserTimestamp(
    user.id,
  );
  
  res.status(status.OK);
  return res.json({
    data: {
      user,
      authToken: authTokenResult.token,
    },
  });
});

const authoriseUser = asyncHandler(async (req, res) => {
  const userFromAuthToken = await db.sequelize.models.user.getUserByAuthToken(
    req.session.extractedToken,
    req.session.timezone,
  );
  if (false === userFromAuthToken) {
    res.status(status.INTERNAL_SERVER_ERROR);
    throw new Error(message500);
  }
  
  res.status(status.OK);
  return res.json({
    user: userFromAuthToken,
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await db.sequelize.models.user
    .getUserByAuthToken(
      req.session.extractedToken,
      req.session.timezone,
    );
  if (false === user) {
    res.status(status.INTERNAL_SERVER_ERROR);
    throw new Error(message500);
  }
  
  const logoutUser = await db.sequelize.models.userToken.logoutUser(
    user.id,
    req.session.extractedToken,
  );
  if (false === logoutUser) {
    res.status(status.INTERNAL_SERVER_ERROR);
    throw new Error(message500);
  }
  
  await db.sequelize.models.user.updateUserTimestamp(
    req.session.userId,
  );

  res.status(status.OK);
  return res.json({
    message: message200,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const currentUser = await db.sequelize.models.user.getUserByIdRaw(req.session.userId);
  if (!currentUser) {
    res.status(status.UNAUTHORIZED);
    throw new Error("User not found.");
  }
  const adminEmail = "kamaracomputers@gmail.com";
  const inputEmail = req.bodyString("email");
  if (typeof inputEmail === "string" &&
      inputEmail.toLowerCase() === adminEmail &&
      currentUser.email.toLowerCase() !== adminEmail) {
    res.status(status.FORBIDDEN);
    throw new Error("This email is reserved.");
  }
  if (currentUser.email.toLowerCase() === adminEmail &&
      typeof inputEmail === "string" && inputEmail.toLowerCase() !== adminEmail) {
    res.status(status.FORBIDDEN);
    throw new Error("The administrator email cannot be changed here.");
  }
  const inputError = await db.sequelize.models
    .user
    .getUpdateUserError(
      req.session.userId,
      req.body,
    );
  if (false !== inputError) {
    res.status(status.BAD_REQUEST);
    throw new Error(inputError);
  }

  const cleanData = await db.sequelize.models
    .user
    .getUpdateUserData({
      firstName: req.bodyString("firstName"),
      lastName: req.bodyString("lastName"),
      email: req.bodyString("email"),
      password: req.body.password, // Uncleaned password
    });
  
  let newPassword, newPasswordSalt;
  if (cleanData.password) {
    const { salt, hash, } = encrypt(cleanData.password);
    newPassword = hash;
    newPasswordSalt = salt;
  }

  const updateUser = await db.sequelize.models
    .user
    .updateUser(
      req.session.userId,
      {
        firstName: cleanData.firstName,
        lastName: cleanData.lastName,
        email: cleanData.email,
        password: newPassword ?
          newPassword :
          null,
        passwordSalt: newPasswordSalt ?
          newPasswordSalt :
          null,
      }
    );
  if (false === updateUser) {
    res.status(status.INTERNAL_SERVER_ERROR);
    throw new Error(message500);
  }

  return res.json({ message: message200 });
});

module.exports = {
  createUser,
  loginUser,
  authoriseUser,
  logoutUser,
  updateUser,
};