{
      id: 'T1-1',
      title: 'Database Schema Design & Setup',
      description: 'Design and implement the complete database schema with proper relationships, indexes, and constraints.',
      assignee: 'Michael',
      estimatedHours: 12,
      priority: 'High',
      status: 'Not Started',
      dependencies: [],
      acceptanceCriteria: [
        'PostgreSQL database schema designed and documented',
        'Prisma ORM configured with proper models',
        'Database migrations created and tested',
        'Seed data scripts for development environment',
        'Database connection pooling configured',
        'Backup and recovery procedures documented'
      ],
      technicalRequirements: [
        'PostgreSQL 14+ database instance',
        'Prisma ORM with TypeScript integration',
        'Database migration system',
        'Connection pooling (pg-pool)',
        'Database indexing strategy for performance'
      ],
      category: 'Database',
      week: 1
    },

        {
      id: "database",
      title: "Database Schema",
      icon: <Database className="w-5 h-5" />,
      content: (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Core Tables</h4>
            <div className="grid gap-4">
              <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                <h5 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2" />
                  users
                </h5>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-blue-800">
                  <div>• id (UUID, Primary Key)</div>
                  <div>• strava_id (BigInt, Unique)</div>
                  <div>• discord_id (String, Unique)</div>
                  <div>• email (String, Unique)</div>
                  <div>• username (String)</div>
                  <div>• encrypted_strava_token (Text)</div>
                  <div>• encrypted_refresh_token (Text)</div>
                  <div>• token_expires_at (Timestamp)</div>
                  <div>• preferences (JSONB)</div>
                  <div>• created_at (Timestamp)</div>
                  <div>• updated_at (Timestamp)</div>
                  <div>• deleted_at (Timestamp, Nullable)</div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                <h5 className="font-semibold text-green-900 mb-2 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  discord_servers
                </h5>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-green-800">
                  <div>• id (UUID, Primary Key)</div>
                  <div>• discord_guild_id (String, Unique)</div>
                  <div>• guild_name (String)</div>
                  <div>• notification_channel_id (String)</div>
                  <div>• settings (JSONB)</div>
                  <div>• is_active (Boolean)</div>
                  <div>• created_at (Timestamp)</div>
                  <div>• updated_at (Timestamp)</div>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
                <h5 className="font-semibold text-purple-900 mb-2 flex items-center">
                  <GitBranch className="w-4 h-4 mr-2" />
                  user_server_memberships
                </h5>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-purple-800">
                  <div>• id (UUID, Primary Key)</div>
                  <div>• user_id (UUID, Foreign Key)</div>
                  <div>• server_id (UUID, Foreign Key)</div>
                  <div>• is_active (Boolean)</div>
                  <div>• role_permissions (JSONB)</div>
                  <div>• created_at (Timestamp)</div>
                  <div>• UNIQUE(user_id, server_id)</div>
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-400">
                <h5 className="font-semibold text-orange-900 mb-2 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  activities
                </h5>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-orange-800">
                  <div>• id (UUID, Primary Key)</div>
                  <div>• strava_activity_id (BigInt, Unique)</div>
                  <div>• user_id (UUID, Foreign Key)</div>
                  <div>• activity_type (String)</div>
                  <div>• name (String)</div>
                  <div>• description (Text)</div>
                  <div>• distance (Decimal)</div>
                  <div>• moving_time (Integer)</div>
                  <div>• elapsed_time (Integer)</div>
                  <div>• total_elevation_gain (Decimal)</div>
                  <div>• start_date (Timestamp)</div>
                  <div>• timezone (String)</div>
                  <div>• raw_data (JSONB)</div>
                  <div>• processed_at (Timestamp)</div>
                  <div>• created_at (Timestamp)</div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
                <h5 className="font-semibold text-red-900 mb-2 flex items-center">
                  <Webhook className="w-4 h-4 mr-2" />
                  webhook_events
                </h5>
                <div className="grid md:grid-cols-2 gap-2 text-sm text-red-800">
                  <div>• id (UUID, Primary Key)</div>
                  <div>• event_type (String)</div>
                  <div>• object_type (String)</div>
                  <div>• object_id (BigInt)</div>
                  <div>• aspect_type (String)</div>
                  <div>• event_time (Timestamp)</div>
                  <div>• subscription_id (Integer)</div>
                  <div>• processed (Boolean)</div>
                  <div>• processed_at (Timestamp)</div>
                  <div>• error_message (Text)</div>
                  <div>• created_at (Timestamp)</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Performance & Security Features
            </h4>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Database Indexes
                </h5>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>
                    •{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs">
                      users.strava_id
                    </code>{" "}
                    (Unique)
                  </li>
                  <li>
                    •{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs">
                      users.discord_id
                    </code>{" "}
                    (Unique)
                  </li>
                  <li>
                    •{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs">
                      users.email
                    </code>{" "}
                    (Unique)
                  </li>
                  <li>
                    •{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs">
                      users.deleted_at
                    </code>{" "}
                    (Partial, WHERE NULL)
                  </li>
                  <li>
                    •{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs">
                      activities.user_id, start_date
                    </code>{" "}
                    (Composite)
                  </li>
                  <li>
                    •{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs">
                      activities.strava_activity_id
                    </code>{" "}
                    (Unique)
                  </li>
                  <li>
                    •{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs">
                      webhook_events.processed, created_at
                    </code>
                  </li>
                  <li>
                    •{" "}
                    <code className="bg-gray-200 px-1 rounded text-xs">
                      discord_servers.discord_guild_id
                    </code>{" "}
                    (Unique)
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Lock className="w-4 h-4 mr-2" />
                  Security Features
                </h5>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Encrypted OAuth tokens at rest</li>
                  <li>• UUID primary keys for security</li>
                  <li>• Soft delete for GDPR compliance</li>
                  <li>• JSONB for flexible preferences</li>
                  <li>• Foreign key constraints enforced</li>
                  <li>• Connection pooling (10-20 connections)</li>
                  <li>• Row-level security policies</li>
                  <li>• Audit logging for sensitive operations</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Relationships & Constraints
            </h4>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">
                    Foreign Key Relationships
                  </h5>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>
                      •{" "}
                      <code className="bg-white px-1 rounded text-xs">
                        user_server_memberships.user_id → users.id
                      </code>
                    </li>
                    <li>
                      •{" "}
                      <code className="bg-white px-1 rounded text-xs">
                        user_server_memberships.server_id → discord_servers.id
                      </code>
                    </li>
                    <li>
                      •{" "}
                      <code className="bg-white px-1 rounded text-xs">
                        activities.user_id → users.id
                      </code>
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">
                    Data Validation
                  </h5>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>• Email format validation</li>
                    <li>• Discord ID length constraints</li>
                    <li>• Activity type enumeration</li>
                    <li>• Timestamp range validation</li>
                    <li>• JSONB schema validation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Prisma Schema Configuration
            </h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-700">
                <div className="mb-2 font-medium">Key Prisma Features:</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-1">
                    <li>• TypeScript-first ORM integration</li>
                    <li>• Automated migration generation</li>
                    <li>• Type-safe database queries</li>
                    <li>• Connection pooling with pgBouncer</li>
                  </ul>
                  <ul className="space-y-1">
                    <li>• Database introspection support</li>
                    <li>• Seed scripts for development data</li>
                    <li>• Query optimization and logging</li>
                    <li>• Multi-environment configuration</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },