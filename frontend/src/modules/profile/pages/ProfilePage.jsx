import React, { useState } from 'react';
import styles from './ProfilePage.module.css';
import { useProfile } from '../hooks/useProfile';
import PersonalInfoSection from '../components/PersonalInfoSection';
import EducationSection from '../components/EducationSection';
import SkillsSection from '../components/SkillsSection';
import ProjectsSection from '../components/ProjectsSection';
import ExperienceSection from '../components/ExperienceSection';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';
import {
  User,
  GraduationCap,
  Code2,
  FolderGit2,
  Briefcase,
  Save,
  CheckCircle2,
} from 'lucide-react';

const TABS = [
  { id: 'personal', label: 'Personal Details', icon: User },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills & Tech', icon: Code2 },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'experience', label: 'Work Experience', icon: Briefcase },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('personal');
  const { profile, setProfile, isLoading, isSaving, saveProfile, completionPercentage } = useProfile();

  if (isLoading) {
    return <Loader fullPage message="Loading student profile..." />;
  }

  const handlePersonalInfoChange = (personalInfo) => {
    setProfile((prev) => ({ ...prev, personal_info: personalInfo }));
  };

  const handleEducationChange = (education) => {
    setProfile((prev) => ({ ...prev, education }));
  };

  const handleSkillsChange = (skills) => {
    setProfile((prev) => ({ ...prev, skills }));
  };

  const handleProjectsChange = (projects) => {
    setProfile((prev) => ({ ...prev, projects }));
  };

  const handleExperienceChange = (experience) => {
    setProfile((prev) => ({ ...prev, work_experience: experience }));
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Student Profile</h1>
          <p className={styles.subtitle}>
            Manage your master profile data. You can import any of these records directly into your resumes.
          </p>
        </div>

        <div className={styles.completionCard}>
          <div className={styles.completionInfo}>
            <span className={styles.completionLabel}>Profile Strength</span>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
          <span className={styles.completionPercent}>{completionPercentage}%</span>
        </div>
      </div>

      <div className={styles.layoutGrid}>
        <aside className={styles.sidebar}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tabBtn} ${isActive ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        <main className={styles.contentCard}>
          {activeTab === 'personal' && (
            <PersonalInfoSection
              data={profile?.personal_info}
              onChange={handlePersonalInfoChange}
            />
          )}

          {activeTab === 'education' && (
            <EducationSection
              list={profile?.education || []}
              onChange={handleEducationChange}
            />
          )}

          {activeTab === 'skills' && (
            <SkillsSection
              list={profile?.skills || []}
              onChange={handleSkillsChange}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsSection
              list={profile?.projects || []}
              onChange={handleProjectsChange}
            />
          )}

          {activeTab === 'experience' && (
            <ExperienceSection
              list={profile?.work_experience || []}
              onChange={handleExperienceChange}
            />
          )}

          <div className={styles.footerBar}>
            <Button
              variant="primary"
              size="md"
              icon={Save}
              isLoading={isSaving}
              onClick={() => saveProfile()}
            >
              Save Profile Changes
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

