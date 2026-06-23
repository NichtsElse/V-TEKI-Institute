# Supabase Migration Instructions

This directory has been organized to make it easy to migrate your database to a new Supabase project.

## 1. Setup Your New Project
- Create a new project in Supabase.
- Open the **SQL Editor** in your new project's dashboard.

## 2. Execute Migrations in Order
Inside the `migrations/` folder, you will find numbered SQL scripts. Copy their contents and run them in the SQL Editor in this exact order:

1. **`00_reset_database.sql`** (Optional, only if you need to wipe existing tables)
2. **`01_schema.sql`** (Creates all the required tables and columns)
3. **`02_policies.sql`** (Enables Row Level Security and creates role-based access policies)
4. **`03_seed_auth.sql`** (Optional, inserts demo users into auth.users and profile)
5. **`04_seed_data.sql`** (Inserts sample dummy data into the app tables)

## Archive
Older policy files and patch scripts (like MVP reads and specific trainer fixes) have been moved to the `archive/` folder to prevent confusion. You generally **do not** need to run anything from the archive for a fresh migration.
