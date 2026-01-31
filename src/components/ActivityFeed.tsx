"use client";

import { motion } from "framer-motion";
import { ExternalLink, Terminal, Clock, Flame } from "lucide-react";
import { LeaderboardEntry, LeetCodeSubmission } from "@/types";
import { getTimeAgo } from "@/lib/utils";

interface ActivityFeedProps {
    entries: LeaderboardEntry[];
    activities?: FlattenedActivity[];
}

interface FlattenedActivity extends LeetCodeSubmission {
    userName: string;
    leetcodeUsername: string;
    avatar?: string;
}

export default function ActivityFeed({ entries, activities: providedActivities }: ActivityFeedProps) {
    const nowTs = Math.floor(Date.now() / 1000);
    const seventyTwoHoursAgo = nowTs - (3 * 24 * 60 * 60);

    // If activities are provided from the API (3rd party de-duplicated), use them.
    // Otherwise fallback to deriving from the current leaderboard entries.
    const activities: FlattenedActivity[] = (providedActivities || entries
        .flatMap(user => (user.recentProblems || []).map(problem => ({
            ...problem,
            userName: user.name,
            leetcodeUsername: user.leetcodeUsername,
            avatar: user.avatar
        }))))
        .filter((a: any) => Number(a.timestamp) >= seventyTwoHoursAgo)
        .sort((a: any, b: any) => Number(b.timestamp) - Number(a.timestamp))
        .slice(0, 30);

    if (activities.length === 0) {
        return (
            <div className="bg-[#F1F3F4]/50 dark:bg-muted/50 rounded-3xl border border-[#E8EAED] dark:border-border p-8 text-center">
                <div className="h-12 w-12 bg-[#F1F3F4] dark:bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Terminal className="h-5 w-5 text-[#5F6368] dark:text-muted-foreground" />
                </div>
                <h3 className="text-[#202124] dark:text-foreground font-bold mb-1">Silence in the arena...</h3>
                <p className="text-[#5F6368] dark:text-muted-foreground text-sm">No recent solutions detected. Is everyone sleeping?</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-card rounded-3xl border border-[#E8EAED] dark:border-border p-6 shadow-[0_1px_2px_0_rgba(60,64,67,0.3),0_1px_3px_1px_rgba(60,64,67,0.15)] dark:shadow-none">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[#5F6368] dark:text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-[#34A853]" />
                    Activity
                </h3>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[#CEEAD6] dark:bg-emerald-500/10 rounded-full">
                    <div className="w-1.5 h-1.5 bg-[#34A853] rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-[#0D652D] dark:text-emerald-400 uppercase tracking-tight">Live</span>
                </div>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[600px] pr-2 no-scrollbar">
                {activities.map((activity, index) => (
                    <motion.div
                        key={`${activity.id}-${index}`}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 rounded-2xl bg-[#F1F3F4]/50 dark:bg-muted/50 border border-[#E8EAED] dark:border-border hover:bg-white dark:hover:bg-card transition-all group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="relative">
                                <div className="h-10 w-10 rounded-xl bg-[#4285F4] flex items-center justify-center text-white font-bold overflow-hidden">
                                    {activity.avatar ? (
                                        <img src={activity.avatar} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        activity.userName.charAt(0)
                                    )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-[#34A853] rounded-full border-2 border-white dark:border-card flex items-center justify-center">
                                    <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                                </div>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h4 className="text-sm font-bold text-[#202124] dark:text-foreground truncate">
                                        {activity.userName.split(' ')[0]}
                                    </h4>
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-[#5F6368] dark:text-muted-foreground">
                                        <Clock className="w-3 h-3" />
                                        {getTimeAgo(activity.timestamp)}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs text-[#5F6368] dark:text-muted-foreground truncate pr-2">
                                        Solved <span className="font-bold text-[#202124] dark:text-foreground">"{activity.title}"</span>
                                    </p>
                                    <a
                                        href={`https://leetcode.com/problems/${activity.titleSlug}/`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#5F6368] dark:text-muted-foreground hover:text-[#4285F4] dark:hover:text-primary transition-colors"
                                    >
                                        <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
