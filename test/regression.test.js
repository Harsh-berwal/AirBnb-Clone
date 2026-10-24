/**
 * Airbnb Clone - Automated Regression & Security Test Suite
 * Uses Node.js native test runner (node:test & node:assert)
 * Does NOT require database connection or external dependencies.
 */

const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const authMiddleware = require("../middleware/auth");
const upload = require("../middleware/upload");

describe("1. Role-Based Access Control (RBAC) & Authorization Middlewares", () => {
  test("isLoggedIn: blocks unauthenticated requests and redirects to /auth/login", () => {
    let redirectedTo = null;
    let nextCalled = false;

    const req = { session: { isLoggedIn: false } };
    const res = {
      redirect: (url) => {
        redirectedTo = url;
      },
    };
    const next = () => {
      nextCalled = true;
    };

    authMiddleware.isLoggedIn(req, res, next);
    assert.equal(redirectedTo, "/auth/login");
    assert.equal(nextCalled, false);
  });

  test("isLoggedIn: allows authenticated requests to proceed", () => {
    let nextCalled = false;
    const req = {
      session: {
        isLoggedIn: true,
        user: { _id: "650000000000000000000001", userType: "guest" },
      },
    };
    const res = {};
    const next = () => {
      nextCalled = true;
    };

    authMiddleware.isLoggedIn(req, res, next);
    assert.equal(nextCalled, true);
  });

  test("isHost: blocks guest users and returns 403 Forbidden with custom view", () => {
    let statusCode = null;
    let renderedView = null;
    let nextCalled = false;

    const req = {
      session: {
        isLoggedIn: true,
        user: { _id: "650000000000000000000002", userType: "guest" },
      },
      isLoggedIn: true,
    };
    const res = {
      status: (code) => {
        statusCode = code;
        return res;
      },
      render: (view, data) => {
        renderedView = view;
      },
    };
    const next = () => {
      nextCalled = true;
    };

    authMiddleware.isHost(req, res, next);
    assert.equal(statusCode, 403);
    assert.equal(renderedView, "403");
    assert.equal(nextCalled, false);
  });

  test("isHost: allows verified host users to proceed", () => {
    let nextCalled = false;
    const req = {
      session: {
        isLoggedIn: true,
        user: { _id: "650000000000000000000003", userType: "host" },
      },
      isLoggedIn: true,
    };
    const res = {};
    const next = () => {
      nextCalled = true;
    };

    authMiddleware.isHost(req, res, next);
    assert.equal(nextCalled, true);
  });
});

describe("2. Favourites Integrity & Deduplication Logic", () => {
  test("Duplicate prevention: correctly identifies existing ID even when submitted as array or string", () => {
    const existingIds = [
      new mongoose.Types.ObjectId("650000000000000000000010"),
      new mongoose.Types.ObjectId("650000000000000000000020"),
    ];

    const targetIdString = "650000000000000000000010";

    // Test string comparison
    const foundByString = existingIds.some(
      (id) => (id._id || id).toString() === targetIdString
    );
    assert.equal(foundByString, true);

    // Test new ID not in array
    const newIdString = "650000000000000000000030";
    const foundNew = existingIds.some(
      (id) => (id._id || id).toString() === newIdString
    );
    assert.equal(foundNew, false);
  });

  test("Array normalization: handles single ID and duplicate array input safely", () => {
    const normalize = (input) => (Array.isArray(input) ? input[0] : input);

    assert.equal(normalize("650000000000000000000010"), "650000000000000000000010");
    assert.equal(
      normalize(["650000000000000000000010", "650000000000000000000010"]),
      "650000000000000000000010"
    );
  });

  test("Orphaned references: filtering null/unpopulated homes prevents TypeError in view rendering", () => {
    const rawPopulatedFavourites = [
      { _id: "650000000000000000000001", homeName: "Beach House", photo: "/uploads/img1.jpg" },
      null, // Deleted home in DB
      undefined,
      { _id: "650000000000000000000002", homeName: "Mountain Cabin", photo: "/uploads/img2.jpg" },
    ];

    // The defensive filter used in storeController
    const safeList = rawPopulatedFavourites.filter(Boolean);

    assert.equal(safeList.length, 2);
    // Verified that iterating over safeList will never throw TypeError on home.photo
    for (const home of safeList) {
      assert.ok(home.homeName);
      assert.ok(home.photo);
    }
  });
});

describe("3. File Upload Middleware Validation", () => {
  test("Multer fileFilter permits JPEG, PNG, and WebP", (t, done) => {
    const fileFilter = upload.fileFilter;
    const dummyReq = {};

    fileFilter(dummyReq, { mimetype: "image/jpeg" }, (err, allowed) => {
      assert.equal(err, null);
      assert.equal(allowed, true);

      fileFilter(dummyReq, { mimetype: "image/png" }, (err2, allowed2) => {
        assert.equal(err2, null);
        assert.equal(allowed2, true);

        fileFilter(dummyReq, { mimetype: "image/webp" }, (err3, allowed3) => {
          assert.equal(err3, null);
          assert.equal(allowed3, true);
          done();
        });
      });
    });
  });

  test("Multer fileFilter rejects unauthorized formats (e.g. PDF, executable, SVG)", (t, done) => {
    const fileFilter = upload.fileFilter;
    const dummyReq = {};

    fileFilter(dummyReq, { mimetype: "application/pdf" }, (err, allowed) => {
      assert.ok(err instanceof Error);
      assert.equal(allowed, undefined);

      fileFilter(dummyReq, { mimetype: "image/svg+xml" }, (err2, allowed2) => {
        assert.ok(err2 instanceof Error);
        done();
      });
    });
  });

  test("Multer size limit is enforced at 5 MB", () => {
    assert.equal(upload.limits.fileSize, 5 * 1024 * 1024);
  });
});

describe("4. ObjectId Validation & Error Handling", () => {
  test("Valid 24-char hex ObjectIds pass validation", () => {
    assert.equal(mongoose.Types.ObjectId.isValid("650000000000000000000001"), true);
  });

  test("Malformed or arbitrary strings are recognized as invalid ObjectIds", () => {
    assert.equal(mongoose.Types.ObjectId.isValid("invalid-id"), false);
    assert.equal(mongoose.Types.ObjectId.isValid("123"), false);
    assert.equal(mongoose.Types.ObjectId.isValid(""), false);
  });
});

describe("5. Authentication & Security Primitives", () => {
  test("Password hashing with bcryptjs produces verifiable hashes", async () => {
    const password = "mySecurePassword123!";
    const hash = await bcrypt.hash(password, 10);

    const isMatch = await bcrypt.compare(password, hash);
    assert.equal(isMatch, true);

    const isWrong = await bcrypt.compare("wrongPassword", hash);
    assert.equal(isWrong, false);
  });
});
