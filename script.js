// Access Web Audio API features
const audioContext = new AudioContext();

// HTML DOM Nodes
const playBtns = document.querySelectorAll(".button");
const canvas = document.querySelector("canvas");


// Initial state on relood
let initiate = false;
let nextLoopTime = 0;
let loadedSamples;
const samples = [];

// Start playing when any of the button is pressed
playBtns.forEach(e => {
    e.addEventListener('click', () => {
        // Initial start for scheduler function
        if (initiate == false) {
            initiate = true;
            // Only start once all samples have been loaded
            setupSample().then((sample) => {
                loadedSamples = sample;
                audioContext.resume();
                scheduler();
                currentNote = 0;
                nextLoopTime = audioContext.currentTime;
            })
        }
        // Toggle aria-checked property; default = false
        if (e.getAttribute('aria-checked') === 'false') {
            e.setAttribute('aria-checked', 'true');
            e.classList.toggle("inqueue");
        } else {
            e.setAttribute('aria-checked', 'false');
            e.classList.toggle("inqueue");
        }
    })
});

console.log('hi');

// Load Samples before play is allowed
async function setupSample() {
        // Paths for all samples
        const samplePaths = [
            "audio/Sunday_Guitar.mp3",
            "audio/Sunday_Bass.mp3",
            "audio/Sunday_Drums.mp3",
            "audio/Sunday_Perc.mp3",
            "audio/Sunday_Rhodes.mp3",
            "audio/Sunday_Melody.mp3",
        ];

        for (let i = 0; i < samplePaths.length; i++) {
            samples[i] = await bufferAudio(samplePaths[i]);
        }
        return samples
}

// Buffer audio file to use with Web Audio API
async function bufferAudio(filePath) {
    const response = await fetch(filePath);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
}

// Scheduler parameters
const lookahead = 1; // 25 ms
const scheduleAheadTime = 0.2; // 100 ms
const tempo = 75; // 83 bpm
const sampleDuration = 60 / tempo * 16; // 16 bars

// Play samples at next loop time; check every 25ms (lookahead) ; look 100ms ahead (scheduleAheadTime)
function scheduler() {
    while (nextLoopTime < audioContext.currentTime + scheduleAheadTime) {
        scheduleSample(nextLoopTime);
        nextLoopTime += sampleDuration; // Update next loop time
    }
    window.setTimeout(scheduler, lookahead);
}

// Play samples if aria-checked is true
function scheduleSample(time) {
    playBtns.forEach((e, index) => {
        if (e.getAttribute('aria-checked') === 'true') {
            playBtns[index].classList.remove("inqueue");
            playSound(loadedSamples[index], time);
            playBtns[index].classList.add("playing");
        } else if (e.getAttribute('aria-checked') === 'false') {
            playBtns[index].classList.remove("playing");
            playBtns[index].classList.remove("inqueue");
        }
    });
}

// Connect buffered audio file to output and play at scheduled time
async function playSound(sample, time) {
    const sampleSource = audioContext.createBufferSource();
    sampleSource.buffer = sample
    sampleSource.connect(analyser);
    sampleSource.start(time);
}

// Analyser
const analyser = audioContext.createAnalyser();
analyser.fftSize = 512;
const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);

// Canvas
const canvasContext = canvas.getContext('2d');
canvas.width = 1280;
canvas.height = 300;
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
canvasContext.clearRect(0, 0, WIDTH, HEIGHT);

function visualise() {
    requestAnimationFrame(visualise);
    analyser.getByteFrequencyData(dataArray);
    canvasContext.fillStyle = "#CEB18D";
    canvasContext.fillRect(0, 0, WIDTH, HEIGHT);

    let barWidth = (WIDTH / bufferLength) * 4;
    let barHeight;
    let x = 0;

    for (var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] * 1.5;

        canvasContext.fillStyle = '#14120F';
        canvasContext.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight);

        x += barWidth + 1;
    }
}

visualise();
analyser.connect(audioContext.destination);