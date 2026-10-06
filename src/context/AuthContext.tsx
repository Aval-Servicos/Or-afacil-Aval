import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { CompanySettings } from '../types/budget';
import { fetchCompanySettings, saveCompanySettings, DEFAULT_SETTINGS } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  companySettings: CompanySettings;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string, companyName?: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => Promise<void>;
  refreshCompanySettings: () => Promise<void>;
  updateCompanySettings: (settings: Partial<CompanySettings>) => Promise<void>;
  isDemoUser: boolean;
  authError: string | null;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [companySettings, setCompanySettings] = useState<CompanySettings>(DEFAULT_SETTINGS('guest'));
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // Demo user fallback when user wants to evaluate immediately
  const createDemoUser = (): User => ({
    uid: 'demo-user-orcafacil-2026',
    email: 'contato@orcafacil.com.br',
    displayName: 'João da Silva (Empresa Demo)',
    photoURL: '',
    emailVerified: true,
    isAnonymous: false,
    metadata: {} as any,
    providerData: [],
    refreshToken: '',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'demo-token',
    getIdTokenResult: async () => ({} as any),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
    providerId: 'google.com',
  });

  const loadSettings = async (uid: string) => {
    try {
      const settings = await fetchCompanySettings(uid);
      setCompanySettings(settings);
    } catch (err) {
      console.warn('Could not load company settings:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setIsDemoUser(false);
        await loadSettings(currentUser.uid);
      } else {
        // If not authenticated, default to demo user or null
        setUser(null);
        setCompanySettings(DEFAULT_SETTINGS('guest'));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await signInWithPopup(auth, googleProvider);
      setUser(res.user);
      setIsDemoUser(false);
      await loadSettings(res.user.uid);
    } catch (error: any) {
      console.error('Google login error:', error);
      setAuthError(error?.message || 'Falha ao autenticar com conta Google.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await signInWithEmailAndPassword(auth, email, pass);
      setUser(res.user);
      setIsDemoUser(false);
      await loadSettings(res.user.uid);
    } catch (error: any) {
      console.error('Email login error:', error);
      let msg = 'Erro ao realizar login.';
      if (error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password' || error?.code === 'auth/invalid-credential') {
        msg = 'E-mail ou senha incorretos.';
      } else if (error?.code === 'auth/invalid-email') {
        msg = 'Formato de e-mail inválido.';
      }
      setAuthError(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string, companyName?: string) => {
    try {
      setLoading(true);
      setAuthError(null);
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (name) {
        await updateProfile(res.user, { displayName: name });
      }
      setUser(res.user);
      setIsDemoUser(false);

      // Save initial company name if provided
      if (companyName) {
        await saveCompanySettings(res.user.uid, {
          name: companyName,
          responsibleName: name,
        });
      }

      await loadSettings(res.user.uid);
    } catch (error: any) {
      console.error('Email register error:', error);
      let msg = 'Erro ao criar conta.';
      if (error?.code === 'auth/email-already-in-use') {
        msg = 'Este e-mail já está em uso por outra conta.';
      } else if (error?.code === 'auth/weak-password') {
        msg = 'A senha deve conter no mínimo 6 caracteres.';
      }
      setAuthError(msg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async () => {
    setLoading(true);
    setAuthError(null);
    const demo = createDemoUser();
    setUser(demo);
    setIsDemoUser(true);
    await loadSettings(demo.uid);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    if (!isDemoUser) {
      await signOut(auth);
    }
    setUser(null);
    setIsDemoUser(false);
    setCompanySettings(DEFAULT_SETTINGS('guest'));
    setLoading(false);
  };

  const refreshCompanySettings = async () => {
    if (user) {
      await loadSettings(user.uid);
    }
  };

  const updateCompanySettings = async (settings: Partial<CompanySettings>) => {
    if (!user) return;
    const updated = await saveCompanySettings(user.uid, settings);
    setCompanySettings(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        companySettings,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginDemo,
        logout,
        refreshCompanySettings,
        updateCompanySettings,
        isDemoUser,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
