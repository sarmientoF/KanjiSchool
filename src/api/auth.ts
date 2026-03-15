// Copyright (c) 2021-2025 Drew Edwards
// This file is part of KanjiSchool under AGPL-3.0.
// Full details: https://github.com/Lemmmy/KanjiSchool/blob/master/LICENSE

import { store } from "@store";
import { useAppSelector } from "@store";
import { shallowEqual } from "react-redux";
import { setApiKey, setUser } from "@store/slices/authSlice.ts";
import { setSyncingSubjects, setSyncingSubjectsProgress } from "@store/slices/syncSlice.ts";

import * as api from "@api";
import { ApiUser } from "@api";

import { db } from "@db";

import { lsSetBoolean, lsSetObject, lsSetString } from "@utils";

import Debug from "debug";
const debug = Debug("kanjischool:api-auth");

export const useIsLoggedIn = (): boolean =>
  !!useAppSelector(s => s.auth.user?.data.id);
export const useUser = (): ApiUser | undefined =>
  useAppSelector(s => s.auth.user, shallowEqual);
export const useUsername = (): string | undefined =>
  useAppSelector(s => s.auth.user?.data.username);
export const useUserLevel = (): number =>
  useAppSelector(s => s.auth.user?.data.level) || 1;
export const useUserMaxLevel = (): number =>
  useAppSelector(s => s.auth.user?.data.subscription.max_level_granted) || 3;

/** Attempt to authenticate with the API using the specified API key. If it is
 * successful, save the API key. Optionally migrate to the custom backend. */
export async function attemptLogIn(apiKey: string, { migrate = false }: { migrate?: boolean } = {}): Promise<void> {
  debug("attempting first-time login (migrate=%s)", migrate);

  const user = await api.get<ApiUser>("/user", { apiKey });
  if (!user || !user?.data.id) throw new Error("Invalid login");

  debug("got user %s (lvl %d)", user.data.username, user.data.level);

  if (migrate) {
    // Show SyncPage with "Migrating..." while server-side migration runs.
    // Set syncingSubjects so syncSubjects() won't run concurrently.
    store.dispatch(setSyncingSubjects(true));
    store.dispatch(setSyncingSubjectsProgress({ count: 0, total: 0, extra: "Migrating..." }));
    lsSetString("apiKey", apiKey);
    lsSetObject("user", user);
    store.dispatch(setApiKey(apiKey));
    store.dispatch(setUser(user));

    const apiUrl = (localStorage.getItem("kanjischool-apiUrl") || import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
    try {
      debug("attempting migration to %s", apiUrl);
      const migrateRes = await fetch(`${apiUrl}/v2/migrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wanikani_api_key: apiKey }),
      });
      const migrateData = await migrateRes.json();
      if (migrateData?.token) {
        debug("migration successful, storing custom token");
        localStorage.setItem("kanjischool-customApiToken", migrateData.token);
      } else {
        debug("migration response missing token field");
      }
    } catch (err) {
      console.error("migration request failed:", err);
    }

    // Migration done — trigger normal sync from custom backend
    store.dispatch(setSyncingSubjects(false));
    api.syncSubjects();
    return;
  }

  lsSetString("apiKey", apiKey);
  lsSetObject("user", user);
  store.dispatch(setApiKey(apiKey));
  store.dispatch(setUser(user));
}

/** Log in using an existing custom backend token (already migrated users). */
export async function attemptLogInWithToken(token: string): Promise<void> {
  debug("attempting login with custom token");

  // Set token first so requests route to the custom backend
  localStorage.setItem("kanjischool-customApiToken", token);

  let user: ApiUser;
  try {
    user = await api.get<ApiUser>("/user");
    if (!user?.data.id) throw new Error("Invalid token");
  } catch (err) {
    localStorage.removeItem("kanjischool-customApiToken");
    throw err;
  }

  debug("got user %s (lvl %d)", user.data.username, user.data.level);

  lsSetString("apiKey", token);
  lsSetObject("user", user);
  store.dispatch(setApiKey(token));
  store.dispatch(setUser(user));
}

/** Clears all user data and logs out. */
export async function logOut(): Promise<void> {
  debug("logging out");

  // Set a 'clearing data' flag first. If the page disappears/reloads before
  // logging out is complete, we will try again on next load.
  lsSetBoolean("clearingData", true);

  // Delete the user data from local storage
  debug("deleting user data");
  lsSetString("apiKey", null);
  lsSetString("customApiToken", null);
  lsSetObject("user", null);

  // Clear the user-relevant stores from the database
  debug("clearing user-relevant db stores");
  await Promise.all([
    db.assignments.clear(),
    db.reviewStatistics.clear(),
    db.reviews.clear(),
    db.levelProgressions.clear(),
    db.studyMaterials.clear(),
    db.queue.clear()
  ]);

  // Clear sync information from local storage
  debug("deleting sync data");
  lsSetString("assignmentsLastSynced", null);
  lsSetString("syncAssignmentsLastVersion", null);
  lsSetString("syncAssignmentsLastTotal", null);
  lsSetString("reviewStatisticsLastSynced", null);
  lsSetString("reviewsLastSynced", null);
  lsSetString("syncReviewsLastVersion", null);
  lsSetString("currentStreak", null);
  lsSetString("maxStreak", null);
  lsSetString("levelProgressionsLastSynced", null);
  lsSetString("syncLevelProgressionsLastVersion", null);
  lsSetString("studyMaterialsLastSynced", null);
  lsSetString("syncStudyMaterialsLastVersion", null);
  lsSetString("pendingLessons2", null);
  lsSetString("pendingReviews2", null);
  lsSetString("nextReviewsCheckTime", null);
  lsSetString("nextReviewsAt", null);
  lsSetString("nextReviewsNow", null);
  lsSetString("nextReviewsCount", null);
  lsSetString("nextReviewsWeek", null);
  lsSetString("tip", null);

  // Clear session information from local storage
  debug("deleting session data");
  lsSetString("sessionOngoing2", null);
  lsSetString("sessionDoingLessons", null);
  lsSetString("sessionLessonCounter", null);
  lsSetString("sessionLastResults", null);
  lsSetString("sessionLastResultsViewed", null);
  lsSetString("selfStudyQueue", null);

  // Unset the 'clearing data' flag finally
  debug("done logging out, removing clearingData flag");
  lsSetBoolean("clearingData", false);
}
