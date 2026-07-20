const express = require("express");

const {
  createTransaction,
  createInitialFundsTransaction,
} = require("../controller/transaction.controller");
const {
  authMiddleware,
  authSystemUserMiddleware,
} = require("../middleware/auth.middleware");
// const authMiddleware = require("../middleware/auth.middleware");

const transactionRoutes = express.Router();

transactionRoutes.post("/", authMiddleware, createTransaction);
transactionRoutes.post(
  "/system/initial-funds",
  authSystemUserMiddleware,
  createInitialFundsTransaction,
);

module.exports = transactionRoutes;
