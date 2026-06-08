"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Camera, Edit2, User, LogOut } from 'lucide-react';
import SplitLayout from '@/components/layout/SplitLayout';
import { insforge } from '@/lib/insforge';
import styles from './Profile.module.css';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAbout, setNewAbout] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await insforge.auth.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await insforge.database
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        setProfile(data);
        setNewName(data.full_name || '');
        setNewAbout(data.about || '');
      }
    };
    fetchProfile();
  }, [router]);

  const handleUpdate = async (field, value) => {
    if (!profile) return;
    const { error } = await insforge.database
      .from('profiles')
      .update({ [field]: value })
      .eq('id', profile.id);
      
    if (!error) {
      setProfile({ ...profile, [field]: value });
    }
  };

  const handleLogout = async () => {
    await insforge.auth.signOut();
    router.push('/login');
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;
      
      // Upload - SDK returns { data: { key, url, ... }, error }
      const { data: uploadData, error: uploadError } = await insforge.storage
        .from('avatars')
        .upload(filePath, file);
      
      if (uploadError) throw new Error(uploadError.message || JSON.stringify(uploadError));
      
      // Use url from upload response, or build it from getPublicUrl (returns string)
      const publicUrl = uploadData?.url || insforge.storage.from('avatars').getPublicUrl(filePath);
      
      await handleUpdate('avatar_url', publicUrl);
    } catch (err) {
      console.error("Error subiendo foto:", err);
      alert(`Hubo un error al subir la foto: ${err.message}`);

    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!profile) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)'}}>Cargando perfil...</div>;
  }

  const leftPanel = (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/" className={styles.backButton}>
          <ArrowLeft size={24} />
        </Link>
        <div>Perfil</div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper} onClick={() => !isUploading && fileInputRef.current?.click()} style={{ cursor: isUploading ? 'default' : 'pointer' }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', opacity: isUploading ? 0.5 : 1}} />
            ) : (
              <User size={80} style={{ opacity: isUploading ? 0.5 : 1 }} />
            )}
            {!isUploading && (
              <div className={styles.avatarOverlay}>
                <Camera size={24} style={{ marginBottom: '8px' }} />
                CAMBIAR FOTO
              </div>
            )}
            {isUploading && (
              <div style={{position: 'absolute', color: '#fff', fontWeight: 'bold'}}>
                Subiendo...
              </div>
            )}
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{display: 'none'}} 
            accept="image/*"
            onChange={handleAvatarUpload} 
          />
        </div>
        
        <div className={styles.fieldSection}>
          <div className={styles.fieldLabel}>Tu nombre</div>
          <div className={styles.fieldValue}>
            {isEditingName ? (
              <input 
                type="text" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)}
                onBlur={() => { setIsEditingName(false); handleUpdate('full_name', newName); }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                autoFocus
                style={{background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none', fontSize: 'inherit'}}
              />
            ) : (
              <>
                {profile.full_name || 'Desconocido'}
                <Edit2 size={20} className={styles.editIcon} onClick={() => setIsEditingName(true)} style={{cursor: 'pointer'}} />
              </>
            )}
          </div>
        </div>
        <div className={styles.fieldDescription}>
          Este no es tu nombre de usuario ni tu PIN. Este nombre será visible para tus contactos de WhatsApp.
        </div>
        
        <div className={styles.fieldSection}>
          <div className={styles.fieldLabel}>Info.</div>
          <div className={styles.fieldValue}>
            {isEditingAbout ? (
              <input 
                type="text" 
                value={newAbout} 
                onChange={(e) => setNewAbout(e.target.value)}
                onBlur={() => { setIsEditingAbout(false); handleUpdate('about', newAbout); }}
                onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                autoFocus
                style={{background: 'transparent', border: 'none', color: 'inherit', width: '100%', outline: 'none', fontSize: 'inherit'}}
              />
            ) : (
              <>
                {profile.about || 'Disponible'}
                <Edit2 size={20} className={styles.editIcon} onClick={() => setIsEditingAbout(true)} style={{cursor: 'pointer'}} />
              </>
            )}
          </div>
        </div>

        <div style={{marginTop: '40px', display: 'flex', justifyContent: 'center'}}>
          <button 
            onClick={handleLogout}
            style={{display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', color: '#ef5350', border: 'none', cursor: 'pointer', fontSize: '16px'}}
          >
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <SplitLayout leftPanel={leftPanel} rightPanel={null} />
  );
}
