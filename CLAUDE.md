# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Guidelines

**IMPORTANT**: This is a Japanese project (Succubus Matching App). When interacting with users, always respond in Japanese (日本語) unless specifically requested otherwise. The application interface, comments, and user interactions are all in Japanese.

## Development Commands

### Server Commands
- `npm start` - Start production server on port 3000
- `npm run dev` - Start development server with hot reload
- `npm run install-deps` - Install production dependencies
- `npm run install-test-deps` - Install development and testing dependencies

### Testing Commands
- `npm test` or `npm run test` - Run unit tests with Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run end-to-end tests with Playwright

### File Structure
- Main server: `server.js` (Express.js with WebSocket hot reload)
- Frontend: `index.html`, `style.css`, `script.js`
- Data files: `succubi-data.json` (character data), `likes-data.json` (like counts)
- Configuration: `config.js` (application settings)
- Tests: `tests/` directory with Vitest and Playwright test files

## Application Architecture

### Hot Reload System
The application uses chokidar for file watching and WebSocket for real-time browser updates. Files are monitored for changes (*.html, *.css, *.js, *.json) and automatically trigger browser refreshes.

### Data Management
- **Character Data**: Stored in `succubi-data.json` with structured character information
- **Like System**: Persistent likes stored in `likes-data.json` with API endpoints for CRUD operations
- **File Locking**: Implemented to prevent data corruption during concurrent writes
- **Data Validation**: Server-side validation with backup and recovery mechanisms

### API Endpoints
- `POST /api/likes/increment` - Increment like count for character
- `GET /api/likes/count/:characterId` - Get like count for specific character  
- `GET /api/likes/all` - Get all like counts with statistics
- `GET /api/character/:characterId` - Get character details with like count
- `GET /api/characters` - Get all characters with like counts

### Frontend Architecture
- **LikeManager Class**: Handles offline/online like operations with queue system
- **SuccubusRealmApp Class**: Main application logic with card swiping interface
- **Modal System**: Character detail views with like functionality
- **Offline Support**: Operations queued when offline and synced when online

### Key Features
- Tinder-style card swiping interface (touch/mouse support)
- Character detail modals with like functionality
- Harem management with statistics
- Offline-first like system with automatic sync
- Real-time like count updates
- Comprehensive error handling and user feedback

### Testing Setup
- **Vitest**: Unit tests with jsdom environment
- **Playwright**: E2E tests across multiple browsers
- **Test Setup**: Custom test setup file at `tests/test-setup.js`
- Server automatically starts for E2E tests on port 3000

### Development Notes
- Uses ES modules in frontend, CommonJS in backend
- WebSocket connection on same port as HTTP server
- File watching excludes node_modules automatically
- Environment variables supported via dotenv