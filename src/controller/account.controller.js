const accountModel = require("../model/account.model");

const createAccountController = async (req, res) => {
  const user = req.user;

  const account = await accountModel.create({
    user: user._id,
  });

  res.status(201).json({
    account,
  });
};

const getAccountController = async (req, res) => {
  const accounts = await accountModel.find({ user: req.user._id });
  res.status(200).json({ accounts });
};

const getAccountBalanceController = async (req, res) => {
  const { accountId } = req.params;
  const account = await accountModel.findById({
    _id: accountId,
    user: req.user._id,
  });

  if (!account) {
    return res.status(404).json({ message: "Account not found" });
  }

  const balance = await account.getBalance();
  res.status(200).json({
    accountId: account._id,
    balance,
  });
};

module.exports = {
  createAccountController,
  getAccountController,
  getAccountBalanceController,
};
