/**
 * @file seed.js
 * @module prisma
 * @description Seeds local agency, users, and Stripe-connected demo data for full flow testing.
 * @author BharatERP
 * @created 2026-02-24
 */

const { PrismaClient, Plan, Role } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const seedIds = {
  agencySidebar: {
    dashboard: "a0000000-0000-0000-0000-000000000001",
    launchpad: "a0000000-0000-0000-0000-000000000002",
    billing: "a0000000-0000-0000-0000-000000000003",
    settings: "a0000000-0000-0000-0000-000000000004",
    subAccounts: "a0000000-0000-0000-0000-000000000005",
    team: "a0000000-0000-0000-0000-000000000006",
  },
  subAccount: "22222222-2222-2222-2222-222222222222",
  subAccountSidebar: {
    launchpad: "b0000000-0000-0000-0000-000000000001",
    settings: "b0000000-0000-0000-0000-000000000002",
    funnels: "b0000000-0000-0000-0000-000000000003",
    media: "b0000000-0000-0000-0000-000000000004",
    automations: "b0000000-0000-0000-0000-000000000005",
    pipelines: "b0000000-0000-0000-0000-000000000006",
    contacts: "b0000000-0000-0000-0000-000000000007",
    dashboard: "b0000000-0000-0000-0000-000000000008",
  },
  permissions: {
    owner: "c0000000-0000-0000-0000-000000000001",
    admin: "c0000000-0000-0000-0000-000000000002",
    member: "c0000000-0000-0000-0000-000000000003",
  },
  pipeline: "33333333-3333-3333-3333-333333333333",
  lanes: {
    newLead: "44444444-4444-4444-4444-444444444441",
    booked: "44444444-4444-4444-4444-444444444442",
  },
  tags: {
    urgent: "55555555-5555-5555-5555-555555555551",
    followUp: "55555555-5555-5555-5555-555555555552",
  },
  contact: "66666666-6666-6666-6666-666666666666",
  tickets: {
    warmLead: "77777777-7777-7777-7777-777777777771",
    closedWon: "77777777-7777-7777-7777-777777777772",
  },
  media: "88888888-8888-8888-8888-888888888888",
  funnel: "99999999-9999-9999-9999-999999999999",
  funnelPage: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
};

const defaultAgencySidebarOptions = (agencyId) => [
  {
    id: seedIds.agencySidebar.dashboard,
    name: "Dashboard",
    icon: "category",
    link: `/agency/${agencyId}`,
  },
  {
    id: seedIds.agencySidebar.launchpad,
    name: "Launchpad",
    icon: "clipboardIcon",
    link: `/agency/${agencyId}/launchpad`,
  },
  {
    id: seedIds.agencySidebar.billing,
    name: "Billing",
    icon: "payment",
    link: `/agency/${agencyId}/billing`,
  },
  {
    id: seedIds.agencySidebar.settings,
    name: "Settings",
    icon: "settings",
    link: `/agency/${agencyId}/settings`,
  },
  {
    id: seedIds.agencySidebar.subAccounts,
    name: "Sub Accounts",
    icon: "person",
    link: `/agency/${agencyId}/all-subaccounts`,
  },
  {
    id: seedIds.agencySidebar.team,
    name: "Team",
    icon: "shield",
    link: `/agency/${agencyId}/team`,
  },
];

const defaultSubAccountSidebarOptions = (subAccountId) => [
  {
    id: seedIds.subAccountSidebar.launchpad,
    name: "Launchpad",
    icon: "clipboardIcon",
    link: `/subaccount/${subAccountId}/launchpad`,
  },
  {
    id: seedIds.subAccountSidebar.settings,
    name: "Settings",
    icon: "settings",
    link: `/subaccount/${subAccountId}/settings`,
  },
  {
    id: seedIds.subAccountSidebar.funnels,
    name: "Funnels",
    icon: "pipelines",
    link: `/subaccount/${subAccountId}/funnels`,
  },
  {
    id: seedIds.subAccountSidebar.media,
    name: "Media",
    icon: "database",
    link: `/subaccount/${subAccountId}/media`,
  },
  {
    id: seedIds.subAccountSidebar.automations,
    name: "Automations",
    icon: "chip",
    link: `/subaccount/${subAccountId}/automations`,
  },
  {
    id: seedIds.subAccountSidebar.pipelines,
    name: "Pipelines",
    icon: "flag",
    link: `/subaccount/${subAccountId}/pipelines`,
  },
  {
    id: seedIds.subAccountSidebar.contacts,
    name: "Contacts",
    icon: "person",
    link: `/subaccount/${subAccountId}/contacts`,
  },
  {
    id: seedIds.subAccountSidebar.dashboard,
    name: "Dashboard",
    icon: "category",
    link: `/subaccount/${subAccountId}`,
  },
];

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
    connectAccountId:
      process.env.SEED_AGENCY_CONNECT_ACCOUNT_ID ?? "acct_demo_seed_agency",
    customerId: process.env.SEED_AGENCY_CUSTOMER_ID ?? "cus_demo_seed_agency",
  },
  subAccount: {
    id: process.env.SEED_SUBACCOUNT_ID ?? seedIds.subAccount,
    name: process.env.SEED_SUBACCOUNT_NAME ?? "Seed Subaccount",
    companyEmail:
      process.env.SEED_SUBACCOUNT_EMAIL ?? "subaccount-billing@example.com",
    companyPhone: process.env.SEED_SUBACCOUNT_PHONE ?? "+10000000001",
    address: process.env.SEED_SUBACCOUNT_ADDRESS ?? "Seed Sub Street 2",
    city: process.env.SEED_SUBACCOUNT_CITY ?? "Seed City",
    zipCode: process.env.SEED_SUBACCOUNT_ZIP ?? "10002",
    state: process.env.SEED_SUBACCOUNT_STATE ?? "Seed State",
    country: process.env.SEED_SUBACCOUNT_COUNTRY ?? "US",
    connectAccountId:
      process.env.SEED_SUBACCOUNT_CONNECT_ACCOUNT_ID ??
      "acct_demo_seed_subaccount",
  },
  stripe: {
    subscriptionId:
      process.env.SEED_STRIPE_SUBSCRIPTION_ID ?? "sub_demo_seed_agency",
    priceId:
      process.env.SEED_STRIPE_PRICE_ID ?? Plan.price_1OYxkqFj9oKEERu1KfJGWxgN,
    plan: process.env.SEED_STRIPE_PLAN ?? Plan.price_1OYxkqFj9oKEERu1KfJGWxgN,
    currentPeriodDays: Number(process.env.SEED_STRIPE_PERIOD_DAYS ?? 30),
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

const resolvePlanValue = (value) => {
  const supportedPlans = Object.values(Plan);
  return supportedPlans.includes(value) ? value : Plan.price_1OYxkqFj9oKEERu1KfJGWxgN;
};

const resolvePositiveInt = (value, fallback) =>
  Number.isInteger(value) && value > 0 ? value : fallback;

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
    connectAccountId: config.connectAccountId,
    customerId: config.customerId,
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

async function upsertSubAccount(config, agencyId) {
  const subAccountData = {
    name: config.name,
    subAccountLogo: buildAvatarUrl(config.name),
    companyEmail: config.companyEmail,
    companyPhone: config.companyPhone,
    goal: 5000,
    address: config.address,
    city: config.city,
    zipCode: config.zipCode,
    state: config.state,
    country: config.country,
    connectAccountId: config.connectAccountId,
    agencyId,
  };

  return prisma.subAccount.upsert({
    where: { id: config.id },
    update: subAccountData,
    create: {
      id: config.id,
      ...subAccountData,
    },
  });
}

async function upsertAgencySidebarOptions(agencyId) {
  for (const option of defaultAgencySidebarOptions(agencyId)) {
    await prisma.agencySidebarOption.upsert({
      where: { id: option.id },
      update: {
        name: option.name,
        icon: option.icon,
        link: option.link,
        agencyId,
      },
      create: {
        id: option.id,
        name: option.name,
        icon: option.icon,
        link: option.link,
        agencyId,
      },
    });
  }
}

async function upsertSubAccountSidebarOptions(subAccountId) {
  for (const option of defaultSubAccountSidebarOptions(subAccountId)) {
    await prisma.subAccountSidebarOption.upsert({
      where: { id: option.id },
      update: {
        name: option.name,
        icon: option.icon,
        link: option.link,
        subAccountId,
      },
      create: {
        id: option.id,
        name: option.name,
        icon: option.icon,
        link: option.link,
        subAccountId,
      },
    });
  }
}

async function upsertPermission(id, email, subAccountId) {
  return prisma.permissions.upsert({
    where: { id },
    update: {
      email,
      subAccountId,
      access: true,
    },
    create: {
      id,
      email,
      subAccountId,
      access: true,
    },
  });
}

async function upsertDemoPipelineData({ subAccountId, ownerId, memberId }) {
  await prisma.pipeline.upsert({
    where: { id: seedIds.pipeline },
    update: {
      name: "Seed Sales Pipeline",
      subAccountId,
    },
    create: {
      id: seedIds.pipeline,
      name: "Seed Sales Pipeline",
      subAccountId,
    },
  });

  await prisma.lane.upsert({
    where: { id: seedIds.lanes.newLead },
    update: {
      name: "New Leads",
      order: 0,
      pipelineId: seedIds.pipeline,
    },
    create: {
      id: seedIds.lanes.newLead,
      name: "New Leads",
      order: 0,
      pipelineId: seedIds.pipeline,
    },
  });

  await prisma.lane.upsert({
    where: { id: seedIds.lanes.booked },
    update: {
      name: "Booked",
      order: 1,
      pipelineId: seedIds.pipeline,
    },
    create: {
      id: seedIds.lanes.booked,
      name: "Booked",
      order: 1,
      pipelineId: seedIds.pipeline,
    },
  });

  await prisma.tag.upsert({
    where: { id: seedIds.tags.urgent },
    update: {
      name: "Urgent",
      color: "orange",
      subAccountId,
    },
    create: {
      id: seedIds.tags.urgent,
      name: "Urgent",
      color: "orange",
      subAccountId,
    },
  });

  await prisma.tag.upsert({
    where: { id: seedIds.tags.followUp },
    update: {
      name: "Follow Up",
      color: "blue",
      subAccountId,
    },
    create: {
      id: seedIds.tags.followUp,
      name: "Follow Up",
      color: "blue",
      subAccountId,
    },
  });

  await prisma.contact.upsert({
    where: { id: seedIds.contact },
    update: {
      name: "Seed Contact",
      email: "contact@example.com",
      subAccountId,
    },
    create: {
      id: seedIds.contact,
      name: "Seed Contact",
      email: "contact@example.com",
      subAccountId,
    },
  });

  await prisma.ticket.upsert({
    where: { id: seedIds.tickets.warmLead },
    update: {
      name: "Landing page redesign inquiry",
      laneId: seedIds.lanes.newLead,
      order: 0,
      value: 1800,
      description: "Warm lead from website form",
      customerId: seedIds.contact,
      assignedUserId: ownerId,
      Tags: {
        set: [{ id: seedIds.tags.followUp }],
      },
    },
    create: {
      id: seedIds.tickets.warmLead,
      name: "Landing page redesign inquiry",
      laneId: seedIds.lanes.newLead,
      order: 0,
      value: 1800,
      description: "Warm lead from website form",
      customerId: seedIds.contact,
      assignedUserId: ownerId,
      Tags: {
        connect: [{ id: seedIds.tags.followUp }],
      },
    },
  });

  await prisma.ticket.upsert({
    where: { id: seedIds.tickets.closedWon },
    update: {
      name: "Website maintenance package",
      laneId: seedIds.lanes.booked,
      order: 0,
      value: 4200,
      description: "Recurring maintenance plan",
      customerId: seedIds.contact,
      assignedUserId: memberId,
      Tags: {
        set: [{ id: seedIds.tags.urgent }],
      },
    },
    create: {
      id: seedIds.tickets.closedWon,
      name: "Website maintenance package",
      laneId: seedIds.lanes.booked,
      order: 0,
      value: 4200,
      description: "Recurring maintenance plan",
      customerId: seedIds.contact,
      assignedUserId: memberId,
      Tags: {
        connect: [{ id: seedIds.tags.urgent }],
      },
    },
  });

  await prisma.media.upsert({
    where: { id: seedIds.media },
    update: {
      type: "image/png",
      name: "Seed Hero Banner",
      link: "https://utfs.io/f/seed-demo-banner.png",
      subAccountId,
    },
    create: {
      id: seedIds.media,
      type: "image/png",
      name: "Seed Hero Banner",
      link: "https://utfs.io/f/seed-demo-banner.png",
      subAccountId,
    },
  });
}

async function upsertDemoFunnel(subAccountId) {
  await prisma.funnel.upsert({
    where: { id: seedIds.funnel },
    update: {
      name: "Seed Funnel",
      description: "Demo funnel for editor and dashboard testing.",
      published: true,
      subAccountId,
    },
    create: {
      id: seedIds.funnel,
      name: "Seed Funnel",
      description: "Demo funnel for editor and dashboard testing.",
      published: true,
      subAccountId,
      liveProducts: "[]",
    },
  });

  await prisma.funnelPage.upsert({
    where: { id: seedIds.funnelPage },
    update: {
      name: "Home",
      pathName: "",
      order: 0,
      funnelId: seedIds.funnel,
      previewImage: null,
      visits: 128,
      content: JSON.stringify([
        {
          id: "__body",
          name: "Body",
          type: "__body",
          styles: { backgroundColor: "white" },
          content: [],
        },
      ]),
    },
    create: {
      id: seedIds.funnelPage,
      name: "Home",
      pathName: "",
      order: 0,
      funnelId: seedIds.funnel,
      previewImage: null,
      visits: 128,
      content: JSON.stringify([
        {
          id: "__body",
          name: "Body",
          type: "__body",
          styles: { backgroundColor: "white" },
          content: [],
        },
      ]),
    },
  });
}

async function upsertStripeDemoData({ agencyId, customerId, stripeConfig }) {
  const safePeriodDays = resolvePositiveInt(stripeConfig.currentPeriodDays, 30);
  const currentPeriodEndDate = new Date(
    Date.now() + safePeriodDays * 24 * 60 * 60 * 1000
  );

  const subscriptionPayload = {
    plan: resolvePlanValue(stripeConfig.plan),
    price: "Unlimited SaaS (Seed Demo)",
    active: true,
    priceId: stripeConfig.priceId,
    customerId,
    currentPeriodEndDate,
    subscritiptionId: stripeConfig.subscriptionId,
    agencyId,
  };

  return prisma.subscription.upsert({
    where: { agencyId },
    update: subscriptionPayload,
    create: subscriptionPayload,
  });
}

async function main() {
  const ownerSeed = seedConfig.users.find((user) => user.key === "owner");
  const adminSeed = seedConfig.users.find((user) => user.key === "admin");
  const memberSeed = seedConfig.users.find((user) => user.key === "member");
  if (!ownerSeed) {
    throw new Error("Owner seed configuration is required.");
  }
  if (!adminSeed || !memberSeed) {
    throw new Error("Admin and member seed configurations are required.");
  }

  const agency = await upsertAgency(seedConfig.agency, ownerSeed.email);
  const seededUsers = [];
  const seededUsersByKey = {};

  for (const user of seedConfig.users) {
    const seededUser = await upsertUser(user, agency.id);
    seededUsersByKey[user.key] = seededUser;
    seededUsers.push({
      email: seededUser.email,
      role: seededUser.role,
      password: user.password,
    });
  }

  const subAccount = await upsertSubAccount(seedConfig.subAccount, agency.id);

  await upsertAgencySidebarOptions(agency.id);
  await upsertSubAccountSidebarOptions(subAccount.id);

  await upsertPermission(
    seedIds.permissions.owner,
    seededUsersByKey.owner.email,
    subAccount.id
  );
  await upsertPermission(
    seedIds.permissions.admin,
    seededUsersByKey.admin.email,
    subAccount.id
  );
  await upsertPermission(
    seedIds.permissions.member,
    seededUsersByKey.member.email,
    subAccount.id
  );

  await upsertDemoPipelineData({
    subAccountId: subAccount.id,
    ownerId: seededUsersByKey.owner.id,
    memberId: seededUsersByKey.member.id,
  });
  await upsertDemoFunnel(subAccount.id);

  const subscription = await upsertStripeDemoData({
    agencyId: agency.id,
    customerId: agency.customerId,
    stripeConfig: seedConfig.stripe,
  });

  process.stdout.write("Seed completed successfully.\n");
  process.stdout.write(`Agency: ${agency.name} (${agency.id})\n`);
  process.stdout.write(
    `Agency Stripe (demo): customer=${agency.customerId}, connect=${agency.connectAccountId}\n`
  );
  process.stdout.write(`Subaccount: ${subAccount.name} (${subAccount.id})\n`);
  process.stdout.write(
    `Subaccount Stripe (demo): connect=${subAccount.connectAccountId}\n`
  );
  process.stdout.write(
    `Subscription: ${subscription.subscritiptionId} (price=${subscription.priceId}, active=${subscription.active})\n`
  );
  process.stdout.write("Users:\n");
  for (const user of seededUsers) {
    process.stdout.write(
      `- ${user.role}: ${user.email} / ${user.password}\n`
    );
  }
  process.stdout.write(
    "Demo records: sidebar options, permissions, pipeline, lanes, tags, tickets, media, funnel, and funnel page.\n"
  );
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
