# Migration `20201003100445`

This migration has been generated by P-Chan at 10/3/2020, 7:04:45 PM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
DROP INDEX "public"."Alias.productId_stickerId_index"

ALTER TABLE "public"."Alias" ADD COLUMN "suffix" text   NOT NULL DEFAULT E''

CREATE INDEX "Alias.productId_stickerId_suffix_index" ON "public"."Alias"("productId", "stickerId", "suffix")
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20201002002538..20201003100445
--- datamodel.dml
+++ datamodel.dml
@@ -1,7 +1,7 @@
 datasource db {
   provider = "postgresql"
-  url = "***"
+  url = "***"
 }
 generator client {
   provider = "prisma-client-js"
@@ -36,12 +36,13 @@
   name      String
   teamId    String
   productId String
   stickerId String
+  suffix    String   @default("")
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   team Team @relation(fields: [teamId], references: [teamId])
   @@unique([name, teamId])
-  @@index([productId, stickerId])
+  @@index([productId, stickerId, suffix])
 }
```


