// history.js
document.addEventListener('DOMContentLoaded', function() {
    const historyContent = document.getElementById('historyContent');
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('id');

    if (chatId) {
        loadChat(chatId);
    } else {
        historyContent.textContent = 'No chat selected.';
    }

    function loadChat(chatId) {
        const history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        const chat = history.find(c => c.id === chatId);
        
        if (chat) {
            addMessageToHistory('user', chat.input);
            addMessageToHistory('ai', chat.output);
            
            // Load associated audio
            const audioStorage = JSON.parse(localStorage.getItem('audioStorage')) || {};
            if (audioStorage[chatId]) {
                try {
                    const audioBlob = base64ToBlob(audioStorage[chatId], 'audio/wav');
                    addAudioToMessage(historyContent.lastElementChild, audioBlob);
                } catch (error) {
                    console.error('Error loading audio:', error);
                }
            }
            
            // Load associated images
            const imageStorage = JSON.parse(localStorage.getItem('imageStorage')) || {};
            if (imageStorage[chatId]) {
                imageStorage[chatId].forEach(imageBase64 => {
                    try {
                        addImageToHistory(imageBase64);
                    } catch (error) {
                        console.error('Error loading image:', error);
                    }
                });
            }

            // Add delete button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete Chat';
            deleteButton.addEventListener('click', () => deleteChat(chatId));
            historyContent.appendChild(deleteButton);
        } else {
            historyContent.textContent = 'Chat not found.';
        }
    }

    function deleteChat(chatId) {
        let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
        history = history.filter(chat => chat.id !== chatId);
        localStorage.setItem('chatHistory', JSON.stringify(history));

        // Delete associated audio
        let audioStorage = JSON.parse(localStorage.getItem('audioStorage')) || {};
        delete audioStorage[chatId];
        localStorage.setItem('audioStorage', JSON.stringify(audioStorage));

        // Delete associated images
        let imageStorage = JSON.parse(localStorage.getItem('imageStorage')) || {};
        delete imageStorage[chatId];
        localStorage.setItem('imageStorage', JSON.stringify(imageStorage));

        window.close();
    }

    function addMessageToHistory(sender, message) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender + '-message');
        messageElement.textContent = message;

        const actionsElement = document.createElement('div');
        actionsElement.classList.add('message-actions');
        messageElement.appendChild(actionsElement);

        historyContent.appendChild(messageElement);
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
            link.download = 'audio.wav';
            link.click();
        });

        const actionsElement = messageElement.querySelector('.message-actions');
        actionsElement.appendChild(speakerButton);
        actionsElement.appendChild(downloadButton);
        actionsElement.appendChild(audioElement);
    }

    function addImageToHistory(imageBase64) {
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
        downloadButton.addEventListener('click', () => {
            const link = document.createElement('a');
            link.href = 'data:image/jpeg;base64,' + imageBase64;
            link.download = 'generated_image.jpg';
            link.click();
        });

        imgContainer.appendChild(imgElement);
        imgContainer.appendChild(downloadButton);
        
        historyContent.appendChild(imgContainer);
    }

    function base64ToBlob(base64, mimeType) {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], {type: mimeType});
    }
});