import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api, ApiError } from "@/lib/api";

type AppRole = "master_admin" | "company_admin" | "company_staff";

interface UserShape {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  phone: string | null;
  companyId: string | null;
  companyName: string | null;
  companyStatus: string | null;
  storeId: string | null;
  storeName: string | null;
  roles: AppRole[];
}

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  company_id: string | null;
}

interface AuthContextType {
  user: UserShape | null;
  session: { authenticated: boolean } | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isMasterAdmin: boolean;
  isCompanyAdmin: boolean;
  isCompanyStaff: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null; resetUrl?: string | null }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

function mapProfile(user: UserShape | null): Profile | null {
  if (!user) return null;

  return {
    id: user.id,
    user_id: user.id,
    full_name: user.fullName,
    avatar_url: user.avatarUrl,
    phone: user.phone,
    company_id: user.companyId,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserShape | null>(null);
  const [session, setSession] = useState<{ authenticated: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const response = await api.get<{ user: UserShape }>("/api/auth/me");
      setUser(response.user);
      setSession({ authenticated: true });
    } catch (error) {
      setUser(null);
      setSession(null);
      if (!(error instanceof ApiError) || error.status !== 401) {
        console.error(error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const response = await api.post<{ user: UserShape }>("/api/auth/login", { email, password });
      setUser(response.user);
      setSession({ authenticated: true });
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const response = await api.post<{ resetUrl?: string | null }>("/api/auth/forgot-password", { email });
      return { error: null, resetUrl: response.resetUrl ?? null };
    } catch (error) {
      return { error: error as Error, resetUrl: null };
    }
  };

  const roles = user?.roles || [];
  const profile = mapProfile(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        isMasterAdmin: roles.includes("master_admin"),
        isCompanyAdmin: roles.includes("company_admin"),
        isCompanyStaff: roles.includes("company_staff"),
        signIn,
        signOut,
        resetPassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
