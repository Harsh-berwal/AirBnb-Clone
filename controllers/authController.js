const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/users");

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "login",
    isLoggedIn: false,
    oldInput: {
      email: "",
    },  
    errors: [],
    user: {},
  });
};

exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ Email: email });

    if (!user) {
      return res.render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: false,
        errors: ["Invalid email or password"],
        oldInput: { email },
        user: req.session.user,
      });
    }

    const doMatch = await bcrypt.compare(password, user.Password);

    if (!doMatch) {
      return res.render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: false,
        errors: ["Invalid email or password"],
        oldInput: { email },
        user: req.session.user,
      });
    }

    req.session.isLoggedIn = true;
    req.session.user = {
      _id: user._id.toString(),
      id: user._id.toString(),
      email: user.Email,
      firstName: user.FirstName,
      lastName: user.LastName,
      userType: user.UserType,
    };
    req.session.save(() => {
      res.cookie("loggedIn", "true");
      res.redirect("/");
    });
  } catch (err) {
    return res.render("auth/login", {
      pageTitle: "Login",
      currentPage: "login",
      isLoggedIn: false,
      errors: [err.message],
      user: req.session.user,
      oldInput: { email: req.body.email || "" },
    });
  }
};

exports.postLogout = (req, res, next) => {
  req.session.isLoggedIn = false;
  req.session.user = null;
  res.clearCookie("loggedIn");
  res.redirect("/auth/login");
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    pageTitle: "Sign Up",
    currentPage: "signup",
    isLoggedIn: false,
    errors: [],
    oldInput: {
      firstName: "",
      lastName: "",
      email: "",
      userType: "guest",
      terms: false,
    },
    user: req.session.user,
  });
};

exports.postSignup = [
  check("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required"),

  check("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required"),

  check("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email"),

  check("password")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),

  check("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }

    return true;
  }),

  (req, res, next) => {
    const errors = validationResult(req);

    const {
      firstName,
      lastName,
      email,
      password,
      userType,
      terms,
    } = req.body;

    if (!errors.isEmpty()) {
      return res.render("auth/signup", {
        pageTitle: "Sign Up",
        currentPage: "signup",
        isLoggedIn: false,
        errors: errors.array().map((err) => err.msg),
        oldInput: {
          firstName,
          lastName,
          email,
          userType,
          terms,
        },
        user: req.session.user,
      });
    }
    bcrypt.hash(password, 12)
      .then((hashedPassword) => {
        const newUser = new User({
          FirstName: firstName,
          LastName: lastName,
          Email: email,
          Password: hashedPassword,
          UserType: userType,
        });
        return newUser.save();
      })
      .then(() => {
        console.log("User created successfully");
        res.redirect("/auth/login");
      })
      .catch((err) => {
        return res.render("auth/signup", {
          pageTitle: "Sign Up",
          currentPage: "signup",
          isLoggedIn: false,
          errors: [err.message],
          oldInput: {
            firstName,
            lastName,
            email,
            userType,
            terms,
          },
          user: req.session.user,
        });
      });
  },
];