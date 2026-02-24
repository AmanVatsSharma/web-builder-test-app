/**
 * @file seed.js
 * @module prisma
 * @description Seeds a local agency with owner/admin/member users for login testing.
 * @author BharatERP
 * @created 2026-02-24
 */

const { PrismaClient, Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const seedConfig = {
  agency: {
    id: process.env.SEED_AGENCY_ID ?? "11111111-1111-1111-1111-111111111111",
    name: process.env.SEED_AGENCY_NAME ?? "Seed Agency",
    phone: process.env.SEED_AGENCY_PHONE ?? "+10000000000",
    address: process.env.SEED_AGENCY_ADDRESS ?? "Seed Street 1",
    city: process.env.SEED_AGENCY_CITY ?? "Seed City",
    zipCode: process.env.SEED_AGENCY_ZIP ?? "10001",
    state: process.env.SEED_AGENCY_STATE ?? "Seed State",
    country: process.env.SEED_AGENCY_COUNTRY ?? "US",
  },
  users: [
    {
      key: "owner",
      name: process.env.SEED_OWNER_NAME ?? "Seed Owner",
      email: process.env.SEED_OWNER_EMAIL ?? "owner@example.com",
      password: process.env.SEED_OWNER_PASSWORD ?? "Owner@12345",
      role: Role.AGENCY_OWNER,
    },
    {
      key: "admin",
      name: process.env.SEED_ADMIN_NAME ?? "Seed Admin",
      email: process.env.SEED_ADMIN_EMAIL ?? "admin@example.com",
      password: process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345",
      role: Role.AGENCY_ADMIN,
    },
    {
      key: "member",
      name: process.env.SEED_MEMBER_NAME ?? "Seed Member",
      email: process.env.SEED_MEMBER_EMAIL ?? "member@example.com",
      password: process.env.SEED_MEMBER_PASSWORD ?? "Member@12345",
      role: Role.SUBACCOUNT_USER,
    },
  ],
};

const buildAvatarUrl = (seed) =>
  `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(seed)}`;

async function upsertAgency(config, ownerEmail) {
  const agencyData = {
    name: config.name,
    agencyLogo: buildAvatarUrl(config.name),
    companyEmail: ownerEmail,
    companyPhone: config.phone,
    whiteLabel: true,
    address: config.address,
    city: config.city,
    zipCode: config.zipCode,
    state: config.state,
    country: config.country,
    goal: 5,
    connectAccountId: "",
    customerId: "",
  };

  return prisma.agency.upsert({
    where: { id: config.id },
    update: agencyData,
    create: {
      id: config.id,
      ...agencyData,
    },
  });
}

async function upsertUser(user, agencyId) {
  const passwordHash = await bcrypt.hash(user.password, 12);
  const userData = {
    name: user.name,
    email: user.email,
    passwordHash,
    role: user.role,
    agencyId,
    avatarUrl: buildAvatarUrl(user.name),
    image: null,
    emailVerified: new Date(),
  };

  return prisma.user.upsert({
    where: { email: user.email },
    update: userData,
    create: userData,
  });
}

async function main() {
  const ownerSeed = seedConfig.users.find((user) => user.key === "owner");
  if (!ownerSeed) {
    throw new Error("Owner seed configuration is required.");
  }

  const agency = await upsertAgency(seedConfig.agency, ownerSeed.email);
  const seededUsers = [];

  for (const user of seedConfig.users) {
    const seededUser = await upsertUser(user, agency.id);
    seededUsers.push({
      email: seededUser.email,
      role: seededUser.role,
      password: user.password,
    });
  }

  process.stdout.write("Seed completed successfully.\n");
  process.stdout.write(`Agency: ${agency.name} (${agency.id})\n`);
  process.stdout.write("Users:\n");
  for (const user of seededUsers) {
    process.stdout.write(
      `- ${user.role}: ${user.email} / ${user.password}\n`
    );
  }
}

(async () => {
  try {
    await main();
  } catch (error) {
    const message =
      error instanceof Error ? error.stack ?? error.message : String(error);
    process.stderr.write(`Seed failed.\n${message}\n`);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
