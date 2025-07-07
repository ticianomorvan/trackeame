# Trackeame

Trackeame is a full-stack web application that allows users to track multiple-platform delivery packages in a easy way. You can register packages from Correo Argentino and Andreani directly inside the website and receive email notifications when they have updates, usually faster than waiting for the official responses.

## Stack

### Front-end

- React v18
- React-Router v7
- Tailwind v4
- Radix UI (components)
- Lucide (icons)
- RHF + Zod (forms)
- Firebase
- Vite v6

Trackeame's front-end is a React SPA routed with React Router that provides basic funcionalities around Trackeame's product. Users may sign up with their Google account via Firebase Auth to then be able to register, follow and delete their packages.

### Back-end

- Fastify v5
- BullMQ v5 (Concurrency management)
- Playwright + Cheerio (Web Scrapping)
- Prisma ORM
- Firebase
- Resend
- Zod

Trackeame's back-end is in charge of processing database operations (such as managing delivery providers, registering packages, etc.) but also handling background jobs concurrently. We use BullMQ + Redis to schedule package's scrapping through provider-specific integrations using Playwright and Cheerio. By default, we do it every 30 minutes, but this can be adjusted. When a new event comes into a package's timeline, we notify the user via email using Resend API.

### Infrastructure

For development, just use `npm run dev` (check specific commands for each project). For deployment, use the given Docker Compose file: `compose.prod.yml`.

This will spin up Docker containers for:
- a PostgreSQL database with some sensible defaults,
- a Redis instance,
- a NodeJS-ready container for running the API,
- a NodeJS-ready container for running the Worker,
- an Umami self-hosted instance for running website analytics,
- a NGINX server routing traffic to each container.

I've faced different obstacles during development of Trackeame, such as handling Cloudflare Orange Cloud Proxy through NGINX, craft project-accurate Dockerfiles for each project to minimize overhead, and so on. Please review each project and pay attention if grabbing it as example or boilerplate for new projects.

# Conclusions

This project was successfully running in an `t3-small` AWS EC2 Instance, alongisde Firebase and Resend project set-ups.
