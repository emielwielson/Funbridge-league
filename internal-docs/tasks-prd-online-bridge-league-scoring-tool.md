## Relevant Files

### Database & Schema
- `supabase/migrations/001_initial_schema.sql` - Database schema with all tables (users, divisions, leagues, matches, match_results)
- `supabase/migrations/002_rls_policies.sql` - Row-level security policies for all tables
- `supabase/migrations/003_initial_admin.sql` - Script to create initial admin user
- `supabase/config.ts` - Supabase client configuration with session pooling

### Authentication
- `lib/auth/supabase-client.ts` - Supabase client initialization
- `lib/auth/auth-helpers.ts` - Authentication helper functions (login, register, logout, getSession)
- `app/(auth)/register/page.tsx` - User registration page
- `app/(auth)/login/page.tsx` - User login page
- `components/auth/AuthForm.tsx` - Reusable authentication form component
- `lib/auth/auth-helpers.test.ts` - Unit tests for auth helpers

### User Management
- `lib/types/user.ts` - TypeScript types for User, Role, etc.
- `lib/api/users.ts` - API functions for user operations (getAllUsers, promoteToAdmin, updateHandicap)
- `lib/api/users.test.ts` - Unit tests for user API functions
- `components/user/UserList.tsx` - Component to display list of all users (admin only)
- `components/user/UserRoleBadge.tsx` - Component to display user role
- `components/user/HandicapEditor.tsx` - Component for admins to edit player handicaps

### Division Management
- `lib/types/division.ts` - TypeScript types for Division
- `lib/api/divisions.ts` - API functions for division operations (create, getAll, assignPlayer, removePlayer)
- `lib/api/divisions.test.ts` - Unit tests for division API functions
- `components/admin/DivisionManager.tsx` - Component for creating and managing divisions
- `components/admin/PlayerAssignment.tsx` - Component for assigning players to divisions

### League Management
- `lib/types/league.ts` - TypeScript types for League, LeagueStatus
- `lib/api/leagues.ts` - API functions for league operations (create, start, finish, getActive, getArchived)
- `lib/api/leagues.test.ts` - Unit tests for league API functions
- `components/admin/LeagueControls.tsx` - Component for starting/finishing leagues
- `app/(admin)/old-leagues/page.tsx` - Page to view archived leagues
- `components/admin/OldLeaguesList.tsx` - Component to display archived leagues

### Match Generation
- `lib/types/match.ts` - TypeScript types for Match, MatchResult
- `lib/utils/match-generation.ts` - Round-robin match generation algorithm
- `lib/utils/match-generation.test.ts` - Unit tests for match generation
- `lib/api/matches.ts` - API functions for match operations (generate, getAll, getByDivision, getByPlayer)
- `lib/api/matches.test.ts` - Unit tests for match API functions

### Match Results
- `lib/utils/match-calculations.ts` - Functions to calculate match outcomes, points, and final scores
- `lib/utils/match-calculations.test.ts` - Unit tests for match calculations
- `components/matches/MatchList.tsx` - Component to display list of matches
- `components/matches/ScoreEntryForm.tsx` - Form component for entering match scores
- `components/matches/MatchResultDisplay.tsx` - Component to display match results
- `lib/api/match-results.ts` - API functions for result operations (submit, update, getByMatch)
- `lib/api/match-results.test.ts` - Unit tests for match result API functions

### Rankings
- `lib/utils/rankings.ts` - Functions to calculate rankings and sort players
- `lib/utils/rankings.test.ts` - Unit tests for rankings calculations
- `lib/api/rankings.ts` - API functions to fetch calculated rankings
- `components/rankings/RankingsTable.tsx` - Component to display rankings table
- `components/rankings/DivisionSelector.tsx` - Component for switching between divisions
- `app/(main)/results/page.tsx` - Main results/rankings page

### UI Components
- `components/layout/Navbar.tsx` - Main navigation component
- `components/layout/AdminNav.tsx` - Admin-specific navigation items
- `components/ui/Button.tsx` - Reusable button component
- `components/ui/Input.tsx` - Reusable input component
- `components/ui/Table.tsx` - Reusable table component
- `components/ui/Select.tsx` - Reusable select/dropdown component
- `components/ui/Alert.tsx` - Component for error/success messages
- `app/layout.tsx` - Root layout with responsive design
- `app/globals.css` - Global styles with mobile-first approach

### Utilities & Types
- `lib/types/index.ts` - Centralized type exports
- `lib/utils/validation.ts` - Input validation utilities
- `lib/utils/validation.test.ts` - Unit tests for validation
- `lib/hooks/useAuth.ts` - Custom hook for authentication state
- `lib/hooks/useUser.ts` - Custom hook for current user data
- `lib/hooks/useIsAdmin.ts` - Custom hook to check admin status

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Supabase RLS policies should be tested to ensure proper access control.
- Match generation algorithm should handle edge cases (empty divisions, single player, etc.).

## Tasks

- [ ] 1.0 Database Schema & Supabase Setup
  - [ ] 1.1 Create Supabase project and configure connection settings
  - [ ] 1.2 Design and create database schema migration for users table (id, username, password_hash, role, handicap, created_at, updated_at)
  - [ ] 1.3 Create database schema migration for divisions table (id, name, created_at, updated_at)
  - [ ] 1.4 Create database schema migration for leagues table (id, status, created_at, updated_at, finished_at)
  - [ ] 1.5 Create database schema migration for matches table (id, league_id, division_id, player_a_id, player_b_id, created_at)
  - [ ] 1.6 Create database schema migration for match_results table (id, match_id, player_a_imp_score, player_b_imp_score, entered_by_user_id, created_at, updated_at)
  - [ ] 1.7 Create junction table for player_divisions (player_id, division_id, league_id) to track player assignments
  - [ ] 1.8 Add database constraints: unique username, check constraint for league status values, foreign key constraints
  - [ ] 1.9 Add database constraint to ensure only one active league at a time (unique partial index on status='active')
  - [ ] 1.10 Create RLS policies migration: users can read their own data, admins can read all user data
  - [ ] 1.11 Create RLS policies for divisions: all authenticated users can read, only admins can write
  - [ ] 1.12 Create RLS policies for leagues: all authenticated users can read, only admins can write
  - [ ] 1.13 Create RLS policies for matches: players can read matches they're part of, admins can read all
  - [ ] 1.14 Create RLS policies for match_results: players can read results for their matches, players can insert/update results for their matches, admins can read/update all
  - [ ] 1.15 Create migration script to manually create initial admin user in database
  - [ ] 1.16 Configure Supabase client with session pooling settings
  - [ ] 1.17 Test database connections and verify RLS policies work correctly

- [ ] 2.0 Authentication & User Management
  - [ ] 2.1 Set up Supabase Auth configuration
  - [ ] 2.2 Create Supabase client initialization utility with proper error handling
  - [ ] 2.3 Implement user registration function (username + password, create user record with role='player', default handicap=0)
  - [ ] 2.4 Implement user login function (username + password)
  - [ ] 2.5 Implement logout function
  - [ ] 2.6 Implement getSession function to retrieve current user session
  - [ ] 2.7 Create registration page with form (username, password, confirm password)
  - [ ] 2.8 Create login page with form (username, password)
  - [ ] 2.9 Create reusable AuthForm component for shared form logic
  - [ ] 2.10 Add form validation (username requirements, password strength, matching passwords)
  - [ ] 2.11 Add error handling and display error messages for failed auth attempts
  - [ ] 2.12 Implement protected route middleware to check authentication
  - [ ] 2.13 Create user context/hook to provide current user data throughout app
  - [ ] 2.14 Display current user's role in navigation/header
  - [ ] 2.15 Write unit tests for authentication helper functions

- [ ] 3.0 Admin Features (Player Management, Divisions, League Management)
  - [ ] 3.1 Create admin-only route protection middleware/component
  - [ ] 3.2 Implement API function to fetch all registered players (admin only)
  - [ ] 3.3 Create UserList component to display all players in a table (username, role, handicap, division)
  - [ ] 3.4 Implement API function to promote a player to admin role
  - [ ] 3.5 Add "Promote to Admin" button/action in UserList component
  - [ ] 3.6 Implement API function to update a player's handicap (admin only)
  - [ ] 3.7 Create HandicapEditor component with input field and save button
  - [ ] 3.8 Display handicap next to player name in relevant components
  - [ ] 3.9 Implement API function to create a new division (admin only)
  - [ ] 3.10 Create DivisionManager component with form to create divisions (name input)
  - [ ] 3.11 Implement API function to fetch all divisions
  - [ ] 3.12 Display list of existing divisions in DivisionManager
  - [ ] 3.13 Implement API function to assign a player to a division (admin only)
  - [ ] 3.14 Implement API function to remove a player from a division (admin only)
  - [ ] 3.15 Create PlayerAssignment component with dropdown to select division and player list
  - [ ] 3.16 Add validation: ensure player belongs to only one division at a time
  - [ ] 3.17 Implement API function to create a new league (status='draft', admin only)
  - [ ] 3.18 Implement API function to start a league (check no active league exists, set status='active', admin only)
  - [ ] 3.19 Implement API function to finish a league (set status='archived', set finished_at timestamp, admin only)
  - [ ] 3.20 Create LeagueControls component with "Start League" and "Finish League" buttons
  - [ ] 3.21 Add validation to prevent starting league if another is active
  - [ ] 3.22 Add validation to prevent operations on archived leagues (read-only enforcement)
  - [ ] 3.23 Implement API function to fetch active league
  - [ ] 3.24 Implement API function to fetch all archived leagues
  - [ ] 3.25 Create OldLeaguesList component to display archived leagues
  - [ ] 3.26 Create old-leagues page to view archived leagues
  - [ ] 3.27 Add visual indication (grayed out, disabled) for archived leagues
  - [ ] 3.28 Write unit tests for admin API functions

- [ ] 4.0 Match Generation & Result Entry
  - [ ] 4.1 Implement round-robin match generation algorithm (every player plays every other player exactly once)
  - [ ] 4.2 Add validation: ensure division has at least 2 players before generating matches
  - [ ] 4.3 Create API function to generate matches for all divisions when league starts
  - [ ] 4.4 Implement API function to fetch all matches for a division
  - [ ] 4.5 Implement API function to fetch all matches for a specific player
  - [ ] 4.6 Create MatchList component to display matches (show player names, scores if entered, status)
  - [ ] 4.7 Create ScoreEntryForm component with inputs for player's IMP score and opponent's IMP score
  - [ ] 4.8 Add default value of 0 for IMP score inputs
  - [ ] 4.9 Display player handicaps next to names in score entry form
  - [ ] 4.10 Implement match outcome calculation function (compare IMP + handicap, determine winner/tie)
  - [ ] 4.11 Implement match points calculation function (win=1, tie=0.5 each)
  - [ ] 4.12 Implement final score calculation function (IMP score + handicap)
  - [ ] 4.13 Create API function to submit match result (player can enter scores for their matches)
  - [ ] 4.14 Add validation: ensure user can only enter scores for matches they're part of
  - [ ] 4.15 Add validation: ensure IMP scores are integers
  - [ ] 4.16 Create API function to update match result (admin only, for editing after submission)
  - [ ] 4.17 Create MatchResultDisplay component to show match results in readable format
  - [ ] 4.18 Add visual feedback when score is successfully submitted
  - [ ] 4.19 Write unit tests for match generation algorithm
  - [ ] 4.20 Write unit tests for match calculation functions

- [ ] 5.0 Rankings & Results Display
  - [ ] 5.1 Implement rankings calculation function (calculate match points, wins, ties for each player)
  - [ ] 5.2 Implement rankings sorting function (sort by match points descending, then by (IMP+handicap won - IMP+handicap lost) descending)
  - [ ] 5.3 Create API function to fetch calculated rankings for a division
  - [ ] 5.4 Create RankingsTable component with columns: rank, player name, handicap, matches played, wins, ties, match points, final score difference
  - [ ] 5.5 Create DivisionSelector component (dropdown/tabs) to switch between divisions
  - [ ] 5.6 Implement logic to default results page to player's own division
  - [ ] 5.7 Create results page that displays rankings table and division selector
  - [ ] 5.8 Implement automatic rankings update when match results are entered/modified
  - [ ] 5.9 Add loading states while rankings are being calculated
  - [ ] 5.10 Display "No matches played yet" message when division has no completed matches
  - [ ] 5.11 Ensure rankings only show for active league (hide if no active league)
  - [ ] 5.12 Write unit tests for rankings calculation and sorting functions

- [ ] 6.0 UI/UX Implementation & Mobile Responsiveness
  - [ ] 6.1 Set up responsive CSS framework or implement mobile-first CSS approach
  - [ ] 6.2 Create root layout with responsive navigation bar
  - [ ] 6.3 Implement mobile-friendly navigation (hamburger menu for mobile, full nav for desktop)
  - [ ] 6.4 Create reusable Button component with mobile-friendly touch targets
  - [ ] 6.5 Create reusable Input component with proper mobile input types
  - [ ] 6.6 Create reusable Table component that scrolls horizontally on mobile if needed
  - [ ] 6.7 Create reusable Select/Dropdown component with mobile-friendly styling
  - [ ] 6.8 Create Alert component for success/error messages
  - [ ] 6.9 Ensure all forms are mobile-friendly (large inputs, proper spacing)
  - [ ] 6.10 Add loading spinners/skeletons for async operations
  - [ ] 6.11 Implement error boundary for graceful error handling
  - [ ] 6.12 Add visual feedback for all user actions (button states, form submissions)
  - [ ] 6.13 Ensure tables are readable on mobile (consider card layout for small screens)
  - [ ] 6.14 Test all pages on mobile viewport (375px, 414px widths)
  - [ ] 6.15 Test all pages on tablet viewport (768px width)
  - [ ] 6.16 Test all pages on desktop viewport (1024px+ width)
  - [ ] 6.17 Ensure touch targets are at least 44x44px for mobile accessibility
  - [ ] 6.18 Add proper focus states for keyboard navigation

