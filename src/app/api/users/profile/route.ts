import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { db } from '@/db/drizzle';
import { users, User } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateDailyStatsForUser, LeetCodeError } from '@/lib/leetcode';
import { profileUpdateSchema, validateRequest, createErrorResponse } from '@/lib/validation';
import type { AuthenticatedUser } from '@/types';

// Type for the update payload
interface UserUpdatePayload {
  name?: string;
  github?: string;
  linkedin?: string | null;
  leetcodeUsername?: string;
  phoneNumber?: string | null;
}

export const PUT = requireAuth(async (req: NextRequest, user) => {
  try {
    // Manual admin cannot update profile through this endpoint
    if (typeof user.id === 'string') {
      return NextResponse.json(
        createErrorResponse('Manual admin cannot update profile', 'FORBIDDEN'),
        { status: 403 }
      );
    }

    const body = await req.json();

    // Validate request body with Zod
    const validation = validateRequest(profileUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        createErrorResponse(validation.error, 'VALIDATION_ERROR', validation.details),
        { status: 400 }
      );
    }

    const { name, phoneNumber, github, linkedin, leetcodeUsername } = validation.data;

    const updateData: UserUpdatePayload = {};
    if (name) updateData.name = name;

    // Attach links if only usernames are provided
    if (github) {
      updateData.github = github.startsWith('http') ? github : `https://github.com/${github.replace('@', '')}`;
    }

    if (linkedin !== undefined) {
      if (!linkedin) {
        updateData.linkedin = null;
      } else {
        updateData.linkedin = linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin.replace('@', '')}`;
      }
    }

    if (leetcodeUsername) updateData.leetcodeUsername = leetcodeUsername;

    if (phoneNumber !== undefined) {
      updateData.phoneNumber = phoneNumber ? phoneNumber.replace(/\s/g, '') : null;
    }

    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning();

    if (!updatedUser) {
      return NextResponse.json(
        createErrorResponse('User not found', 'NOT_FOUND'),
        { status: 404 }
      );
    }

    // Trigger immediate LeetCode sync if username was set
    if (leetcodeUsername) {
      try {
        await updateDailyStatsForUser(updatedUser.id, updatedUser.leetcodeUsername);
      } catch (syncError) {
        console.error('Initial LeetCode sync failed:', syncError);
        // Handle LeetCode-specific errors with user-friendly messages
        if (syncError instanceof LeetCodeError) {
          return NextResponse.json(
            createErrorResponse(syncError.message, syncError.code),
            { status: 400 }
          );
        }
        // Check for user not found in generic errors
        if (syncError instanceof Error &&
          (syncError.message.includes('not found') || syncError.message.includes('does not exist'))) {
          return NextResponse.json(
            createErrorResponse(syncError.message, 'LEETCODE_USER_NOT_FOUND'),
            { status: 400 }
          );
        }
      }
    }

    // Calculate isProfileIncomplete using the same logic as auth sync
    const isProfileIncomplete =
      !updatedUser.leetcodeUsername ||
      updatedUser.leetcodeUsername.startsWith('pending_') ||
      !updatedUser.github ||
      updatedUser.github === 'pending' ||
      !updatedUser.phoneNumber ||
      !updatedUser.linkedin;

    const responseUser: AuthenticatedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      leetcodeUsername: updatedUser.leetcodeUsername,
      github: updatedUser.github,
      linkedin: updatedUser.linkedin,
      phoneNumber: updatedUser.phoneNumber,
      role: updatedUser.role,
      isProfileIncomplete,
    };

    return NextResponse.json({ user: responseUser });
  } catch (error) {
    console.error('Profile update error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      createErrorResponse(message, 'INTERNAL_ERROR'),
      { status: 500 }
    );
  }
});
