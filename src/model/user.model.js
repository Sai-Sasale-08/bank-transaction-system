const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      required: "Email address is required",

      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
      unique: [true, "email already exits"],
    },
    name: {
      type: String,
      required: "name address is required",
    },
    password: {
      type: String,
      required: "password address is required",
      // minlength: [6, "contain more than 6 char"],
      select: false,
    },
    systemUser: {
      type: Boolean,
      default: false,
      immutable: true,
      select: false,
    }
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  return;
});

userSchema.methods.comparePassword = async function (password) {
  console.log("password =", password, typeof password);
  console.log("stored password =", this.password, typeof this.password);

  return await bcrypt.compare(String(password), String(this.password));
};

const userModel = mongoose.model("user", userSchema);
module.exports = userModel;
