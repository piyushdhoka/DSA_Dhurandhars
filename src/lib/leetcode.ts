import dbConnect from './mongodb';
import { DailyStat } from '@/models/DailyStat';

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

// Calculate current streak from submission calendar
function calculateStreak(calendarData: string): number {
  if (!calendarData) return 0;
  
  try {
    const calendar = JSON.parse(calendarData);
    const timestamps = Object.keys(calendar).map(Number).sort((a, b) => b - a);
    
    if (timestamps.length === 0) return 0;
    
    let streak = 0;
    const oneDayInSeconds = 86400;
    const now = Math.floor(Date.now() / 1000);
    const todayStart = now - (now % oneDayInSeconds);
    
    // Check if solved today or yesterday (to account for timezone)
    const mostRecent = timestamps[0];
    if (mostRecent < todayStart - oneDayInSeconds) return 0;
    
    let currentDay = todayStart;
    
    for (const timestamp of timestamps) {
      const dayStart = timestamp - (timestamp % oneDayInSeconds);
      
      if (dayStart === currentDay || dayStart === currentDay - oneDayInSeconds) {
        if (dayStart < currentDay) {
          streak++;
          currentDay = dayStart;
        }
      } else {
        break;
      }
    }
    
    return streak;
  } catch (error) {
    console.error('Error calculating streak:', error);
    return 0;
  }
}

async function fetchLeetCodeUser(username: string) {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          userAvatar
          countryName
        }
        submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
        }
        submissionCalendar
        recentAcSubmissionList(limit: 5) {
          id
          title
          titleSlug
          timestamp
        }
      }
    }
  `;

  const response = await fetch(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { username } }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}

export async function fetchLeetCodeStats(username: string) {
  try {
    const userStats = await fetchLeetCodeUser(username);

    if (!userStats || !userStats.matchedUser) {
      throw new Error(`User "${username}" not found on LeetCode. Please check the username is correct.`);
    }

    const submitStats = userStats.matchedUser.submitStatsGlobal;
    if (!submitStats || !submitStats.acSubmissionNum || submitStats.acSubmissionNum.length === 0) {
      throw new Error(`Could not fetch submission stats for "${username}". The profile may be private.`);
    }

    const acNum = submitStats.acSubmissionNum;
    const easy = acNum.find((s: any) => s.difficulty === 'Easy')?.count || 0;
    const medium = acNum.find((s: any) => s.difficulty === 'Medium')?.count || 0;
    const hard = acNum.find((s: any) => s.difficulty === 'Hard')?.count || 0;
    const total = acNum.find((s: any) => s.difficulty === 'All')?.count || 0;
    const ranking = userStats.matchedUser.profile?.ranking || 0;
    const avatar = userStats.matchedUser.profile?.userAvatar || '';
    const country = userStats.matchedUser.profile?.countryName || '';
    const recentSubmissions = userStats.matchedUser.recentAcSubmissionList || [];
    
    // Calculate streak from submission calendar
    const calendar = userStats.matchedUser.submissionCalendar;
    const streak = calculateStreak(calendar);
    
    // Get last submission timestamp
    const lastSubmission = recentSubmissions.length > 0 ? recentSubmissions[0].timestamp : null;

    return {
      easy,
      medium,
      hard,
      total,
      ranking,
      avatar,
      country,
      recentSubmissions: recentSubmissions.map((s: any) => ({
        title: s.title,
        titleSlug: s.titleSlug,
        timestamp: s.timestamp,
      })),
      streak,
      lastSubmission,
    };
  } catch (error) {
    console.error(`Error fetching LeetCode stats for ${username}:`, error);
    throw error;
  }
}

export async function updateDailyStatsForUser(userId: string, leetcodeUsername: string) {
  await dbConnect();
  const stats = await fetchLeetCodeStats(leetcodeUsername);
  const today = new Date().toISOString().split('T')[0];

  // Find today's stat or the most recent one
  let todayStat = await DailyStat.findOne({ userId, date: today });

  // Get yesterday's or most recent stat to calculate points
  const lastStat = await DailyStat.findOne({
    userId,
    date: { $lt: today }
  }).sort({ date: -1 });

  // Calculate today's points with weighted scoring
  // Easy = 1 point, Medium = 3 points, Hard = 6 points
  let todayPoints = 0;
  let previousTotal = 0;

  if (lastStat) {
    // Calculate points based on new problems solved since last stat
    const newEasy = Math.max(0, stats.easy - lastStat.easy);
    const newMedium = Math.max(0, stats.medium - lastStat.medium);
    const newHard = Math.max(0, stats.hard - lastStat.hard);
    todayPoints = newEasy * 1 + newMedium * 3 + newHard * 6;
    previousTotal = lastStat.total;
  } else {
    // First ever entry for this user, no points yet
    previousTotal = stats.total;
    todayPoints = 0;
  }

  // Ensure points are non-negative
  todayPoints = Math.max(0, todayPoints);

  const update = {
    easy: stats.easy,
    medium: stats.medium,
    hard: stats.hard,
    total: stats.total,
    ranking: stats.ranking,
    avatar: stats.avatar,
    country: stats.country,
    streak: stats.streak,
    lastSubmission: stats.lastSubmission,
    recentProblems: stats.recentSubmissions.map((s: any) => s.title),
    previousTotal: todayStat ? previousTotal : stats.total, // Keep original baseline
    todayPoints,
  };

  return await DailyStat.findOneAndUpdate(
    { userId, date: today },
    update,
    { upsert: true, new: true }
  );
}
