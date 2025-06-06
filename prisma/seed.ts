import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Clean the database
  await prisma.webhookEvent.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.userServerMembership.deleteMany();
  await prisma.discordServer.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        stravaId: 123456789,
        discordId: '123456789012345678',
        email: 'test.user1@example.com',
        username: 'TestUser1',
        encryptedStravaToken: 'encrypted_token_1',
        encryptedRefreshToken: 'encrypted_refresh_1',
        tokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        preferences: {
          units: 'metric',
          notifications: {
            email: true,
            discord: true,
          },
        },
      },
    }),
    prisma.user.create({
      data: {
        stravaId: 987654321,
        discordId: '876543210987654321',
        email: 'test.user2@example.com',
        username: 'TestUser2',
        encryptedStravaToken: 'encrypted_token_2',
        encryptedRefreshToken: 'encrypted_refresh_2',
        tokenExpiresAt: new Date(Date.now() + 3600000),
        preferences: {
          units: 'imperial',
          notifications: {
            email: false,
            discord: true,
          },
        },
      },
    }),
  ]);

  // Create test Discord servers
  const servers = await Promise.all([
    prisma.discordServer.create({
      data: {
        discordGuildId: '123456789012345678',
        guildName: 'Test Running Club',
        notificationChannelId: '123456789012345678',
        settings: {
          welcomeMessage: 'Welcome to our running club!',
          activityNotifications: true,
          minimumActivityDistance: 5, // km
        },
      },
    }),
    prisma.discordServer.create({
      data: {
        discordGuildId: '876543210987654321',
        guildName: 'Cycling Enthusiasts',
        notificationChannelId: '876543210987654321',
        settings: {
          welcomeMessage: 'Welcome to our cycling community!',
          activityNotifications: true,
          minimumActivityDistance: 10, // km
        },
      },
    }),
  ]);

  // Create user-server memberships
  await Promise.all([
    prisma.userServerMembership.create({
      data: {
        userId: users[0].id,
        serverId: servers[0].id,
        rolePermissions: {
          canManageServer: true,
          canViewActivities: true,
          canPostNotifications: true,
        },
      },
    }),
    prisma.userServerMembership.create({
      data: {
        userId: users[0].id,
        serverId: servers[1].id,
        rolePermissions: {
          canManageServer: false,
          canViewActivities: true,
          canPostNotifications: false,
        },
      },
    }),
    prisma.userServerMembership.create({
      data: {
        userId: users[1].id,
        serverId: servers[0].id,
        rolePermissions: {
          canManageServer: false,
          canViewActivities: true,
          canPostNotifications: true,
        },
      },
    }),
  ]);

  // Create test activities
  await Promise.all([
    // Running activities
    prisma.activity.create({
      data: {
        stravaActivityId: 1234567890,
        userId: users[0].id,
        activityType: 'Run',
        name: 'Morning Run',
        description: 'Easy morning run around the park',
        distance: 5.2,
        movingTime: 1800, // 30 minutes
        elapsedTime: 2000,
        totalElevationGain: 50.5,
        startDate: new Date('2024-03-01T08:00:00Z'),
        timezone: 'America/New_York',
        rawData: {
          average_speed: 2.89,
          max_speed: 3.5,
          average_heartrate: 145,
          max_heartrate: 165,
          average_cadence: 170,
          device_name: 'Garmin Forerunner 245',
        },
        processedAt: new Date(),
      },
    }),
    prisma.activity.create({
      data: {
        stravaActivityId: 1234567891,
        userId: users[0].id,
        activityType: 'Run',
        name: 'Long Run',
        description: 'Long run training for marathon',
        distance: 21.1, // Half marathon
        movingTime: 7200, // 2 hours
        elapsedTime: 7500,
        totalElevationGain: 150.2,
        startDate: new Date('2024-03-03T07:00:00Z'),
        timezone: 'America/New_York',
        rawData: {
          average_speed: 2.93,
          max_speed: 3.8,
          average_heartrate: 155,
          max_heartrate: 175,
          average_cadence: 168,
          device_name: 'Garmin Forerunner 245',
        },
        processedAt: new Date(),
      },
    }),
    // Cycling activities
    prisma.activity.create({
      data: {
        stravaActivityId: 9876543210,
        userId: users[1].id,
        activityType: 'Ride',
        name: 'Weekend Ride',
        description: 'Group ride with friends',
        distance: 45.5,
        movingTime: 5400, // 1.5 hours
        elapsedTime: 6000,
        totalElevationGain: 350.8,
        startDate: new Date('2024-03-02T10:00:00Z'),
        timezone: 'America/New_York',
        rawData: {
          average_speed: 8.43,
          max_speed: 12.5,
          average_heartrate: 135,
          max_heartrate: 160,
          average_cadence: 85,
          device_name: 'Garmin Edge 530',
        },
        processedAt: new Date(),
      },
    }),
  ]);

  // Create test webhook events
  await Promise.all([
    prisma.webhookEvent.create({
      data: {
        eventType: 'create',
        objectType: 'activity',
        objectId: 1234567890,
        aspectType: 'create',
        eventTime: new Date('2024-03-01T08:30:00Z'),
        subscriptionId: 1,
        processed: true,
        processedAt: new Date('2024-03-01T08:31:00Z'),
      },
    }),
    prisma.webhookEvent.create({
      data: {
        eventType: 'create',
        objectType: 'activity',
        objectId: 1234567891,
        aspectType: 'create',
        eventTime: new Date('2024-03-03T07:30:00Z'),
        subscriptionId: 1,
        processed: true,
        processedAt: new Date('2024-03-03T07:31:00Z'),
      },
    }),
    prisma.webhookEvent.create({
      data: {
        eventType: 'create',
        objectType: 'activity',
        objectId: 9876543210,
        aspectType: 'create',
        eventTime: new Date('2024-03-02T10:30:00Z'),
        subscriptionId: 1,
        processed: false,
      },
    }),
  ]);
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
