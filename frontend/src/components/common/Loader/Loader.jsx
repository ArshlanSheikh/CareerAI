import React from 'react';
import styles from './Loader.module.css';
import { Loader2 } from 'lucide-react';

export default function Loader({ fullPage = false, message = 'Loading...' }) {
  if (fullPage) {
    return (
      <div className={styles.fullPageContainer}>
        <Loader2 className={styles.spinner} size={40} />
        {message && <p className={styles.message}>{message}</p>}
      </div>
    );
  }

  return (
    <div className={styles.inlineContainer}>
      <Loader2 className={styles.spinner} size={24} />
      {message && <span className={styles.inlineMessage}>{message}</span>}
    </div>
  );
}

