const express = require("express");
const authMiddleware = require("../middleware/auth.middleware").authMiddleware;
const accountController = require("../controller/account.controller");
const router = express.Router();

router.post("/create", authMiddleware, accountController.createAccountController);

router.get("/list", authMiddleware, accountController.getAccountController);

router.get('/balance/:accountId', authMiddleware, accountController.getAccountBalanceController);

module.exports = router;
