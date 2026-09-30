import bcrypt from "bcrypt";
import prisma from "../config/db.js";

export const register = async (req, res) => {
  const requiredFields = [
    "name",
    "email",
    "password",
    "workspaceName",
    "workspaceSlug",
  ];

  const body = req.body ?? {};

  for (const field of requiredFields) {
    if (
      typeof body[field] !== "string" ||
      body[field].trim() === ""
    ) {
      return res.status(400).json({
        message: `${field} must be a non-empty string`,
      });
    }
  }

  const name = body.name.trim();
  const email = body.email.trim().toLowerCase();
  const password = body.password;
  const workspaceName = body.workspaceName.trim();
  const workspaceSlug = body.workspaceSlug.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { 
    return res.status(400).json({
      message: "Enter a valid email address",
    });
  }

  if (password.length < 12) {
    return res.status(400).json({
      message: "Password must contain at least 12 characters",
    });
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(workspaceSlug)) {
    return res.status(400).json({
      message: "Workspace slug must use lowercase letters, numbers and single hyphens between words",
    });
  }

// bcrypt সর্বোচ্চ 72 bytes পর্যন্ত password ব্যবহার করে।
if (Buffer.byteLength(password, "utf8") > 72) {
  return res.status(400).json({
    message: "Password must not exceed 72 bytes",
  });
}

try {
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const workspace = await tx.workspace.create({
      data: {
        name: workspaceName,
        slug: workspaceSlug,
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    await tx.membership.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: "ADMIN",
      },
    });

    return { user, workspace };
  });

  return res.status(201).json({
    message: "Account and workspace created",
    data: result,
  });
} catch (error) {
  if (error.code === "P2002") {
    return res.status(409).json({
      message: "Email or workspace slug is already in use",
    });
  }

  console.error("Registration failed:", error.code ?? error.name);

  return res.status(500).json({
    message: "Unable to register. Please try again.",
  });
}
};

export const login = async (req, res) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    email.trim() === "" ||
    typeof password !== "string" ||
    password === ""
  ) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Password সঠিক হলে নতুন session ID তৈরি করো।
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    // Session-এর সঙ্গে user-এর পরিচয় যুক্ত করো।
    req.session.userId = user.id;

    // Response দেওয়ার আগে Redis-এ save করো।
    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) return reject(error);
        resolve();
      });
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login failed:", error.code ?? error.name);

    return res.status(500).json({
      message: "Unable to log in. Please try again.",
    });
  }
};

export const getMe = async (req, res) => {

const userId = req.session.userId;
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists. Please log in again.",
      });
    }

    return res.status(200).json({
      user,
    });
  } catch (error) {
    console.error("Get user failed:", error.code ?? error.name);

    return res.status(500).json({
      message: "Unable to fetch user",
    });
  }
};

export const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout failed:", error.message);

      return res.status(500).json({
        message: "Unable to log out. Please try again.",
      });
    }

    res.clearCookie("support.sid", {
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  });
};