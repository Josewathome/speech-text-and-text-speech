//Script.js
document.addEventListener('DOMContentLoaded', function() {
    const chatHistory = document.getElementById('chatHistory');
    const userInput = document.getElementById('userInput');
    const micButton = document.getElementById('micButton');
    const uploadButton = document.getElementById('uploadButton');
    const submitButton = document.getElementById('submitButton');
    const audioUpload = document.getElementById('audioUpload');
    const historyList = document.getElementById('historyList');
    const imageCheckbox = document.getElementById('imageCheckbox');
    const loader = document.getElementById('loader');
    const newChatButton = document.getElementById('newChatButton');
    const errorPopup = document.getElementById('errorPopup');
    const errorMessage = document.getElementById('errorMessage');
    const closeButton = document.querySelector('.close-button');

    const MAX_IMAGES_PER_CHAT = 100;
    const MAX_AUDIOS_PER_CHAT = 100;
    let currentChatId = Date.now().toString();
    let currentImageCount = 0;
    let currentAudioCount = 0;

    let isGeneratingAudio = false;

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;

    // Event listeners
    micButton.addEventListener('click', toggleRecording);
    uploadButton.addEventListener('click', () => audioUpload.click());
    audioUpload.addEventListener('change', handleAudioUpload);
    submitButton.addEventListener('click', handleSubmit);
    newChatButton.addEventListener('click', startNewChat);
    closeButton.addEventListener('click', closeErrorPopup);

    // Load chat history from localStorage
    loadChatHistory();

    function showLoader() {
        loader.style.display = 'block';
    }

    function hideLoader() {
        loader.style.display = 'none';
    }

    function disableButtons(disable = true) {
        [submitButton, micButton, uploadButton, imageCheckbox].forEach(button => {
            button.disabled = disable;
        });
    }

    function handleAudioUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('audio', file);

            showLoader();
            disableButtons();

            fetch('/api/text/transcribe/', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.transcription) {
                    addMessageToChat('user', data.transcription);
                    sendMessageToServer(data.transcription);
                } else {
                    showError('No transcription received');
                }
            })
            .catch(error => {
                console.error('Error uploading audio file:', error);
                showError('An error occurred during audio upload. Please try again.');
            })
            .finally(() => {
                hideLoader();
                disableButtons(false);
            });
        }
    }

    async function toggleRecording() {
        if (isRecording) {
            stopRecording();
        } else {
            await startRecording();
        }
    }

    async function startRecording() {
        try {
            disableButtons();
            showLoader();
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.addEventListener('dataavailable', event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                sendAudioToServer(audioBlob);
            });

            mediaRecorder.start();
            isRecording = true;
            micButton.textContent = '⏹️';
        } catch (error) {
            console.error('Error starting recording:', error);
            showError('Error starting recording. Please check console for details.');
        } finally {
            hideLoader();
            disableButtons(false);
        }
    }

    function stopRecording() {
        mediaRecorder.stop();
        isRecording = false;
        micButton.textContent = '🎤';
    }

    function sendAudioToServer(audioBlob) {
        const formData = new FormData();
        formData.append('audio', audioBlob);

        showLoader();
        disableButtons();

        fetch('/api/text/transcribe/', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.transcription) {
                addMessageToChat('user', data.transcription);
                sendMessageToServer(data.transcription);
            } else {
                showError('No transcription received');
            }
        })
        .catch(error => {
            console.error('Error sending audio to server:', error);
            showError('An error occurred during audio transcription. Please try again.');
        })
        .finally(() => {
            hideLoader();
            disableButtons(false);
        });
    }

    function handleSubmit() {
        const text = userInput.value.trim();
        if (text) {
            addMessageToChat('user', text);
            sendMessageToServer(text, imageCheckbox.checked);
            userInput.value = '';
        }
    }

    function sendMessageToServer(text, isImageRequest) {
        showLoader();
        disableButtons();
    
        fetch('/api/models/generate-text/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        })
        .then(response => response.json())
        .then(data => {
            if (data.generated_text) {
                addMessageToChat('ai', data.generated_text);
                addToHistory(text, data.generated_text);
                if (currentAudioCount < MAX_AUDIOS_PER_CHAT && !isGeneratingAudio) {
                    currentAudioCount++;
                    isGeneratingAudio = true;
                    return generateAudio(data.generated_text);
                }
            } else {
                showError('No generated text received');
            }
        })
        .then(() => {
            if (isImageRequest && currentImageCount < MAX_IMAGES_PER_CHAT) {
                return generateImage(text);
            }
        })
        .then(imageData => {
            if (imageData && imageData.image_base64) {
                console.log('Received image data, base64 length:', imageData.image_base64.length);
                addImageToChat(imageData.image_base64);
                currentImageCount++;
            } else if (imageData) {
                console.error('No valid image data received:', imageData);
            }
        })
        .catch(error => {
            console.error('Error during the generation process:', error);
            showError('An error occurred while generating the response. Please try again.');
        })
        .finally(() => {
            hideLoader();
            disableButtons(false);
            isGeneratingAudio = false;
        });
    }


    function generateImage(text) {
        if (text.length > 200) {
            return fetch('/api/models/generate-summary/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            })
            .then(response => response.json())
            .then(data => {
                if (data.summary_text) {
                    return fetch('/api/models/generate-image/', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text: data.summary_text })
                    }).then(response => response.json());
                } else {
                    throw new Error('No summary text received');
                }
            });
        } else {
            return fetch('/api/models/generate-image/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            }).then(response => response.json());
        }
    }

    function generateAudio(text) {
        return fetch('/api/speech/tts/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        })
        .then(response => response.blob())
        .then(blob => {
            const messageElement = chatHistory.lastElementChild;
            addAudioToMessage(messageElement, blob);
            return saveAudioToLocalStorage(blob);
        })
        .catch(error => {
            console.error('Error generating audio:', error);
            showError('An error occurred while generating audio. Please try again.');
        });
    }


    function addMessageToChat(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender + '-message');
        messageElement.textContent = message;

        const actionsElement = document.createElement('div');
        actionsElement.classList.add('message-actions');
        messageElement.appendChild(actionsElement);

        chatHistory.appendChild(messageElement);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function addAudioToMessage(messageElement, audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audioElement = document.createElement('audio');
        audioElement.src = audioUrl;
        audioElement.controls = true;

        const speakerButton = document.createElement('button');
        speakerButton.innerHTML = '🔊';
        speakerButton.addEventListener('click', () => audioElement.play());

        const downloadButton = document.createElement('button');
        downloadButton.innerHTML = '⬇️';
        downloadButton.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = audioUrl;
            link.download = `audio_${currentChatId}.wav`;
            link.click();
        });

        const actionsElement = messageElement.querySelector('.message-actions');
        actionsElement.appendChild(speakerButton);
        actionsElement.appendChild(downloadButton);
        actionsElement.appendChild(audioElement);
    }

    function addImageToChat(imageBase64) {
        const imgContainer = document.createElement('div');
        imgContainer.classList.add('image-container');
    
        const imgElement = document.createElement('img');
        imgElement.src = 'data:image/jpeg;base64,' + imageBase64;
        imgElement.alt = 'Generated Image';
        imgElement.classList.add('thumbnail');
        imgElement.addEventListener('click', () => {
            imgElement.classList.toggle('expanded');
        });
    
        const downloadButton = document.createElement('button');
        downloadButton.textContent = 'Download Image';
        downloadButton.addEventListener('click', () => downloadImage(imageBase64));
    
        imgContainer.appendChild(imgElement);
        imgContainer.appendChild(downloadButton);
        
        chatHistory.appendChild(imgContainer);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    
        saveImageToLocalStorage(imageBase64);
    }

    function downloadImage(imageBase64) {
        const link = document.createElement('a');
        link.href = 'data:image/jpeg;base64,' + imageBase64;
        link.download = `image_${currentChatId}_${Date.now()}.jpg`;
        link.click();
    }

    function addToHistory(input, output) {
        const chatData = { 
            id: currentChatId, 
            input, 
            output,
            timestamp: Date.now()
        };
        let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        history.push(chatData);
        localStorage.setItem('chatHistory', JSON.stringify(history));
        updateHistoryList();
    }

    function updateHistoryList() {
        historyList.innerHTML = '';
        const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        history.forEach(chat => {
            const listItem = document.createElement('li');
            listItem.textContent = chat.input.substring(0, 30) + '...';
            
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '🗑️';
            deleteButton.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteChat(chat.id);
            });
            
            listItem.appendChild(deleteButton);
            listItem.addEventListener('click', () => openChatHistory(chat.id));
            historyList.appendChild(listItem);
        });
    }

    function deleteChat(chatId) {
        let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        history = history.filter(chat => chat.id !== chatId);
        localStorage.setItem('chatHistory', JSON.stringify(history));
        updateHistoryList();
    }

    function openChatHistory(chatId) {
        const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        const chat = history.find(c => c.id === chatId);
        if (chat) {
            window.open(`history.html?id=${chatId}`, '_blank');
        }
    }

    function startNewChat() {
        chatHistory.innerHTML = '';
        userInput.value = '';
        currentChatId = Date.now().toString();
        currentImageCount = 0;
        currentAudioCount = 0;
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorPopup.style.display = 'block';
    }

    function closeErrorPopup() {
        errorPopup.style.display = 'none';
    }

    function saveAudioToLocalStorage(audioBlob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = function() {
                try {
                    const base64Audio = reader.result;
                    let audioStorage = JSON.parse(localStorage.getItem('audioStorage')) || {};
                    audioStorage[currentChatId] = base64Audio;
                    localStorage.setItem('audioStorage', JSON.stringify(audioStorage));
                    resolve(base64Audio);
                } catch (error) {
                    if (error.name === 'QuotaExceededError') {
                        console.warn('LocalStorage quota exceeded. Unable to save audio.');
                        showError('Unable to save audio due to storage limitations.');
                    } else {
                        reject(error);
                    }
                }
            }
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
        });
    }

    function saveImageToLocalStorage(imageBase64) {
        try {
            let imageStorage = JSON.parse(localStorage.getItem('imageStorage')) || {};
            if (!imageStorage[currentChatId]) {
                imageStorage[currentChatId] = [];
            }
            imageStorage[currentChatId].push(imageBase64);
            localStorage.setItem('imageStorage', JSON.stringify(imageStorage));
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('LocalStorage quota exceeded. Unable to save image.');
                showError('Unable to save image due to storage limitations.');
            } else {
                throw error;
            }
        }
    }

    function loadChatHistory() {
        const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        history.forEach(chat => {
            addMessageToChat('user', chat.input);
            addMessageToChat('ai', chat.output);
        });
        updateHistoryList();
    }

    function loadEntireChatHistory() {
        const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        const audioStorage = JSON.parse(localStorage.getItem('audioStorage')) || {};
        const imageStorage = JSON.parse(localStorage.getItem('imageStorage')) || {};

        chatHistory.innerHTML = ''; // Clear existing chat display

        history.forEach(chat => {
            if (chat.id === currentChatId) {
                addMessageToChat('user', chat.input);
                addMessageToChat('ai', chat.output);

                // Load associated audio
                if (audioStorage[chat.id]) {
                    const audioBlob = base64ToBlob(audioStorage[chat.id]);
                    addAudioToMessage(chatHistory.lastElementChild, audioBlob);
                }

                // Load associated images
                if (imageStorage[chat.id]) {
                    imageStorage[chat.id].forEach(imageBase64 => {
                        addImageToChat(imageBase64);
                    });
                }
            }
        });
    }

    function base64ToBlob(base64, mimeType = 'audio/wav') {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], {type: mimeType});
    }




    loadEntireChatHistory();
});