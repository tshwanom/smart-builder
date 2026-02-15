# FEAT-001-Init: System Initialization & Clean Architecture Setup

## 🎯 Goal

Initialize the Next.js 14 project with strict Clean Architecture to support the Standards-Driven BOQ System.

## 📋 Scope

- Initialize Next.js (App Router, TS, Tailwind)
- Set up Clean Architecture folders (`src/core`, `src/modules`)
- Configure Supabase client
- Install core UI dependencies (Shadcn/UI, Konva)

## 🏗️ Architecture

Following **Clean Architecture** patterns:

- `src/core/domain`: Universal entities (Wall, Room)
- `src/modules/*`: Feature-specific logic
- `app/*`: Routing Only
