import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthChange } from '../supabase/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  useEffect(() => {
    const unsub = onAuthChange(u => setUser(u));
    return unsub;
  }, []);
  return (
    <AuthContext.Provider value={{ user, loading: user === undefined }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
