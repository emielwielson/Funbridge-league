# Implementation Plan: Task 4.0 - Match Generation & Result Entry

## Overview
This plan implements match generation (round-robin algorithm) and match result entry functionality. When a league is started, matches are automatically generated for all divisions. Players can then enter IMP scores for their matches, and the system calculates outcomes, match points, and final scores.

## Prerequisites
- Task 1.0: Database Schema & Supabase Setup (✅ Complete)
- Task 2.0: Authentication & User Management (✅ Complete)
- Task 3.0: Admin Features (✅ Complete)
- Database tables: `matches`, `match_results`, `player_divisions` exist
- League start functionality exists (needs match generation integration)

## Implementation Steps

### Phase 1: Type Definitions & Core Utilities

#### 4.1.1 Create Match Types (`lib/types/match.ts`)
- Define `Match` interface:
  - `id: string`
  - `league_id: string`
  - `division_id: string`
  - `player_a_id: string`
  - `player_b_id: string`
  - `created_at: string`
  - Optional: `player_a_name?: string`, `player_b_name?: string` (for display)
- Define `MatchResult` interface:
  - `id: string`
  - `match_id: string`
  - `player_a_imp_score: number`
  - `player_b_imp_score: number`
  - `entered_by_user_id: string`
  - `created_at: string`
  - `updated_at: string`
- Define `MatchWithResult` interface (Match + optional MatchResult)
- Define `MatchOutcome` type: `'player_a_wins' | 'player_b_wins' | 'tie'`
- Export all types

#### 4.1.2 Create Match Calculation Utilities (`lib/utils/match-calculations.ts`)
- `calculateMatchOutcome(playerAImp: number, playerAHandicap: number, playerBImp: number, playerBHandicap: number): MatchOutcome`
  - Compare `playerAImp + playerAHandicap` vs `playerBImp + playerBHandicap`
  - Return appropriate outcome
- `calculateMatchPoints(outcome: MatchOutcome, player: 'a' | 'b'): number`
  - Win = 1 point
  - Tie = 0.5 point for each player
  - Loss = 0 points
- `calculateFinalScore(impScore: number, handicap: number): number`
  - Return `impScore + handicap`
- `calculateScoreDifference(playerAImp: number, playerAHandicap: number, playerBImp: number, playerBHandicap: number): number`
  - Return `(playerAImp + playerAHandicap) - (playerBImp + playerBHandicap)`
  - Used for tiebreaker in rankings

#### 4.1.3 Create Match Generation Algorithm (`lib/utils/match-generation.ts`)
- `generateRoundRobinMatches(playerIds: string[]): Array<{playerA: string, playerB: string}>`
  - Input: Array of player IDs in a division
  - Output: Array of unique player pairs
  - Algorithm: Generate all combinations where `playerA < playerB` (lexicographically or by ID)
  - Validation: Require at least 2 players
  - Edge cases:
    - Empty array → return empty array
    - Single player → return empty array (no matches possible)
    - Two players → return one match
    - Multiple players → return n*(n-1)/2 matches

### Phase 2: Server-Side API Routes

#### 4.2.1 Create Matches API Route (`app/api/matches/route.ts`)
- `GET /api/matches?divisionId=<id>&leagueId=<id>`
  - Fetch all matches for a division in a league
  - Include player names via JOIN
  - Include match results if they exist
  - Return `MatchWithResult[]`
  - Admin can access any division, players can only access their division
- `GET /api/matches?playerId=<id>&leagueId=<id>`
  - Fetch all matches for a specific player in a league
  - Include opponent names and match results
  - Return `MatchWithResult[]`
  - Players can only access their own matches
- `POST /api/matches/generate`
  - Admin only
  - Body: `{ leagueId: string }`
  - Generate matches for all divisions in the league
  - For each division:
    - Get all players assigned to that division (from `player_divisions`)
    - Validate: at least 2 players
    - Generate matches using round-robin algorithm
    - Insert matches into database
  - Return success/error
  - Handle errors gracefully (e.g., division with < 2 players)

#### 4.2.2 Create Match Results API Route (`app/api/match-results/route.ts`)
- `POST /api/match-results`
  - Body: `{ matchId: string, playerAImpScore: number, playerBImpScore: number }`
  - Validation:
    - User must be either player_a_id or player_b_id in the match
    - IMP scores must be integers
    - Match must exist and belong to active league
  - Insert or update match_result
  - If result exists, update it (players can overwrite their own submissions)
  - Set `entered_by_user_id` to current user
  - Return success/error
- `PUT /api/match-results`
  - Admin only
  - Body: `{ matchResultId: string, playerAImpScore: number, playerBImpScore: number }`
  - Update existing match result
  - Validation: Match must not be in archived league
  - Return success/error
- `GET /api/match-results?matchId=<id>`
  - Fetch match result for a specific match
  - Return `MatchResult | null`

### Phase 3: Client-Side API Functions

#### 4.3.1 Create Matches API Client (`lib/api/matches.ts`)
- `getMatchesByDivision(divisionId: string, leagueId: string): Promise<ApiResponse<MatchWithResult[]>>`
  - Call `GET /api/matches?divisionId=<id>&leagueId=<id>`
- `getMatchesByPlayer(playerId: string, leagueId: string): Promise<ApiResponse<MatchWithResult[]>>`
  - Call `GET /api/matches?playerId=<id>&leagueId=<id>`
- `generateMatches(leagueId: string): Promise<ApiResponse<{ success: boolean, matchesGenerated: number }>>`
  - Call `POST /api/matches/generate`
  - Admin only

#### 4.3.2 Create Match Results API Client (`lib/api/match-results.ts`)
- `submitMatchResult(matchId: string, playerAImpScore: number, playerBImpScore: number): Promise<ApiResponse<MatchResult>>`
  - Call `POST /api/match-results`
- `updateMatchResult(matchResultId: string, playerAImpScore: number, playerBImpScore: number): Promise<ApiResponse<MatchResult>>`
  - Call `PUT /api/match-results`
  - Admin only
- `getMatchResult(matchId: string): Promise<ApiResponse<MatchResult | null>>`
  - Call `GET /api/match-results?matchId=<id>`

### Phase 4: UI Components

#### 4.4.1 Create MatchList Component (`components/matches/MatchList.tsx`)
- Props: `{ matches: MatchWithResult[], currentUserId: string, onResultSubmit?: () => void }`
- Display matches in a table/card layout
- Columns/fields:
  - Player A name (with handicap)
  - Player B name (with handicap)
  - Status: "Not Started", "Completed", "Pending"
  - If result exists: Show scores and outcome
- Mobile-friendly: Use card layout on small screens
- Show "Enter Score" button for matches the user is part of (if not completed or if they want to update)
- Show "Edit" button for admins (if result exists)
- Loading and error states

#### 4.4.2 Create ScoreEntryForm Component (`components/matches/ScoreEntryForm.tsx`)
- Props: `{ match: MatchWithResult, currentUserId: string, playerAHandicap: number, playerBHandicap: number, onSubmit: (playerAImp: number, playerBImp: number) => Promise<void>, onCancel?: () => void }`
- Form fields:
  - Player A IMP score (number input, default 0)
  - Player B IMP score (number input, default 0)
  - Display handicaps next to player names
  - Show calculated outcome preview (e.g., "Player A wins" or "Tie")
- Validation:
  - IMP scores must be integers
  - Show validation errors
- Submit button (disabled while submitting)
- Cancel button (if onCancel provided)
- Loading state during submission
- Success feedback after submission

#### 4.4.3 Create MatchResultDisplay Component (`components/matches/MatchResultDisplay.tsx`)
- Props: `{ match: MatchWithResult, playerAHandicap: number, playerBHandicap: number }`
- Display match result in readable format:
  - Player A: [IMP score] + [handicap] = [final score]
  - Player B: [IMP score] + [handicap] = [final score]
  - Outcome: "Player A wins" / "Player B wins" / "Tie"
  - Match points awarded
- Visual styling to highlight winner
- Mobile-friendly layout

### Phase 5: Integration with League Start

#### 4.5.1 Update League Start API (`app/api/leagues/start/route.ts`)
- After setting league status to 'active', automatically call match generation
- Call `generateMatches(leagueId)` internally
- Handle errors: If match generation fails, consider rolling back league status or showing warning
- Return success only if both league start and match generation succeed

### Phase 6: Pages & User Flows

#### 4.6.1 Create Matches Page (`app/matches/page.tsx`)
- Protected route (requires authentication)
- Fetch current user's matches for active league
- Display using MatchList component
- Show message if no active league
- Show message if user has no matches
- Allow filtering by division (if user is in multiple divisions)

#### 4.6.2 Update Results Page (`app/results/page.tsx`)
- Add section to display matches for selected division
- Use MatchList component
- Allow players to enter scores from results page
- Show rankings and matches side-by-side or in tabs

### Phase 7: Testing

#### 4.7.1 Unit Tests for Match Generation (`lib/utils/match-generation.test.ts`)
- Test with 2 players (1 match)
- Test with 3 players (3 matches)
- Test with 4 players (6 matches)
- Test with 5 players (10 matches)
- Test edge cases:
  - Empty array
  - Single player
  - Large number of players
- Verify no duplicate matches
- Verify all players play each other exactly once

#### 4.7.2 Unit Tests for Match Calculations (`lib/utils/match-calculations.test.ts`)
- Test `calculateMatchOutcome`:
  - Player A wins scenarios
  - Player B wins scenarios
  - Tie scenarios
  - With and without handicaps
- Test `calculateMatchPoints`:
  - Win = 1 point
  - Tie = 0.5 point
  - Loss = 0 points
- Test `calculateFinalScore`:
  - Various IMP and handicap combinations
- Test `calculateScoreDifference`:
  - Positive, negative, and zero differences

#### 4.7.3 Integration Tests
- Test match generation when league starts
- Test score submission flow
- Test admin result editing
- Test validation (user can only enter scores for their matches)
- Test archived league read-only enforcement

## Implementation Order

1. **Type Definitions** (4.1.1) - Foundation for everything else
2. **Match Calculation Utilities** (4.1.2) - Core logic, testable independently
3. **Match Generation Algorithm** (4.1.3) - Core logic, testable independently
4. **Server-Side API Routes** (4.2.1, 4.2.2) - Backend functionality
5. **Client-Side API Functions** (4.3.1, 4.3.2) - API wrappers
6. **UI Components** (4.4.1, 4.4.2, 4.4.3) - User interface
7. **Integration** (4.5.1) - Connect match generation to league start
8. **Pages** (4.6.1, 4.6.2) - User-facing pages
9. **Testing** (4.7.1, 4.7.2, 4.7.3) - Ensure quality

## Dependencies

- `lib/api/auth-utils.ts` - For authentication checks in API routes
- `lib/api/divisions.ts` - To get players in divisions
- `lib/api/leagues.ts` - To check league status
- `lib/types/user.ts` - For user types
- `lib/types/division.ts` - For division types
- `lib/types/league.ts` - For league types

## Notes

- Match generation happens automatically when league is started (no separate UI needed)
- Players can enter scores for matches they're part of
- Players can update their own score submissions
- Admins can edit any match result (except in archived leagues)
- IMP scores default to 0 if not entered
- Handicaps are displayed next to player names in score entry forms
- Match outcomes are calculated automatically based on IMP + handicap
- Match points are calculated automatically (win=1, tie=0.5)
- All calculations happen server-side for consistency

## Edge Cases to Handle

- Division with < 2 players (skip match generation, show warning)
- Player not assigned to any division (no matches generated)
- Match result already exists (update instead of insert)
- User tries to enter score for match they're not part of (403 error)
- User tries to enter score for archived league (403 error)
- Admin tries to edit result in archived league (403 error)
- Invalid IMP scores (non-integers, negative if needed)
- Network errors during submission (retry mechanism or clear error message)

## Success Criteria

- ✅ Matches are automatically generated when league starts
- ✅ All players in a division play each other exactly once
- ✅ Players can enter IMP scores for their matches
- ✅ Match outcomes are calculated correctly (IMP + handicap)
- ✅ Match points are awarded correctly (win=1, tie=0.5)
- ✅ Admins can edit match results
- ✅ Validation prevents unauthorized score entry
- ✅ UI is mobile-friendly
- ✅ All unit tests pass
- ✅ Integration works end-to-end

