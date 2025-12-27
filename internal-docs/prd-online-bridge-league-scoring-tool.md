# Product Requirements Document: Online Bridge League Scoring Tool

## Introduction/Overview

The Online Bridge League Scoring Tool is a simple, minimal, mobile-friendly web-based application designed to manage an online bridge league from player registration through final rankings. Currently, keeping track of scores, rankings, and divisions in an online bridge league is manual and error-prone. This tool will automate the process of managing players, organizing divisions, generating matches, entering results, and calculating rankings.

**Technical Stack:**
- Backend: Supabase
- Database connections: Session pooler
- Platform: Web-based (mobile-friendly)

## Goals

1. Enable admins to set up a league without technical assistance
2. Allow players to easily register and enter match scores
3. Automatically calculate and display rankings based on IMP scores and handicaps
4. Provide a simple, intuitive interface that works on mobile devices
5. Ensure data consistency and prevent errors in score tracking
6. Support multiple divisions within a league
7. Maintain league history through an archived leagues system

## User Stories

### Player Stories

- **As a player**, I want to register an account with a username and password so that I can participate in the league.
- **As a player**, I want to view my division's results and rankings so that I can see how I'm performing.
- **As a player**, I want to switch between divisions on the results page so that I can view results from other divisions.
- **As a player**, I want to enter IMP scores for matches I'm part of so that match results are recorded.
- **As a player**, I want to see my handicap displayed when entering scores so that I understand how it affects my final score.
- **As an player**, I want to view old leagues so that I can access historical data.

### Admin Stories

- **As an admin**, I want to view a list of all registered players so that I can manage the league.
- **As an admin**, I want to promote other players to admin so that I can share administrative responsibilities.
- **As an admin**, I want to manage player handicaps so that the league remains competitive.
- **As an admin**, I want to create divisions so that players can be organized into groups.
- **As an admin**, I want to assign players to divisions so that matches can be generated appropriately.
- **As an admin**, I want to start the league so that matches are generated and players can begin entering scores.
- **As an admin**, I want to finish a league so that it becomes read-only and archived.
- **As an admin**, I want to edit match results after submission so that I can correct any errors.
- **As an admin**, I want to view old leagues so that I can access historical data.

## Functional Requirements

### 1. Authentication & User Management

1.1. The system must allow players to register using a username and password.

1.2. The system must store passwords securely (hashed, not plain text).

1.3. The system must support user login with username and password.

1.4. The system must support two user roles: Player and Admin.

1.5. The system must allow admins to view a list of all registered players.

1.6. The system must allow admins to promote other players to admin role.

1.7. The system must support an initial admin that is manually created and stored directly in the database.

1.8. The system must display the user's current role in the interface.

### 2. Handicap Management

2.1. The system must store a handicap (numeric value) for each player.

2.2. The system must allow only admins to update a player's handicap.

2.3. The system must display a player's handicap next to their name when entering scores.

2.4. The system must use the handicap in final score calculations.

### 3. Division Management

3.1. The system must allow admins to create divisions with a name/identifier.

3.2. The system must allow admins to add players to divisions.

3.3. The system must ensure a player belongs to one division at a time.

3.4. The system must allow players to be reassigned to divisions only after the current league is archived.

3.5. The system must display which division a player belongs to.

### 4. League Management

4.1. The system must support a league status with three states: Draft, Active, and Archived.

4.2. The system must allow admins to start a league.

4.3. The system must prevent starting a league if another league is currently active.

4.4. When a league is started, the system must automatically change the league status to Active.

4.5. When a league is started, the system must automatically generate matches for all divisions.

4.6. Within each division, the system must generate matches such that every player plays every other player exactly once.

4.7. The system must allow admins to manually finish a league.

4.8. When a league is finished, the system must change the league status to Archived.

4.9. When a league is archived, the system must make it read-only (no edits to matches, results, divisions, or players).

4.10. The system must provide an "Old Leagues" overview page to view archived leagues.

4.11. The system must prevent creating a new league until the current league is archived.

### 5. Match Generation

5.1. The system must generate matches automatically when a league is started.

5.2. The system must create one match for each unique pair of players within a division.

5.3. The system must ensure each player plays every other player in their division exactly once.

5.4. The system must associate each match with a specific division.

5.5. The system must store two players for each match (Player A and Player B).

### 6. Match Results Entry

6.1. The system must allow players to enter scores for matches they are part of.

6.2. For each match, the system must allow entry of:
   - Player's own IMP score (integer)
   - Opponent's IMP score (integer)

6.3. The system must default IMP values to 0.

6.4. The system must calculate match outcome based on IMP scores:
   - If Player A's IMP score + Player A's handicap > Player B's IMP score + Player B's handicap, Player A wins
   - If Player B's IMP score Player B's handicap > Player A's IMP score Player A's handicap, Player B wins
   - If IMP + handicap scores are equal, the match is a tie

6.5. The system must award match points as follows:
   - Win: 1 point
   - Tie: 0.5 point for each player

6.7. The system must not require opponent confirmation for submitted results.

6.8. The system must allow admins to edit match results after submission.

6.9. The system must display match results in a clear, readable format.

### 7. Rankings & Results Display

7.1. The system must allow players to view results for the currently active league.

7.2. By default, the results page must show the player's own division.

7.3. The system must allow players to switch between divisions on the results page.

7.4. The system must calculate and display rankings based on:
   - Match points (primary)
   - Final scores (IMP + handicap) as tiebreaker if needed

7.5. The system must update rankings automatically when match results are entered or modified.

7.6. The system must display rankings in a table format showing:
   - Player name
   - Handicap
   - Number of matches played
   - Number of wins
   - Number of ties
   - Total match points
   - Final score (if applicable)

7.7. The system must sort rankings by match points (descending), then by (IMP + handicap) won - (IMP + handicap) lost if match points are equal.

### 8. User Interface

8.1. The system must be mobile-friendly and responsive.

8.2. The system must provide clear navigation between different sections (results, admin panel, etc.).

8.3. The system must display appropriate error messages for invalid inputs or actions.

8.4. The system must provide visual feedback for successful actions (e.g., score submission).

## Non-Goals (Out of Scope)

1. **Advanced Bridge Scoring:** No support for advanced bridge scoring systems beyond IMPs (e.g., no support for other scoring methods like matchpoints, total points, etc.).

2. **Team-Based Play:** The system only supports individual players, not teams.

3. **Notifications:** No email notifications, push notifications, or in-app notifications.

4. **Native Mobile App:** The system is web-based only (no iOS or Android native apps).

5. **Advanced Permissions:** Only two roles (Player and Admin) are supported. No custom roles or granular permissions.

6. **Real-Time Collaboration:** The system prioritizes data consistency over real-time updates. Multiple users can use the system simultaneously, but there's no real-time synchronization requirement.

7. **Match Scheduling:** The system does not handle scheduling of when matches should be played, only the recording of results.

8. **Tournament Brackets:** No support for elimination-style tournaments or brackets.

9. **Statistics & Analytics:** No advanced statistics, graphs, or analytics beyond basic rankings.

10. **Social Features:** No chat, forums, or social interaction features.

## Design Considerations

1. **Mobile-First Design:** The interface must be optimized for mobile devices while remaining functional on desktop.

2. **Simplicity:** The UI should prioritize simplicity and ease of use over advanced features.

3. **Clear Visual Hierarchy:** Important information (rankings, match results) should be prominently displayed.

4. **Form Design:** Score entry forms should be intuitive with clear labels and appropriate input types (number inputs for IMP scores).

5. **Division Switching:** Provide an easy-to-use dropdown or tab interface for switching between divisions on the results page.

6. **Admin Panel:** Admin functions should be clearly separated from player functions, possibly in a dedicated admin section.

7. **Read-Only State:** Archived leagues should be visually distinct (e.g., grayed out) to indicate they cannot be edited.

## Technical Considerations

1. **Backend:** Use Supabase for backend services (authentication, database, API).

2. **Database:** Use Supabase's PostgreSQL database with session pooling for connections.

3. **Authentication:** Leverage Supabase Auth for user registration and login.

4. **Database Schema:** Design tables for:
   - Users (with role and handicap)
   - Divisions
   - Leagues (with status)
   - Matches (with players, division, scores)
   - Match results

5. **Data Integrity:** Implement database constraints to ensure:
   - Only one active league at a time
   - Players belong to one division at a time
   - Match results are valid (scores are integers, etc.)

6. **Security:** 
   - Implement row-level security (RLS) policies in Supabase to ensure users can only access appropriate data
   - Admins should have broader access than regular players

7. **Match Generation Algorithm:** Implement a round-robin algorithm to generate matches where each player plays every other player exactly once.

8. **Ranking Calculation:** Implement server-side calculation of rankings to ensure consistency and accuracy.

9. **Session Management:** Use Supabase's session management for maintaining user authentication state.

## Open Questions

1. **Result Overwriting:** Can players overwrite their own submitted results, or can only admins edit results after initial submission?

2. **Audit Log:** Should admins see an audit log of result changes, including who made the change and when?

3. **Results Page Default View:** The preparational document mentions "By default, the page shows the player's" but is incomplete. Should it show:
   - The player's own division?
   - The player's own matches?
   - Overall rankings across all divisions?

4. **Match Display:** How should matches be displayed to players? Should they see:
   - Only their own matches?
   - All matches in their division?
   - A combination of both?

5. **Handicap Display Format:** How should handicaps be displayed? (e.g., "+5", "5", "Handicap: 5")

6. **Initial Admin Setup:** What is the exact process for manually creating the initial admin? Should this be documented as a setup script or database migration?

7. **League Naming:** Should leagues have names/identifiers, or are they simply identified by their status and date?

8. **Division Capacity:** Is there a maximum or minimum number of players per division?

9. **Tiebreaker Rules:** If two players have the same match points and final scores, how should they be ranked? (Alphabetical? Head-to-head result? Other?)

10. **Data Export:** Should admins be able to export league data (rankings, results) to CSV or other formats?

