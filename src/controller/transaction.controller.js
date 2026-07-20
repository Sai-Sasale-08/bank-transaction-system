const ledgerModel = require("../model/ledger.model");
const transactionModel = require("../model/transaction.model");
const accountModel = require("../model/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

const createTransaction = async (req, res) => {
  const { formAccount, toAccount, amount, idempotencyKey } = req.body;

  /**
   *1. Validate Request
   */

  if (!formAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const fromAccount = await accountModel.findOne({
    _id: formAccount,
    user: req.user._id,
  });
  const receiverAccount = await accountModel.findOne({
    _id: toAccount,
    user: req.user._id,
  });

  if (!fromAccount || !receiverAccount) {
    return res.status(404).json({ error: "Account not found" });
  }

  /**
   * 2.Validate Idempotency Key
   */

  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey,
  });

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({ message: "Transaction already completed" });
    }
    if (isTransactionAlreadyExists.status === "PENDING") {
      return res
        .status(200)
        .json({ message: "Transaction is already in progress" });
    }
    if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({ message: "Transaction has failed" });
    }
    if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(200).json({ message: "Transaction has been reversed" });
    }
  }

  /**
   * 3. Check Account Status
   */

  if (fromAccount.status !== "ACTIVE" || receiverAccount.status !== "ACTIVE") {
    return res
      .status(400)
      .json({ error: "One or both accounts are not active" });
  }

  /**
   * 4. Check Sender Balance
   */

  const balance = await fromAccount.getBalance();
  if (balance < amount) {
    return res
      .status(400)
      .json({ error: `Insufficient balance: ${balance} amount is ${amount}` });
  }

  /**
   * 5. Create Transaction
   */

  let transaction;
  try {
    const session = await mongoose.startSession();
    session.startTransaction();

    transaction = (
      await transactionModel.create(
        [
          {
            fromAccount,
            toAccount: receiverAccount,
            amount,
            idempotencyKey,
            status: "PENDING",
          },
        ],
        { session },
      )
    )[0];

    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount._id,
          amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    await (() => {
      return new Promise((resolve) => {
        setTimeout(resolve, 20 * 1000);
      });
    });

    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: receiverAccount._id,
          amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session },
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });
    await session.commitTransaction();
    session.endSession();
  } catch (error) {
    return res
      .status(500)
      .json({
        error: "Transaction pending due to some issue, please try again later",
      });
  }

  /**
   * 6. Send Email Notification
   */

  await emailService.sendTransactionEmail(
    req.user.email,
    req.user.name,
    amount,
    receiverAccount._id,
  );
  return res
    .status(201)
    .json({ message: "Transaction completed successfully" });
};

const createInitialFundsTransaction = async (req, res) => {
  const { toaccount, amount, idempotencyKey } = req.body;
  if (!toaccount || !amount || !idempotencyKey) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const toUserAccount = await accountModel.findOne({
    _id: toaccount,
  });
  if (!toUserAccount) {
    return res.status(404).json({ error: "Account not found" });
  }

  const fromUserAccout = await accountModel.findOne({
    user: req.user._id,
  });
  if (!fromUserAccout) {
    return res.status(404).json({ error: "System account not found" });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  const transaction = new transactionModel({
    fromAccount: fromUserAccout._id,
    toAccount: toUserAccount._id,
    amount,
    idempotencyKey,
    status: "PENDING",
  });

  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccout._id,
        amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );
  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toUserAccount._id,
        amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );
  transaction.status = "COMPLETED";
  await transaction.save({ session });
  await session.commitTransaction();
  session.endSession();

  return res.status(201).json({
    message: "Initial funds transaction completed successfully",
    transaction,
  });
};

module.exports = {
  createTransaction,
  createInitialFundsTransaction,
};
