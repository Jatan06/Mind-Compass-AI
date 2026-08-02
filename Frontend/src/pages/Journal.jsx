import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FiMic,
    FiSquare,
    FiBookOpen,
    FiTag,
    FiPlusCircle,
    FiCheck,
    FiInfo,
    FiCalendar,
    FiChevronDown,
    FiChevronUp,
    FiAlertCircle
} from 'react-icons/fi';
import { PageTransition } from '../components/PageTransition';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';

export const Journal = () => {
    const { journals, addJournal, updateJournal, deleteJournal } = useApp();

    const [text, setText] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);
    const [recordIntervalId, setRecordIntervalId] = useState(null);

    const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
    const [latestAnalysis, setLatestAnalysis] = useState(null);
    const [expandedJournalId, setExpandedJournalId] = useState(null);

    const [isVoiceEntry, setIsVoiceEntry] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const prompts = [
        "What made you smile today?",
        "What challenged you today?",
        "What are you grateful for?",
        "Describe a quiet moment you enjoyed today."
    ];

    // Simulated dictation scripts
    const mockTranscripts = [
        "Today was a mix of things. I felt pretty stressed during my morning work meeting because of the code refactoring timeline. But afterwards, I went for a brief 10-minute walk through the park. Seeing the calm trees and breathing slowly really helped me cool down.",
        "I was thinking about how much progress I have made recently. I used to get so anxious whenever my code threw warnings, but today I just breathed through it and resolved it step by step. Feeling content and proud of my growth.",
        "Really tired today. Didn't sleep well last night, worrying about project requirements. Hopefully, some quiet breathing exercises will help me relax tonight."
    ];

    const toggleRecording = () => {
        if (!isRecording) {
            setIsRecording(true);
            setRecordTime(0);
            const interval = setInterval(() => {
                setRecordTime(prev => prev + 1);
            }, 1000);
            setRecordIntervalId(interval);
        } else {
            clearInterval(recordIntervalId);
            setIsRecording(false);
            setIsVoiceEntry(true);
            // Select a random transcript and append it to our text
            const randomIdx = Math.floor(Math.random() * mockTranscripts.length);
            setText(prev => (prev ? prev + ' ' : '') + mockTranscripts[randomIdx]);
        }
    };

    const handlePromptClick = (prompt) => {
        setText(prev => (prev ? prev + '\n' + prompt + ' ' : prompt + ' '));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        setIsLoadingAnalysis(true);
        setLatestAnalysis(null);
        setError('');

        try {
            const analysis = await addJournal(text, isVoiceEntry);
            setLatestAnalysis(analysis);
            setText('');
            setIsVoiceEntry(false);
        } catch (err) {
            console.error('Failed to save journal:', err);
            const errMsg = err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to submit journal. Please try again.';
            setError(errMsg);
        } finally {
            setIsLoadingAnalysis(false);
        }
    };

    const handleStartEdit = (journal) => {
        setEditingId(journal.id);
        setEditText(journal.text);
    };

    const handleSaveEdit = async (journalId) => {
        if (!editText.trim()) return;
        setIsSavingEdit(true);
        try {
            await updateJournal(journalId, editText);
            setEditingId(null);
        } catch (err) {
            console.error('Failed to update journal entry:', err);
        } finally {
            setIsSavingEdit(false);
        }
    };

    const handleDeleteClick = async (journalId) => {
        if (window.confirm("Are you sure you want to delete this journal entry?")) {
            try {
                await deleteJournal(journalId);
            } catch (err) {
                console.error('Failed to delete journal entry:', err);
            }
        }
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const getSentimentColor = (s) => {
        switch (s) {
            case 'Positive': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'Negative': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'Crisis': return 'text-rose-600 bg-rose-600/10 border-rose-600/20 font-bold';
            default: return 'text-secondary bg-secondary/10 border-secondary/20';
        }
    };

    const getCrisisBadge = (status) => {
        if (status === 'Urgent Help Needed') return 'bg-rose-500 text-white font-bold animate-pulse';
        if (status === 'Needs Attention') return 'bg-amber-400 text-bg-dark font-semibold';
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    };

    return (
        <PageTransition>
            <div className="flex-grow flex flex-col gap-6 text-left max-w-5xl mx-auto w-full">
                {/* Header */}
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-dark dark:text-text-light">
                        Journal Space
                    </h1>
                    <p className="text-sm md:text-base text-text-dark/65 dark:text-text-light/70 mt-1">
                        Pour your thoughts. Voice transcriptions and emotional analysis are entirely secure.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Writing Area */}
                    <div className="lg:col-span-7 space-y-6">
                        <form onSubmit={handleSubmit} className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
                            <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                <FiBookOpen className="w-5 h-5 text-secondary" />
                                New Reflection
                            </h3>

                            {/* Prompts Container */}
                            <div className="space-y-2">
                                <span className="text-[10px] uppercase font-bold tracking-wider text-text-dark/50 dark:text-text-light/50">
                                    Need a starting prompt?
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    {prompts.map((p, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handlePromptClick(p)}
                                            className="text-xs border border-secondary/20 dark:border-secondary/10 hover:border-secondary/40 rounded-full px-3 py-1.5 transition-all text-text-dark/85 dark:text-text-light/85 hover:bg-secondary/5 cursor-pointer outline-none"
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Writer field */}
                            <div className="relative">
                                <textarea
                                    rows="8"
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    placeholder="Start writing... or click the mic button below to record your voice journal."
                                    className="w-full rounded-2xl px-4 py-4 text-sm transition-all duration-200 
                    border outline-none bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light
                    border-secondary/20 dark:border-secondary/10 focus:border-secondary focus:ring-1 focus:ring-secondary/35 resize-none leading-relaxed"
                                    required
                                />

                                {/* Voice Dictation HUD block */}
                                <AnimatePresence>
                                    {isRecording && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="absolute inset-0 bg-bg-light/95 dark:bg-bg-dark/95 rounded-2xl flex flex-col items-center justify-center gap-4 p-6"
                                        >
                                            <div className="flex gap-1.5 items-center">
                                                <span className="w-2.5 h-6 bg-red-500 rounded-full animate-bounce" />
                                                <span className="w-2.5 h-10 bg-red-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                                                <span className="w-2.5 h-8 bg-red-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                                                <span className="w-2.5 h-5 bg-red-500 rounded-full animate-bounce [animation-delay:0.45s]" />
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xl font-bold font-mono tracking-tight">{formatTime(recordTime)}</div>
                                                <p className="text-xs text-text-dark/60 dark:text-text-light/60 mt-1">
                                                    Speaking your mind... Click stop to transcribe.
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-xs sm:text-sm border border-red-500/15 flex items-center gap-2 mb-4">
                                    <FiAlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex justify-between items-center pt-2">
                                <button
                                    type="button"
                                    onClick={toggleRecording}
                                    className={`p-3 rounded-full flex items-center justify-center transition-all cursor-pointer outline-none
                    ${isRecording
                                            ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse'
                                            : 'bg-secondary/15 hover:bg-secondary/25 dark:bg-secondary/10 text-primary dark:text-accent'
                                        }
                   `}
                                    title={isRecording ? 'Stop Recording' : 'Start Voice Journaling'}
                                >
                                    {isRecording ? <FiSquare className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
                                </button>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isLoadingAnalysis || !text.trim()}
                                >
                                    {isLoadingAnalysis ? 'Analyzing Entry...' : 'Save & Analyze'}
                                </Button>
                            </div>
                        </form>

                        {/* Expandable Journal History Logs */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-text-dark dark:text-text-light">
                                Reflection History
                            </h3>

                            <div className="space-y-3">
                                {journals.map((journal) => {
                                    const isExpanded = expandedJournalId === journal.id;
                                    return (
                                        <div
                                            key={journal.id}
                                            className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-3xl p-5 shadow-sm transition-all text-left"
                                        >
                                            <div
                                                onClick={() => setExpandedJournalId(isExpanded ? null : journal.id)}
                                                className="flex justify-between items-start gap-4 cursor-pointer select-none"
                                            >
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2 text-xs text-text-dark/50 dark:text-text-light/50">
                                                        <FiCalendar />
                                                        <span>{new Date(journal.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                                                        {journal.isVoice && <span className="bg-secondary/10 px-2 py-0.5 rounded-full text-[9px] font-semibold text-primary dark:text-accent">Voice</span>}
                                                    </div>
                                                    <p className="text-sm font-semibold truncate max-w-md mt-1">
                                                        {journal.text}
                                                    </p>
                                                </div>
                                                <button className="p-1 rounded hover:bg-secondary/15 dark:hover:bg-secondary/5">
                                                    {isExpanded ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden mt-4 pt-4 border-t border-secondary/10 dark:border-secondary/5 space-y-4"
                                                    >
                                                        {editingId === journal.id ? (
                                                            <div className="space-y-3 text-left">
                                                                <textarea
                                                                    rows="4"
                                                                    value={editText}
                                                                    onChange={(e) => setEditText(e.target.value)}
                                                                    className="w-full rounded-2xl px-4 py-3 text-sm transition-all duration-200 
                                                                    border outline-none bg-bg-light dark:bg-bg-dark text-text-dark dark:text-text-light
                                                                    border-secondary/20 focus:border-secondary focus:ring-1 focus:ring-secondary/35 resize-none leading-relaxed"
                                                                />
                                                                <div className="flex gap-2 justify-end">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingId(null)}
                                                                        className="text-xs font-semibold px-4 py-2 rounded-full border border-secondary/20 hover:bg-secondary/5 cursor-pointer"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSaveEdit(journal.id)}
                                                                        disabled={isSavingEdit || !editText.trim()}
                                                                        className="text-xs font-semibold bg-primary hover:bg-primary-hover dark:bg-accent dark:hover:bg-accent-hover text-bg-light dark:text-bg-dark px-4 py-2 rounded-full cursor-pointer"
                                                                    >
                                                                        {isSavingEdit ? 'Saving...' : 'Save Changes'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="text-sm leading-relaxed text-text-dark/85 dark:text-text-light/90 font-normal whitespace-pre-wrap">
                                                                    "{journal.text}"
                                                                </p>

                                                                {/* AI Metrics summary bar */}
                                                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-2">
                                                                    <div className="p-3 bg-secondary/5 dark:bg-secondary/5 rounded-2xl border border-secondary/10">
                                                                        <span className="text-[10px] text-text-dark/50 dark:text-text-light/50 font-bold block mb-1">SENTIMENT</span>
                                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border inline-block ${getSentimentColor(journal.analysis?.sentiment)}`}>
                                                                            {journal.analysis?.sentiment || 'Neutral'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="p-3 bg-secondary/5 dark:bg-secondary/5 rounded-2xl border border-secondary/10">
                                                                        <span className="text-[10px] text-text-dark/50 dark:text-text-light/50 font-bold block mb-1">EMOTION</span>
                                                                        <span className="text-xs font-bold text-text-dark dark:text-text-light">{journal.analysis?.emotion || 'Neutral'}</span>
                                                                    </div>
                                                                    <div className="p-3 bg-secondary/5 dark:bg-secondary/5 rounded-2xl border border-secondary/10">
                                                                        <span className="text-[10px] text-text-dark/50 dark:text-text-light/50 font-bold block mb-1">COGNITIVE MATCH</span>
                                                                        <span className="text-xs font-mono font-bold">{Math.round((journal.analysis?.confidence || 0) * 100)}%</span>
                                                                    </div>
                                                                    <div className="p-3 bg-secondary/5 dark:bg-secondary/5 rounded-2xl border border-secondary/10">
                                                                        <span className="text-[10px] text-text-dark/50 dark:text-text-light/50 font-bold block mb-1">CRISIS BADGE</span>
                                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full inline-block ${getCrisisBadge(journal.analysis?.crisisStatus)}`}>
                                                                            {journal.analysis?.crisisStatus || 'Safe'}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                {/* Themes */}
                                                                <div className="flex flex-wrap items-center gap-2 pt-1 text-left">
                                                                    <FiTag className="w-3.5 h-3.5 text-secondary" />
                                                                    <span className="text-xs font-bold text-text-dark/50 mr-1">THEMES:</span>
                                                                    {(journal.analysis?.themes || []).map((theme, i) => (
                                                                        <span key={i} className="text-xs bg-secondary/10 dark:bg-secondary/5 text-primary dark:text-accent font-semibold px-2.5 py-1 rounded-full">
                                                                            {theme}
                                                                        </span>
                                                                    ))}
                                                                </div>

                                                                {/* Action Buttons */}
                                                                <div className="flex justify-end gap-3 pt-3 border-t border-secondary/10 dark:border-secondary/5 mt-3">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleStartEdit(journal)}
                                                                        className="text-xs font-semibold text-secondary hover:text-primary dark:hover:text-accent cursor-pointer"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDeleteClick(journal.id)}
                                                                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 cursor-pointer"
                                                                    >
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right: AI Sentiment Report HUD */}
                    <div className="lg:col-span-5">
                        <div className="bg-card-light dark:bg-card-dark border border-secondary/15 dark:border-secondary/5 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6 sticky top-6">
                            <h3 className="text-lg font-bold text-text-dark dark:text-text-light flex items-center gap-2">
                                <FiInfo className="w-5 h-5 text-indigo-500" />
                                AI Insight HUD
                            </h3>

                            {latestAnalysis ? (
                                <div className="space-y-5 text-left">
                                    <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs">
                                        Reflection successfully compiled. Insight report calculated below.
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-2 border-b border-secondary/10">
                                            <span className="text-xs text-text-dark/60 dark:text-text-light/60">Primary Sentiment:</span>
                                            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${getSentimentColor(latestAnalysis.sentiment)}`}>
                                                {latestAnalysis.sentiment}
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-center py-2 border-b border-secondary/10">
                                            <span className="text-xs text-text-dark/60 dark:text-text-light/60">Dominant Emotion:</span>
                                            <span className="text-sm font-bold text-primary dark:text-accent">{latestAnalysis.emotion}</span>
                                        </div>

                                        <div className="flex justify-between items-center py-2 border-b border-secondary/10">
                                            <span className="text-xs text-text-dark/60 dark:text-text-light/60">Confidence Level:</span>
                                            <span className="text-xs font-mono font-bold">{Math.round(latestAnalysis.confidence * 100)}%</span>
                                        </div>

                                        <div className="flex justify-between items-center py-2 border-b border-secondary/10">
                                            <span className="text-xs text-text-dark/60 dark:text-text-light/60">Crisis Status:</span>
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${getCrisisBadge(latestAnalysis.crisisStatus)}`}>
                                                {latestAnalysis.crisisStatus}
                                            </span>
                                        </div>

                                        <div className="space-y-2">
                                            <span className="text-xs text-text-dark/60 dark:text-text-light/60 block">Detected Themes:</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {latestAnalysis.themes.map((t, idx) => (
                                                    <span key={idx} className="text-xs bg-secondary/15 dark:bg-secondary/5 text-primary dark:text-accent font-semibold px-2.5 py-0.5 rounded-full">
                                                        {t}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 text-center border-2 border-dashed border-secondary/15 dark:border-secondary/5 rounded-3xl space-y-3">
                                    <FiBookOpen className="w-8 h-8 text-secondary/30 mx-auto" />
                                    <p className="text-xs text-text-dark/50 dark:text-text-light/50">
                                        Type out your thoughts or record an audio file. The AI Insight HUD will analyze your journal's sentiment, cognitive themes, and support status upon submit.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};
