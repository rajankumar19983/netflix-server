import User from "../models/user-model.js";

export const userRegistrationSchema = {
  email: {
    in: ["body"],
    exists: {
      errorMessage: "email field is required",
    },
    notEmpty: {
      errorMessage: "email is required",
    },
    isEmail: {
      errorMessage: "invalid email format",
    },
    trim: true,
    normalizeEmail: true,
    custom: {
      options: async function (value) {
        try {
          const user = await User.findOne({ email: value });
          if (user) {
            throw new Error("email is already taken");
          }
        } catch (err) {
          throw new Error(err.message);
        }
        return true;
      },
    },
  },
  username: {
    in: ["body"],
    exists: {
      errorMessage: "username field is required",
    },
    notEmpty: {
      errorMessage: "username is required",
    },
    isLength: {
      options: { min: 2, max: 20 },
      errorMessage: "username should be between 2 to 20 characters",
    },
    trim: true,
    custom: {
      options: async function (value) {
        const usernamePattern = /^[a-zA-Z0-9_]+$/;
        if (!usernamePattern.test(value)) {
          throw new Error(
            "username can contain alphabets, numbers and underscore only"
          );
        }
        try {
          const user = await User.findOne({ username: value });
          if (user) {
            throw new Error("username is already taken");
          }
        } catch (err) {
          throw new Error(err.message);
        }
        return true;
      },
    },
  },
  password: {
    in: ["body"],
    exists: {
      errorMessage: "password field is required",
    },
    notEmpty: {
      errorMessage: "password is required",
    },
    isStrongPassword: {
      options: {
        minLength: 8,
        minLowercase: 1,
        minUpperCase: 1,
        minNumbers: 1,
        minSymbols: 1,
      },
      errorMessage:
        "Password should be atleast 8 characters long and must contain 1 lowercase, 1 uppercase, 1 special character & 1 number",
    },
    trim: true,
  },
};

export const userLoginSchema = {
  loginId: {
    in: ["body"],
    exists: {
      errorMessage: "loginId field is required",
    },
    notEmpty: {
      errorMessage: "email/username is required",
    },
    trim: true,
    custom: {
      options: function (value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const usernamePattern = /^[a-zA-Z0-9_]+$/;

        if (!emailPattern.test(value) && !usernamePattern.test(value)) {
          throw new Error("invalid format: must be valid email or username");
        }
        return true;
      },
    },
  },
  password: {
    in: ["body"],
    exists: {
      errorMessage: "password field is required",
    },
    notEmpty: {
      errorMessage: "password is required",
    },
    trim: true,
  },
};
