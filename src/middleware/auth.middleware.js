const jwt = require("jsonwebtoken");
const userModel = require("../model/user.model");
const tokenBlackListModel = require("../model/blackList.model");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const isTokenBlacklisted = await tokenBlackListModel.findOne({ token });
    if (isTokenBlacklisted) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const decoded = jwt.verify(
      token,
      "1b40e956a511bb5b8ac672345ca02ada32657d6f9f9c63e6",
    );

    const user = await userModel.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
};

async function authSystemUserMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  const isTokenBlacklisted = await tokenBlackListModel.findOne({ token });
  if (isTokenBlacklisted) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      "1b40e956a511bb5b8ac672345ca02ada32657d6f9f9c63e6",
    );
    const user = await userModel.findById(decoded.userId).select("+systemUser");

    if (!user.systemUser) {
      return res.status(403).json({
        message: "Access denied",
      });
    }
    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      message: "Unauthorized",
    });
  }
}

module.exports = { authMiddleware, authSystemUserMiddleware };
