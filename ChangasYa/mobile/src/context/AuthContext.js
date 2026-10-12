import React, { createContext, useContext, useState } from 'react';
import { setWorkerToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // { id, phone, name }
  const [worker, setWorker] = useState(null);   // { id, name, trade_id, ... }
  const [workerToken, setWorkerTokenState] = useState(null);

  function loginUser(userData) {
    setUser(userData);
  }

  function loginWorker(workerData, token) {
    setWorker(workerData);
    setWorkerTokenState(token);
    setWorkerToken(token);
  }

  function logoutWorker() {
    setWorker(null);
    setWorkerTokenState(null);
    setWorkerToken(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, worker, workerToken, loginUser, loginWorker, logoutWorker }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
