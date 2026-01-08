/*
  # Drop badges tables

  1. Tables Dropped
    - `user_badges` - User earned badges junction table
    - `badges` - Badge definitions and requirements

  2. Notes
    - Drops user_badges first due to foreign key constraint
    - Uses CASCADE to handle any dependent objects
*/

DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;