import React, { useState } from 'react';
import Modal from '../../../../components/common/Modal/Modal';
import Button from '../../../../components/common/Button/Button';
import { useNotification } from '../../../../context/NotificationContext';
import { resumeService } from '../../services/resumeService';
import { AlertTriangle } from 'lucide-react';

export default function DeleteModal({ isOpen, onClose, resume, onDeleted }) {
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useNotification();

  const handleDelete = async () => {
    if (!resume) return;

    setIsLoading(true);
    try {
      await resumeService.deleteResume(resume.id);
      success(`"${resume.title}" was deleted.`);
      onDeleted(resume.id);
      onClose();
    } catch (err) {
      error(err.message || 'Failed to delete resume');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Resume"
      maxWidth="440px"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" size="md" isLoading={isLoading} onClick={handleDelete}>
            Delete Resume
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{ backgroundColor: 'var(--danger-50)', color: 'var(--danger-600)', padding: '0.65rem', borderRadius: 'var(--radius-full)' }}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--slate-900)', marginBottom: '0.35rem' }}>
            Are you sure you want to delete this resume?
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
            This will permanently remove <strong>"{resume?.title}"</strong> and all of its version history snapshots. This action cannot be undone.
          </p>
        </div>
      </div>
    </Modal>
  );
}

