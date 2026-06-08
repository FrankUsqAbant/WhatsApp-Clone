"use client";

import styles from './SidebarHeader.module.css';
import { CircleDashed, MessageSquarePlus, MoreVertical, User } from 'lucide-react';
import Link from 'next/link';

export default function SidebarHeader({ onNewChat, avatarUrl, userName }) {
  return (
    <div className={styles.header}>
      <Link href="/profile" className={styles.avatar} title="Ver perfil">
        {avatarUrl ? (
          <img src={avatarUrl} alt={userName || 'Mi perfil'} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%'}} />
        ) : (
          <User size={24} />
        )}
      </Link>
      <div className={styles.actions}>
        <Link href="/status" className={styles.iconButton} title="Estados">
          <CircleDashed size={20} strokeWidth={2.5} />
        </Link>
        <button className={styles.iconButton} title="Nuevo chat" onClick={onNewChat}>
          <MessageSquarePlus size={20} />
        </button>
        <button className={styles.iconButton} title="Menú">
          <MoreVertical size={20} />
        </button>
      </div>
    </div>
  );
}
