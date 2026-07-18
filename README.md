# ResQ-portal-MERN
📖 Overview
ResQ-Portal is a full-stack Lost & Found Management System built with the MERN stack (MongoDB, Express.js, React.js, Node.js). It leverages Google Gemini AI for intelligent image tagging and Socket.IO for real-time anonymous chat, helping university students and staff recover lost items efficiently.

The system automatically matches lost and found items using a smart scoring algorithm that considers date, location, description text, and AI-generated image tags.
✨ Key Features
🔍 AI-Powered Smart Matching
Google Gemini AI integration for image recognition

Automatically extracts 5 keywords from uploaded images (color, brand, material, type)

Scoring algorithm with 4 weighted factors:

Date Match (25 pts) - within 7 days window

Location Match (25 pts) - exact location match

Text Match (up to 30 pts) - keyword extraction from descriptions

AI Tags Match (up to 35 pts) - image recognition tags

Match threshold: 45+ points triggers automatic match

💬 Real-Time Anonymous Chat
Socket.IO WebSocket connection for instant messaging

Identity protection - only nicknames are visible

Typing indicators, online/offline status

Chat history persistence

System messages for match notifications and handover updates

🔐 Secure Handover System
OTP-based verification (6-digit code, 15-minute expiration)

Only the finder (person who found the item) can initiate handover

Both items marked as returned upon successful verification

Finder receives +50 trust points

Real-time leaderboard updates

👤 Trust Score & Gamification
Each user starts with trustScore: 0

Successfully returning items → +50 points

Leaderboard to encourage community participation

🖼️ Image Management
Cloudinary integration for image hosting

Automatic AI tagging on upload

Automatic image cleanup on item deletion

📱 Comprehensive Dashboard
Active Items - View all pending lost/found items

Returned Items - Track completed handovers
🛠️ Technical Stack
The ResQ-Portal system is built on a modern full-stack architecture combining robust backend technologies with a responsive frontend interface.

Backend Technologies
The backend is powered by Node.js (v18+) with Express.js as the REST API framework, providing a lightweight and scalable server environment. Data persistence is handled by MongoDB with Mongoose ODM, offering flexible schema design for managing users, items, chat rooms, and messages efficiently. JSON Web Tokens (JWT) are implemented for secure authentication and session management, ensuring only authorized users can access protected endpoints.

For AI capabilities, the system integrates Google Generative AI (Gemini) to perform intelligent image tagging and object recognition, automatically extracting relevant keywords such as color, brand, material, and type from uploaded images. Cloudinary serves as the image hosting and management solution, handling uploads, transformations, and automatic cleanup of image assets. Nodemailer is used for email notifications, sending OTPs and match alerts to users. Socket.IO enables real-time WebSocket communication, powering the anonymous chat feature with instant message delivery, typing indicators, and online/offline presence detection.

The backend follows a clean layered architecture with controllers handling request/response logic, service layers managing business rules, models defining data structures, and middleware for cross-cutting concerns like authentication, rate limiting, and input validation. The API exposes RESTful endpoints organized by functional modules, supporting all system operations from item creation to OTP verification.

Frontend Technologies
The frontend is developed using React 18, leveraging its component-based architecture to build a dynamic and responsive user interface. React Router v6 handles client-side navigation, enabling seamless transitions between different views such as the dashboard, conversations list, and individual chat windows.

For real-time communication, the frontend integrates Socket.IO Client, maintaining persistent WebSocket connections for instant message delivery, live status updates, and real-time notifications. User interface components are styled using CSS-in-JS, providing scoped styling with dynamic theming capabilities. Lucide React supplies the icon library, offering a consistent set of modern, SVG-based icons throughout the application.

The frontend is structured around reusable components, with state management handled through React hooks (useState, useEffect, useContext) and custom hooks for complex logic such as real-time messaging and notification polling. The application is fully responsive, optimized for both desktop and mobile viewing, ensuring accessibility across devices.

Architecture Overview

The system follows a client-server architecture with the frontend serving as the presentation layer, communicating with the backend API via HTTP/HTTPS for data operations and WebSocket connections for real-time features. The backend acts as the application layer, managing all business logic, authentication, AI integrations, and database interactions. MongoDB serves as the persistent storage layer, with indexes optimized for query performance on frequently accessed fields like item categories, user IDs, and chat room participants.
My Conversations - All chat rooms with matches

Real-time Notifications - Match alerts and messages
