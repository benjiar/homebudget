import { households, householdMembers } from '@homebudget/db';
import { InferSelectModel } from 'drizzle-orm';

export type Household = InferSelectModel<typeof households>;
export type HouseholdMember = InferSelectModel<typeof householdMembers>;

export type HouseholdWithMembers = Household & {
  members: (HouseholdMember & {
    user: {
      id: string;
      email: string;
      fullName: string | null;
      avatarUrl: string | null;
    };
  })[];
};

export type CreateHouseholdInput = {
  name: string;
};

export type UpdateHouseholdInput = {
  name?: string;
  settings?: {
    currency: string;
    defaultCategories: string[];
  };
};

export type InviteMemberInput = {
  email: string;
};

export type RemoveMemberInput = {
  memberId: string;
}; 