const micWrapper = document.getElementById('micWrapper');
const speakerWrapper = document.getElementById('speakerWrapper');
const resultArea = document.getElementById('result');
const audioUpload = document.getElementById('audioUpload');
const downloadWrapper = document.getElementById('downloadWrapper');
const historyList = document.getElementById('historyList');

let mediaRecorder;
let audioContext;
let mp3Encoder;
let mp3Data = [];
let audio;
let isRecording = false;
let isPlaying = false;

micWrapper.addEventListener('click', toggleRecording);
speakerWrapper.addEventListener('click', toggleAudioPlayback);
audioUpload.addEventListener('change', handleAudioUpload);
downloadWrapper.addEventListener('click', downloadGeneratedAudio);

// Show and hide loader functions
function showLoader() {
    document.getElementById('loader').style.display = 'block';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

// Toggle Recording
async function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        await startRecording();
    }
}

// Start recording audio
async function startRecording() {
    try {
        showLoader();  // Show loader when starting recording

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);

        mp3Encoder = new lamejs.Mp3Encoder(1, audioContext.sampleRate, 128);
        mp3Data = [];

        const bufferSize = 2048;
        const recorder = audioContext.createScriptProcessor(bufferSize, 1, 1);

        recorder.onaudioprocess = (e) => {
            const samples = e.inputBuffer.getChannelData(0);
            const mp3buf = mp3Encoder.encodeBuffer(convertFloat32ToInt16(samples));
            if (mp3buf.length > 0) {
                mp3Data.push(mp3buf);
            }
        };

        source.connect(recorder);
        recorder.connect(audioContext.destination);

        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.start();

        isRecording = true;
        micWrapper.style.backgroundColor = '#4CAF50'; // Green when recording
    } catch (error) {
        console.error('Error starting recording:', error);
        alert('Error starting recording. Please check console for details.');
    } finally {
        hideLoader();  // Hide loader when recording setup is complete
    }
}

// Stop recording
function stopRecording() {
    if (mediaRecorder && isRecording) {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach(track => track.stop());

        const mp3buf = mp3Encoder.flush();
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }

        const blob = new Blob(mp3Data, { type: 'audio/mp3' });
        sendAudioToServer(blob);

        isRecording = false;
        micWrapper.style.backgroundColor = '#e0e0e0'; // Back to default when not recording
    }
}

// Convert float to int16
function convertFloat32ToInt16(buffer) {
    const l = buffer.length;
    const output = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        output[i] = Math.min(1, buffer[i]) * 0x7FFF;
    }
    return output;
}

// Send audio to the server
function sendAudioToServer(audioBlob) {
    showLoader();  // Show loader when sending request

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.mp3');

    fetch('http://127.0.0.1:8000/api/text/transcribe/', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.transcription) {
            resultArea.value = data.transcription;
            addToHistory('Input Audio', audioBlob);
        } else {
            console.error('No transcription received');
        }
    })
    .catch(error => console.error('Error transcribing audio:', error))
    .finally(() => {
        hideLoader();  // Hide loader when request completes
    });
}

// Toggle audio playback
function toggleAudioPlayback() {
    if (isPlaying && audio) {
        audio.pause();
        speakerWrapper.style.backgroundColor = '#e0e0e0'; // Back to default when not playing
        isPlaying = false;
    } else {
        const text = resultArea.value;
        if (!text) return;

        showLoader();  // Show loader when starting playback

        fetch('http://127.0.0.1:8000/api/speech/tts/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to generate speech');
            }
            return response.blob();
        })
        .then(blob => {
            const url = URL.createObjectURL(blob);
            audio = new Audio(url);
            audio.play();
            speakerWrapper.style.backgroundColor = '#2196F3'; // Blue when playing
            isPlaying = true;

            audio.onended = function() {
                speakerWrapper.style.backgroundColor = '#e0e0e0'; // Back to default when finished
                isPlaying = false;
            };

            addToHistory('Output Audio', blob);
        })
        .catch(error => console.error('Error generating speech:', error))
        .finally(() => {
            hideLoader();  // Hide loader when playback starts
        });
    }
}

// Handle audio file upload
function handleAudioUpload(event) {
    const file = event.target.files[0];
    
    if (file) {
        console.log("File selected for upload:", file);

        const reader = new FileReader();
        reader.onload = function(e) {
            const audioBlob = new Blob([e.target.result], { type: file.type });
            console.log("File successfully read. Sending to server...");

            // Sending the audio to the server
            sendAudioToServer(audioBlob);
        };

        reader.onerror = function() {
            console.error("Error reading the file.");
        };

        reader.readAsArrayBuffer(file);  // Read the file as an ArrayBuffer
    } else {
        console.log("No file selected.");
    }
}

// Send audio to the server
function sendAudioToServer(audioBlob) {
    showLoader();  // Show loader when sending request

    const formData = new FormData();
    formData.append('audio', audioBlob, 'uploaded_audio.mp3');

    console.log("Sending audio to the server...");

    fetch('http://127.0.0.1:8000/api/text/transcribe/', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log("Response from server:", data);
        if (data.transcription) {
            resultArea.value = data.transcription;
            addToHistory('Uploaded Audio', audioBlob);
        } else {
            console.error("No transcription received.");
        }
    })
    .catch(error => console.error("Error uploading audio:", error))
    .finally(() => {
        hideLoader();  // Hide loader when request completes
    });
}


// Download generated audio
function downloadGeneratedAudio() {
    if (audio) {
        const audioUrl = audio.src;
        const link = document.createElement('a');
        link.href = audioUrl;
        link.download = 'generated_audio.mp3';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert('No audio available to download');
    }
}

// Add entry to history
function addToHistory(type, blob) {
    const listItem = document.createElement('li');
    const timestamp = new Date().toLocaleString();
    const audioUrl = URL.createObjectURL(blob);

    listItem.innerHTML = `
        <strong>${type}</strong> - ${timestamp}<br>
        <audio controls src="${audioUrl}"></audio><br>
        <span class="download-link" onclick="downloadAudio('${audioUrl}', '${type.toLowerCase()}_${timestamp}.mp3')">Download</span>
    `;

    historyList.prepend(listItem);
}

// Download audio from history
function downloadAudio(url, filename) {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
