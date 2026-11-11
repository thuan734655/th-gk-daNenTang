import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  ApiError,
  loadToken,
  saveToken,
  setUnauthorizedHandler,
} from "@/services/api";
import type { PublicUser } from "@/types/user";
type Session = {
  user: PublicUser;
  isAdmin: boolean;
};
type Auth = {
  session: Session | null;
  loading: boolean;
  error: string;
  signIn: (
    result: Session & {
      token: string;
    },
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const signOut = useCallback(async () => {
    setSession(null);
    await saveToken(null);
  }, []);
  const refresh = useCallback(async () => {
    setSession(await api<Session>("/auth/me"));
  }, []);
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void signOut();
    });
    let active = true;
    void (async () => {
      try {
        if (await loadToken()) {
          const result = await api<Session>("/auth/me");
          if (active) setSession(result);
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) await saveToken(null);
        else if (active)
          setError(
            e instanceof Error ? e.message : "Không khôi phục được phiên.",
          );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
      setUnauthorizedHandler(undefined);
    };
  }, [signOut]);
  async function signIn(
    result: Session & {
      token: string;
    },
  ) {
    await saveToken(result.token);
    setError("");
    setSession({ user: result.user, isAdmin: result.isAdmin });
  }
  return (
    <Context.Provider
      value={{ session, loading, error, signIn, signOut, refresh }}
    >
      {children}
    </Context.Provider>
  );
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider missing");
  return value;
}
