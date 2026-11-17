import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

export function useTelegramAuth() {
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState('initial'); // 'initial' | 'phone' | 'code' | 'password' | 'authenticated'

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAuthStatus();
      setAuthStatus(data);
      if (data.authenticated) {
        setStep('authenticated');
      } else if (data.pendingAuth) {
        setStep('code');
      } else {
        setStep('phone');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const sendCode = async (phoneNumber, apiHash) => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.sendCode(phoneNumber, apiHash);
      setStep('code');
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const verifyCode = async (code) => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.verifyCode(code);
      if (res.requiresPassword) {
        setStep('password');
        return res;
      }
      if (res.authenticated) {
        setStep('authenticated');
        await checkStatus();
      }
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const verifyPassword = async (password) => {
    try {
      setActionLoading(true);
      setError(null);
      const res = await api.verifyPassword(password);
      if (res.authenticated) {
        setStep('authenticated');
        await checkStatus();
      }
      return res;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const logout = async () => {
    try {
      setActionLoading(true);
      await api.logout();
      setStep('phone');
      await checkStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return {
    authStatus,
    loading,
    actionLoading,
    error,
    step,
    setStep,
    sendCode,
    verifyCode,
    verifyPassword,
    logout,
    refreshStatus: checkStatus,
  };
}
