const express = require("express");

const cookieparser = require("cookie-parser");
const authRouter = require("./router/routes");
const accountRouter = require("./router/account.route");
const transactionRouter = require("./router/transaction.route");

const app = express();

app.use(express.json());
app.use(cookieparser());
app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/transaction", transactionRouter);

module.exports = app;
