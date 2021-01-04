$(function () {

    //todo: jquery knob plugin thing

    $("#tempo").knob({
        'change': function (v) {
            jQuery.event.trigger('setTempo', v);
        }
    });

    $("#tuning").knob({
        'release': function (v) {
            jQuery.event.trigger('setTuning', v);
        }
    });

    $("#decay").knob({
        'change': function (v) { jQuery.event.trigger('setRelease', v / 10); }
    });

    var context = new (window.AudioContext || window.webkitAudioContext)();

    var VCO = (function (context) {
        function VCO() {
            this.oscillator = context.createOscillator();
            this.oscillator.type = "sawtooth";
            this.setFrequency(220);
            this.oscillator.start(0);

            this.input = this.oscillator;
            this.output = this.oscillator;

            //will be used in future when stepping over notes
            //var that = this;
            //$(document).bind('frequency', function (_, frequency) {
            //    that.setFrequency(frequency);
            //});
        };

        VCO.prototype.setOscTypeSaw = function () {
            this.oscillator.type = "sawtooth";
        };
        VCO.prototype.setOscSquareType = function () {
            this.oscillator.type = "square";
        };

        VCO.prototype.setFrequency = function (frequency) {
            this.oscillator.frequency.setValueAtTime(frequency, context.currentTime);
        };

        VCO.prototype.connect = function (node) {
            if (node.hasOwnProperty('input')) {
                this.output.connect(node.input);
            } else {
                this.output.connect(node);
            };
        };


        return VCO;
    })(context);

    var VCA = (function (context) {
        function VCA() {
            this.gain = context.createGain();
            this.gain.gain.value = 0;
            this.input = this.gain;
            this.output = this.gain;
            this.amplitude = this.gain.gain;
        };

        VCA.prototype.connect = function (node) {
            if (node.hasOwnProperty('input')) {
                this.output.connect(node.input);
            } else {
                this.output.connect(node);
            };
        }

        return VCA;
    })(context);

    //ASDR bizniss
    var EnvelopeGenerator = (function (context) {
        function EnvelopeGenerator() {
            this.attackTime = 0;    //should happen instantly, like the 303
            this.releaseTime = 0.1;

            var that = this;
            $(document).bind('setRelease', function (_, value) {
                that.releaseTime = value;
            });
        };

        EnvelopeGenerator.prototype.trigger = function () {
            now = context.currentTime;
            this.param.cancelScheduledValues(now);
            this.param.setValueAtTime(0, now);
            this.param.linearRampToValueAtTime(0.125, now + this.attackTime);
            this.param.linearRampToValueAtTime(0, now + this.attackTime + this.releaseTime);
        };

        EnvelopeGenerator.prototype.connect = function (param) {
            this.param = param;
        };

        return EnvelopeGenerator;
    })(context);

    function InitNotes() {
        var notes = [];
        for (var i = 0; i < 16; i++)
            notes.push({

                pitch: Math.random() * (110 - 55) + 55

                //pitch : 110 + i * (Math.random() * (10 - 0) + 0)
            });

        return notes;
    }

    var vco = new VCO;
    var vca = new VCA;
    var envelope = new EnvelopeGenerator;
    var Sequencer = (function (osc, envelope) {

        function Sequencer() {
            this.tempo = 120;
            this.notes = InitNotes();
            this.timer;
            this.isRunning = false;

            var that = this;
            $(document).bind('startStepper', function (_) {
                that.start();
            });

            $(document).bind('setTempo', function (_, tempo) {
                that.setTempo(tempo);
            });

            $(document).bind('setTuning', function (_, pitch) {
                that.setTuning(pitch);
            });
        };

        Sequencer.prototype.setTempo = function (tempo) {
            this.tempo = tempo;
        };


        //THIS SHOULD REALLY PROBABLY BE ON THE VCO, BUT...WHATEVER
        Sequencer.prototype.setTuning = function (pitchModifier) {
            //apply a pitch modifier to all of the items in the bank of notes.
            this.notes = this.notes.map(function (note) {

                return {pitch: note.pitch += pitchModifier};
            });
        }

        Sequencer.prototype.run = function () {
            var that = this;
            var noteCounter = 0;

            function playNote() {
                var stepTime = 20000 / that.tempo;
                if (noteCounter >= that.notes.length - 1) {
                    noteCounter = 0;
                } else {
                    noteCounter++;
                }

                var freq = that.notes[noteCounter].pitch;
                osc.setFrequency(freq);
                
                envelope.trigger();

                if (that.isRunning) {
                    timer = setTimeout(playNote, stepTime); //TODO: bpm calcs
                }
            }
            playNote();
        }

        Sequencer.prototype.start = function () {
            if (!this.isRunning) {
                this.isRunning = true;
                this.run();
            };
        };

        Sequencer.prototype.stop = function () {
            if (this.isRunning) {
                this.isRunning = false;
            }

        };

        return Sequencer;
    })(vco, envelope);

    /* Connections */
    vco.connect(vca);
    envelope.connect(vca.amplitude);
    vca.connect(context.destination);


    //Sequencer

    var sequencer = new Sequencer;
    jQuery.event.trigger('startStepper');
});