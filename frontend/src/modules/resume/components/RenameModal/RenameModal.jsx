import React, { useState, useEffect } from 'react';
import Modal from '../../../../components/common/Modal/Modal';
import Input from '../../../../components/common/Input/Input';
import Button from '../../../../components/common/Button/Button';
import { useNotification } from '../../../../context/NotificationContext';
import { resumeService } from '../../services/resumeService';

export default function RenameModal({ isOpen, onClose, resume, onRenamed }) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useNotification();

  useEffect(() => {
    if (resume) {
      setTitle(resume.title || '');
    }
  }, [resume]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !resume) return;

    setIsLoading(true);
    try {
      const updated = await resumeService.updateResume(resume.id, { title: title.trim() });
      success('Resume renamed successfully');
      onRenamed(updated);
      onClose();
    } catch (err) {
      error(err.message || 'Failed to rename resume');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rename Resume"
      maxWidth="460px"
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" isLoading={isLoading} onClick={handleSave}>
            Save Title
          </Button>
        </>
      }
    >
      <form onSubmit={handleSave}>
        <Input
          label="Resume Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Frontend Internship Resume"
          required
          autoFocus
        />
      </form>
    </Modal>
  );
}

