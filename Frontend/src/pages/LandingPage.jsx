import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    FiHeart,
    FiMic,
    FiBookOpen,
    FiTrendingUp,
    FiCompass,
    FiActivity,
    FiArrowRight,
    FiCheckCircle
} from 'react-icons/fi';
import { PageTransition } from '../components/PageTransition';
import { Button } from '../components/Button';
import { FeatureCard } from '../components/FeatureCard';
import { Accordion } from '../components/Accordion';
import { HeroIllustration } from '../components/HeroIllustration';

export const LandingPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            title: 'Mood Tracking',
            description: 'Check in with yourself daily. Monitor nuances of emotions with simple, organic descriptors instead of arbitrary ratings.',
            icon: <FiHeart className="w-6 h-6" />,
        },
        {
            title: 'Voice Journaling',
            description: 'Speak your mind naturally. Record thoughts safely and hands-free, preserving tone and raw emotional content.',
            icon: <FiMic className="w-6 h-6" />,
        },
        {
            title: 'Journal Analysis',
            description: 'Receive thoughtful insights helper prompts. Detect recurring mental loops, stressful contexts, and positive associations.',
            icon: <FiBookOpen className="w-6 h-6" />,
        },
        {
            title: 'Mood Prediction',
            description: 'Observe patterns before they overwhelm. Understand how factors like rest, work schedules, and social links shape your week.',
            icon: <FiTrendingUp className="w-6 h-6" />,
        },
        {
            title: 'Personalized Wellness',
            description: 'Receive guided direction custom fit to your current head space. Compassionate advice, breathing steps, or journaling prompts.',
            icon: <FiCompass className="w-6 h-6" />,
        },
        {
            title: 'Progress Tracking',
            description: 'Observe your growth trends over weeks and months. Celebrate minor achievements and path modifications.',
            icon: <FiActivity className="w-6 h-6" />,
        },
    ];

    const steps = [
        {
            number: '01',
            title: 'Create Account',
            description: 'Establish a safe space protected with secure credentials. Your data is encrypted and completely private.',
        },
        {
            number: '02',
            title: 'Complete Assessment',
            description: 'Take a short, five-minute introductory questionnaire. Discover your starting mood profile and outline your primary objectives.',
        },
        {
            number: '03',
            title: 'Track Mood & Journal',
            description: 'Make daily entries via voice or text. Check in every morning or evening to map out details of your emotional path.',
        },
        {
            number: '04',
            title: 'Receive Wellness Guidance',
            description: 'Enjoy dynamic support resources, tailored focus strategies, and custom breathing schedules to keep you balanced.',
        },
    ];

    const testimonials = [
        {
            quote: 'MindCompass completely changed how I look at journaling. The voice feature makes reflecting at the end of a long day feel like a conversation with an old friend.',
            author: 'Evelyn Carter',
            role: 'Creative Director',
            initials: 'EC',
        },
        {
            quote: 'I love how clean and calm the interface is. Unlike generic tracking apps that feel like cold, mechanical spreadsheets, MindCompass feels warm, simple, and deeply human.',
            author: 'Marcus Vance',
            role: 'Software Architect',
            initials: 'MV',
        },
        {
            quote: 'The personalized guidance offers practical prompts that actually click. I feel supported on days when my thoughts are noisy and cluttered.',
            author: 'Dr. Sarah Lin',
            role: 'Clinical Psychologist',
            initials: 'SL',
        },
    ];

    const faqs = [
        {
            question: 'Is my mental health data private and secure?',
            answer: 'Absolutely. We believe that your thoughts and emotions are sacred. All journal logs, assessments, and profile parameters are encrypted both in transit and at rest. We never sell or share raw personal logs with any advertising networks.',
        },
        {
            question: 'How does the voice journaling translate thoughts?',
            answer: 'Our text-to-voice parser processes raw dictation securely. It transcribes spoken words while analyzing underlying themes, feelings, and topics, translating spoken sentences into structured text summaries and emotion flags.',
        },
        {
            question: 'Is MindCompass a replacement for therapy?',
            answer: 'No. MindCompass is a guidance tool and journaling diary designed to help monitor emotional wellness and outline healthy coping steps. It is not an alternative to licensed clinical therapy or psychiatric medical treatment. If you are experiencing a crisis, please search out immediate local help.',
        },
        {
            question: 'Can I use MindCompass on mobile devices?',
            answer: 'Yes! The MindCompass application is fully responsive. You can open it on your phone or tablet browser, save it to your home screen, and enjoy the same smooth, premium, and calming experience on the go.',
        },
    ];

    return (
        <PageTransition>
            {/* Hero Section */}
            <section id="hero" className="relative min-h-[90vh] flex items-center pt-8 md:pt-12 pb-16 md:pb-24 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Hero Content */}
                    <div className="lg:col-span-7 text-left space-y-6 md:space-y-8 z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.5 }}
                            className="inline-flex items-center gap-2 bg-secondary/15 dark:bg-secondary/10 px-4 py-1.5 rounded-full text-xs font-semibold text-primary dark:text-accent tracking-wide uppercase"
                        >
                            <span className="flex h-2 w-2 rounded-full bg-secondary-hover/80 dark:bg-accent animate-pulse" />
                            Empowering Mindful Guidance
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text-dark dark:text-text-light leading-[1.1] max-w-2xl">
                            Navigate Your Mind.<br />
                            <span className="text-secondary font-medium dark:text-accent">Discover Your Balance.</span>
                        </h1>

                        <p className="text-base sm:text-lg md:text-xl text-text-dark/70 dark:text-text-light/75 leading-relaxed max-w-xl">
                            Understand your emotions with depth. A thoughtful wellness companion that helps you track your mood, record voice journals, and receive personalized emotional guidance.
                        </p>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => navigate('/register')}
                                icon={<FiArrowRight className="w-5 h-5" />}
                            >
                                Get Started Free
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={(e) => {
                                    e.preventDefault();
                                    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                                }}
                            >
                                Learn How It Works
                            </Button>
                        </div>
                    </div>

                    {/* Hero Illustration */}
                    <div className="lg:col-span-5 flex justify-center items-center relative select-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="w-full relative"
                        >
                            {/* Blur background dots to make illustration soft */}
                            <div className="absolute top-1/4 left-1/4 w-48 h-48 rounded-full bg-accent/25 dark:bg-accent/5 filter blur-3xl" />
                            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-secondary/20 dark:bg-secondary/5 filter blur-3xl" />
                            <HeroIllustration />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 md:py-28 bg-bg-light/50 dark:bg-bg-dark/20 border-t border-b border-secondary/10 dark:border-secondary/5 transition-all">
                <div className="max-w-7xl mx-auto px-6 md:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-4">
                        <h2 className="text-xs uppercase tracking-[0.2em] text-secondary dark:text-secondary-hover font-semibold">
                            Platform Features
                        </h2>
                        <p className="text-3xl md:text-4xl font-bold text-text-dark dark:text-text-light tracking-tight">
                            Designed with Intent. Built for Wellness.
                        </p>
                        <p className="text-base md:text-lg text-text-dark/65 dark:text-text-light/75 leading-relaxed max-w-2xl mx-auto">
                            Everything in MindCompass is designed to encourage self-reflection without administrative clutter. No streaks, no alerts, just smooth emotional mapping.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {features.map((feature, idx) => (
                            <FeatureCard
                                key={idx}
                                title={feature.title}
                                description={feature.description}
                                icon={feature.icon}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-20 md:py-28">
                <div className="max-w-7xl mx-auto px-6 md:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24 space-y-4">
                        <h2 className="text-xs uppercase tracking-[0.2em] text-secondary dark:text-secondary-hover font-semibold">
                            The Journey
                        </h2>
                        <p className="text-3xl md:text-4xl font-bold text-text-dark dark:text-text-light tracking-tight">
                            Building Your Balance Pathway
                        </p>
                        <p className="text-base md:text-lg text-text-dark/65 dark:text-text-light/75 leading-relaxed max-w-2xl mx-auto font-normal">
                            Wellness is a slow progression, not a single goal. Follow these simple checkpoints to map your daily balance strategy.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
                        {steps.map((step, idx) => (
                            <div
                                key={idx}
                                className="relative bg-card-light dark:bg-card-dark p-8 rounded-3xl border border-secondary/15 dark:border-secondary/5 flex flex-col text-left space-y-4 shadow-sm hover:shadow"
                            >
                                {/* Step number watermark */}
                                <div className="text-4xl md:text-5xl font-bold text-secondary/20 dark:text-secondary/10 absolute top-6 right-6">
                                    {step.number}
                                </div>

                                <div className="w-10 h-10 rounded-xl bg-primary dark:bg-accent text-bg-light dark:text-bg-dark flex items-center justify-center font-bold text-sm">
                                    {idx + 1}
                                </div>

                                <h3 className="text-lg md:text-xl font-semibold text-text-dark dark:text-text-light">
                                    {step.title}
                                </h3>

                                <p className="text-sm text-text-dark/70 dark:text-text-light/75 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 md:py-28 bg-primary text-bg-light rounded-[2.5rem] mx-6 md:mx-8 mb-24 overflow-hidden relative shadow-lg">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-secondary/10 dark:bg-accent/5 rounded-full filter blur-3xl pointer-events-none" />
                <div className="max-w-5xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center text-left relative z-10">
                    <div className="lg:col-span-5 space-y-6">
                        <div className="text-xs uppercase tracking-[0.2em] text-accent/80 font-bold">
                            Our Ethos
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                            A Human-Centric Space for Quiet Reflection
                        </h2>
                        <div className="h-1 w-16 bg-accent rounded-full" />
                    </div>
                    <div className="lg:col-span-7 space-y-5 text-bg-light/90">
                        <p className="text-base sm:text-lg leading-relaxed font-light">
                            We started MindCompass because regular fitness and habit track applications are too metric-focused. They guilt users with streaks, reward counts, and busy notification alerts.
                        </p>
                        <p className="text-base sm:text-lg leading-relaxed font-light">
                            We wanted to build a sanctuary. A calm, beautiful digital environment to look deep within, record honest journals without judgment, and receive warm wellness hints that guide your path forwards.
                        </p>
                        <div className="flex gap-6 pt-4 text-xs font-semibold uppercase tracking-wider text-accent">
                            <span className="flex items-center gap-1.5"><FiCheckCircle /> Zero Ads</span>
                            <span className="flex items-center gap-1.5"><FiCheckCircle /> Encrypted Entries</span>
                            <span className="flex items-center gap-1.5"><FiCheckCircle /> Human Centered</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 md:py-28 bg-bg-light/50 dark:bg-bg-dark/20 border-t border-b border-secondary/10 dark:border-secondary/5 transition-all mb-8">
                <div className="max-w-7xl mx-auto px-6 md:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20 space-y-4">
                        <h2 className="text-xs uppercase tracking-[0.2em] text-secondary dark:text-secondary-hover font-semibold">
                            Testimonials
                        </h2>
                        <p className="text-3xl md:text-4xl font-bold text-text-dark dark:text-text-light tracking-tight">
                            Honest Conversations, Authentic Growth
                        </p>
                        <p className="text-base text-text-dark/65 dark:text-text-light/75 leading-relaxed max-w-xl mx-auto">
                            Read how people have integrated MindCompass into their routine to discover peace and balance.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((t, idx) => (
                            <div
                                key={idx}
                                className="bg-card-light dark:bg-card-dark p-8 rounded-3xl border border-secondary/15 dark:border-secondary/5 shadow-sm flex flex-col justify-between text-left h-full hover:shadow transition-shadow duration-300"
                            >
                                <div className="space-y-4">
                                    {/* Quote decoration */}
                                    <span className="text-4xl font-serif text-secondary select-none leading-none opacity-40">“</span>
                                    <p className="text-sm md:text-base leading-relaxed text-text-dark/75 dark:text-text-light/80 italic">
                                        {t.quote}
                                    </p>
                                </div>

                                <div className="flex items-center gap-4 mt-8 border-t border-secondary/10 pt-4">
                                    <div className="w-10 h-10 rounded-full bg-secondary/20 dark:bg-secondary/10 flex items-center justify-center font-bold text-xs text-primary dark:text-accent">
                                        {t.initials}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-text-dark dark:text-text-light leading-none">
                                            {t.author}
                                        </h4>
                                        <span className="text-xs text-text-dark/50 dark:text-text-light/50 mt-1 block">
                                            {t.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20 md:py-28 max-w-4xl mx-auto px-6 md:px-8">
                <div className="text-center mb-16 md:mb-20 space-y-4">
                    <h2 className="text-xs uppercase tracking-[0.2em] text-secondary dark:text-secondary-hover font-semibold">
                        Questions & Answers
                    </h2>
                    <p className="text-3xl md:text-4xl font-bold text-text-dark dark:text-text-light tracking-tight">
                        Frequently Asked Questions
                    </p>
                    <p className="text-sm md:text-base text-text-dark/65 dark:text-text-light/75 leading-relaxed">
                        Find details on security, functionality, and mental wellness scopes.
                    </p>
                </div>

                <Accordion items={faqs} />
            </section>

            {/* Final Call to Action */}
            <section className="py-16 md:py-24 text-center bg-accent/20 dark:bg-secondary/5 border-t border-secondary/10 dark:border-secondary/5">
                <div className="max-w-4xl mx-auto px-6 md:px-8 space-y-6 md:space-y-8">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-text-dark dark:text-text-light">
                        Start Navigating Your Mind Today
                    </h2>
                    <p className="text-base sm:text-lg text-text-dark/70 dark:text-text-light/75 leading-relaxed max-w-xl mx-auto">
                        Join thousands of users discovering direction and calm. Create your encrypted balance account in seconds.
                    </p>
                    <div className="pt-2">
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/register')}
                            icon={<FiArrowRight className="w-5 h-5" />}
                        >
                            Get Started for Free
                        </Button>
                    </div>
                </div>
            </section>
        </PageTransition>
    );
};
