import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import styles from './AppLayout.module.css';

export default function AppLayout({ user, onLogout }) {
  return (
    <div className={styles.wrapper}>
      <Navbar user={user} onLogout={onLogout} />
      <main className={styles.main}>
        <div className={styles.container}>
          <Outlet />
        </div>
      </main>
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          <p>© {new Date().getFullYear()} CareerAI. Built for Students, Job Seekers & Future Leaders.</p>
        </div>
      </footer>
    </div>
  );
}

