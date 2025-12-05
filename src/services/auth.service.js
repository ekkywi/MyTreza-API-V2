const userRepo = require("../repositories/user.repository");
const refreshRepo = require("../repositories/refreshToken.repository");
const { hash, compare } = require("../utils/password");
const { signAccess, signRefresh } = require("../utils/jwt");
const seedUserWallets = require("../infrastructure/seed/seedUserWallet");
const jwt = require("jsonwebtoken");

exports.register = async ({ fullName, email, password }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw new Error("Email sudah terdaftar");
  const pw = await hash(password);
  const user = await userRepo.create({
    fullName,
    email,
    password: pw,
  });
  await seedUserWallets(user.id);
  return user;
};

exports.login = async ({ email, password }) => {
  const user = await userRepo.findByEmail(email);
  if (!user)
    throw Object.assign(new Error("Email atau password salah"), {
      status: 401,
    });
  const ok = await compare(password, user.password);
  if (!ok)
    throw Object.assign(new Error("Email atau password salah"), {
      status: 401,
    });

  const accessToken = signAccess({ sub: user.id });
  const refreshToken = signRefresh({ sub: user.id });
  // store refresh token with expiry
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7d - or parse from env
  await refreshRepo.upsert({ userId: user.id, token: refreshToken, expiresAt });

  return { user, accessToken, refreshToken };
};

exports.refresh = async ({ refreshToken }) => {
  try {
    const { verify } = require("../utils/jwt");
    const payload = verify(refreshToken);

    // check saved token
    const saved = await refreshRepo.findByToken(refreshToken);
    if (!saved) throw new Error("Refresh token tidak valid");

    // optional: cek expiry
    if (saved.expiresAt < new Date()) throw new Error("Refresh token expired");

    // GENERATE TOKEN BARU
    const newAccess = signAccess({ sub: payload.sub });
    const newRefresh = signRefresh({ sub: payload.sub });

    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);

    await refreshRepo.upsert({
      userId: payload.sub,
      token: newRefresh,
      expiresAt,
    });

    return {
      success: true,
      accessToken: newAccess,
      refreshToken: newRefresh,
    };
  } catch (err) {
    console.error("Refresh Error:", err); // Log error for debugging
    throw Object.assign(new Error("Refresh token tidak valid"), {
      status: 401,
    });
  }
};
