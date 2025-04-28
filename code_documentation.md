# Web App Code Documentation

## Project Overview
This document provides detailed documentation of the codebase for a web application that appears to be a property management system with Hostaway integration, user management, payment processing with Stripe, and AI-powered features.

## Backend (FastAPI)

### Main Application Structure

#### `/backend/app/main.py`
- **Initializes the FastAPI application**
- Sets up CORS middleware to allow cross-origin requests
- Configures logging
- Mounts the main router that includes all API routes
- Integrates Socket.IO for real-time communication
- Sets up a background scheduler that runs `check_and_send_upsells` daily at midnight
- Provides a health check endpoint at `/api`

#### `/backend/app/database/db.py`
- **Database connection setup**
- Uses SQLAlchemy ORM with a connection URL from environment variables
- Creates the engine, session maker, and base class for models
- Provides a dependency injection function `get_db()` for database access in routes
- Support for both local development and production database connections

#### `/backend/app/routers/main.py`
- **Central router configuration**
- Aggregates all sub-routers:
  - User router
  - Admin router
  - Hostaway data router
  - User authentication router
  - Hostaway authentication router
  - Stripe payment router
  - Stats router
  - Listing subscription router

### Routers and API Endpoints

#### `/backend/app/routers/user.py`
- **User management endpoints**
- `/user/update` - Updates user information
- `/user/all-users` - Admin endpoint to retrieve all non-admin users with pagination
- `/user/change-password` - Handles password changes with security validation
- `/user/profile` - Returns user profile data including subscription and AI chat status
- `/user/ai-suggestion` - Endpoint for AI chat interactions using GPT own model
- `/user/generate-extension-key` - Generates key for Chrome extension authentication
- `/user/get-extension-key` - Retrieves a user's extension key
- `/user/validate-extension-token` - Validates extension tokens
- `/user/nearby-places` - Gets nearby places information
- `/user/update-ai` - Updates AI chat settings for a specific listing

#### `/backend/app/routers/admin.py`
- Administrative functions and endpoints

#### `/backend/app/routers/hostaway.py`
- Handles Hostaway API authentication and integration

#### `/backend/app/routers/hostway_data.py`
- Data retrieval and management for Hostaway listings

#### `/backend/app/routers/user_auth.py`
- User authentication endpoints (login, register, refresh token)

#### `/backend/app/routers/stripe.py`
- Payment processing with Stripe integration

#### `/backend/app/routers/stats.py`
- Statistical data endpoints for user and admin dashboard

#### `/backend/app/routers/listing_subscription.py`
- Managing user subscriptions for property listings

### Common Utilities

#### `/backend/app/common/auth.py`
- Authentication utilities for user verification
- Functions for password hashing and verification
- JWT token handling (encoding, decoding)
- Hostaway key validation

#### `/backend/app/common/chat_gpt_assistant.py`
- Integration with ChatGPT for AI assistant functionality
- Includes a `train_chat_gpt` function
- Functions to retrieve latest trained AI model IDs

#### `/backend/app/common/chat_query.py`
- Handles chat queries and processing
- Chat history storage functionality
- Includes utility functions like `haversine_distance` for location calculations

#### `/backend/app/common/hostaway_setup.py`
- Setup and configuration for Hostaway API integration
- Contains HTTP request wrappers for Hostaway API: `hostaway_get_request` and `hostaway_put_request`

#### `/backend/app/common/open_ai.py`
- OpenAI API integration utilities
- Functions for generating responses from GPT models
- Specialized function `nearby_spots_gpt_response` for listing local attractions

#### `/backend/app/common/send_email.py`
- Email sending functionality for notifications

#### `/backend/app/common/user_query.py`
- Processes user queries and requests
- Includes `update_user_details` function

### Data and Models

#### `/backend/app/data/chat_prompt.py`
- Defines prompts for chat interactions

#### `/backend/app/data/prompt.py`
- General prompts for AI interactions for chat

#### `/backend/app/data/task_create_prompt.py`
- Prompts specific to task creation

#### `/backend/app/models/user.py`
- User model definition for database
- Additional models:
  - `ChromeExtensionToken` - For chrome extension authentication
  - `Subscription` - For user subscription management
  - `ChatAIStatus` - For tracking AI chat activation status
  - `HostawayAccount` - For Hostaway integration

### Service Functions

#### `/backend/app/service/send_upshell_opportunity.py`
- Contains the `check_and_send_upsells` function that runs on schedule
- Identifies and sends upsell opportunities to users

#### `/backend/app/service/chat_service.py`
- Contains functions:
  - `get_current_user` - For user authentication
  - `get_user_subscription` - For subscription validation
  - `update_ai_status` - For updating AI chat status for guest
  - `get_active_ai_chats` - For retrieving active AI chat sessions

### Batch Processing

#### `/backend/app/batch_evaluate.py`
- Handles batch evaluation processes

### WebSocket Integration

#### `/backend/app/websocket.py`
- Real-time communication setup via Socket.IO
- Includes `update_checkout_date` function for real-time updates



## Frontend (React)

### Styling and Theme Configuration

#### `/front-end/tailwind.config.js`
- **Main Tailwind CSS configuration file**
- Defines the custom color palette used throughout the application:
  - Primary color scheme: Green gradient from `#0E2E23` to `#2D8062`
  - Text colors: White (`#FFFFFF`) for sidebar, dark (`#060606`) for active tabs
  - Background colors: Gradient background for sidebar, white for active tabs
  - Custom chart colors for data visualization
- Defines custom border radius for consistent UI components
- Configured font families: 'DM Sans' and 'Inter'
- Includes animation plugin for UI transitions

#### `/front-end/src/lib/utils.js`
- **Utility functions for styling**
- Contains `cn()` function that combines Tailwind classes using `clsx` and `tailwind-merge`
- This utility is used throughout the application for conditional class application

### Navigation and Router Components

#### `/front-end/src/components/Routes/Route.jsx`
- **Main routing configuration**
- Defines the routing structure for both admin and user interfaces
- Links routes to their respective components

#### `/front-end/src/components/common/sidebar/Sidebar.jsx`
- **Primary navigation component**
- Two navigation configurations:
  - Admin navigation: Home, Users, Settings
  - User navigation: Dashboard, Messages, Listings, Tasks, Upsells, Integrations, Settings

- **Styling and Color Scheme:**
  - Background: Gradient from `#0E2E23` (dark green) to `#2D8062` (medium green)
  - Inactive tab text: White (`#FFFFFF`/`#F1F1F1`)
  - Active tab: White background (`#FFFFFF`) with dark text (`#060606`)
  - Hover effect: Medium green (`#2D8062`) for better user interaction
  - Notification indicator: Red dot (`bg-red-500`) for unread messages

- **Responsive Design:**
  - Collapsible sidebar with toggle button
  - Different widths based on screen size:
    - Full width: `lg:w-[260px] w-[200px]`
    - Collapsed: `2xl:w-[120px] xl:w-[105px] lg:w-[110px] md:w-[120px]`
  - Mobile-friendly with off-canvas menu pattern

- **Icon Handling:**
  - Two types of icons: SVG paths (imported from Lucide React) and image files
  - Special handling for active state - SVG icons change color, image icons are inverted

- **Interactive Features:**
  - Route navigation via React Router
  - Unread message notification indicator
  - Sidebar expansion toggle
  - Scrollable navigation for longer menus

### Styling Customization Points

To modify the navigation tabs styling:

1. **Color Changes:**
   - To modify the sidebar gradient: Edit the `bg-gradient-to-r to-[#2D8062] from-[#0E2E23]` in `Sidebar.jsx`
   - To change active tab colors: Update `bg-[#FFFFFF] text-[#060606]` in the button component
   - To change inactive tab colors: Update `text-[#FFFFFF] hover:bg-[#2D8062]` in the button component
   - To modify text colors: Update `text-[#060606]` for active and `text-[#F1F1F1]` for inactive

2. **Text Styling:**
   - Font size can be adjusted by modifying `lg:text-xl text-md` class
   - Font family is defined in `tailwind.config.js` - update the `fontFamily` section

3. **Tab Shape and Size:**
   - For collapsed mode: Edit `rounded-xl scale-110 px-4 py-3 my-1`
   - For expanded mode: Edit `w-[90%] gap-2 px-4 lg:px-6 py-3 rounded-3xl`

4. **Navigation Configuration:**
   - Add or remove tabs by editing the `navigationConfig` object
   - Each item requires:
     - `id`: Unique identifier
     - `label`: Display text 
     - `icon`: Icon component or path to image
     - `route`: Target route path

## 1. Main Sidebar Navigation

**File:** `front-end/src/components/common/sidebar/Sidebar.jsx`

- **Colors:**
  - Sidebar gradient: `bg-gradient-to-r to-[#2D8062] from-[#0E2E23]` (lines 50-52)
  - Active tab: `bg-[#FFFFFF] text-[#060606]` (line 83)
  - Inactive tab: `text-[#FFFFFF] hover:bg-[#2D8062]` (line 83)
  - Notification indicator: `bg-red-500` (line 92)

- **Text:**
  - Font size: `lg:text-xl text-md` (line 91)
  - Active text color: `text-[#060606]` (lines 83, 91)
  - Inactive text color: `text-[#F1F1F1]` (line 91)

- **Shapes:**
  - Collapsed mode tabs: `rounded-xl scale-110 px-4 py-3 my-1` (line 83)
  - Expanded mode tabs: `w-[90%] gap-2 px-4 lg:px-6 py-3 rounded-3xl` (line 83)

## 2. Dashboard Tab

**File:** `front-end/src/pages/dashboard.jsx` and `front-end/src/pages/userdashboard.jsx`

- **Colors:**
  - Background: `bg-[#FCFDFC]` (line 12 in dashboard.jsx)

## 3. Messages Tab

**File:** `front-end/src/components/user/dashboard/Messages/MessageTab.jsx`

- **Styling:**
  - Messages container: `md:ml-4 mx-2 md:mr-5` (line 18)
  - Background color: `bg-white mt-24` (line 17)

**Message Right Sidebar:**
- **File:** `front-end/src/components/common/shimmer/MessageRightSidebr.jsx`
- Width: `w-80 lg:w-52 p-4` (line 3)

## 4. Listings Tab

**File:** `front-end/src/components/user/dashboard/listings/Listings.jsx`

**Listing Sidebar:**
- **File:** `front-end/src/components/user/dashboard/listings/ListingSidebar.jsx`
- **Colors:**
  - Background: `bg-[#FCFDFC]` (line 10)
  - Border: `border-gray-300` (line 10)
  - Active text: `text-[#000] font-light` (line 19)
  - Inactive text: `text-[#696969] font-extralight` (line 19)
- **Shape/Size:**
  - Width: `md:w-[181px] w-20` (line 10)
  - Navigation padding: `pt-16 px-3 md:px-14` (line 11)
  - Text size: `text-base md:text-2xl` (line 19)

**Properties Table:**
- **File:** `front-end/src/components/user/dashboard/listings/Properties.jsx`
- Background color: `bg-[#FCFDFC]` (line 8)

**Listing Nearby Details:**
- **File:** `front-end/src/components/user/dashboard/listings/ListingNearbyDetails.jsx`
- **Colors:**
  - Available status: `text-[#2D8062]` (line 74)
  - Unavailable status: `text-red-600` (line 74)
  - Info container: `bg-[#F8F8F8]` (line 91)
  - Border: `border-gray-300` (line 91)

## 5. Tasks Tab

**File:** `front-end/src/components/user/dashboard/task/TasksTab.jsx`

- **Button styling:**
  - Completed tasks button: `bg-[#E3E9F2] text-nowrap rounded-2xl h-8 flex gap-1 items-center px-3 py-3` (line 65)

**Task Stepper:**
- **File:** `front-end/src/components/user/dashboard/task/TaskSteper.jsx`
- **Colors:**
  - Completed steps: `bg-[#2D8062] border-[#2D8062] text-white` (lines 52-54)
  - Current step: `bg-white border-[#2D8062] text-[#2D8062]` (lines 54-55)
  - Incomplete steps: `bg-white border-gray-300 text-gray-300` (lines 56-57)
  - Line color completed: `bg-[#2D8062]` (lines 44-49)
  - Line color incomplete: `bg-gray-200` (line 49)

**Task Information:**
- **File:** `front-end/src/components/user/dashboard/task/TaskInformation.jsx`
- **Colors:**
  - Background: `bg-[#FCFDFC]` (line 14)
  - Active task: `bg-green-200 hover:bg-green-200` (line 36)
  - Inactive task: `bg-white` (line 36)
  - Border: `border-gray-300` (line 17)

**Task Details:**
- **File:** `front-end/src/components/user/dashboard/task/TaskDetails.jsx`
- **Colors:**
  - Text color: `text-black` (line 74)
  - Urgent priority: `text-[#E65F2B] bg-[#e65f2b2e]` (line 83)
  - Normal priority: `text-yellow-700 bg-yellow-100` (line 83)
  - Edit button: `bg-green-700 text-white... hover:bg-green-600` (line 104)

## 6. Settings Tab

**File:** `front-end/src/components/admin/dashboard/Setting.jsx` and `front-end/src/components/user/dashboard/setting/MainSetting.jsx`

- **Colors:**
  - Button color: `bg-green-800 text-white` (lines 156, 190)

**Hostaway Account:**
- **File:** `front-end/src/components/user/dashboard/setting/HostawayAccount.jsx`
- **Colors:**
  - Alert text: `text-yellow-600 dark:text-yellow-500` (line 91)
  - Add account button: `bg-green-800 border-green-600 hover:bg-green-700 text-white` (line 100)
  - Popup background: `bg-gray-800 bg-opacity-50` (line 109)
  - Popup box: `bg-white` (line 110)
  - No button: `text-gray-700 bg-gray-200... hover:bg-gray-300` (line 121)
  - Yes button: `text-white bg-red-600... hover:bg-red-700` (line 127)

## 7. Global Styling

**File:** `front-end/tailwind.config.js`

- **Colors:** The main color palette is defined here
- **Font Family:** 
  ```js
  fontFamily: {
    sans: ['DM Sans', 'sans-serif'],
    inter: ['Inter', 'sans-serif']
  }
  ```

**File:** `front-end/src/index.css`

- Contains CSS variables for colors in both light and dark modes
- Defines the main color scheme for the application
- Contains utility classes like `scrollbar-hide`

## 8. Message Input Selector

**File:** `front-end/src/components/user/dashboard/Messages/MuitiSelector.jsx`

- Height: `height: 36` (line 46)
- Font: `fontSize: "15px", fontFamily: "DM Sans", fontWeight: 500` (line 46)

This information should help you easily locate the exact files and code blocks where you need to edit colors, text styling, shapes, and dimensions for each tab and component in the application.


### API Integration

#### `/front-end/src/api/api.js`
- **API client setup and configuration**
- Creates an axios instance with the backend API base URL
- Implements JWT token handling with automatic refresh:
  - Checks for token expiration before requests
  - Refreshes token when needed using `/user/refresh-token` endpoint
  - Handles authentication errors (401) by clearing tokens and redirecting
- Implements response interceptors for handling authentication failures
- Exports standardized API methods:
  - `get(url)` - For GET requests
  - `post(url, data)` - For POST requests
  - `put(url, data)` - For PUT requests
  - `delete(url, data)` - For DELETE requests

### Application Structure

#### Directory Structure
- `/front-end/src`
  - `/api` - API integration
  - `/assets` - Static assets
  - `/components` - UI components
    - `/admin` - Admin interface components
    - `/common` - Shared components
    - `/Routes` - Route definitions
    - `/ui` - UI library components
    - `/user` - User interface components
  - `/context` - React context providers
  - `/helpers` - Helper utilities
  - `/hooks` - Custom React hooks
  - `/lib` - Library utilities
  - `/pages` - Page components
  - `/store` - State management

### Key Frontend Components

#### Admin Components
- `/components/admin/dashboard` - Admin dashboard views
- `/components/admin/login` - Admin login interface

#### User Components
- `/components/user/auth` - User authentication components
- `/components/user/dashboard` - Main user dashboard
  - `/home` - Home dashboard view
  - `/listings` - Property listings management
  - `/Messages` - Messaging interface
  - `/setting` - User settings
  - `/staff` - Staff management
  - `/task` - Task management
  - `/upsell` - Upsell opportunities interface

#### Common Components
- `/components/common/auth` - Shared authentication components
- `/components/common/modals` - Modal dialog components
- `/components/common/sidebar` - Sidebar navigation
- `/components/common/statcard` - Statistics card components

### Helpers and Utilities

#### `/front-end/src/helpers`
- `adminStat.js` - Admin statistics utilities
- `TaskHelper.js` - Task-related utilities
- `user.js` - User-related utilities
- `Upsellhelpers.js` - Upsell functionality helpers
- `prompt.js` - Prompt utilities for AI interactions
- `statHelper.js` - Statistics helper functions
- `taskPrompt.js` - Task prompt utilities
- `Message.js` - Message handling utilities
- `localstorage.js` - Local storage interaction:
  - Provides getItem/setItem functionality for browser storage
  - Used by API client for token management
- `payment.js` - Payment processing utilities
- `ListingsHelper.js` - Property listing utilities

#### `/front-end/src/hooks`
- `useAuth.js` - Authentication hook for React components
- `useAIsuggestion.js` - AI suggestion functionality integration

## System Configuration

### `/backend/requirements.txt`
- Lists all Python dependencies for the backend
- Key dependencies include:
  - FastAPI
  - SQLAlchemy
  - APScheduler
  - OpenAI
  - Socket.IO

### `/backend/.env`
- Environment variables for the backend
- Contains database URLs, API keys, and other configuration

## Authentication Flow

1. Users register through `/user/register` endpoint
2. Login via `/user/login` to receive access and refresh tokens
3. API requests include access token in Authorization header
4. Token auto-refresh occurs when the token is about to expire
5. Admin authentication uses the same flow but with different role restrictions

## AI Integration

The application integrates AI features through:
1. OpenAI GPT for chat suggestions and responses
2. AI assistants for property management tasks
3. Location-based AI suggestions for nearby attractions
4. Task management with AI assistance
