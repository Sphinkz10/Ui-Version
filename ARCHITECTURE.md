# Architecture Overview

This document outlines the high-level architecture of the **PerformTrack / V-Login2** platform. The system is designed for high performance, ease of use, and multi-platform availability, leveraging a modern stack.

## High-Level Architecture

The platform follows a modular architecture split into the following core layers:

1. **Frontend (Web):**
   - Built with **React 18** and **Vite** for rapid development and optimized builds.
   - State-based routing handles top-level navigation, with conditional rendering for sub-pages.
   - Styled with Tailwind CSS and Radix UI components.

2. **Mobile:**
   - Powered by **Capacitor**, wrapping the responsive React web app into native iOS and Android applications. This allows for a single unified codebase across web and mobile.

3. **Backend & Authentication:**
   - **Supabase** serves as the primary backend, providing PostgreSQL for relational data storage.
   - Handles real-time subscriptions, bulk data operations, and secure authentication (using RLS policies).
   - Custom backend processing scripts and decision-engine rules are used to orchestrate complex logic, like performance evaluation.

4. **API:**
   - **Hono** is integrated for extremely fast, edge-optimized routing where applicable.
   - API endpoints enforce strict authentication validations, such as JWT bearer tokens and workspace isolation.

## Diagram

Below is a simplified architecture diagram using Mermaid:

```mermaid
graph TD
    subgraph Client Layer
        Web[Web Browser (React/Vite)]
        Mobile[Mobile App (Capacitor)]
    end

    subgraph API Layer
        HonoAPI[Hono Edge Router]
    end

    subgraph Core Backend
        Supabase[Supabase PostgreSQL]
        Auth[Supabase Auth / JWT]
        DecisionEngine[Decision Engine / Rules]
    end

    Web -->|HTTPS/WSS| Supabase
    Mobile -->|HTTPS/WSS| Supabase

    Web -->|API Requests| HonoAPI
    Mobile -->|API Requests| HonoAPI

    HonoAPI -->|Database Queries| Supabase
    HonoAPI --> Auth

    Supabase --> DecisionEngine
    DecisionEngine -.->|Automated Decisions| Supabase
```

## Security & Access
- All endpoints authenticate using JWT.
- Workspace isolation is strictly verified.
- Content Security Policy (CSP) is strictly configured (e.g., no `unsafe-eval`).
