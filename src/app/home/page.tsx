"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/components/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Trophy, Target, Crown, LogOut } from "lucide-react";

interface LeaderboardEntry {
    id: string;
    name: string;
    email: string;
    leetcodeUsername: string;
    todayPoints: number;
    totalScore: number;
    totalProblems: number;
    rank: number;
}

const MOTIVATIONAL_ROASTS = [
    "Did you solve anything today or just scrolling?",
    "Your competitors are grinding right now. What are you doing?",
    "That 0 points is making recruiters cry!",
    "Bro solve at least one problem, need to impress that recruiter!",
    "Sitting idle? Try that graph question!",
    "Your struggle story will go viral on LinkedIn... for the wrong reasons!",
    "Can't even do Two Sum? Maybe engineering isn't for you!",
];

function getRandomRoast() {
    return MOTIVATIONAL_ROASTS[Math.floor(Math.random() * MOTIVATIONAL_ROASTS.length)];
}

export default function HomePage() {
    const { user, logout, isLoading: authLoading, token } = useAuth();
    const router = useRouter();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
    const [roast] = useState(getRandomRoast());

    const fetchLeaderboard = useCallback(async (showLoader = true) => {
        if (showLoader) setIsLoading(true);
        setIsRefreshing(true);
        try {
            const res = await fetch("/api/leaderboard");
            const data = await res.json();
            if (Array.isArray(data)) {
                setLeaderboard(data);
                setLastRefresh(new Date());
            }
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const refreshStats = async () => {
        if (!user || !token) return;
        setIsRefreshing(true);
        try {
            await fetch("/api/users/refresh", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
            });
            await fetchLeaderboard(false);
        } catch (error) {
            console.error("Failed to refresh stats:", error);
        } finally {
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (user) {
            fetchLeaderboard();
            const interval = setInterval(() => fetchLeaderboard(false), 30000);
            return () => clearInterval(interval);
        }
    }, [user, fetchLeaderboard]);

    if (authLoading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user) return null;

    const currentUserEntry = leaderboard.find(e => e.email === user.email);
    const myPoints = currentUserEntry?.todayPoints || 0;
    const myRank = currentUserEntry?.rank || '-';

    return (
        <div className="min-h-screen bg-white text-gray-800 font-sans">
            {/* Header - Google Style Navbar */}
            <header className="fixed top-0 inset-x-0 bg-white/90 backdrop-blur-md z-50 border-b border-gray-200">
                <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Image src="/logo.png" alt="Logo" width={40} height={40} className="object-contain" priority />
                        <span className="text-2xl font-medium tracking-tight text-gray-500">
                            DSA <span className="text-gray-900 font-semibold">Grinders</span>
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost" 
                            size="sm"
                            onClick={refreshStats}
                            disabled={isRefreshing}
                            className="text-gray-600 hover:bg-gray-50 hover:text-blue-600 font-medium rounded-full px-4"
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Sync Stats
                        </Button>
                        <div className="h-6 w-px bg-gray-200 mx-1"></div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={logout}
                            className="text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full h-9 w-9 p-0"
                            title="Logout"
                        >
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="max-w-[1000px] mx-auto pt-24 pb-12 px-6">
                
                {/* Minimalist Welcome/Roast */}
                <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-gray-900 mb-4">
                        {myPoints === 0 ? "Zero points?" : "Keep climbing."}
                    </h1>
                    <p className="text-lg text-gray-500 max-w-2xl mx-auto font-light">
                        {myPoints === 0 ? roast : "Great job solving problems today. Don't stop now."}
                    </p>
                </div>

                {/* Stats Grid - Clean Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Today's Points */}
                    <div className="bg-white rounded-3xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow border border-gray-100 flex flex-col items-center justify-center text-center group">
                        <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-blue-600">
                           <Target className="h-6 w-6" />
                        </div>
                        <p className="text-4xl font-normal text-gray-900 mb-2">{myPoints}</p>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Points Today</p>
                    </div>

                    {/* Rank */}
                    <div className="bg-white rounded-3xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow border border-gray-100 flex flex-col items-center justify-center text-center group">
                        <div className="h-12 w-12 bg-yellow-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-yellow-600">
                           <Crown className="h-6 w-6" />
                        </div>
                        <p className="text-4xl font-normal text-gray-900 mb-2">#{myRank}</p>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Current Rank</p>
                    </div>

                    {/* Total Problems */}
                    <div className="bg-white rounded-3xl p-8 shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] transition-shadow border border-gray-100 flex flex-col items-center justify-center text-center group">
                        <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-green-600">
                           <Trophy className="h-6 w-6" />
                        </div>
                        <p className="text-4xl font-normal text-gray-900 mb-2">{currentUserEntry?.totalProblems || 0}</p>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Lifetime Solved</p>
                    </div>
                </div>

                {/* Leaderboard Table */}
                <div className="bg-white rounded-3xl overflow-hidden border border-gray-200 shadow-sm">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                        <h2 className="text-xl font-normal text-gray-800">Leaderboard</h2>
                        {lastRefresh && (
                            <span className="text-xs font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
                                Updated {lastRefresh.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        )}
                    </div>
                    
                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 opacity-50" />
                        </div>
                    ) : leaderboard.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                            <p>No data available yet.</p>
                        </div>
                    ) : (
                        <>
                            {/* Header Row */}
                            <div className="px-8 py-3 flex items-center gap-6 bg-gray-50/50 border-b border-gray-100">
                                <div className="w-8 flex-shrink-0"></div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Name</span>
                                </div>
                                <div className="flex gap-8 items-center">
                                    <div className="text-right w-16">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</span>
                                    </div>
                                    <div className="text-right w-16">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Today</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Data Rows */}
                            <div className="divide-y divide-gray-100">
                                {leaderboard.map((entry, index) => (
                                    <div 
                                        key={entry.id} 
                                        className={`px-8 py-5 flex items-center gap-6 transition-colors hover:bg-gray-50 ${
                                            entry.email === user.email ? 'bg-blue-50/40' : ''
                                        }`}
                                    >
                                        <div className={`
                                            w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0
                                            ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                                              index === 1 ? 'bg-gray-100 text-gray-600' :
                                              index === 2 ? 'bg-orange-100 text-orange-700' :
                                              'text-gray-400'}
                                        `}>
                                            {entry.rank}
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-gray-900 truncate">{entry.name}</p>
                                                {entry.email === user.email && (
                                                    <span className="text-[10px] font-bold tracking-wide text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full uppercase">You</span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 font-normal truncate">@{entry.leetcodeUsername}</p>
                                        </div>
                                        
                                        <div className="flex gap-8 items-center">
                                            <div className="text-right w-16">
                                                <span className="text-lg font-semibold text-gray-900">{entry.totalScore}</span>
                                            </div>
                                            <div className="text-right w-16">
                                                <span className="text-lg font-medium text-blue-600">{entry.todayPoints}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
