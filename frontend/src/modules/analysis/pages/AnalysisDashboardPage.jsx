import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Target,
  History,
  Clock,
  ArrowRight,
  Edit3,
  Eye,
  FileText,
  Check,
  AlertCircle,
  TrendingUp,
  Zap,
} from 'lucide-react';
import styles from './AnalysisDashboardPage.module.css';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import { useNotification } from '../../../context/NotificationContext';
import { resumeService } from '../../resume/services/resumeService';
import { analysisService } from '../services/analysisService';
import { enhancementService } from '../../enhancement/services/enhancementService';
import TemplateRenderer from '../../templates/TemplateRenderer';

export default function AnalysisDashboardPage() {
  const { id: resumeId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const notify = useNotification();

  const [resume, setResume] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Pre-Built AI Resume Preview Modal state
  const [aiPreviewOpen, setAiPreviewOpen] = useState(false);
  const [aiPreviewLoading, setAiPreviewLoading] = useState(false);
  const [aiImprovedResume, setAiImprovedResume] = useState(null);
  const [previewVersion, setPreviewVersion] = useState('improved'); // 'improved' or 'original'
  const [isApplyingAi, setIsApplyingAi] = useState(false);

  // Load resume and analysis
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const resumeRes = await resumeService.getResume(resumeId);
        if (!isMounted) return;
        setResume(resumeRes);
        setTargetRole(resumeRes.target_role || '');

        let existingAnalysis = null;
        try {
          const latest = await analysisService.getLatestAnalysis(resumeId);
          if (latest) {
            existingAnalysis = latest.data || latest;
            setAnalysisData(existingAnalysis);
          }
        } catch {
          // No analysis exists yet
        }

        // Fetch history list
        try {
          const hist = await analysisService.getAnalysisHistory(resumeId);
          if (Array.isArray(hist?.data || hist)) {
            setHistoryList(hist.data || hist);
          }
        } catch {
          // Ignore history load errors
        }

        // Auto-analyze if query parameter present OR no analysis exists yet
        const shouldAutoAnalyze = searchParams.get('autoAnalyze') === '1' || !existingAnalysis;
        if (shouldAutoAnalyze) {
          setIsAnalyzing(true);
          try {
            const res = await analysisService.analyzeResume(resumeId, resumeRes.target_role || '');
            if (isMounted) {
              setAnalysisData(res.data || res);
              notify.success('AI Resume Analysis complete!');
            }
          } catch (analyzeErr) {
            if (isMounted) {
              notify.error(analyzeErr.message || 'Automatic analysis failed. Please try again.');
            }
          } finally {
            if (isMounted) setIsAnalyzing(false);
          }
        }
      } catch (err) {
        notify.error('Failed to load resume details.');
        navigate('/dashboard');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [resumeId, searchParams, navigate]);

  const handleRunAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      const res = await analysisService.analyzeResume(resumeId, targetRole);
      setAnalysisData(res.data || res);
      setHistoryList((prev) => [res.data || res, ...prev]);
      notify.success('AI Resume Analysis updated!');
    } catch (err) {
      notify.error(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleOpenAiPreview = async () => {
    setAiPreviewOpen(true);
    setPreviewVersion('improved');

    if (aiImprovedResume) return;

    setAiPreviewLoading(true);
    try {
      let resData = null;
      try {
        const latestEnh = await enhancementService.getLatestEnhancement(resumeId);
        if (latestEnh?.data?.improved_content) {
          resData = latestEnh.data;
        }
      } catch {
        // Not generated yet
      }

      if (!resData) {
        const genRes = await enhancementService.generateEnhancement(resumeId, {
          target_role: targetRole || resume?.target_role || '',
        });
        resData = genRes.data || genRes;
      }

      setAiImprovedResume(resData);
    } catch (err) {
      notify.error(err.message || 'Failed to generate AI-improved preview.');
    } finally {
      setAiPreviewLoading(false);
    }
  };

  const handleApplyAiResume = async () => {
    if (!aiImprovedResume?.improved_content) return;
    setIsApplyingAi(true);
    try {
      await enhancementService.applyEnhancement(resumeId, {
        mode: 'replace',
        custom_content: aiImprovedResume.improved_content,
      });
      notify.success('AI improvements applied to your resume!');
      setAiPreviewOpen(false);

      // Refresh resume and re-run analysis
      const updatedResume = await resumeService.getResume(resumeId);
      setResume(updatedResume);
      handleRunAnalysis();
    } catch (err) {
      notify.error(err.message || 'Failed to apply AI improvements.');
    } finally {
      setIsApplyingAi(false);
    }
  };

  const analysis = analysisData?.analysis || analysisData;
  const overallScore = analysis?.overall_score ?? resume?.overall_score ?? 0;
  const atsScore = analysis?.ats_compatibility_score ?? resume?.ats_score ?? 0;
  const jobReadiness = analysis?.job_readiness_score ?? resume?.job_readiness_score ?? 0;
  const contentQuality = analysis?.content_quality_score ?? 0;

  // Section Scores for progress bars
  const sectionScores = useMemo(() => {
    if (!analysis) return [];
    return [
      { key: 'summary', name: 'Professional Summary', score: analysis.summary_score ?? analysis.section_scores?.summary?.score ?? 75 },
      { key: 'skills', name: 'Technical Skills', score: analysis.skills_score ?? analysis.section_scores?.skills?.score ?? 80 },
      { key: 'experience', name: 'Work Experience', score: analysis.experience_score ?? analysis.section_scores?.experience?.score ?? 70 },
      { key: 'projects', name: 'Projects & Highlights', score: analysis.projects_score ?? analysis.section_scores?.projects?.score ?? 75 },
      { key: 'education', name: 'Education', score: analysis.education_score ?? analysis.section_scores?.education?.score ?? 85 },
      { key: 'certifications', name: 'Certifications', score: analysis.certifications_score ?? analysis.section_scores?.certifications?.score ?? 80 },
    ];
  }, [analysis]);

  // Radar Chart Data
  const radarChartData = useMemo(() => {
    if (analysis?.quality_dimensions?.length) {
      return analysis.quality_dimensions.map((d) => ({
        dimension: d.dimension,
        score: d.score,
        benchmark: 80,
      }));
    }
    return [
      { dimension: 'Impact & Metrics', score: 70, benchmark: 80 },
      { dimension: 'ATS Keywords', score: atsScore || 75, benchmark: 80 },
      { dimension: 'Readability', score: contentQuality || 80, benchmark: 80 },
      { dimension: 'Action Verbs', score: 75, benchmark: 80 },
      { dimension: 'Formatting', score: 85, benchmark: 80 },
    ];
  }, [analysis, atsScore, contentQuality]);

  const strengths = useMemo(() => {
    if (Array.isArray(analysis?.strengths) && analysis.strengths.length > 0) {
      return analysis.strengths.slice(0, 5);
    }
    return [
      'Standard single-column layout optimized for ATS parsers',
      'Clear, relevant technical competencies listed in organized groups',
      'Well-defined education and contact information sections',
    ];
  }, [analysis]);

  const weaknesses = useMemo(() => {
    if (Array.isArray(analysis?.weaknesses) && analysis.weaknesses.length > 0) {
      return analysis.weaknesses.slice(0, 5);
    }
    return [];
  }, [analysis]);

  const getScoreVerdict = (score) => {
    if (score >= 80) return { label: 'Strong ATS Match', class: styles.verdictGood };
    if (score >= 60) return { label: 'Competitive Profile', class: styles.verdictAvg };
    return { label: 'Needs Optimization', class: styles.verdictLow };
  };

  const verdict = getScoreVerdict(overallScore);

  if (isLoading) {
    return <Loader fullPage message="Opening Resume Analytics..." />;
  }

  return (
    <div className={styles.pageContainer}>
      {/* Top Navigation & Action Bar */}
      <div className={styles.topBar}>
        <div className={styles.barLeft}>
          <Link to="/dashboard" className={styles.backBtn} title="Return to Dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div className={styles.titleInfo}>
            <div className={styles.resumeTitleRow}>
              <h1 className={styles.resumeTitle}>{resume?.title || 'Resume Analytics'}</h1>
              {targetRole ? (
                <span className={styles.roleBadge}>
                  <Target size={12} />
                  {targetRole}
                </span>
              ) : (
                <span className={styles.roleBadgeMuted}>General Profile</span>
              )}
            </div>
            <span className={styles.subtext}>
              Comprehensive ATS audit & role readiness evaluation
            </span>
          </div>
        </div>

        {/* 3 Prominent Action Buttons */}
        <div className={styles.barActions}>
          <Link to={`/resumes/${resumeId}/edit`}>
            <Button variant="primary" size="md" icon={Edit3}>
              Edit Resume
            </Button>
          </Link>

          <Button
            variant="secondary"
            size="md"
            icon={Sparkles}
            onClick={handleOpenAiPreview}
            style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: '#ffffff',
              border: 'none',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
            }}
          >
            Preview AI-Improved Resume
          </Button>

          <Button
            variant="outline"
            size="md"
            icon={RefreshCw}
            isLoading={isAnalyzing}
            onClick={handleRunAnalysis}
            title="Re-run analysis after making edits"
          >
            Re-Analyze
          </Button>

          {historyList.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              icon={History}
              onClick={() => setHistoryModalOpen(true)}
              title="View past analysis score scans"
            >
              History ({historyList.length})
            </Button>
          )}
        </div>
      </div>

      {/* Hero Score Card */}
      <div className={styles.heroCard}>
        {/* Overall Score Circle */}
        <div className={styles.heroLeft}>
          <div className={styles.scoreGauge}>
            <svg viewBox="0 0 120 120" className={styles.gaugeSvg}>
              <circle
                cx="60"
                cy="60"
                r="50"
                className={styles.gaugeBg}
              />
              <circle
                cx="60"
                cy="60"
                r="50"
                className={styles.gaugeProgress}
                style={{
                  strokeDasharray: 314,
                  strokeDashoffset: 314 - (314 * Math.min(overallScore, 100)) / 100,
                  stroke: overallScore >= 80 ? '#22c55e' : overallScore >= 60 ? '#f59e0b' : '#ef4444',
                }}
              />
            </svg>
            <div className={styles.gaugeValueArea}>
              <span className={styles.gaugeNumber}>{overallScore}</span>
              <span className={styles.gaugePercent}>%</span>
            </div>
          </div>

          <div className={styles.heroLeftText}>
            <span className={`${styles.verdictBadge} ${verdict.class}`}>
              {verdict.label}
            </span>
            <h2 className={styles.heroHeading}>Overall Resume Score</h2>
            <p className={styles.heroDescription}>
              {overallScore >= 80
                ? 'Your resume is in excellent shape! High ATS readability and strong section coverage make it competitive for recruiters.'
                : overallScore >= 60
                ? 'Your resume covers key fundamentals. Polishing action verbs and quantifying your project outcomes will boost your score.'
                : 'Several high-impact improvements are recommended to pass automated ATS filters and highlight your experience.'}
            </p>
          </div>
        </div>

        {/* 3 Companion KPI Cards */}
        <div className={styles.kpiGrid}>
          <div className={styles.kpiBox}>
            <div className={styles.kpiHeader}>
              <ShieldCheck size={18} className={styles.kpiIconAts} />
              <span className={styles.kpiTitle}>ATS Compatibility</span>
            </div>
            <div className={styles.kpiScore}>
              {atsScore}
              <span className={styles.kpiUnit}>%</span>
            </div>
            <p className={styles.kpiNote}>Layout parseability & header structure</p>
          </div>

          <div className={styles.kpiBox}>
            <div className={styles.kpiHeader}>
              <Target size={18} className={styles.kpiIconRole} />
              <span className={styles.kpiTitle}>Job Readiness</span>
            </div>
            <div className={styles.kpiScore}>
              {jobReadiness}
              <span className={styles.kpiUnit}>%</span>
            </div>
            <p className={styles.kpiNote}>Role keyword coverage & skill alignment</p>
          </div>

          <div className={styles.kpiBox}>
            <div className={styles.kpiHeader}>
              <CheckCircle2 size={18} className={styles.kpiIconQuality} />
              <span className={styles.kpiTitle}>Content Quality</span>
            </div>
            <div className={styles.kpiScore}>
              {contentQuality}
              <span className={styles.kpiUnit}>%</span>
            </div>
            <p className={styles.kpiNote}>Action verbs, impact & sentence clarity</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Layout */}
      <div className={styles.mainGrid}>
        {/* Left Column: Section Breakdown & Radar Chart */}
        <div className={styles.leftCol}>
          {/* Section Scores Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Section-by-Section Score</h3>
              <span className={styles.benchmarkNote}>Target Benchmark: 80%</span>
            </div>

            <div className={styles.sectionBarsList}>
              {sectionScores.map((sec) => {
                const isPass = sec.score >= 80;
                return (
                  <div key={sec.key} className={styles.barRow}>
                    <div className={styles.barLabelGroup}>
                      <span className={styles.sectionName}>{sec.name}</span>
                      <span className={`${styles.sectionScoreText} ${isPass ? styles.scoreGood : ''}`}>
                        {sec.score}%
                      </span>
                    </div>

                    <div className={styles.barTrack}>
                      <div
                        className={styles.barFill}
                        style={{
                          width: `${Math.min(sec.score, 100)}%`,
                          backgroundColor:
                            sec.score >= 80
                              ? 'var(--success-500)'
                              : sec.score >= 60
                              ? 'var(--warning-500)'
                              : 'var(--danger-500)',
                        }}
                      />
                      <div className={styles.benchmarkLine} style={{ left: '80%' }} title="Target: 80%" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quality Dimensions Radar Chart Card */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Resume Quality Dimensions</h3>
              <span className={styles.cardSub}>5 Core Evaluation Criteria</span>
            </div>

            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarChartData} outerRadius="75%">
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }}
                  />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                  <Radar
                    name="Your Score"
                    dataKey="score"
                    stroke="var(--primary-600)"
                    fill="var(--primary-500)"
                    fillOpacity={0.25}
                  />
                  <Tooltip
                    formatter={(val) => [`${val}%`, 'Score']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Key Strengths & Actionable Recommendations */}
        <div className={styles.rightCol}>
          {/* Key Strengths */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIconWrapGood}>
                <Check size={18} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Key Strengths</h3>
                <span className={styles.cardSub}>What your resume does exceptionally well</span>
              </div>
            </div>

            <div className={styles.strengthsList}>
              {strengths.map((s, idx) => (
                <div key={idx} className={styles.strengthItem}>
                  <CheckCircle2 size={16} className={styles.strengthCheckIcon} />
                  <span className={styles.strengthText}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardHeaderIconWrapWarn}>
                <AlertCircle size={18} />
              </div>
              <div>
                <h3 className={styles.cardTitle}>Recommended Improvements</h3>
                <span className={styles.cardSub}>Actionable edits to boost ATS pass rates</span>
              </div>
            </div>

            {weaknesses.length > 0 ? (
              <div className={styles.recList}>
                {weaknesses.map((w, idx) => (
                  <div key={idx} className={styles.recCard}>
                    <div className={styles.recTop}>
                      <span
                        className={`${styles.severityTag} ${
                          w.severity === 'critical'
                            ? styles.sevCritical
                            : w.severity === 'warning'
                            ? styles.sevWarning
                            : styles.sevSuggestion
                        }`}
                      >
                        {w.severity || 'suggestion'}
                      </span>
                      <span className={styles.recSection}>{w.section || 'General'}</span>
                    </div>

                    <h4 className={styles.recTitle}>{w.title || 'Optimization Opportunity'}</h4>
                    <p className={styles.recText}>
                      {w.recommendation || w.description}
                    </p>

                    <Link
                      to={`/resumes/${resumeId}/edit`}
                      className={styles.fixInEditorLink}
                    >
                      <span>Fix in Editor</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyRecState}>
                <CheckCircle2 size={28} style={{ color: 'var(--success-600)' }} />
                <p>No critical weak spots found! Your resume meets recruiter criteria.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className={styles.disclaimerNote}>
        * ATS Compatibility and Job Readiness scores are algorithmic benchmarks designed to assist your preparation and resume tailoring. They are not guarantees of recruiter interview selection or employment.
      </div>

      {/* Pre-Built AI Resume Preview Modal */}
      <Modal
        isOpen={aiPreviewOpen}
        onClose={() => setAiPreviewOpen(false)}
        title="Pre-Built AI-Improved Resume Preview"
        maxWidth="900px"
        footer={
          <div className={styles.modalFooterRow}>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setAiPreviewOpen(false)}
            >
              Close
            </Button>

            <Link to={`/resumes/${resumeId}/edit`}>
              <Button variant="outline" size="md" icon={Edit3}>
                Edit in Resume Builder
              </Button>
            </Link>

            <Button
              variant="primary"
              size="md"
              icon={Sparkles}
              isLoading={isApplyingAi}
              disabled={aiPreviewLoading || !aiImprovedResume?.improved_content}
              onClick={handleApplyAiResume}
            >
              Apply AI Version to My Resume
            </Button>
          </div>
        }
      >
        <div className={styles.previewModalBody}>
          {aiPreviewLoading ? (
            <div className={styles.modalLoadingBox}>
              <Sparkles size={40} className={styles.pulseSparkle} />
              <h4>Polishing Your Resume with AI...</h4>
              <p>Rewriting bullet points with action verbs, adding metrics, and optimizing ATS wording.</p>
            </div>
          ) : (
            <>
              {/* Version Switcher & Summary Strip */}
              <div className={styles.previewControlsStrip}>
                <div className={styles.versionToggle}>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${
                      previewVersion === 'improved' ? styles.activeToggle : ''
                    }`}
                    onClick={() => setPreviewVersion('improved')}
                  >
                    <Sparkles size={14} />
                    <span>AI-Improved Version</span>
                  </button>
                  <button
                    type="button"
                    className={`${styles.toggleBtn} ${
                      previewVersion === 'original' ? styles.activeToggle : ''
                    }`}
                    onClick={() => setPreviewVersion('original')}
                  >
                    <FileText size={14} />
                    <span>Original Version</span>
                  </button>
                </div>

                <div className={styles.enhancementBadge}>
                  {previewVersion === 'improved' ? (
                    <span>✨ Action verbs & XYZ bullets upgraded</span>
                  ) : (
                    <span>📄 Original draft without AI polishing</span>
                  )}
                </div>
              </div>

              {/* Formatted Paper Preview Sheet */}
              <div className={styles.paperContainer}>
                <TemplateRenderer
                  template={resume?.template || 'modern'}
                  content={
                    previewVersion === 'improved'
                      ? aiImprovedResume?.improved_content || resume?.content
                      : resume?.content
                  }
                  targetRole={resume?.target_role}
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Resume Score Progression"
        maxWidth="500px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {historyList.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                border: '1px solid var(--slate-200)',
                borderRadius: 'var(--radius-md)',
                background: '#ffffff',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                  Scan #{historyList.length - idx}
                </strong>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--primary-700)' }}>
                  Overall: {item.overall_score || item.analysis?.overall_score}%
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                  ATS: {item.ats_compatibility_score || item.analysis?.ats_compatibility_score}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
