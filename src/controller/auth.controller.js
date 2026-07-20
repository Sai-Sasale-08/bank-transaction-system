const userModel = require("../model/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../model/blackList.model");

async function userRegisterController(req, res) {
  const { email, name, password } = req.body;
  const isExists = await userModel.findOne({
    email: email,
  });
  if (isExists) {
    return res.status(404).json({
      message: "User already exists",
      status: "failed",
    });
  }
  const user = await userModel.create({
    email,
    password,
    name,
  });

  const token = jwt.sign(
    { userId: user._id },
    "1b40e956a511bb5b8ac672345ca02ada32657d6f9f9c63e6",
    { expiresIn: "3d" },
  );
  res.cookie("token", token);
  res.status(202).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });

  await emailService.sendRegistrationEmail(user.email, user.name);
}

async function userLoginController(req, res) {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return res.status(404).json({
      message: "email or password unvalid",
    });
  }

  const isCompare = await user.comparePassword(password);
  if (!isCompare) {
    return res.status(404).json({
      message: "invalid password",
    });
  }

  const token = jwt.sign(
    { userId: user._id },
    "1b40e956a511bb5b8ac672345ca02ada32657d6f9f9c63e6",
    { expiresIn: "3d" },
  );
  res.cookie("token", token);
  res.status(202).json({
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });
}

async function userLogoutController(req, res) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(200).json({ message: "User logged out" });
  }

  await tokenBlackListModel.create({ token });

  res.clearCookie("token");

  return res.status(200).json({ message: "User logged out successfully" });
}

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};
