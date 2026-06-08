"use client";

import styles from './SidebarSearch.module.css';
import { Search } from 'lucide-react';

export default function SidebarSearch({ placeholder = "Buscar", value, onChange }) {
  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <Search className={styles.icon} size={18} />
        <input 
          type="text" 
          className={styles.input} 
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
