const express = require("express");
const authcontroller = require("../controller/auth.controller");
const router = express.Router();

/* Post Method Api:-  /api/auth/register*/
router.post("/register", authcontroller.userRegisterController);
router.post("/login", authcontroller.userLoginController);

module.exports = router;
