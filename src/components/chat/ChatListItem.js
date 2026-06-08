"use client";

import styles from './ChatListItem.module.css';
import { User } from 'lucide-react';

function getMessagePreview(content) {
  if (!content) return '';
  try {
    if (content.startsWith('{')) {
      const parsed = JSON.parse(content);
      if (parsed.file) {
        const type = parsed.file.type || '';
        if (type.startsWith('image/')) return '📷 Imagen';
        if (type.startsWith('audio/')) return '🎤 Nota de voz';
        if (type.startsWith('video/')) return '🎥 Video';
        return `📎 ${parsed.file.name || 'Archivo'}`;
      }
      if (parsed.text) return parsed.text;
    }
  } catch (e) {}
  return content;
}

export default function ChatListItem({ chat, isActive, onClick }) {
  return (
    <div 
      className={`${styles.item} ${isActive ? styles.itemActive : ''}`} 
      onClick={onClick}
    >
      <div className={styles.avatar}>
        {chat.avatar ? (
          <img src={chat.avatar.includes('pravatar') ? `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}&background=random` : chat.avatar} alt={chat.name} />
        ) : (
          <User size={24} />
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.topLine}>
          <div className={styles.name}>{chat.name}</div>
          <div className={styles.time}>{chat.time}</div>
        </div>
        <div className={styles.bottomLine}>
          <div className={styles.message}>{getMessagePreview(chat.lastMessage)}</div>
          {chat.unreadCount > 0 && (
            <div className={styles.unreadBadge}>{chat.unreadCount}</div>
          )}
        </div>
      </div>
    </div>
  );
}
