#!/bin/bash

# StudyFlow Deployment Script
# Run this script to build and deploy Phase 2

echo "🚀 StudyFlow Phase 2 Deployment"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo ""
    echo "Please install Node.js first:"
    echo "  Option 1: brew install node"
    echo "  Option 2: Download from https://nodejs.org/"
    echo ""
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available!"
    echo "Please ensure npm is installed with Node.js"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed!"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Run build
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    echo "Please fix the errors above and try again."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Git operations
echo "📝 Committing changes..."
git add .
git commit -m "Phase 2: AI Insights, Gamification, Leaderboard, Referrals"

if [ $? -ne 0 ]; then
    echo "⚠️  No changes to commit or git error"
    echo "Continuing with push..."
fi

echo ""
echo "🚀 Pushing to GitHub..."
git push origin main

if [ $? -ne 0 ]; then
    echo "❌ Git push failed!"
    echo "Please check your git configuration and try manually:"
    echo "  git add ."
    echo "  git commit -m 'Phase 2 deployment'"
    echo "  git push origin main"
    exit 1
fi

echo ""
echo "================================"
echo "✅ Deployment Complete!"
echo "================================"
echo ""
echo "📋 Next Steps:"
echo "1. Go to https://vercel.com/dashboard"
echo "2. Your project should auto-deploy"
echo "3. Check Vercel build logs for any errors"
echo ""
echo "🗄️  Don't forget to run Phase 2 SQL schema in Supabase!"
echo "   File: supabase-phase2-schema.sql"
echo ""
