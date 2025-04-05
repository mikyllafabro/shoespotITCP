import { createSelector } from '@reduxjs/toolkit';

// Base selector
const selectAuth = state => state.auth;

// Memoized selectors
export const selectUser = createSelector(
  [selectAuth],
  auth => auth.user
);

export const selectIsAuthenticated = createSelector(
  [selectAuth],
  auth => auth.isAuthenticated
);

export const selectAuthState = createSelector(
  [selectAuth],
  auth => ({
    isAuthenticated: auth.isAuthenticated,
    user: auth.user
  })
);
