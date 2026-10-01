"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile } from "@/lib/domain";

// `forbidden` : compte Firebase valide mais absent de l'équipe ou désactivé.
export type SessionStatus = "loading" | "signed-out" | "forbidden" | "ready";

type Session = {
  status: SessionStatus;
  user: User | null;
  profile: UserProfile | null;
  logout: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<SessionStatus>("loading");

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      unsubscribeProfile?.();
      unsubscribeProfile = null;
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setStatus("signed-out");
        return;
      }

      setStatus("loading");
      unsubscribeProfile = onSnapshot(
        doc(db, "users", currentUser.uid),
        (snapshot) => {
          const data = snapshot.exists() ? ({ ...snapshot.data(), uid: snapshot.id } as UserProfile) : null;
          setProfile(data);
          setStatus(data?.active ? "ready" : "forbidden");
        },
        () => {
          setProfile(null);
          setStatus("forbidden");
        }
      );
    });

    return () => {
      unsubscribeProfile?.();
      unsubscribeAuth();
    };
  }, []);

  const value: Session = { status, user, profile, logout: () => signOut(auth) };
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession doit être utilisé dans <SessionProvider>.");
  }
  return session;
}
