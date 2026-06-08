"use client";

import styles from './ChatList.module.css';
import ChatListItem from './ChatListItem';

export default function ChatList({ chats, activeChatId, onChatSelect }) {
  return (
    <div className={styles.list}>
      {chats.map(chat => (
        <ChatListItem 
          key={chat.id} 
          chat={chat} 
          isActive={chat.id === activeChatId}
          onClick={() => onChatSelect(chat.id)}
        />
      ))}
    </div>
  );
}
