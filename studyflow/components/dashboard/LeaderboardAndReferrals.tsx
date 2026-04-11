'use client'

import { useState } from 'react'
import { Trophy, Medal, Award, TrendingUp, Gift, Users, Copy, Share2, CheckCircle2, Star } from 'lucide-react'

const mockLeaderboard = [
  { rank: 1, name: 'Anonymous Topper', hours: 45.5, streak: 28, level: 'Genius', avatar: '🥇' },
  { rank: 2, name: 'Anonymous Genius', hours: 42.3, streak: 25, level: 'Master', avatar: '🥈' },
  { rank: 3, name: 'Anonymous Scholar', hours: 38.7, streak: 21, level: 'Topper', avatar: '🥉' },
  { rank: 4, name: 'Anonymous Student', hours: 35.2, streak: 18, level: 'Scholar', avatar: '4' },
  { rank: 5, name: 'Anonymous Learner', hours: 32.1, streak: 15, level: 'Student', avatar: '5' },
  { rank: 6, name: 'You', hours: 28.5, streak: 12, level: 'Learner', avatar: '⭐', isYou: true },
  { rank: 7, name: 'Anonymous User', hours: 25.3, streak: 10, level: 'Learner', avatar: '7' },
  { rank: 8, name: 'Anonymous User', hours: 22.8, streak: 8, level: 'Student', avatar: '8' },
  { rank: 9, name: 'Anonymous User', hours: 20.1, streak: 7, level: 'Beginner', avatar: '9' },
  { rank: 10, name: 'Anonymous User', hours: 18.5, streak: 5, level: 'Beginner', avatar: '10' },
]

const referralTiers = [
  { referrals: 1, reward: '1 month free', icon: '🎉' },
  { referrals: 3, reward: '3 months free', icon: '🎁' },
  { referrals: 5, reward: '6 months free', icon: '🏆' },
  { referrals: 10, reward: '1 year free', icon: '👑' },
]

export default function LeaderboardAndReferrals() {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'referrals'>('leaderboard')
  const [copied, setCopied] = useState(false)
  const referralCode = 'STUDY-ABC123' // In production, generate unique codes
  const referralLink = `${window?.location?.origin || 'https://studyflow.app'}/ref/${referralCode}`
  const referredCount = 2 // Mock data

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 font-semibold rounded-lg transition-all text-sm ${
            activeTab === 'leaderboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          🏆 Leaderboard
        </button>
        <button
          onClick={() => setActiveTab('referrals')}
          className={`px-4 py-2 font-semibold rounded-lg transition-all text-sm ${
            activeTab === 'referrals' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
          }`}
        >
          🎁 Refer & Earn
        </button>
      </div>

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <>
          {/* Top 3 Podium */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 sm:w-8 sm:h-8" />
              Weekly Leaderboard
            </h2>
            <div className="grid grid-cols-3 gap-3 sm:gap-4 items-end">
              {/* 2nd Place */}
              <div className="text-center">
                <div className="text-3xl sm:text-5xl mb-2">{mockLeaderboard[1].avatar}</div>
                <p className="text-xs sm:text-sm font-semibold truncate">Anonymous</p>
                <p className="text-xs opacity-90">{mockLeaderboard[1].hours}h</p>
                <div className="bg-white/20 rounded-lg py-2 mt-2">
                  <span className="text-lg sm:text-2xl font-bold">2nd</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="text-center">
                <div className="text-4xl sm:text-6xl mb-2">{mockLeaderboard[0].avatar}</div>
                <p className="text-sm sm:text-base font-bold truncate">Anonymous</p>
                <p className="text-xs opacity-90">{mockLeaderboard[0].hours}h</p>
                <div className="bg-white/30 rounded-lg py-3 mt-2">
                  <span className="text-2xl sm:text-3xl font-bold">1st</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="text-center">
                <div className="text-3xl sm:text-5xl mb-2">{mockLeaderboard[2].avatar}</div>
                <p className="text-xs sm:text-sm font-semibold truncate">Anonymous</p>
                <p className="text-xs opacity-90">{mockLeaderboard[2].hours}h</p>
                <div className="bg-white/20 rounded-lg py-1 mt-2">
                  <span className="text-lg sm:text-2xl font-bold">3rd</span>
                </div>
              </div>
            </div>
          </div>

          {/* Full Leaderboard */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Full Rankings</h3>
              <p className="text-sm text-gray-500">This week's top performers</p>
            </div>
            <div className="divide-y divide-gray-100">
              {mockLeaderboard.map((user) => (
                <div
                  key={user.rank}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 ${
                    user.isYou ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                    user.rank === 1 ? 'bg-amber-500 text-white' :
                    user.rank === 2 ? 'bg-gray-400 text-white' :
                    user.rank === 3 ? 'bg-orange-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm sm:text-base ${
                      user.isYou ? 'text-blue-600' : 'text-gray-900'
                    }`}>
                      {user.name}
                      {user.isYou && <span className="ml-2 text-xs text-blue-500">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-600">{user.level} • 🔥 {user.streak} day streak</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm sm:text-base">{user.hours}h</p>
                    <p className="text-xs text-gray-500">this week</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Referrals Tab */}
      {activeTab === 'referrals' && (
        <>
          {/* Referral Hero */}
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full" />
            <div className="absolute -bottom-30 -left-30 w-80 h-80 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <Gift className="w-10 h-10 sm:w-12 sm:h-12 mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Refer & Earn Rewards</h2>
              <p className="text-sm sm:text-base opacity-90 mb-4">
                Invite your friends and get free months for each successful referral!
              </p>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm mb-2">Your Referral Code:</p>
                <div className="flex items-center gap-2">
                  <code className="text-lg sm:text-xl font-bold flex-1">{referralCode}</code>
                  <button
                    onClick={copyReferralLink}
                    className="bg-white text-purple-600 px-3 py-2 rounded-lg font-semibold flex items-center gap-2"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Share Your Link</h3>
            <div className="bg-gray-50 rounded-lg p-3 mb-3">
              <code className="text-xs sm:text-sm break-all">{referralLink}</code>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyReferralLink}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold flex items-center justify-center gap-2"
              >
                {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button className="bg-green-600 text-white py-2.5 px-4 rounded-lg font-semibold">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Your Referrals */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Your Referrals</h3>
                <p className="text-sm text-gray-500">{referredCount} friends referred</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                {referredCount}
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm text-purple-800">
                🎉 You've earned <strong>{referredCount} month{referredCount > 1 ? 's' : ''} free</strong>! 
                Refer {3 - referredCount} more to unlock 3 months free!
              </p>
            </div>
          </div>

          {/* Reward Tiers */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Reward Tiers</h3>
              <p className="text-sm text-gray-500">More referrals = Better rewards</p>
            </div>
            <div className="divide-y divide-gray-100">
              {referralTiers.map((tier, index) => (
                <div
                  key={tier.referrals}
                  className={`flex items-center gap-4 p-4 ${
                    referredCount >= tier.referrals ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="text-3xl">{tier.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{tier.referrals} Referrals</p>
                    <p className="text-sm text-gray-600">{tier.reward}</p>
                  </div>
                  {referredCount >= tier.referrals ? (
                    <span className="badge badge-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="badge bg-gray-100 text-gray-500">
                      {tier.referrals - referredCount} more needed
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Share Buttons */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Share Via</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button className="bg-green-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition-colors">
                💬 WhatsApp
              </button>
              <button className="bg-blue-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
                📱 Telegram
              </button>
              <button className="bg-sky-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-sky-600 transition-colors">
                🐦 Twitter
              </button>
              <button className="bg-indigo-500 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors">
                📧 Email
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
