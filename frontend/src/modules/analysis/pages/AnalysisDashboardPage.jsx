import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  TrendingUp,
  Award,
  FileText,
  Briefcase,
  ArrowLeft,
  RefreshCw,
  Wand2,
  BookOpen,
  Code2,
  Target,
  History,
  Clock,
  Calendar,
} from 'lucide-react';
import styles from './AnalysisDashboardPage.module.css';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import { useNotification } from '../../../context/NotificationContext';
import { resumeService } from '../../resume/services/resumeService';
import { analysisService } from '../services/analysisService';

// Circular Score Indicator Sub-component
function CircularGauge({ score = 0, label, subtitle, size = 120, strokeWidth = 10, isHero = false }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = '#6366f1';
  let tierLabel = 'Good';
  let tierStyle = { background: '#e0e7ff', color: '#3730a3' };

  if (clampedScore >= 85) {
    strokeColor = '#10b981';
    tierLabel = 'Excellent';
    tierStyle = { background: '#d1fae5', color: '#065f46' };
  } else if (clampedScore >= 70) {
    strokeColor = '#6366f1';
    tierLabel = 'Good';
    tierStyle = { background: '#e0e7ff', color: '#3730a3' };
  } else if (clampedScore >= 55) {
    strokeColor = '#f59e0b';
    tierLabel = 'Fair';
    tierStyle = { background: '#fef3c7', color: '#92400e' };
  } else {
    strokeColor = '#ef4444';
    tierLabel = 'Needs Work';
    tierStyle = { background: '#fee2e2', color: '#991b1b' };
  }

  return (
    <div className={`${styles.scoreCard} ${isHero ? styles.scoreCardHero : ''}`}>
      <span className={styles.scoreTierBadge} style={tierStyle}>
        {tierLabel}
      </span>
      <div className={styles.gaugeContainer} style={{ width: size, height: size }}>
        <svg className={styles.gaugeSvg} width={size} height={size}>
          <circle
            className={styles.gaugeBackground}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
          />
          <circle
            className={styles.gaugeProgress}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className={styles.gaugeCenterText}>
          <span className={styles.gaugeNumber}>{clampedScore}</span>
          <span className={styles.gaugeMax}>/ 100</span>
        </div>
      </div>
      <div className={styles.scoreLabel}>{label}</div>
      {subtitle && <p className={styles.scoreDesc}>{subtitle}</p>}
    </div>
  );
}

export default function AnalysisDashboardPage() {
  const { id: resumeId } = useParams();
  const navigate = useNavigate();
  const notify = useNotification();

  const [resume, setResume] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSectionTab, setActiveSectionTab] = useState('summary');
  const [historyList, setHistoryList] = useState([]);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Load initial resume and existing analysis
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setIsLoading(true);
        const resumeRes = await resumeService.getResume(resumeId);
        if (!isMounted) return;
        setResume(resumeRes);
        setTargetRole(resumeRes.target_role || '');

        // Fetch latest analysis
        try {
          const latest = await analysisService.getLatestAnalysis(resumeId);
          if (latest && latest.analysis) {
            setAnalysisData(latest);
          }
        } catch (err) {
          // No previous analysis found; user can trigger first run
        }

        // Fetch history list
        try {
          const hist = await analysisService.getAnalysisHistory(resumeId);
          if (Array.isArray(hist)) {
            setHistoryList(hist);
          }
        } catch (err) {
          // Ignore history load errors
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
  }, [resumeId]);

  const handleRunAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      const res = await analysisService.analyzeResume(resumeId, targetRole);
      setAnalysisData(res);
      setHistoryList((prev) => [res, ...prev]);
      notify.success('AI Resume Analysis complete!');
    } catch (err) {
      notify.error(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <Loader fullPage message="Loading AI Resume Insights..." />;
  }

  const analysis = analysisData?.analysis;

  // Transform section scores for Recharts Bar Chart
  const sectionChartData = analysis ? [
    { name: 'Summary', score: analysis.summary_score || 0, benchmark: 80 },
    { name: 'Skills', score: analysis.skills_score || 0, benchmark: 80 },
    { name: 'Projects', score: analysis.projects_score || 0, benchmark: 80 },
    { name: 'Experience', score: analysis.experience_score || 0, benchmark: 80 },
    { name: 'Education', score: analysis.education_score || 0, benchmark: 80 },
  ] : [];

  // Transform quality dimensions for Recharts Radar Chart
  const radarChartData = analysis?.quality_dimensions?.length
    ? analysis.quality_dimensions.map((d) => ({
        dimension: d.dimension,
        score: d.score,
        benchmark: d.benchmark || 80,
      }))
    : [];

  const getBarColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 65) return '#6366f1';
    return '#f59e0b';
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.innerWrapper}>
        {/* Top Header Bar */}
        <div className={styles.topBar}>
          <div className={styles.barLeft}>
            <Link to={`/resumes/${resumeId}/edit`} className={styles.backBtn} title="Return to Editor">
              <ArrowLeft size={18} />
            </Link>
            <div className={styles.headerTitleArea}>
              <div className={styles.headerTitleRow}>
                <h1 className={styles.pageTitle}>{resume?.title || 'Resume Analysis'}</h1>
                {targetRole ? (
                  <span className={styles.targetRoleBadge}>
                    <Target size={12} />
                    {targetRole}
                  </span>
                ) : (
                  <span className={styles.targetRoleBadge} style={{ background: '#f1f5f9', color: '#475569' }}>
                    General Profile
                  </span>
                )}
              </div>
              <p className={styles.headerSubtitle}>
                AI-powered ATS audit, keyword alignment, and deep section diagnostic
              </p>
            </div>
          </div>

          <div className={styles.barRight}>
            {historyList.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                icon={History}
                onClick={() => setHistoryModalOpen(true)}
                title="View previous analysis scans & score progression"
              >
                History ({historyList.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              isLoading={isAnalyzing}
              onClick={handleRunAnalysis}
            >
              {analysis ? 'Re-Analyze' : 'Analyze Now'}
            </Button>
            <Link to={`/resumes/${resumeId}/preview`}>
              <Button variant="outline" size="sm" icon={FileText}>
                Preview Resume
              </Button>
            </Link>
            <Link to={`/resumes/${resumeId}/enhance`}>
              <Button variant="primary" size="sm" icon={Wand2}>
                AI Resume Improver
              </Button>
            </Link>
          </div>
        </div>

        {/* ATS Estimation Disclaimer Notice */}
        <div className={styles.disclaimerBanner}>
          <ShieldAlert size={20} />
          <div>
            <strong>ATS Score Estimation Notice: </strong>
            {analysis?.disclaimer ||
              'ATS compatibility ratings are calculated based on formatting parseability, structure, and industry keyword alignment. They serve as actionable guidance and do not guarantee ATS bypass or job selection.'}
          </div>
        </div>

        {/* Scanning State */}
        {isAnalyzing && (
          <div className={styles.scanningOverlay}>
            <div className={styles.scanningPulse}>
              <div className={styles.pulseRing} />
              <Sparkles size={36} color="var(--primary-600)" />
            </div>
            <h2 className={styles.scanningTitle}>Scanning Resume with Gemini AI...</h2>
            <p className={styles.scanningSubtitle}>
              Auditing ATS readability, measuring metric density, evaluating action verbs, and compiling tailored recommendations.
            </p>
          </div>
        )}

        {/* Empty State when never analyzed */}
        {!analysis && !isAnalyzing && (
          <div className={styles.emptyStateCard}>
            <div className={styles.emptyIconCircle}>
              <Sparkles size={40} />
            </div>
            <div>
              <h2 className={styles.emptyTitle}>Run Your AI Resume Audit</h2>
              <p className={styles.emptyDesc}>
                Get an objective, in-depth evaluation of your ATS compatibility, impact quantification, industry keywords, and concrete recommendations.
              </p>
            </div>

            <div className={styles.emptyForm}>
              <label className={styles.formLabel}>Target Job Title or Specialization (Optional)</label>
              <input
                type="text"
                className={styles.roleInput}
                placeholder="e.g. Senior Full Stack Engineer, Product Manager"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
              />
              <Button
                variant="primary"
                size="lg"
                icon={Sparkles}
                onClick={handleRunAnalysis}
              >
                Analyze Resume Now
              </Button>
            </div>
          </div>
        )}

        {/* Main Dashboard Visualizations */}
        {analysis && !isAnalyzing && (
          <>
            {/* 4 Hero Score Cards */}
            <div className={styles.scoreGrid}>
              <CircularGauge
                score={analysis.overall_score}
                label="Overall Resume Score"
                subtitle="Calculated across all sections and impact depth"
                isHero
              />
              <CircularGauge
                score={analysis.ats_compatibility_score}
                label="ATS Compatibility"
                subtitle="Readability by modern Applicant Tracking Systems"
              />

              {/* Content Quality Metric */}
              <div className={styles.miniMetricCard}>
                <div className={styles.miniMetricHeader}>
                  <span className={styles.miniMetricTitle}>Content Quality</span>
                  <div className={styles.miniMetricIcon} style={{ background: '#f5f3ff', color: '#7c3aed' }}>
                    <TrendingUp size={18} />
                  </div>
                </div>
                <div>
                  <div className={styles.miniMetricVal}>{analysis.content_quality_score || 75}%</div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${analysis.content_quality_score || 75}%`,
                        background: 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                      }}
                    />
                  </div>
                </div>
                <div className={styles.miniMetricMeta}>
                  <span>Impact & Action Verbs</span>
                  <span>Benchmark 80%</span>
                </div>
              </div>

              {/* Readability Metric */}
              <div className={styles.miniMetricCard}>
                <div className={styles.miniMetricHeader}>
                  <span className={styles.miniMetricTitle}>Readability & Layout</span>
                  <div className={styles.miniMetricIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
                    <BookOpen size={18} />
                  </div>
                </div>
                <div>
                  <div className={styles.miniMetricVal}>{analysis.readability_score || 80}%</div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${analysis.readability_score || 80}%`,
                        background: 'linear-gradient(90deg, #10b981, #059669)',
                      }}
                    />
                  </div>
                </div>
                <div className={styles.miniMetricMeta}>
                  <span>Visual Hierarchy</span>
                  <span>Benchmark 80%</span>
                </div>
              </div>
            </div>

            {/* Visual Charts: Bar Chart & Radar Chart */}
            <div className={styles.chartsRow}>
              {/* Section Performance Bar Chart */}
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <h3 className={styles.chartTitle}>Section-by-Section Strength</h3>
                    <p className={styles.chartSubtitle}>Individual performance scores vs 80-point target benchmark</p>
                  </div>
                </div>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sectionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#1e293b',
                          border: 'none',
                          borderRadius: '8px',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                        {sectionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quality Dimensions Radar Chart */}
              <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                  <div>
                    <h3 className={styles.chartTitle}>Quality Dimensions</h3>
                    <p className={styles.chartSubtitle}>Holistic audit across 5 core hiring dimensions</p>
                  </div>
                </div>
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={260}>
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                      <PolarGrid stroke="#e2e8f0" />
                      <PolarAngleAxis dataKey="dimension" stroke="#64748b" fontSize={11} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={10} />
                      <Radar
                        name="Score"
                        dataKey="score"
                        stroke="#6366f1"
                        fill="#818cf8"
                        fillOpacity={0.45}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Interactive Section Explorer */}
            <div className={styles.sectionTabsCard}>
              <div className={styles.sectionTabsHeader}>
                <h3 className={styles.chartTitle}>Detailed Section Diagnostics</h3>
                <div className={styles.tabBtnGroup}>
                  {[
                    { id: 'summary', label: 'Summary', score: analysis.summary_score },
                    { id: 'skills', label: 'Skills', score: analysis.skills_score },
                    { id: 'experience', label: 'Experience', score: analysis.experience_score },
                    { id: 'projects', label: 'Projects', score: analysis.projects_score },
                    { id: 'education', label: 'Education', score: analysis.education_score },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      className={`${styles.tabBtn} ${activeSectionTab === tab.id ? styles.tabBtnActive : ''}`}
                      onClick={() => setActiveSectionTab(tab.id)}
                    >
                      <span>{tab.label}</span>
                      <span className={styles.tabScoreBadge}>{tab.score || 0}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content Panels */}
              {activeSectionTab === 'summary' && (
                <div className={styles.tabContentPanel}>
                  <p className={styles.sectionFeedbackText}>
                    {analysis.section_scores?.summary?.feedback ||
                      'Professional summary gives an introductory overview of your background and career goals.'}
                  </p>
                  {analysis.section_scores?.summary?.strengths?.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--success-700)' }}>Strengths:</strong>
                      <ul style={{ margin: '0.35rem 0 0 1.25rem', fontSize: '0.825rem', color: 'var(--slate-600)' }}>
                        {analysis.section_scores.summary.strengths.map((str, idx) => (
                          <li key={idx}>{str}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {analysis.section_scores?.summary?.improvements?.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.85rem', color: '#b45309' }}>Opportunities to Refine:</strong>
                      <ul style={{ margin: '0.35rem 0 0 1.25rem', fontSize: '0.825rem', color: 'var(--slate-600)' }}>
                        {analysis.section_scores.summary.improvements.map((imp, idx) => (
                          <li key={idx}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {activeSectionTab === 'skills' && (
                <div className={styles.tabContentPanel}>
                  <p className={styles.sectionFeedbackText}>
                    {analysis.section_scores?.skills?.feedback ||
                      'Skill presentation impacts keyword matching in automated candidate screenings.'}
                  </p>
                  <div>
                    <h4 style={{ fontSize: '0.825rem', color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                      Identified Skills ({analysis.section_scores?.skills?.found_skills?.length || 0})
                    </h4>
                    <div className={styles.chipsContainer}>
                      {(analysis.section_scores?.skills?.found_skills || []).map((sk, idx) => (
                        <span key={idx} className={styles.skillPillPresent}>
                          <CheckCircle2 size={12} /> {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                  {analysis.section_scores?.skills?.recommended_keywords?.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: '0.825rem', color: '#be185d', margin: '0.75rem 0 0.5rem' }}>
                        Recommended Keywords for Target Role ({analysis.section_scores?.skills?.recommended_keywords?.length})
                      </h4>
                      <div className={styles.chipsContainer}>
                        {analysis.section_scores.skills.recommended_keywords.map((kw, idx) => (
                          <span key={idx} className={styles.skillPillMissing}>
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeSectionTab === 'experience' && (
                <div className={styles.tabContentPanel}>
                  <p className={styles.sectionFeedbackText}>
                    {analysis.section_scores?.experience?.feedback ||
                      'Work experience demonstrates your track record and professional growth.'}
                  </p>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Action Verbs Strength: </span>
                      <strong style={{ color: 'var(--slate-800)' }}>
                        {analysis.section_scores?.experience?.action_verbs_score || 70}%
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Impact Quantification: </span>
                      <strong style={{ color: 'var(--slate-800)' }}>
                        {analysis.section_scores?.experience?.quantification_score || 65}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {activeSectionTab === 'projects' && (
                <div className={styles.tabContentPanel}>
                  <p className={styles.sectionFeedbackText}>
                    {analysis.section_scores?.projects?.feedback ||
                      'Projects highlight your technical competence, execution capability, and problem-solving.'}
                  </p>
                  <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Technical Depth: </span>
                      <strong style={{ color: 'var(--slate-800)' }}>
                        {analysis.section_scores?.projects?.tech_depth_score || 70}%
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Measurable Impact: </span>
                      <strong style={{ color: 'var(--slate-800)' }}>
                        {analysis.section_scores?.projects?.impact_score || 70}%
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {activeSectionTab === 'education' && (
                <div className={styles.tabContentPanel}>
                  <p className={styles.sectionFeedbackText}>
                    {analysis.section_scores?.education?.feedback ||
                      'Academic credentials, degrees, and institutions.'}
                  </p>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Status: </span>
                    <strong style={{ color: 'var(--slate-800)' }}>
                      {analysis.section_scores?.education?.status || 'Complete'}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Strengths & Weaknesses Cards */}
            <div className={styles.insightsRow}>
              {/* Strengths */}
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <h3 className={`${styles.insightTitle} ${styles.strengthsTitle}`}>
                    <CheckCircle2 size={20} />
                    Key Strengths ({analysis.strengths?.length || 0})
                  </h3>
                </div>
                <div className={styles.insightList}>
                  {(analysis.strengths || []).map((str, idx) => (
                    <div key={idx} className={styles.strengthItem}>
                      <CheckCircle2 size={16} />
                      <div>
                        <div className={styles.itemHeading}>{str.title}</div>
                        <p className={styles.itemBody}>{str.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div className={styles.insightCard}>
                <div className={styles.insightHeader}>
                  <h3 className={`${styles.insightTitle} ${styles.weaknessesTitle}`}>
                    <AlertTriangle size={20} />
                    Areas to Improve ({analysis.weaknesses?.length || 0})
                  </h3>
                </div>
                <div className={styles.insightList}>
                  {(analysis.weaknesses || []).map((wk, idx) => {
                    const isCrit = wk.severity === 'critical';
                    const isWarn = wk.severity === 'warning';
                    const itemClass = isCrit
                      ? styles.weaknessCritical
                      : isWarn
                      ? styles.weaknessWarning
                      : styles.weaknessSuggestion;
                    const tagClass = isCrit
                      ? styles.tagCritical
                      : isWarn
                      ? styles.tagWarning
                      : styles.tagSuggestion;

                    return (
                      <div key={idx} className={`${styles.weaknessItem} ${itemClass}`}>
                        <AlertTriangle
                          size={16}
                          color={isCrit ? '#dc2626' : isWarn ? '#d97706' : '#0284c7'}
                          style={{ flexShrink: 0, marginTop: 2 }}
                        />
                        <div>
                          <div className={styles.itemHeading}>
                            <span>{wk.title}</span>
                            <span className={`${styles.severityTag} ${tagClass}`}>
                              {wk.severity}
                            </span>
                          </div>
                          <p className={styles.itemBody}>{wk.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actionable Improvement Recommendations */}
            <div className={styles.recommendationsCard}>
              <div className={styles.recHeader}>
                <div className={styles.recTitleArea}>
                  <Award size={22} color="var(--primary-600)" />
                  <div>
                    <h3 className={styles.chartTitle} style={{ margin: 0 }}>
                      Actionable Recommendations ({analysis.actionable_recommendations?.length || 0})
                    </h3>
                    <p className={styles.chartSubtitle}>
                      Highest impact adjustments to maximize ATS pass potential and recruiter interest
                    </p>
                  </div>
                </div>

                <Link to={`/resumes/${resumeId}/enhance`}>
                  <Button variant="primary" size="sm" icon={Wand2}>
                    Auto-Improve Resume with AI
                  </Button>
                </Link>
              </div>

              <div className={styles.recGrid}>
                {(analysis.actionable_recommendations || []).map((rec) => {
                  const prioClass =
                    rec.priority === 'high'
                      ? styles.recPriorityHigh
                      : rec.priority === 'medium'
                      ? styles.recPriorityMedium
                      : styles.recPriorityLow;

                  return (
                    <div key={rec.id} className={styles.recItem}>
                      <div className={styles.recLeft}>
                        <div className={styles.recTopMeta}>
                          <span className={prioClass}>{rec.priority} priority</span>
                          <span className={styles.recSectionTag}>• Section: {rec.section}</span>
                        </div>
                        <h4 className={styles.recTitle}>{rec.title}</h4>
                        <p className={styles.recDesc}>{rec.description}</p>
                      </div>

                      <div className={styles.recBoostBadge}>
                        <TrendingUp size={14} />
                        +{rec.estimated_score_boost || 5} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Analysis History Modal */}
      {historyModalOpen && (
        <Modal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          title="Analysis Scan History"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', margin: 0 }}>
              Track score progression across revisions. Click any scan to load its complete report.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto' }}>
              {historyList.map((item, idx) => {
                const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent';
                const isCurrent = item.id === analysisData?.id;
                const scores = item.analysis || {};

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-lg)',
                      border: isCurrent ? '2px solid var(--primary-500)' : '1px solid var(--slate-200)',
                      background: isCurrent ? 'var(--primary-50)' : 'white',
                      gap: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={13} color="var(--slate-400)" />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
                          {dateStr}
                        </span>
                        {isCurrent && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '999px', background: 'var(--primary-200)', color: 'var(--primary-800)' }}>
                            Active View
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        Target: {item.target_role || 'General Profile'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                          {scores.overall_score || 0}/100
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                          {scores.ats_compatibility_score || 0}% ATS
                        </div>
                      </div>

                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAnalysisData(item);
                            setHistoryModalOpen(false);
                            notify.info('Loaded past analysis scan.');
                          }}
                        >
                          View Report
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
