import React from 'react';
import styles from './Card.module.css';

export default function Card({
  children,
  title,
  subtitle,
  actions,
  className = '',
  onClick,
  ...props
}) {
  return (
    <div
      className={`${styles.card} ${onClick ? styles.clickable : ''} ${className}`}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div className={styles.header}>
          <div className={styles.titles}>
            {title && <h3 className={styles.title}>{title}</h3>}
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

