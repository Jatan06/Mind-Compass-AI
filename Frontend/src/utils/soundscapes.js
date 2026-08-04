/**
 * MindCompass Wellness Ambient Sound Engine — Tone.js Edition
 *
 * Distinct, peaceful, professionally-crafted ambient soundscapes for every
 * wellness category.  Each soundscape is synthesised entirely in-browser using
 * Tone.js — no external audio files required.
 */

import * as Tone from 'tone';

// ---------------------------------------------------------------------------
// Soundscape metadata registry
// ---------------------------------------------------------------------------
export const CATEGORY_SOUNDSCAPES = {
    'Breathing': {
        id: 'breathing', category: 'Breathing',
        title: 'Peaceful Breath Swell',
        subtitle: 'Soft pink-noise swell that breathes in for 4 s and out for 4 s',
        benefit: 'Calms heart rate & activates the parasympathetic nervous system',
        color: 'from-teal-500/20 to-cyan-500/20', emoji: 'u{1F32C}', soundType: 'breath_swell'
    },
    'Meditation': {
        id: 'meditation', category: 'Meditation',
        title: 'Tibetan Singing Bowls',
        subtitle: 'Deep resonant bowl struck softly every 8 seconds with long harmonic decay',
        benefit: 'Clears mental chatter & deepens inner stillness',
        color: 'from-purple-500/20 to-indigo-500/20', emoji: 'u{1F9D8}', soundType: 'singing_bowl'
    },
    'Mindfulness': {
        id: 'mindfulness', category: 'Mindfulness',
        title: 'Forest Stream & Chimes',
        subtitle: 'Gentle running-water brown noise with soft woodland chime drops',
        benefit: 'Anchors present-moment awareness through natural sound',
        color: 'from-emerald-500/20 to-teal-500/20', emoji: 'u{1F343}', soundType: 'stream_chimes'
    },
    'Sleep Hygiene': {
        id: 'sleep_hygiene', category: 'Sleep Hygiene',
        title: 'Rain & Ocean Waves',
        subtitle: 'Soft rain patter blended with slow rolling ocean wave swells',
        benefit: 'Eases the nervous system into restful, deep sleep',
        color: 'from-blue-900/30 to-indigo-900/30', emoji: 'u{1F319}', soundType: 'rain_ocean'
    },
    'Gratitude': {
        id: 'gratitude', category: 'Gratitude',
        title: 'Warm Piano Arpeggios',
        subtitle: 'Gentle piano notes softly rising through a C-major pentatonic scale',
        benefit: 'Opens the heart & fosters emotional warmth',
        color: 'from-amber-500/20 to-rose-500/20', emoji: 'u{1F64F}', soundType: 'piano_arpeggios'
    },
    'Journaling': {
        id: 'journaling', category: 'Journaling',
        title: 'Cozy Rain & Soft Warmth',
        subtitle: 'Quiet rain acoustics with a gentle warm chord hum for deep focus',
        benefit: 'Promotes reflective writing & calm self-expression',
        color: 'from-violet-500/20 to-purple-500/20', emoji: 'u{1F4D3}', soundType: 'lofi_rain'
    },
    'Physical Activity': {
        id: 'physical_activity', category: 'Physical Activity',
        title: 'Kalimba Pulse',
        subtitle: 'Bright acoustic kalimba plucks in a flowing pentatonic pattern',
        benefit: 'Gentle uplifting energy for stretching & mindful movement',
        color: 'from-orange-500/20 to-amber-500/20', emoji: 'u{1F3C3}', soundType: 'kalimba_pulse'
    },
    'Relaxation': {
        id: 'relaxation', category: 'Relaxation',
        title: 'Deep Ocean Swells',
        subtitle: 'Low, rumbling ocean waves rolling in slowly every 10 seconds',
        benefit: 'Releases body tension & melts away muscle stress',
        color: 'from-sky-500/20 to-blue-500/20', emoji: 'u{1F30A}', soundType: 'ocean_swells'
    },
    'Grounding': {
        id: 'grounding', category: 'Grounding',
        title: 'Forest Wind & Earth Drone',
        subtitle: 'Rustling forest breeze layered with a deep grounding bass tone',
        benefit: 'Stops racing thoughts & anchors you to the present moment',
        color: 'from-emerald-700/20 to-stone-700/20', emoji: 'u{1F331}', soundType: 'forest_drone'
    },
    'Stress Management': {
        id: 'stress_management', category: 'Stress Management',
        title: '528 Hz Healing Bell',
        subtitle: 'Therapeutic 528 Hz solfeggio bell struck gently every 6 seconds',
        benefit: 'Soothes the nervous system & reduces cortisol response',
        color: 'from-teal-500/20 to-emerald-500/20', emoji: 'u{1F610}', soundType: 'solfeggio_528'
    },
    'Anxiety Relief': {
        id: 'anxiety_relief', category: 'Anxiety Relief',
        title: 'Crystal Glass Chimes',
        subtitle: 'Delicate high glass chime drops every 3-6 seconds with soft air',
        benefit: 'Calms chest tightness & quiets anxious thought patterns',
        color: 'from-cyan-400/20 to-blue-400/20', emoji: 'u{1F630}', soundType: 'crystal_chimes'
    },
    'Emotional Regulation': {
        id: 'emotional_regulation', category: 'Emotional Regulation',
        title: 'Water Drops & String Pad',
        subtitle: 'Gentle water-drop plucks with a soft warm string underneath',
        benefit: 'Restores inner calm & emotional balance gently',
        color: 'from-rose-400/20 to-pink-500/20', emoji: 'u{1F49A}', soundType: 'water_strings'
    },
    'Digital Wellbeing': {
        id: 'digital_wellbeing', category: 'Digital Wellbeing',
        title: 'Zen Bamboo Fountain',
        subtitle: 'Wooden bamboo knocks & water drops in a calm Zen garden rhythm',
        benefit: 'Relieves eye strain & digital overload with grounding sounds',
        color: 'from-green-500/20 to-emerald-400/20', emoji: 'u{1F4F1}', soundType: 'bamboo_fountain'
    },
    'Social Wellness': {
        id: 'social_wellness', category: 'Social Wellness',
        title: 'Campfire & Evening Warmth',
        subtitle: 'Warm crackling campfire with a soft soothing evening chord',
        benefit: 'Encourages open-heartedness & calm social connection',
        color: 'from-amber-600/20 to-red-500/20', emoji: 'u{1F91D}', soundType: 'campfire'
    },
    'Cognitive Exercises': {
        id: 'cognitive_exercises', category: 'Cognitive Exercises',
        title: '40 Hz Gamma Focus Pulse',
        subtitle: 'Subtle 40 Hz AM-modulated tone proven to enhance neural focus',
        benefit: 'Sharpens attention, memory & cognitive performance',
        color: 'from-violet-600/20 to-fuchsia-600/20', emoji: 'u{1F9E0}', soundType: 'gamma_focus'
    }
};

export const DEFAULT_SOUNDSCAPE = CATEGORY_SOUNDSCAPES['Breathing'];

export const getSoundscapeForCategory = (category) => {
    if (!category || category === 'All') return DEFAULT_SOUNDSCAPE;
    if (CATEGORY_SOUNDSCAPES[category]) return CATEGORY_SOUNDSCAPES[category];
    const matchedKey = Object.keys(CATEGORY_SOUNDSCAPES).find(
        k => k.toLowerCase() === category.toLowerCase()
    );
    return matchedKey ? CATEGORY_SOUNDSCAPES[matchedKey] : DEFAULT_SOUNDSCAPE;
};

// ---------------------------------------------------------------------------
// CategorySoundEngine — Tone.js powered ambient sound engine
// ---------------------------------------------------------------------------
class CategorySoundEngine {
    constructor() {
        this.started = false;
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 0.75;
        this.currentSoundscape = null;
        this.masterVol = null;
        this._nodes = [];
        this._timers = [];
        this._stopTimeout = null;
    }

    _linToDB(linear) {
        if (linear <= 0) return -Infinity;
        return 20 * Math.log10(Math.max(linear, 0.0001));
    }

    async _ensureStarted() {
        if (!this.started) {
            await Tone.start();
            this.started = true;
        }
        if (Tone.getContext().state === 'suspended') {
            await Tone.getContext().resume();
        }
    }

    _reg(node) { this._nodes.push(node); return node; }
    _regTimer(id) { this._timers.push(id); return id; }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, val));
        if (this.masterVol) {
            const db = this.isMuted ? -Infinity : this._linToDB(this.volume);
            this.masterVol.volume.rampTo(db, 0.1);
        }
    }

    setMuted(muted) {
        this.isMuted = muted;
        this.setVolume(this.volume);
    }

    pause() {
        this.isPlaying = false;
        if (this.masterVol) this.masterVol.volume.rampTo(-Infinity, 0.3);
    }

    resume() {
        this.isPlaying = true;
        if (this.masterVol) {
            const db = this.isMuted ? -Infinity : this._linToDB(this.volume);
            this.masterVol.volume.rampTo(db, 0.3);
        }
    }

    stop() {
        this.isPlaying = false;
        this._timers.forEach(id => {
            try { clearInterval(id); } catch (_) {}
            try { clearTimeout(id); } catch (_) {}
        });
        this._timers = [];
        if (this._stopTimeout) { clearTimeout(this._stopTimeout); this._stopTimeout = null; }
        if (this.masterVol) {
            try { this.masterVol.volume.rampTo(-Infinity, 0.5); } catch (_) {}
        }
        const nodesToDispose = [...this._nodes];
        this._nodes = [];
        setTimeout(() => {
            nodesToDispose.forEach(n => { try { n.dispose(); } catch (_) {} });
            this.masterVol = null;
        }, 700);
    }

    // Called on user gesture (Start Now button)
    async initCtx() {
        await this._ensureStarted();
    }

    async play(soundscape, durationSeconds = 300) {
        await this._ensureStarted();
        this.stop();
        await new Promise(r => setTimeout(r, 750));

        const sound = soundscape || DEFAULT_SOUNDSCAPE;
        this.currentSoundscape = sound;
        this.isPlaying = true;

        this.masterVol = this._reg(new Tone.Volume(this._linToDB(this.volume)).toDestination());

        switch (sound.soundType) {
            case 'breath_swell':      this._genBreathSwell(); break;
            case 'singing_bowl':      this._genSingingBowl(); break;
            case 'stream_chimes':     this._genStreamChimes(); break;
            case 'rain_ocean':        this._genRainOcean(); break;
            case 'piano_arpeggios':   this._genPianoArpeggios(); break;
            case 'lofi_rain':         this._genLofiRain(); break;
            case 'kalimba_pulse':     this._genKalimbaPulse(); break;
            case 'ocean_swells':      this._genOceanSwells(); break;
            case 'forest_drone':      this._genForestDrone(); break;
            case 'solfeggio_528':     this._genSolfeggio528(); break;
            case 'crystal_chimes':    this._genCrystalChimes(); break;
            case 'water_strings':     this._genWaterStrings(); break;
            case 'bamboo_fountain':   this._genBambooFountain(); break;
            case 'campfire':          this._genCampfire(); break;
            case 'gamma_focus':       this._genGammaFocus(); break;
            default:                  this._genBreathSwell(); break;
        }

        this._stopTimeout = setTimeout(() => this.stop(), (durationSeconds + 2) * 1000);
    }

    // 1. Breathing — Pink noise breath swell (4 s in / 4 s out LFO)
    _genBreathSwell() {
        const noise = this._reg(new Tone.Noise('pink'));
        const filter = this._reg(new Tone.Filter(400, 'lowpass'));
        const vol = this._reg(new Tone.Volume(-12));
        const lfo = this._reg(new Tone.LFO({ frequency: 0.125, min: -40, max: -8, type: 'sine' }));
        noise.connect(filter);
        filter.connect(vol);
        vol.connect(this.masterVol);
        lfo.connect(vol.volume);
        noise.start();
        lfo.start();
    }

    // 2. Meditation — Deep Tibetan singing bowl (every 8 s)
    _genSingingBowl() {
        const pad = this._reg(new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 4, decay: 0, sustain: 1, release: 4 }
        }));
        pad.volume.value = -28;
        pad.connect(this.masterVol);
        pad.triggerAttack('D2');

        const bowl = this._reg(new Tone.MetalSynth({
            frequency: 110,
            envelope: { attack: 0.001, decay: 6, release: 8 },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        }));
        bowl.volume.value = -10;
        bowl.connect(this.masterVol);
        const strike = () => { if (!this.isPlaying) return; bowl.triggerAttackRelease('16n'); };
        strike();
        this._regTimer(setInterval(strike, 8000));
    }

    // 3. Mindfulness — Brown-noise stream + periodic chime drops
    _genStreamChimes() {
        const stream = this._reg(new Tone.Noise('brown'));
        const streamFilter = this._reg(new Tone.Filter({ frequency: 800, type: 'bandpass', Q: 0.8 }));
        const streamVol = this._reg(new Tone.Volume(-14));
        const streamLFO = this._reg(new Tone.LFO({ frequency: 0.3, min: 400, max: 1200 }));
        streamLFO.connect(streamFilter.frequency);
        stream.connect(streamFilter);
        streamFilter.connect(streamVol);
        streamVol.connect(this.masterVol);
        stream.start();
        streamLFO.start();

        const chimeSynth = this._reg(new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.001, decay: 1.8, sustain: 0, release: 1 }
        }));
        chimeSynth.volume.value = -14;
        chimeSynth.connect(this.masterVol);
        const chimeNotes = ['C5', 'E5', 'G5', 'A5', 'C6'];
        const chime = () => {
            if (!this.isPlaying) return;
            chimeSynth.triggerAttackRelease(chimeNotes[Math.floor(Math.random() * chimeNotes.length)], '8n');
        };
        chime();
        this._regTimer(setInterval(chime, 3500));
    }

    // 4. Sleep Hygiene — Soft rain (pink noise) + slow ocean swell (brown noise LFO)
    _genRainOcean() {
        const rain = this._reg(new Tone.Noise('pink'));
        const rainHP = this._reg(new Tone.Filter({ frequency: 1200, type: 'highpass' }));
        const rainVol = this._reg(new Tone.Volume(-18));
        rain.connect(rainHP);
        rainHP.connect(rainVol);
        rainVol.connect(this.masterVol);
        rain.start();

        const ocean = this._reg(new Tone.Noise('brown'));
        const oceanLP = this._reg(new Tone.Filter({ frequency: 300, type: 'lowpass' }));
        const oceanVol = this._reg(new Tone.Volume(-14));
        const waveLFO = this._reg(new Tone.LFO({ frequency: 1 / 12, min: -32, max: -10, type: 'sine' }));
        waveLFO.connect(oceanVol.volume);
        ocean.connect(oceanLP);
        oceanLP.connect(oceanVol);
        oceanVol.connect(this.masterVol);
        ocean.start();
        waveLFO.start();
    }

    // 5. Gratitude — Warm piano arpeggios (C pentatonic)
    _genPianoArpeggios() {
        const pad = this._reg(new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 2, decay: 1, sustain: 0.8, release: 3 }
        }));
        pad.volume.value = -26;
        pad.connect(this.masterVol);
        pad.triggerAttack(['C3', 'G3', 'E3']);

        const piano = this._reg(new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.005, decay: 1.2, sustain: 0.1, release: 1.5 }
        }));
        const reverb = this._reg(new Tone.Reverb({ decay: 3, wet: 0.45 }));
        piano.connect(reverb);
        reverb.connect(this.masterVol);
        piano.volume.value = -12;

        const notes = ['C4', 'E4', 'G4', 'A4', 'C5', 'E5', 'G5'];
        let idx = 0;
        const play = () => {
            if (!this.isPlaying) return;
            piano.triggerAttackRelease(notes[idx % notes.length], '4n');
            idx++;
        };
        play();
        this._regTimer(setInterval(play, 1800));
    }

    // 6. Journaling — Cozy rain + warm AM chord hum
    _genLofiRain() {
        const rain = this._reg(new Tone.Noise('pink'));
        const rainBP = this._reg(new Tone.Filter({ frequency: 1800, type: 'bandpass', Q: 0.4 }));
        const rainVol = this._reg(new Tone.Volume(-20));
        rain.connect(rainBP);
        rainBP.connect(rainVol);
        rainVol.connect(this.masterVol);
        rain.start();

        const chord = this._reg(new Tone.AMSynth({
            harmonicity: 1.5,
            envelope: { attack: 3, decay: 0, sustain: 1, release: 4 },
            modulation: { type: 'sine' },
            modulationEnvelope: { attack: 2, decay: 0, sustain: 1, release: 4 }
        }));
        chord.volume.value = -24;
        chord.connect(this.masterVol);
        chord.triggerAttack('C3');
    }

    // 7. Physical Activity — Kalimba pluck pulse
    _genKalimbaPulse() {
        const kalimba = this._reg(new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.001, decay: 0.9, sustain: 0, release: 0.8 }
        }));
        const reverb = this._reg(new Tone.Reverb({ decay: 1.5, wet: 0.3 }));
        kalimba.connect(reverb);
        reverb.connect(this.masterVol);
        kalimba.volume.value = -10;

        const pad = this._reg(new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 2, decay: 0, sustain: 1, release: 3 }
        }));
        pad.volume.value = -28;
        pad.connect(this.masterVol);
        pad.triggerAttack('C3');

        const scale = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'];
        let idx = 0;
        const pluck = () => {
            if (!this.isPlaying) return;
            kalimba.triggerAttackRelease(scale[idx % scale.length], '16n');
            idx++;
        };
        pluck();
        this._regTimer(setInterval(pluck, 900));
    }

    // 8. Relaxation — Deep ocean swells (10 s cycle)
    _genOceanSwells() {
        const ocean = this._reg(new Tone.Noise('brown'));
        const lp = this._reg(new Tone.Filter({ frequency: 250, type: 'lowpass' }));
        const vol = this._reg(new Tone.Volume(-12));
        const waveLFO = this._reg(new Tone.LFO({ frequency: 0.1, min: -30, max: -8, type: 'sine' }));
        waveLFO.connect(vol.volume);
        const filterLFO = this._reg(new Tone.LFO({ frequency: 0.08, min: 120, max: 350 }));
        filterLFO.connect(lp.frequency);
        ocean.connect(lp);
        lp.connect(vol);
        vol.connect(this.masterVol);
        ocean.start();
        waveLFO.start();
        filterLFO.start();
    }

    // 9. Grounding — Forest wind + low earth drone
    _genForestDrone() {
        const wind = this._reg(new Tone.Noise('brown'));
        const windBP = this._reg(new Tone.Filter({ frequency: 600, type: 'bandpass', Q: 0.5 }));
        const windVol = this._reg(new Tone.Volume(-18));
        const windLFO = this._reg(new Tone.LFO({ frequency: 0.2, min: 300, max: 900 }));
        windLFO.connect(windBP.frequency);
        wind.connect(windBP);
        windBP.connect(windVol);
        windVol.connect(this.masterVol);
        wind.start();
        windLFO.start();

        const drone = this._reg(new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 4, decay: 0, sustain: 1, release: 5 }
        }));
        drone.volume.value = -26;
        drone.connect(this.masterVol);
        drone.triggerAttack('G1');
    }

    // 10. Stress Management — 528 Hz solfeggio bell (every 6 s)
    _genSolfeggio528() {
        const pad = this._reg(new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 3, decay: 0, sustain: 1, release: 4 }
        }));
        pad.volume.value = -28;
        pad.connect(this.masterVol);
        pad.triggerAttack('C3');

        const bell = this._reg(new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 4.5, sustain: 0, release: 2 }
        }));
        const reverb = this._reg(new Tone.Reverb({ decay: 4, wet: 0.5 }));
        bell.connect(reverb);
        reverb.connect(this.masterVol);
        bell.volume.value = -10;
        const strike = () => { if (!this.isPlaying) return; bell.triggerAttackRelease(528, '32n'); };
        strike();
        this._regTimer(setInterval(strike, 6000));
    }

    // 11. Anxiety Relief — Delicate crystal chimes + soft air breeze
    _genCrystalChimes() {
        const breeze = this._reg(new Tone.Noise('white'));
        const breezeLP = this._reg(new Tone.Filter({ frequency: 2000, type: 'lowpass' }));
        const breezeVol = this._reg(new Tone.Volume(-32));
        breeze.connect(breezeLP);
        breezeLP.connect(breezeVol);
        breezeVol.connect(this.masterVol);
        breeze.start();

        const chime = this._reg(new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 3, sustain: 0, release: 2 }
        }));
        const reverb = this._reg(new Tone.Reverb({ decay: 5, wet: 0.6 }));
        chime.connect(reverb);
        reverb.connect(this.masterVol);
        chime.volume.value = -12;
        const crystalNotes = ['B5', 'D6', 'E6', 'G6', 'A6'];
        const scheduleNext = () => {
            if (!this.isPlaying) return;
            chime.triggerAttackRelease(crystalNotes[Math.floor(Math.random() * crystalNotes.length)], '32n');
            this._regTimer(setTimeout(scheduleNext, 3000 + Math.random() * 3000));
        };
        this._regTimer(setTimeout(scheduleNext, 500));
    }

    // 12. Emotional Regulation — Water drop plucks + gentle string pad
    _genWaterStrings() {
        const strings = this._reg(new Tone.AMSynth({
            harmonicity: 1,
            envelope: { attack: 3, decay: 0, sustain: 1, release: 4 },
            modulation: { type: 'sine' },
            modulationEnvelope: { attack: 2, decay: 0, sustain: 1, release: 3 }
        }));
        strings.volume.value = -24;
        strings.connect(this.masterVol);
        strings.triggerAttack('E3');

        const drop = this._reg(new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.6, sustain: 0, release: 0.4 }
        }));
        const reverb = this._reg(new Tone.Reverb({ decay: 2, wet: 0.4 }));
        drop.connect(reverb);
        reverb.connect(this.masterVol);
        drop.volume.value = -14;
        const dropNotes = ['A4', 'C5', 'E5', 'G5'];
        const drip = () => {
            if (!this.isPlaying) return;
            drop.triggerAttackRelease(dropNotes[Math.floor(Math.random() * dropNotes.length)], '32n');
        };
        drip();
        this._regTimer(setInterval(drip, 2200));
    }

    // 13. Digital Wellbeing — Zen bamboo knock + water drop
    _genBambooFountain() {
        const water = this._reg(new Tone.Noise('brown'));
        const waterLP = this._reg(new Tone.Filter({ frequency: 600, type: 'lowpass' }));
        const waterVol = this._reg(new Tone.Volume(-26));
        water.connect(waterLP);
        waterLP.connect(waterVol);
        waterVol.connect(this.masterVol);
        water.start();

        const knock = this._reg(new Tone.NoiseSynth({
            noise: { type: 'brown' },
            envelope: { attack: 0.001, decay: 0.08, sustain: 0, release: 0.05 }
        }));
        const knockFilter = this._reg(new Tone.Filter({ frequency: 400, type: 'bandpass', Q: 4 }));
        knock.connect(knockFilter);
        knockFilter.connect(this.masterVol);
        knock.volume.value = -8;

        const drop = this._reg(new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 0.3 }
        }));
        drop.volume.value = -16;
        drop.connect(this.masterVol);

        const bamboo = () => {
            if (!this.isPlaying) return;
            knock.triggerAttackRelease('16n');
            setTimeout(() => { if (this.isPlaying) drop.triggerAttackRelease('C6', '32n'); }, 180);
        };
        bamboo();
        this._regTimer(setInterval(bamboo, 3000));
    }

    // 14. Social Wellness — Campfire crackle + warm evening chord
    _genCampfire() {
        const pad = this._reg(new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'sine' },
            envelope: { attack: 3, decay: 0, sustain: 1, release: 5 }
        }));
        pad.volume.value = -28;
        pad.connect(this.masterVol);
        pad.triggerAttack(['C3', 'E3', 'G3']);

        const crackle = () => {
            if (!this.isPlaying) return;
            const pop = new Tone.NoiseSynth({
                noise: { type: 'white' },
                envelope: { attack: 0.001, decay: 0.02 + Math.random() * 0.04, sustain: 0, release: 0.01 }
            });
            const hp = new Tone.Filter({ frequency: 2000 + Math.random() * 3000, type: 'highpass' });
            pop.connect(hp);
            hp.connect(this.masterVol);
            pop.volume.value = -14 - Math.random() * 8;
            pop.triggerAttackRelease('32n');
            setTimeout(() => { try { pop.dispose(); hp.dispose(); } catch (_) {} }, 500);
            this._regTimer(setTimeout(crackle, 200 + Math.random() * 700));
        };
        crackle();
    }

    // 15. Cognitive Exercises — 40 Hz gamma AM pulse + focus pad
    _genGammaFocus() {
        const pad = this._reg(new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 2, decay: 0, sustain: 1, release: 3 }
        }));
        pad.volume.value = -30;
        pad.connect(this.masterVol);
        pad.triggerAttack('C3');

        const carrier = this._reg(new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { attack: 2, decay: 0, sustain: 1, release: 2 }
        }));
        const ampNode = this._reg(new Tone.Gain(1));
        const gammaLFO = this._reg(new Tone.LFO({ frequency: 40, min: 0, max: 1 }));
        gammaLFO.connect(ampNode.gain);
        carrier.connect(ampNode);
        ampNode.connect(this.masterVol);
        carrier.volume.value = -18;
        carrier.triggerAttack('C4');
        gammaLFO.start();
    }
}

export const audioEngine = new CategorySoundEngine();
