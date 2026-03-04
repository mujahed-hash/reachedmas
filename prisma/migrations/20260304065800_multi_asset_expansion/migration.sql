-- Multi-Asset Platform Expansion Migration
-- Renames vehicles → assets, adds type/metadata columns, adds family_members table

-- 1. Rename `vehicles` table to `assets`
ALTER TABLE "vehicles" RENAME TO "assets";

-- 2. Add new columns to assets
ALTER TABLE "assets" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'CAR';

ALTER TABLE "assets" ADD COLUMN "subtitle" TEXT;

ALTER TABLE "assets" ADD COLUMN "image_url" TEXT;

ALTER TABLE "assets" ADD COLUMN "metadata" TEXT;

-- 3. Rename `model` + `color` → populate `name` from them, then drop old columns
ALTER TABLE "assets" ADD COLUMN "name" TEXT;

UPDATE "assets"
SET
    "name" = COALESCE("color", '') || ' ' || COALESCE("model", '');
-- Store old vehicle-specific data as JSON metadata
UPDATE "assets" SET "metadata" = json_build_object(
    'model', "model",
    'color', "color",
    'year', "year",
    'licensePlate', "licensePlate",
    'licensePlateHash', "licensePlateHash"
)::text;
-- Make name NOT NULL after population
ALTER TABLE "assets" ALTER COLUMN "name" SET NOT NULL;
-- Drop old vehicle-specific columns
ALTER TABLE "assets" DROP COLUMN IF EXISTS "model";

ALTER TABLE "assets" DROP COLUMN IF EXISTS "color";

ALTER TABLE "assets" DROP COLUMN IF EXISTS "year";

ALTER TABLE "assets" DROP COLUMN IF EXISTS "licensePlate";

ALTER TABLE "assets" DROP COLUMN IF EXISTS "licensePlateHash";

-- 4. Rename `vehicleId` → `assetId` in tags
ALTER TABLE "tags" RENAME COLUMN "vehicleId" TO "assetId";

-- 5. Rename `vehicleId` → `assetId` in auto_replies
ALTER TABLE "auto_replies" RENAME COLUMN "vehicleId" TO "assetId";

-- 6. Add photoUrl to interactions
ALTER TABLE "interactions" ADD COLUMN "photoUrl" TEXT;

-- 7. Create family_members table
CREATE TABLE "family_members" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "family_members_pkey" PRIMARY KEY ("id")
);

-- 8. Create unique constraint on family_members
CREATE UNIQUE INDEX "family_members_ownerId_memberId_key" ON "family_members" ("ownerId", "memberId");

-- 9. Add foreign keys for family_members
ALTER TABLE "family_members"
ADD CONSTRAINT "family_members_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "family_members"
ADD CONSTRAINT "family_members_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 10. Rename foreign key constraint on tags (vehicleId → assetId)
ALTER TABLE "tags" DROP CONSTRAINT IF EXISTS "tags_vehicleId_fkey";

ALTER TABLE "tags"
ADD CONSTRAINT "tags_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 11. Rename foreign key constraint on auto_replies
ALTER TABLE "auto_replies"
DROP CONSTRAINT IF EXISTS "auto_replies_vehicleId_fkey";

ALTER TABLE "auto_replies"
ADD CONSTRAINT "auto_replies_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "assets" ("id") ON DELETE CASCADE ON UPDATE CASCADE;