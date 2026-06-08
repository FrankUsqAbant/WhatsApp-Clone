"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, Plus, X, EyeOff, Loader2 } from 'lucide-react';
import SplitLayout from '@/components/layout/SplitLayout';
import styles from './Status.module.css';
import { insforge, getAuthClient } from '@/lib/insforge';

const NEXT_PUBLIC_INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL;
const NEXT_PUBLIC_INSFORGE_ANON_KEY = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY;

export default function StatusPage() {
  const [activeStatus, setActiveStatus] = useState(null);
  const [statusesByUser, setStatusesByUser] = useState({});
  const [myStatuses, setMyStatuses] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [authDb, setAuthDb] = useState(null);

  // Animar la barra de progreso cuando hay un estado activo
  useEffect(() => {
    if (!activeStatus) {
      setProgress(0);
      return;
    }

    const duration = 5000; // 5 segundos
    const intervalTime = 50;
    const steps = duration / intervalTime;
    const increment = 100 / steps;

    setProgress(0);

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setActiveStatus(null);
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [activeStatus]);

  useEffect(() => {
    insforge.auth.getCurrentUser().then(({ data: { user } }) => {
      if (user) {
        const accessToken = insforge.auth?.tokenManager?.getAccessToken?.() ||
                            insforge.auth?.tokenManager?.accessToken ||
                            null;
        setSession({ user, access_token: accessToken });
        const authenticatedDb = getAuthClient(accessToken);
        setAuthDb(authenticatedDb);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (authDb && session?.user) {
      loadStatuses();
    }
  }, [authDb, session]);

  const loadStatuses = async () => {
    if (!authDb) return;
    try {
      // Filtrar estados de las ultimas 24 horas
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: allStatuses, error } = await authDb.database
        .from('statuses')
        .select('*, profiles(id, full_name, avatar_url)')
        .gt('created_at', twentyFourHoursAgo)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mine = [];
      const others = {};

      (allStatuses || []).forEach(status => {
        if (status.profile_id === session.user.id) {
          mine.push(status);
        } else {
          if (!others[status.profile_id]) {
            others[status.profile_id] = {
              user: status.profiles,
              statuses: []
            };
          }
          others[status.profile_id].statuses.push(status);
        }
      });

      setMyStatuses(mine);
      setStatusesByUser(others);
    } catch (error) {
      console.error("Error cargando estados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !authDb) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${session.user.id}/${fileName}`;

      // 1. Subir imagen
      const { data: uploadData, error: uploadError } = await authDb.storage
        .from('status_media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const publicUrl = authDb.storage
        .from('status_media')
        .getPublicUrl(filePath);

      // 2. Crear estado en la base de datos
      const { error: dbError } = await authDb.database
        .from('statuses')
        .insert({
          profile_id: session.user.id,
          media_url: publicUrl
        });

      if (dbError) throw dbError;

      // Recargar estados
      await loadStatuses();
    } catch (error) {
      console.error("Error subiendo estado:", error);
      alert("Error: " + (error.message || JSON.stringify(error) || "Error desconocido"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getTimeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `hace ${minutes || 1} minutos`;
    return `hace ${Math.floor(minutes / 60)} horas`;
  };

  // Convert object of users to array for mapping
  const othersList = Object.values(statusesByUser);

  const leftPanel = (
    <div className={styles.statusListContainer}>
      <div className={styles.header}>
        Estados
      </div>
      <div className={styles.list}>
        {/* Mi Estado */}
        <div className={styles.myStatus} onClick={handleUploadClick}>
          <div className={styles.avatar}>
            <User size={24} />
            <div className={styles.addIcon}>
              <Plus size={14} />
            </div>
          </div>
          <div className={styles.statusInfo}>
            <div className={styles.statusTitle}>Mi estado</div>
            <div className={styles.statusTime}>
              {uploading ? "Subiendo..." : myStatuses.length > 0 ? `${myStatuses.length} estado(s) - Haz clic para añadir más` : "Añadir a mi estado"}
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*" 
            onChange={handleFileChange} 
          />
        </div>

        {/* Ver mis propios estados (si tengo) */}
        {myStatuses.length > 0 && (
          <div 
            className={`${styles.statusItem} ${activeStatus?.id === myStatuses[0].id ? styles.active : ''}`}
            onClick={() => setActiveStatus(myStatuses[0])}
            style={{ marginTop: '10px' }}
          >
            <div className={styles.avatar} style={{ border: '2px solid var(--accent-color)', padding: '2px' }}>
              <User size={24} />
            </div>
            <div className={styles.statusInfo}>
              <div className={styles.statusTitle}>Ver mis estados</div>
              <div className={styles.statusTime}>{getTimeAgo(myStatuses[0].created_at)}</div>
            </div>
          </div>
        )}

        {othersList.length > 0 && <div className={styles.sectionTitle}>Recientes</div>}
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#8696a0' }}><Loader2 className={styles.spinner} /></div>
        ) : (
          othersList.map(group => {
            const latestStatus = group.statuses[0]; // array ya esta ordenado por fecha descendente
            return (
              <div 
                key={latestStatus.id} 
                className={`${styles.statusItem} ${activeStatus?.id === latestStatus.id ? styles.active : ''}`}
                onClick={() => setActiveStatus(latestStatus)}
              >
                <div className={styles.avatar} style={{ border: '2px solid var(--accent-color)', padding: '2px', overflow: 'hidden' }}>
                   {group.user.avatar_url ? (
                     <img src={group.user.avatar_url} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                   ) : (
                     <User size={24} />
                   )}
                </div>
                <div className={styles.statusInfo}>
                  <div className={styles.statusTitle}>{group.user.full_name || 'Desconocido'}</div>
                  <div className={styles.statusTime}>{getTimeAgo(latestStatus.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  const rightPanel = activeStatus ? (
    <div className={styles.viewerContainer}>
      <button className={styles.closeButton} onClick={() => setActiveStatus(null)}>
        <X size={30} />
      </button>
      <div className={styles.viewerContent}>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div className={styles.progressBarFill} style={{ width: `${progress}%`, transition: 'width 0.05s linear' }}></div>
          </div>
        </div>
        <img src={activeStatus.media_url} alt="Status" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
      </div>
    </div>
  ) : (
    <div className={styles.viewerContainer}>
      <Link href="/" className={styles.closeButton} title="Cerrar estados">
        <X size={30} />
      </Link>
      <div className={styles.viewerEmpty}>
        <EyeOff size={48} style={{ marginBottom: '20px', opacity: 0.5 }} />
        <p>Haz clic en un contacto para ver su estado</p>
      </div>
    </div>
  );

  return (
    <SplitLayout leftPanel={leftPanel} rightPanel={rightPanel} />
  );
}
