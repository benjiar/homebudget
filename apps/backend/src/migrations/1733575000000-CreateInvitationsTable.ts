import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInvitationsTable1733575000000 implements MigrationInterface {
    name = 'CreateInvitationsTable1733575000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create invitations table
        await queryRunner.query(`
            CREATE TABLE "invitations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying(255) NOT NULL,
                "household_id" uuid NOT NULL,
                "role" "household_members_role_enum" NOT NULL DEFAULT 'member',
                "invited_by" uuid NOT NULL,
                "invited_at" TIMESTAMP NOT NULL DEFAULT now(),
                "expires_at" TIMESTAMP NOT NULL,
                "is_accepted" boolean NOT NULL DEFAULT false,
                "accepted_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_invitations" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_invitations_email_household" UNIQUE ("email", "household_id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "invitations" 
            ADD CONSTRAINT "FK_invitations_household" 
            FOREIGN KEY ("household_id") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "invitations" 
            ADD CONSTRAINT "FK_invitations_invited_by" 
            FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Add index for efficient lookups
        await queryRunner.query(`
            CREATE INDEX "IDX_invitations_email" ON "invitations" ("email")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_invitations_household_id" ON "invitations" ("household_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_invitations_expires_at" ON "invitations" ("expires_at")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_invitations_expires_at"`);
        await queryRunner.query(`DROP INDEX "IDX_invitations_household_id"`);
        await queryRunner.query(`DROP INDEX "IDX_invitations_email"`);
        
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_invited_by"`);
        await queryRunner.query(`ALTER TABLE "invitations" DROP CONSTRAINT "FK_invitations_household"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "invitations"`);
    }
} 