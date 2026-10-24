const { check, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/users");

exports.getLogin = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    return res.redirect("/");
  }

  res.render("auth/login", {
    pageTitle: "Login",
    currentPage: "login",
    isLoggedIn: false,
    oldInput: {
      email: "",
    },
    errors: [],
    user: null,
  });
};

exports.postLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || "").trim().toLowerCase();

    const user = await User.findOne({ Email: normalizedEmail });

    if (!user) {
      return res.status(401).render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: false,
        errors: ["Invalid email or password"],
        oldInput: { email },
        user: null,
      });
    }

    const doMatch = await bcrypt.compare(password, user.Password);

    if (!doMatch) {
      return res.status(401).render("auth/login", {
        pageTitle: "Login",
        currentPage: "login",
        isLoggedIn: false,
        errors: ["Invalid email or password"],
        oldInput: { email },
        user: null,
      });
    }

    // Regenerate session ID to prevent Session Fixation attacks
    req.session.regenerate((err) => {
      if (err) {
        return next(err);
      }

      req.session.isLoggedIn = true;
      req.session.user = {
        _id: user._id.toString(),
        id: user._id.toString(),
        email: user.Email,
        firstName: user.FirstName,
        lastName: user.LastName,
        userType: user.UserType || "guest",
      };

      req.session.save((saveErr) => {
        if (saveErr) {
          return next(saveErr);
        }
        res.redirect("/");
      });
    });
  } catch (err) {
    return res.status(500).render("auth/login", {
      pageTitle: "Login",
      currentPage: "login",
      isLoggedIn: false,
      errors: ["An error occurred while logging in. Please try again."],
      user: null,
      oldInput: { email: req.body.email || "" },
    });
  }
};

exports.postLogout = (req, res, next) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session on logout:", err);
      }
      res.clearCookie("connect.sid");
      res.clearCookie("loggedIn");
      res.redirect("/auth/login");
    });
  } else {
    res.clearCookie("loggedIn");
    res.redirect("/auth/login");
  }
};

exports.getSignup = (req, res, next) => {
  if (req.session && req.session.isLoggedIn) {
    return res.redirect("/");
  }

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
    user: null,
  });
};

exports.postSignup = [
  check("firstName")
    .trim()
    .notEmpty()
    .withMessage("First name is required")
    .isLength({ max: 50 })
    .withMessage("First name cannot exceed 50 characters"),

  check("lastName")
    .trim()
    .notEmpty()
    .withMessage("Last name is required")
    .isLength({ max: 50 })
    .withMessage("Last name cannot exceed 50 characters"),

  check("email")
    .trim()
    .isEmail()
    .withMessage("Please enter a valid email address")
    .custom(async (value) => {
      const existingUser = await User.findOne({ Email: value.toLowerCase() });
      if (existingUser) {
        throw new Error("This email is already registered. Please log in instead.");
      }
      return true;
    }),

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

  check("terms").custom((value) => {
    if (!value || value === "false") {
      throw new Error("You must agree to the Terms of Service and Privacy Policy.");
    }
    return true;
  }),

  async (req, res, next) => {
    const errors = validationResult(req);

    const {
      firstName,
      lastName,
      email,
      password,
      userType,
      terms,
    } = req.body;

    const safeUserType = userType === "host" ? "host" : "guest";

    if (!errors.isEmpty()) {
      return res.status(422).render("auth/signup", {
        pageTitle: "Sign Up",
        currentPage: "signup",
        isLoggedIn: false,
        errors: errors.array().map((err) => err.msg),
        oldInput: {
          firstName,
          lastName,
          email,
          userType: safeUserType,
          terms: !!terms,
        },
        user: null,
      });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 12);
      const newUser = new User({
        FirstName: firstName.trim(),
        LastName: lastName.trim(),
        Email: email.trim().toLowerCase(),
        Password: hashedPassword,
        UserType: safeUserType,
      });

      await newUser.save();
      res.redirect("/auth/login");
    } catch (err) {
      let displayError = "An error occurred while creating your account. Please try again.";
      if (err.code === 11000) {
        displayError = "An account with this email address already exists.";
      }
      return res.status(422).render("auth/signup", {
        pageTitle: "Sign Up",
        currentPage: "signup",
        isLoggedIn: false,
        errors: [displayError],
        oldInput: {
          firstName,
          lastName,
          email,
          userType: safeUserType,
          terms: !!terms,
        },
        user: null,
      });
    }
  },
];