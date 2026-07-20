require("dotenv").config()
const app = require("./src/app");
const connect = require("./src/config/db");



app.listen(3000, async() => {
    try {
      await connect;
      console.log("server is running");
      console.log("connected to db");
    } catch (error) {
      console.error("something went wrong");
      console.error(error);
    }
})


