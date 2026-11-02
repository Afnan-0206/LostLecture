import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { InteractiveHoverButton } from '../ui/interactive-hover-button';
import {
  Sparkles,
  BookOpen,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Award,
} from 'lucide-react';

const AiStudyAssistant = ({ resourceId, title }) => {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'quiz'
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);

  const [aiSummary, setAiSummary] = useState(null);
  const [quiz, setQuiz] = useState(null);

  // Quiz state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  const fetchSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await api.get(`/resources/${resourceId}/ai-summary`);
      if (res.success && res.data) {
        setAiSummary(res.data);
      }
    } catch (err) {
      toast.error('Failed to generate AI study insights');
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchQuiz = async () => {
    setLoadingQuiz(true);
    try {
      const res = await api.get(`/resources/${resourceId}/ai-quiz`);
      if (res.success && res.data) {
        setQuiz(res.data);
        setSelectedAnswers({});
        setSubmittedQuiz(false);
      }
    } catch (err) {
      toast.error('Failed to generate AI practice quiz');
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleOptionSelect = (qIdx, optIdx) => {
    if (submittedQuiz) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    return quiz.reduce((score, q, idx) => {
      return score + (selectedAnswers[idx] === q.answerIndex ? 1 : 0);
    }, 0);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-900/90 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md border border-indigo-500/20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-indigo-500/20 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">AI Study Assistant</h3>
            <p className="text-xs text-indigo-200">
              Exam summaries, formula sheets, and interactive practice quizzes
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-950/60 p-1 rounded-xl border border-indigo-500/30 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'summary'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-indigo-200 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Summary & Notes</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('quiz');
              if (!quiz) fetchQuiz();
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'quiz'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-indigo-200 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Practice Quiz</span>
          </button>
        </div>
      </div>

      {activeTab === 'summary' ? (
        <div className="space-y-6">
          {!aiSummary ? (
            <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-indigo-500/20 p-6">
              <Sparkles className="w-10 h-10 text-indigo-400 mx-auto mb-3 animate-pulse" />
              <h4 className="text-base font-bold text-white mb-1">
                Instant Academic Comprehension
              </h4>
              <p className="text-xs text-indigo-200 max-w-md mx-auto mb-5 leading-relaxed">
                Generate a structured executive summary, core key takeaways, and specific
                university exam preparation tips for this lecture.
              </p>
              <InteractiveHoverButton
                onClick={fetchSummary}
                disabled={loadingSummary}
                loading={loadingSummary}
                variant="primary"
                size="md"
                text="Generate AI Study Summary"
                icon={<Sparkles className="w-4 h-4" />}
              />
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in">
              {/* Executive Summary */}
              <div className="bg-slate-950/50 p-5 rounded-2xl border border-indigo-500/20">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Executive Academic Summary</span>
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed">{aiSummary.summary}</p>
              </div>

              {/* Core Key Concepts */}
              {aiSummary.keyConcepts && aiSummary.keyConcepts.length > 0 && (
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-indigo-500/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 mb-3 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Core Takeaways & Mechanisms</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {aiSummary.keyConcepts.map((concept, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        <span>{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Exam Preparation Tips */}
              {aiSummary.examTips && aiSummary.examTips.length > 0 && (
                <div className="bg-slate-950/50 p-5 rounded-2xl border border-indigo-500/20">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300 mb-3 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    <span>University Exam Tips</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {aiSummary.examTips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Quiz Tab */
        <div className="space-y-6">
          {loadingQuiz ? (
            <div className="text-center py-12 text-xs text-indigo-200 flex flex-col items-center gap-3">
              <span className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
              <span>Formulating Conceptual Practice Questions...</span>
            </div>
          ) : quiz && quiz.length > 0 ? (
            <div className="space-y-6">
              {quiz.map((q, qIdx) => {
                const userChoice = selectedAnswers[qIdx];
                const isCorrect = userChoice === q.answerIndex;

                return (
                  <div
                    key={qIdx}
                    className="bg-slate-950/50 p-5 rounded-2xl border border-indigo-500/20 space-y-3"
                  >
                    <p className="text-xs font-bold text-white">
                      <span className="text-indigo-400 mr-1.5">Q{qIdx + 1}.</span>
                      {q.question}
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt, optIdx) => {
                        let btnStyle =
                          'bg-slate-900 border-slate-700 text-slate-300 hover:border-indigo-400';

                        if (submittedQuiz) {
                          if (optIdx === q.answerIndex) {
                            btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-semibold';
                          } else if (userChoice === optIdx) {
                            btnStyle = 'bg-red-950/80 border-red-500 text-red-200';
                          }
                        } else if (userChoice === optIdx) {
                          btnStyle = 'bg-indigo-600/40 border-indigo-400 text-white font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleOptionSelect(qIdx, optIdx)}
                            className={`w-full text-left p-3 text-xs rounded-xl border transition flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {submittedQuiz && optIdx === q.answerIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            )}
                            {submittedQuiz && userChoice === optIdx && optIdx !== q.answerIndex && (
                              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {submittedQuiz && q.explanation && (
                      <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                        <span className="font-bold text-indigo-300">Explanation: </span>
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}

              <div className="flex items-center justify-between pt-2">
                {submittedQuiz ? (
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <span className="text-sm font-bold text-white">
                      Score: {calculateScore()} / {quiz.length} Correct
                    </span>
                  </div>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  {submittedQuiz ? (
                    <InteractiveHoverButton
                      onClick={() => {
                        setSelectedAnswers({});
                        setSubmittedQuiz(false);
                      }}
                      variant="dark"
                      size="sm"
                      text="Retake Quiz"
                      icon={<RefreshCw className="w-3.5 h-3.5" />}
                    />
                  ) : (
                    <InteractiveHoverButton
                      onClick={() => {
                        if (Object.keys(selectedAnswers).length < quiz.length) {
                          toast.error('Please answer all questions before submitting.');
                          return;
                        }
                        setSubmittedQuiz(true);
                      }}
                      variant="primary"
                      size="sm"
                      text="Check Answers & Grading"
                    />
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <InteractiveHoverButton
                onClick={fetchQuiz}
                variant="primary"
                size="md"
                text="Start Practice Quiz"
                icon={<HelpCircle className="w-4 h-4" />}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AiStudyAssistant;

