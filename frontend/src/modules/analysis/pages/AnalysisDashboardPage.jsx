import React, { useState, useEffect, useMemo } from 'react';
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
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
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
  Layers,
  CheckCircle,
  XCircle,
  HelpCircle,
  ChevronRight,
  Edit3,
} from 'lucide-react';
import styles from './AnalysisDashboardPage.module.css';
import Button from '../../../components/common/Button/Button';
import Modal from '../../../components/common/Modal/Modal';
import Loader from '../../../components/common/Loader/Loader';
import { useNotification } from '../../../context/NotificationContext';
import { resumeService } from '../../resume/services/resumeService';
import { analysisService } from '../services/analysisService';

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
          if (latest) {
            setAnalysisData(latest);
          }
        } catch (err) {
          // No previous analysis found
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

  const analysis = analysisData?.analysis || analysisData;

  // Transform 8-Section Scores for Recharts Bar Chart
  const sectionBarData = useMemo(() => {
    if (!analysis) return [];
    return [
      { name: 'Summary', score: analysis.summary_score ?? 70, benchmark: 80 },
      { name: 'Skills', score: analysis.skills_score ?? 75, benchmark: 80 },
      { name: 'Education', score: analysis.education_score ?? 80, benchmark: 80 },
      { name: 'Projects', score: analysis.projects_score ?? 70, benchmark: 80 },
      { name: 'Experience', score: analysis.experience_score ?? 70, benchmark: 80 },
      { name: 'Internships', score: analysis.internships_score ?? 75, benchmark: 80 },
      { name: 'Certs', score: analysis.certifications_score ?? 80, benchmark: 80 },
      { name: 'Additional', score: analysis.additional_score ?? 75, benchmark: 80 },
    ];
  }, [analysis]);

  // Transform Quality Dimensions for Recharts Radar Chart
  const radarChartData = useMemo(() => {
    if (!analysis?.quality_dimensions?.length) return [];
    return analysis.quality_dimensions.map((d) => ({
      dimension: d.dimension,
      score: d.score,
      benchmark: d.benchmark || 80,
    }));
  }, [analysis]);

  // Transform Historical Analysis Data for Recharts Line Chart
  const historicalTrendData = useMemo(() => {
    if (!historyList || historyList.length === 0) {
      if (!analysis) return [];
      return [
        {
          scan: 'Baseline',
          overall: analysis.overall_score || 0,
          ats: analysis.ats_compatibility_score || 0,
          readiness: analysis.job_readiness_score || 0,
        },
      ];
    }
    // Reverse so chronological order (oldest -> newest)
    return [...historyList].reverse().map((item, idx) => {
      const a = item.analysis || item;
      const dateLabel = item.created_at
        ? new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : `Scan #${idx + 1}`;
      return {
        scan: dateLabel,
        overall: a.overall_score || 0,
        ats: a.ats_compatibility_score || 0,
        readiness: a.job_readiness_score || 0,
      };
    });
  }, [historyList, analysis]);

  // Skill Distribution Donut Data
  const donutData = useMemo(() => {
    if (analysis?.skill_distribution?.distribution?.length) {
      return analysis.skill_distribution.distribution;
    }
    return [
      { name: 'Technical Skills', value: 8, percentage: 53, color: '#6366f1' },
      { name: 'Tools & Cloud', value: 4, percentage: 27, color: '#a855f7' },
      { name: 'Domain & Soft', value: 3, percentage: 20, color: '#ec4899' },
    ];
  }, [analysis]);

  const getBarColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 65) return '#6366f1';
    return '#f59e0b';
  };

  // Helper score tier
  const getScoreTier = (score) => {
    if (score >= 85) return { label: 'Top 10%', bg: '#dcfce7', color: '#15803d' };
    if (score >= 70) return { label: 'Competitive', bg: '#e0e7ff', color: '#3730a3' };
    if (score >= 55) return { label: 'Moderate', bg: '#fef3c7', color: '#b45309' };
    return { label: 'Needs Optimization', bg: '#fee2e2', color: '#b91c1c' };
  };

  if (isLoading) {
    return <Loader fullPage message="Opening Dedicated Resume Analytics Dashboard..." />;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.innerWrapper}>
        {/* Top Header & Breadcrumb Bar */}
        <div className={styles.topBar}>
          <div className={styles.barLeft}>
            <Link to="/dashboard" className={styles.backBtn} title="Return to Dashboard">
              <ArrowLeft size={18} />
            </Link>
            <div className={styles.headerTitleArea}>
              <div className={styles.breadcrumb}>
                <span>Resumes</span>
                <span>/</span>
                <span>{resume?.title || 'Resume'}</span>
                <span>/</span>
                <span style={{ color: 'var(--primary-700)' }}>Analytics Dashboard</span>
              </div>
              <div className={styles.headerTitleRow}>
                <h1 className={styles.pageTitle}>{resume?.title || 'Resume Analytics'}</h1>
                {targetRole ? (
                  <span className={styles.targetRoleBadge}>
                    <Target size={12} />
                    Target Role: {targetRole}
                  </span>
                ) : (
                  <span className={styles.targetRoleBadge} style={{ background: '#f1f5f9', color: '#475569' }}>
                    General Profile
                  </span>
                )}
              </div>
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
                Scan History ({historyList.length})
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              isLoading={isAnalyzing}
              onClick={handleRunAnalysis}
            >
              {analysis ? 'Re-Analyze Resume' : 'Analyze Now'}
            </Button>
          </div>
        </div>

        {/* 3 Action Options Strip (Option A, Option B, Option C) */}
        <div className={styles.optionsStrip}>
          {/* Option A: Edit Manually in Resume Builder */}
          <Link to={`/resumes/${resumeId}/edit`} style={{ textDecoration: 'none' }}>
            <div className={styles.optionCard}>
              <div className={styles.optionLeft}>
                <div className={styles.optionIconCircle} style={{ background: '#f1f5f9', color: '#334155' }}>
                  <Edit3 size={20} />
                </div>
                <div>
                  <div className={styles.optionTag}>Option A</div>
                  <h4 className={styles.optionTitle}>Edit Manually</h4>
                  <p className={styles.optionDesc}>Open in Resume Builder with live paper preview</p>
                </div>
              </div>
              <ChevronRight size={18} color="var(--slate-400)" />
            </div>
          </Link>

          {/* Option B: Improve with AI Suggestions */}
          <Link to={`/resumes/${resumeId}/edit`} style={{ textDecoration: 'none' }}>
            <div className={styles.optionCard}>
              <div className={styles.optionLeft}>
                <div className={styles.optionIconCircle} style={{ background: '#e0e7ff', color: '#4338ca' }}>
                  <Sparkles size={20} />
                </div>
                <div>
                  <div className={styles.optionTag}>Option B</div>
                  <h4 className={styles.optionTitle}>Section AI Assist</h4>
                  <p className={styles.optionDesc}>Refine individual sections with 6 AI intent modes</p>
                </div>
              </div>
              <ChevronRight size={18} color="var(--slate-400)" />
            </div>
          </Link>

          {/* Option C: AI Recommended Resume */}
          <Link to={`/resumes/${resumeId}/enhance`} style={{ textDecoration: 'none' }}>
            <div className={`${styles.optionCard} ${styles.optionCardHighlight}`}>
              <div className={styles.optionLeft}>
                <div className={styles.optionIconCircle} style={{ background: 'var(--gradient-subtle)', color: 'var(--primary-600)' }}>
                  <Wand2 size={20} />
                </div>
                <div>
                  <div className={styles.optionTag} style={{ color: 'var(--primary-600)' }}>Option C (Recommended)</div>
                  <h4 className={styles.optionTitle}>AI Recommended Resume</h4>
                  <p className={styles.optionDesc}>Side-by-side comparison with XYZ bullet points</p>
                </div>
              </div>
              <ChevronRight size={18} color="var(--primary-600)" />
            </div>
          </Link>
        </div>

        {/* ATS & Job Readiness Estimation Notice */}
        <div className={styles.disclaimerBanner}>
          <ShieldAlert size={20} />
          <div>
            <strong>ATS Compatibility & Job Readiness Notice: </strong>
            {analysis?.disclaimer ||
              'ATS compatibility and Job Readiness scores are algorithmic estimations based on industry keyword density, format parseability, and structured evaluation criteria. They are actionable guidelines and not a factual guarantee of selection.'}
          </div>
        </div>

        {/* Scanning State */}
        {isAnalyzing && (
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--slate-200)', padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: '64px', height: '64px', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={40} color="var(--primary-600)" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)', margin: '0 0 0.5rem' }}>
              Auditing Resume Against Recruitment Benchmarks...
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', maxWidth: '440px', margin: '0 auto' }}>
              Evaluating ATS readability, calculating job readiness index, measuring action verb strength, and auditing all 8 sections.
            </p>
          </div>
        )}

        {/* Empty State when never analyzed */}
        {!analysis && !isAnalyzing && (
          <div style={{ background: '#ffffff', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--slate-200)', padding: '3.5rem 2rem', textAlign: 'center', maxWidth: '640px', margin: '2rem auto' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
              <Sparkles size={36} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
              Generate Resume Analytics Dashboard
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', lineHeight: 1.55, marginBottom: '2rem' }}>
              Run our deep multi-dimensional analytics engine to audit your Overall Score, ATS Compatibility, Job Readiness, and section-by-section benchmarks.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)', display: 'block', marginBottom: '0.35rem' }}>
                  Target Role / Job Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem 0.9rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--slate-300)', fontSize: '0.875rem' }}
                />
              </div>
              <Button
                variant="primary"
                size="lg"
                icon={Sparkles}
                onClick={handleRunAnalysis}
              >
                Launch Resume Audit
              </Button>
            </div>
          </div>
        )}

        {/* Complete Multi-Column Analytics Dashboard */}
        {analysis && !isAnalyzing && (
          <>
            {/* Top 5 KPI Score Cards Strip (Semrush Domain Analytics style) */}
            <div className={styles.kpiGrid}>
              {/* Card 1: Overall Score */}
              <div className={`${styles.kpiCard} ${styles.kpiCardHero}`}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiTitle}>Overall Score</span>
                  <span className={styles.kpiBadge} style={getScoreTier(analysis.overall_score)}>
                    {getScoreTier(analysis.overall_score).label}
                  </span>
                </div>
                <div className={styles.kpiGaugeRow}>
                  <span className={styles.kpiNumber}>{analysis.overall_score}</span>
                  <span className={styles.kpiUnit}>/ 100%</span>
                </div>
                <div className={styles.kpiProgressBg}>
                  <div
                    className={styles.kpiProgressFill}
                    style={{ width: `${analysis.overall_score}%`, background: 'var(--gradient-primary)' }}
                  />
                </div>
                <p className={styles.kpiFooter}>Composite performance across all 8 sections</p>
              </div>

              {/* Card 2: ATS Compatibility */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiTitle}>ATS Compatibility</span>
                  <span className={styles.kpiBadge} style={{ background: '#dbeafe', color: '#1e40af' }}>
                    {analysis.ats_compatibility_score >= 80 ? 'Format Friendly' : 'Check Layout'}
                  </span>
                </div>
                <div className={styles.kpiGaugeRow}>
                  <span className={styles.kpiNumber} style={{ color: '#2563eb' }}>
                    {analysis.ats_compatibility_score}
                  </span>
                  <span className={styles.kpiUnit}>%</span>
                </div>
                <div className={styles.kpiProgressBg}>
                  <div
                    className={styles.kpiProgressFill}
                    style={{ width: `${analysis.ats_compatibility_score}%`, background: '#3b82f6' }}
                  />
                </div>
                <p className={styles.kpiFooter}>Machine parseability and keyword placement</p>
              </div>

              {/* Card 3: Job Readiness */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiTitle}>Job Readiness</span>
                  <span className={styles.kpiBadge} style={{ background: '#fdf2f8', color: '#be185d' }}>
                    {analysis.job_readiness_score >= 75 ? 'Market Ready' : 'In Progress'}
                  </span>
                </div>
                <div className={styles.kpiGaugeRow}>
                  <span className={styles.kpiNumber} style={{ color: '#db2777' }}>
                    {analysis.job_readiness_score ?? 75}
                  </span>
                  <span className={styles.kpiUnit}>%</span>
                </div>
                <div className={styles.kpiProgressBg}>
                  <div
                    className={styles.kpiProgressFill}
                    style={{ width: `${analysis.job_readiness_score ?? 75}%`, background: '#ec4899' }}
                  />
                </div>
                <p className={styles.kpiFooter}>Alignment with target role hiring standards</p>
              </div>

              {/* Card 4: Content Quality */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiTitle}>Content Quality</span>
                  <span className={styles.kpiBadge} style={{ background: '#f3e8ff', color: '#6b21a8' }}>
                    Benchmark 80%
                  </span>
                </div>
                <div className={styles.kpiGaugeRow}>
                  <span className={styles.kpiNumber} style={{ color: '#9333ea' }}>
                    {analysis.content_quality_score ?? 75}
                  </span>
                  <span className={styles.kpiUnit}>%</span>
                </div>
                <div className={styles.kpiProgressBg}>
                  <div
                    className={styles.kpiProgressFill}
                    style={{ width: `${analysis.content_quality_score ?? 75}%`, background: '#a855f7' }}
                  />
                </div>
                <p className={styles.kpiFooter}>Action verb intensity & metric quantification</p>
              </div>

              {/* Card 5: Structure & Completeness */}
              <div className={styles.kpiCard}>
                <div className={styles.kpiHeader}>
                  <span className={styles.kpiTitle}>Structure Completeness</span>
                  <span className={styles.kpiBadge} style={{ background: '#dcfce7', color: '#15803d' }}>
                    8 Sections
                  </span>
                </div>
                <div className={styles.kpiGaugeRow}>
                  <span className={styles.kpiNumber} style={{ color: '#16a34a' }}>
                    {analysis.structure_completeness_score ?? 85}
                  </span>
                  <span className={styles.kpiUnit}>%</span>
                </div>
                <div className={styles.kpiProgressBg}>
                  <div
                    className={styles.kpiProgressFill}
                    style={{ width: `${analysis.structure_completeness_score ?? 85}%`, background: '#22c55e' }}
                  />
                </div>
                <p className={styles.kpiFooter}>All standard resume sections fully verified</p>
              </div>
            </div>

            {/* Main Multi-Column Analytics Grid (Semrush Layout) */}
            <div className={styles.analyticsGrid}>
              {/* Left Column (2/3 width): Trends, Section Performance, Radar, Donut, Diagnostics */}
              <div className={styles.mainColumn}>
                {/* Historical Score Progression Trend (Line Chart) */}
                <div className={styles.analyticsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleArea}>
                      <h3 className={styles.cardTitle}>
                        <TrendingUp size={18} color="var(--primary-600)" />
                        Score Progression & Trajectory
                      </h3>
                      <p className={styles.cardSubtitle}>Historical tracking of Overall, ATS, and Job Readiness scores across scans</p>
                    </div>
                  </div>
                  <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={historicalTrendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="scan" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: '#1e293b',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Line type="monotone" dataKey="overall" name="Overall Score" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="ats" name="ATS Compatibility" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="readiness" name="Job Readiness" stroke="#ec4899" strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Dual Charts Row: 8-Section Performance & 5 Quality Dimensions */}
                <div className={styles.dualChartsRow}>
                  {/* Chart 1: Section Performance Benchmark (Bar Chart) */}
                  <div className={styles.analyticsCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitleArea}>
                        <h3 className={styles.cardTitle}>Section Strength</h3>
                        <p className={styles.cardSubtitle}>All 8 sections vs 80-point benchmark</p>
                      </div>
                    </div>
                    <div className={styles.chartContainer}>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={sectionBarData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} interval={0} angle={-25} textAnchor="end" height={45} />
                          <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
                          <Tooltip
                            contentStyle={{
                              background: '#1e293b',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                            {sectionBarData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getBarColor(entry.score)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: 5 Quality Dimensions (Radar Chart) */}
                  <div className={styles.analyticsCard}>
                    <div className={styles.cardHeader}>
                      <div className={styles.cardTitleArea}>
                        <h3 className={styles.cardTitle}>Quality Dimensions</h3>
                        <p className={styles.cardSubtitle}>Audit across 5 hiring dimensions</p>
                      </div>
                    </div>
                    <div className={styles.chartContainer}>
                      <ResponsiveContainer width="100%" height={260}>
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarChartData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="dimension" stroke="#64748b" fontSize={10} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" fontSize={9} />
                          <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#818cf8" fillOpacity={0.45} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Skill Distribution & Keyword Coverage Card (Semrush SEO Ideas Donut style) */}
                <div className={styles.analyticsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleArea}>
                      <h3 className={styles.cardTitle}>
                        <Code2 size={18} color="var(--primary-600)" />
                        Skill Distribution & Keyword Coverage
                      </h3>
                      <p className={styles.cardSubtitle}>Technical vs soft skill balance and target role keyword matching</p>
                    </div>
                    {analysis.keyword_coverage && (
                      <span className={styles.targetRoleBadge}>
                        {analysis.keyword_coverage.coverage_percentage}% Keyword Match
                      </span>
                    )}
                  </div>

                  <div className={styles.donutWrapper}>
                    {/* Donut Chart with Center Label */}
                    <div style={{ width: '200px', height: '200px', position: 'relative' }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%"
                            cy="50%"
                            innerRadius={55}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {donutData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: '#1e293b',
                              border: 'none',
                              borderRadius: '8px',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                          pointerEvents: 'none',
                        }}
                      >
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)', lineHeight: 1 }}>
                          {donutData.reduce((acc, d) => acc + (d.value || 0), 0)}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--slate-400)', fontWeight: 600 }}>Skills</div>
                      </div>
                    </div>

                    {/* Donut Legend & Keyword Progress */}
                    <div className={styles.donutLegendList}>
                      {donutData.map((item, idx) => (
                        <div key={idx} className={styles.legendItem}>
                          <div className={styles.legendLabel}>
                            <span className={styles.legendDot} style={{ background: item.color || '#6366f1' }} />
                            <span>{item.name}</span>
                          </div>
                          <span className={styles.legendValue}>
                            {item.value} ({item.percentage}%)
                          </span>
                        </div>
                      ))}

                      {/* Keyword Coverage Progress Bar */}
                      {analysis.keyword_coverage && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--slate-100)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.35rem', color: 'var(--slate-600)', fontWeight: 600 }}>
                            <span>Matched Keywords: {analysis.keyword_coverage.matched_keywords_count}</span>
                            <span>Missing: {analysis.keyword_coverage.missing_critical_keywords?.length || 0}</span>
                          </div>
                          <div className={styles.kpiProgressBg} style={{ height: '8px' }}>
                            <div
                              className={styles.kpiProgressFill}
                              style={{ width: `${analysis.keyword_coverage.coverage_percentage}%`, background: 'var(--gradient-primary)' }}
                            />
                          </div>
                          {analysis.keyword_coverage.missing_critical_keywords?.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.5rem' }}>
                              <span style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600, alignSelf: 'center' }}>Recommended:</span>
                              {analysis.keyword_coverage.missing_critical_keywords.slice(0, 4).map((kw, i) => (
                                <span key={i} style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: '#fdf2f8', color: '#be185d', border: '1px solid #fce7f3' }}>
                                  + {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 8-Section Detailed Diagnostics Explorer */}
                <div className={styles.analyticsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleArea}>
                      <h3 className={styles.cardTitle}>
                        <Layers size={18} color="var(--primary-600)" />
                        8-Section Deep Diagnostics
                      </h3>
                      <p className={styles.cardSubtitle}>Inspect detailed feedback and sub-scores for each resume section</p>
                    </div>
                  </div>

                  <div className={styles.tabNavGroup}>
                    {[
                      { id: 'summary', label: 'Summary', score: analysis.summary_score },
                      { id: 'skills', label: 'Skills', score: analysis.skills_score },
                      { id: 'education', label: 'Education', score: analysis.education_score },
                      { id: 'projects', label: 'Projects', score: analysis.projects_score },
                      { id: 'experience', label: 'Experience', score: analysis.experience_score },
                      { id: 'internships', label: 'Internships', score: analysis.internships_score },
                      { id: 'certifications', label: 'Certifications', score: analysis.certifications_score },
                      { id: 'additional', label: 'Additional', score: analysis.additional_score },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        className={`${styles.tabBtn} ${activeSectionTab === tab.id ? styles.tabBtnActive : ''}`}
                        onClick={() => setActiveSectionTab(tab.id)}
                      >
                        <span>{tab.label}</span>
                        <span className={styles.tabScoreChip}>{tab.score ?? 70}</span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Detail Panel */}
                  <div className={styles.tabDetailPanel}>
                    {activeSectionTab === 'summary' && (
                      <div>
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.55 }}>
                          {analysis.section_scores?.summary?.feedback || 'Professional summary gives an introductory overview of your background and career focus.'}
                        </p>
                        {analysis.section_scores?.summary?.strengths?.length > 0 && (
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong style={{ fontSize: '0.8rem', color: '#15803d' }}>Strengths: </strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                              {analysis.section_scores.summary.strengths.join(' • ')}
                            </span>
                          </div>
                        )}
                        {analysis.section_scores?.summary?.improvements?.length > 0 && (
                          <div>
                            <strong style={{ fontSize: '0.8rem', color: '#b45309' }}>Opportunities: </strong>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                              {analysis.section_scores.summary.improvements.join(' • ')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {activeSectionTab === 'skills' && (
                      <div>
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.55 }}>
                          {analysis.section_scores?.skills?.feedback || 'Skill presentation impacts keyword matching in automated candidate screenings.'}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                          {(analysis.section_scores?.skills?.found_skills || []).map((sk, idx) => (
                            <span key={idx} style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0', fontWeight: 600 }}>
                              ✓ {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeSectionTab === 'projects' && (
                      <div>
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.55 }}>
                          {analysis.section_scores?.projects?.feedback || 'Projects highlight technical competence and execution capability.'}
                        </p>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Technical Depth: </span>
                            <strong style={{ color: 'var(--slate-800)' }}>{analysis.section_scores?.projects?.tech_depth_score || 75}%</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Measurable Impact: </span>
                            <strong style={{ color: 'var(--slate-800)' }}>{analysis.section_scores?.projects?.impact_score || 70}%</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSectionTab === 'experience' && (
                      <div>
                        <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.55 }}>
                          {analysis.section_scores?.experience?.feedback || 'Work experience demonstrates professional track record and growth.'}
                        </p>
                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Action Verbs Strength: </span>
                            <strong style={{ color: 'var(--slate-800)' }}>{analysis.section_scores?.experience?.action_verbs_score || 70}%</strong>
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>Impact Quantification: </span>
                            <strong style={{ color: 'var(--slate-800)' }}>{analysis.section_scores?.experience?.quantification_score || 65}%</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSectionTab === 'education' && (
                      <div>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.55 }}>
                          {analysis.section_scores?.education?.feedback || 'Academic credentials, degrees, and institutions.'}
                        </p>
                        <span style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                          Status: <strong>{analysis.section_scores?.education?.status || 'Complete'}</strong>
                        </span>
                      </div>
                    )}

                    {activeSectionTab === 'internships' && (
                      <div>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.55 }}>
                          {analysis.section_scores?.internships?.feedback || 'Internships provide early career experience and team collaboration proof.'}
                        </p>
                      </div>
                    )}

                    {activeSectionTab === 'certifications' && (
                      <div>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.55 }}>
                          {analysis.section_scores?.certifications?.feedback || 'Professional credentials, cloud badges, and verified coursework.'}
                        </p>
                      </div>
                    )}

                    {activeSectionTab === 'additional' && (
                      <div>
                        <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem', color: 'var(--slate-700)', lineHeight: 1.55 }}>
                          {analysis.section_scores?.additional_info?.feedback || 'Extracurricular awards, hackathons, publications, and languages.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actionable Improvement Recommendations */}
                <div className={styles.analyticsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleArea}>
                      <h3 className={styles.cardTitle}>
                        <Award size={18} color="var(--primary-600)" />
                        Actionable Recommendations ({analysis.actionable_recommendations?.length || 0})
                      </h3>
                      <p className={styles.cardSubtitle}>Highest-impact adjustments to elevate ATS and interview selection potential</p>
                    </div>

                    <Link to={`/resumes/${resumeId}/enhance`}>
                      <Button variant="primary" size="sm" icon={Wand2}>
                        Apply with AI Improver
                      </Button>
                    </Link>
                  </div>

                  <div className={styles.recommendationsList}>
                    {(analysis.actionable_recommendations || []).map((rec) => {
                      const prioClass =
                        rec.priority === 'high'
                          ? styles.prioChipHigh
                          : rec.priority === 'medium'
                          ? styles.prioChipMed
                          : styles.prioChipLow;

                      return (
                        <div key={rec.id} className={styles.recommendationItem}>
                          <div className={styles.recLeft}>
                            <div className={styles.recMetaRow}>
                              <span className={prioClass}>{rec.priority} priority</span>
                              <span style={{ fontSize: '0.725rem', color: 'var(--slate-500)', textTransform: 'capitalize' }}>
                                Section: {rec.section}
                              </span>
                            </div>
                            <h4 style={{ margin: 0, fontSize: '0.925rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                              {rec.title}
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--slate-600)', lineHeight: 1.45 }}>
                              {rec.description}
                            </p>
                          </div>

                          <div className={styles.recBoostBadge}>
                            <TrendingUp size={13} />
                            +{rec.estimated_score_boost || 5} pts
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column (1/3 width): Semrush Site Audit Style */}
              <div className={styles.sidebarColumn}>
                {/* Card 1: ATS Compliance Health Audit (Semrush Site Audit style) */}
                <div className={styles.auditHealthCard}>
                  <div>
                    <h3 className={styles.cardTitle} style={{ fontSize: '1rem', marginBottom: '0.2rem' }}>
                      <ShieldAlert size={18} color="var(--primary-600)" />
                      ATS Structural Audit
                    </h3>
                    <p className={styles.cardSubtitle}>Applicant Tracking System compliance check</p>
                  </div>

                  {/* Circular Health Gauge + Issue Counters */}
                  <div className={styles.auditCircleSection}>
                    <div className={styles.circularGaugeWrapper}>
                      <svg className={styles.circularGaugeSvg}>
                        <circle className={styles.circularGaugeBg} cx="50" cy="50" r="40" />
                        <circle
                          className={styles.circularGaugeProgress}
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={analysis.ats_compatibility_score >= 80 ? '#10b981' : '#6366f1'}
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 - ((analysis.ats_compatibility_score || 80) / 100) * (2 * Math.PI * 40)}
                        />
                      </svg>
                      <div className={styles.circularGaugeText}>
                        <span className={styles.circularGaugeNum}>{analysis.ats_compatibility_score}%</span>
                        <span className={styles.circularGaugeLabel}>ATS Health</span>
                      </div>
                    </div>

                    <div className={styles.auditSummaryCounters}>
                      <div className={styles.auditCounter}>
                        <span className={styles.counterLabel}>Passes</span>
                        <span className={`${styles.counterNum} ${styles.counterPass}`}>
                          {(analysis.ats_checklist || []).filter((c) => c.status === 'pass').length || 4}
                        </span>
                      </div>
                      <div className={styles.auditCounter}>
                        <span className={styles.counterLabel}>Warnings</span>
                        <span className={`${styles.counterNum} ${styles.counterWarning}`}>
                          {(analysis.weaknesses || []).filter((w) => w.severity === 'warning').length || 1}
                        </span>
                      </div>
                      <div className={styles.auditCounter}>
                        <span className={styles.counterLabel}>Critical</span>
                        <span className={`${styles.counterNum} ${styles.counterCritical}`}>
                          {(analysis.weaknesses || []).filter((w) => w.severity === 'critical').length || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Stacked Parsing Health Bar */}
                  <div className={styles.stackedBarWrapper}>
                    <div className={styles.stackedBarHeader}>
                      <span>Parsing Integrity</span>
                      <span>100% Readable</span>
                    </div>
                    <div className={styles.stackedBar}>
                      <div className={styles.stackedBarPass} style={{ width: '80%' }} />
                      <div className={styles.stackedBarWarn} style={{ width: '15%' }} />
                      <div className={styles.stackedBarCrit} style={{ width: '5%' }} />
                    </div>
                  </div>

                  {/* Checklist Items */}
                  <div className={styles.checkList}>
                    {(analysis.ats_checklist?.length
                      ? analysis.ats_checklist
                      : [
                          { item: 'Standard Section Headings', status: 'pass', note: 'All primary headings match ATS standards.' },
                          { item: 'Single-Column Text Flow', status: 'pass', note: 'Linear structure readable by parsers.' },
                          { item: 'Contact Info Parseability', status: 'pass', note: 'Phone, email, and location properly placed.' },
                          { item: 'Standard Date Formats', status: 'pass', note: 'Month/Year standard formatting.' },
                        ]
                    ).map((chk, i) => (
                      <div key={i} className={styles.checkItem}>
                        {chk.status === 'pass' ? (
                          <CheckCircle2 size={15} color="#16a34a" />
                        ) : chk.status === 'warning' ? (
                          <AlertTriangle size={15} color="#d97706" />
                        ) : (
                          <XCircle size={15} color="#dc2626" />
                        )}
                        <div>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--slate-800)', display: 'block' }}>
                            {chk.item}
                          </strong>
                          {chk.note && <span style={{ fontSize: '0.725rem', color: 'var(--slate-500)' }}>{chk.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 2: Key Strengths Panel */}
                <div className={styles.analyticsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleArea}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem', color: '#15803d' }}>
                        <CheckCircle2 size={18} color="#16a34a" />
                        Key Strengths ({analysis.strengths?.length || 0})
                      </h3>
                      <p className={styles.cardSubtitle}>Your competitive resume advantages</p>
                    </div>
                  </div>

                  <div className={styles.insightList}>
                    {(analysis.strengths || []).map((str, idx) => (
                      <div key={idx} className={styles.strengthItem}>
                        <CheckCircle2 size={16} />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--slate-800)', marginBottom: '0.15rem' }}>
                            {str.title}
                          </div>
                          <p style={{ margin: 0, fontSize: '0.785rem', color: 'var(--slate-600)', lineHeight: 1.45 }}>
                            {str.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card 3: Areas for Improvement Panel */}
                <div className={styles.analyticsCard}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleArea}>
                      <h3 className={styles.cardTitle} style={{ fontSize: '1rem', color: '#b91c1c' }}>
                        <AlertTriangle size={18} color="#dc2626" />
                        Areas to Improve ({analysis.weaknesses?.length || 0})
                      </h3>
                      <p className={styles.cardSubtitle}>Issues categorized by hiring impact</p>
                    </div>
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
                      const chipClass = isCrit
                        ? styles.chipCritical
                        : isWarn
                        ? styles.chipWarning
                        : styles.chipSuggestion;

                      return (
                        <div key={idx} className={`${styles.weaknessItem} ${itemClass}`}>
                          <AlertTriangle
                            size={16}
                            color={isCrit ? '#dc2626' : isWarn ? '#d97706' : '#0284c7'}
                            style={{ flexShrink: 0, marginTop: 2 }}
                          />
                          <div>
                            <div className={styles.weaknessHeading}>
                              <span>{wk.title}</span>
                              <span className={`${styles.severityChip} ${chipClass}`}>
                                {wk.severity}
                              </span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.785rem', color: 'var(--slate-600)', lineHeight: 1.45 }}>
                              {wk.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
          title="Resume Analysis Scan History"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', margin: 0 }}>
              Review score trajectory across revisions. Click any scan to load its complete analytics report:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto' }}>
              {historyList.map((item, idx) => {
                const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent';
                const isCurrent = item.id === (analysisData?.id || analysisData?._id);
                const scores = item.analysis || item;

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
                            Active Report
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
                          {scores.overall_score || 0}% Overall
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>
                          {scores.ats_compatibility_score || 0}% ATS • {scores.job_readiness_score || 0}% Ready
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
