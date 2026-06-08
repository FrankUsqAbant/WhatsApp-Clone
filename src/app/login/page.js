"use client";

import { useState } from 'react';
import { insforge } from '@/lib/insforge';
import styles from './Login.module.css';

export default function LoginPage() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { error } = await insforge.auth.signInWithOAuth("google", {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.box}>
        <h1 className={styles.title}>WhatsApp Web Clone</h1>
        <p className={styles.subtitle}>Inicia sesión para continuar</p>
        
        <button 
          className={styles.googleBtn} 
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Cargando..." : "Continuar con Google"}
        </button>

        {error && <div className={styles.error}>{error}</div>}
      </div>
    </div>
  );
}
