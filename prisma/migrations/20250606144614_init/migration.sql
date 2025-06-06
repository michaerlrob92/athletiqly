-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "strava_id" BIGINT NOT NULL,
    "discord_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "encrypted_strava_token" TEXT NOT NULL,
    "encrypted_refresh_token" TEXT NOT NULL,
    "token_expires_at" TIMESTAMP(3) NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discord_servers" (
    "id" TEXT NOT NULL,
    "discord_guild_id" TEXT NOT NULL,
    "guild_name" TEXT NOT NULL,
    "notification_channel_id" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discord_servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_server_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "role_permissions" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_server_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "strava_activity_id" BIGINT NOT NULL,
    "user_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "distance" DECIMAL(10,2) NOT NULL,
    "moving_time" INTEGER NOT NULL,
    "elapsed_time" INTEGER NOT NULL,
    "total_elevation_gain" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "raw_data" JSONB NOT NULL,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "object_id" BIGINT NOT NULL,
    "aspect_type" TEXT NOT NULL,
    "event_time" TIMESTAMP(3) NOT NULL,
    "subscription_id" INTEGER NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_strava_id_key" ON "users"("strava_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_discord_id_key" ON "users"("discord_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_deleted_at" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "discord_servers_discord_guild_id_key" ON "discord_servers"("discord_guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "idx_user_server_unique" ON "user_server_memberships"("user_id", "server_id");

-- CreateIndex
CREATE UNIQUE INDEX "activities_strava_activity_id_key" ON "activities"("strava_activity_id");

-- CreateIndex
CREATE INDEX "idx_activities_user_start" ON "activities"("user_id", "start_date");

-- CreateIndex
CREATE INDEX "idx_webhook_events_processed_created" ON "webhook_events"("processed", "created_at");

-- AddForeignKey
ALTER TABLE "user_server_memberships" ADD CONSTRAINT "user_server_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_server_memberships" ADD CONSTRAINT "user_server_memberships_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "discord_servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
