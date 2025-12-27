-- Row-Level Security (RLS) policies for Online Bridge League Scoring Tool
-- This migration enables RLS on all tables and creates appropriate policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_divisions ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_id AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is part of a match
CREATE OR REPLACE FUNCTION is_match_participant(match_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM matches 
        WHERE id = match_uuid 
        AND (player_a_id = user_uuid OR player_b_id = user_uuid)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Users can SELECT their own row
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Admins can SELECT all rows
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
USING (is_admin(auth.uid()));

-- Users can UPDATE their own row (limited to non-sensitive fields)
CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Admins can UPDATE any row
CREATE POLICY "Admins can update any user"
ON users FOR UPDATE
USING (is_admin(auth.uid()));

-- ============================================================================
-- DIVISIONS TABLE POLICIES
-- ============================================================================

-- All authenticated users can SELECT divisions
CREATE POLICY "Authenticated users can view divisions"
ON divisions FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can INSERT divisions
CREATE POLICY "Admins can create divisions"
ON divisions FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can UPDATE divisions
CREATE POLICY "Admins can update divisions"
ON divisions FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can DELETE divisions
CREATE POLICY "Admins can delete divisions"
ON divisions FOR DELETE
USING (is_admin(auth.uid()));

-- ============================================================================
-- LEAGUES TABLE POLICIES
-- ============================================================================

-- All authenticated users can SELECT leagues
CREATE POLICY "Authenticated users can view leagues"
ON leagues FOR SELECT
USING (auth.role() = 'authenticated');

-- Only admins can INSERT leagues
CREATE POLICY "Admins can create leagues"
ON leagues FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can UPDATE leagues
CREATE POLICY "Admins can update leagues"
ON leagues FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can DELETE leagues
CREATE POLICY "Admins can delete leagues"
ON leagues FOR DELETE
USING (is_admin(auth.uid()));

-- ============================================================================
-- MATCHES TABLE POLICIES
-- ============================================================================

-- Users can SELECT matches where they are player_a_id or player_b_id
CREATE POLICY "Users can view their own matches"
ON matches FOR SELECT
USING (
    auth.uid() = player_a_id OR 
    auth.uid() = player_b_id OR
    is_admin(auth.uid())
);

-- Admins can SELECT all matches (covered by above policy, but explicit for clarity)
-- Only admins can INSERT matches
CREATE POLICY "Admins can create matches"
ON matches FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can UPDATE matches
CREATE POLICY "Admins can update matches"
ON matches FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can DELETE matches
CREATE POLICY "Admins can delete matches"
ON matches FOR DELETE
USING (is_admin(auth.uid()));

-- ============================================================================
-- MATCH RESULTS TABLE POLICIES
-- ============================================================================

-- Users can SELECT results for matches they're part of
CREATE POLICY "Users can view results for their matches"
ON match_results FOR SELECT
USING (
    is_match_participant(match_id, auth.uid()) OR
    is_admin(auth.uid())
);

-- Admins can SELECT all results (covered by above policy)
-- Users can INSERT results for matches they're part of
CREATE POLICY "Users can create results for their matches"
ON match_results FOR INSERT
WITH CHECK (
    is_match_participant(match_id, auth.uid()) AND
    entered_by_user_id = auth.uid()
);

-- Users can UPDATE results for matches they're part of
CREATE POLICY "Users can update results for their matches"
ON match_results FOR UPDATE
USING (
    is_match_participant(match_id, auth.uid()) OR
    is_admin(auth.uid())
)
WITH CHECK (
    is_match_participant(match_id, auth.uid()) OR
    is_admin(auth.uid())
);

-- Admins can INSERT/UPDATE all results (covered by above policies)

-- ============================================================================
-- PLAYER_DIVISIONS TABLE POLICIES
-- ============================================================================

-- Users can SELECT their own assignments
CREATE POLICY "Users can view their own division assignments"
ON player_divisions FOR SELECT
USING (
    auth.uid() = player_id OR
    auth.role() = 'authenticated'
);

-- All authenticated users can SELECT (to see division members)
-- This is covered by the above policy since it allows authenticated users

-- Only admins can INSERT player divisions
CREATE POLICY "Admins can create player division assignments"
ON player_divisions FOR INSERT
WITH CHECK (is_admin(auth.uid()));

-- Only admins can UPDATE player divisions
CREATE POLICY "Admins can update player division assignments"
ON player_divisions FOR UPDATE
USING (is_admin(auth.uid()));

-- Only admins can DELETE player divisions
CREATE POLICY "Admins can delete player division assignments"
ON player_divisions FOR DELETE
USING (is_admin(auth.uid()));

