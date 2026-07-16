import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.OPSPILOT_JWT_SECRET || "opspilot-dev-secret";

export async function registerUser(users, { email, password }) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || String(password || "").length < 6) {
    throw new Error("Email and a password of at least 6 characters are required.");
  }
  if (users.has(normalizedEmail)) {
    throw new Error("User already exists. Log in instead.");
  }

  const user = {
    id: crypto.randomUUID(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };
  users.set(normalizedEmail, user);
  return { user: publicUser(user), token: createToken(user) };
}

export async function loginUser(users, { email, password }) {
  const user = users.get(normalizeEmail(email));
  if (!user || !(await bcrypt.compare(String(password || ""), user.passwordHash))) {
    throw new Error("Invalid email or password.");
  }
  return { user: publicUser(user), token: createToken(user) };
}

export function authenticate(users, request, response, next) {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) {
    response.status(401).json({ error: "Authentication required." });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = users.get(payload.email);
    if (!user) {
      response.status(401).json({ error: "Authentication required." });
      return;
    }
    request.user = publicUser(user);
    next();
  } catch {
    response.status(401).json({ error: "Authentication required." });
  }
}

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
  };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}
