import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';
import { FileText, Sparkles, User, LogOut, LayoutDashboard, PlusCircle } from 'lucide-react';
import Button from '../../components/common/Button/Button';

export default function Navbar({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/dashboard" className={styles.brand}>
          <div className={styles.logoIcon}>
            <FileText size={20} className={styles.fileIcon} />
            <Sparkles size={12} className={styles.sparkleIcon} />
          </div>
          <span className={styles.brandName}>
            Career<span className={styles.brandHighlight}>AI</span>
          </span>
        </Link>

        {user && (
          <nav className={styles.navLinks}>
            <Link
              to="/dashboard"
              className={`${styles.navLink} ${isActive('/dashboard') ? styles.activeLink : ''}`}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/profile"
              className={`${styles.navLink} ${isActive('/profile') ? styles.activeLink : ''}`}
            >
              <User size={16} />
              <span>Student Profile</span>
            </Link>
          </nav>
        )}

        <div className={styles.userActions}>
          {user ? (
            <>
              <Link to="/resumes/create">
                <Button variant="primary" size="sm" icon={PlusCircle}>
                  New Resume
                </Button>
              </Link>
              <div className={styles.userBadge}>
                <span className={styles.userEmail}>{user.full_name || user.email}</span>
                <button
                  onClick={onLogout}
                  className={styles.logoutBtn}
                  title="Log out"
                  aria-label="Log out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className={styles.authButtons}>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

