const userRepo = require("../repositories/user.repository");
const refreshRepo = require("../repositories/refreshToken.repository");
const { hash, compare } = require("../utils/password");
const { signAccess, signRefresh } = require("../utils/jwt");
const seedUserWallets = require("../infrastructure/seed/seedUserWallet");

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
    throw Object.assign(new Error("Kredensial tidak valid"), { status: 401 });
  const ok = await compare(password, user.password);
  if (!ok)
    throw Object.assign(new Error("Kredensial tidak valid"), { status: 401 });

  const accessToken = signAccess({ sub: user.id });
  const refreshToken = signRefresh({ sub: user.id });
  // store refresh token with expiry
  const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7d - or parse from env
  await refreshRepo.upsert({ userId: user.id, token: refreshToken, expiresAt });

  return { user, accessToken, refreshToken };
};

exports.refresh = async ({ refreshToken }) => {
  // verify jwt signature
  const jwt = require("jsonwebtoken");
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET || "mytreza_secret_key"
    );
    // check saved token
    const r = await refreshRepo.findByToken(refreshToken);
    if (!r) throw new Error("Refresh token tidak valid");
    const accessToken = signAccess({ sub: payload.sub });
    const newRefresh = signRefresh({ sub: payload.sub });
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await refreshRepo.upsert({
      userId: payload.sub,
      token: newRefresh,
      expiresAt,
    });
    return { accessToken, refreshToken: newRefresh };
  } catch (err) {
    throw Object.assign(new Error("Invalid refresh token"), { status: 401 });
  }
};
