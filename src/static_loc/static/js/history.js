let currentChatCode;

// DOM elements
const historyContent = document.getElementById('historyContent');
const deleteButton = document.getElementById('deleteButton');

// Initialize the history page
function initHistoryPage() {
    window.addEventListener('message', (event) => {
        if (event.data.chatCode) {
            currentChatCode = event.data.chatCode;
            fetchChatHistory();
        }
    });

    deleteButton.addEventListener('click', deleteChat);
}

// Fetch and display chat history
async function fetchChatHistory() {
    if (!currentChatCode) {
        historyContent.innerHTML = 'No chat selected';
        return;
    }

    try {
        const response = await fetch(`/api/text/chat/?chat_code=${currentChatCode}&page=1&per_page=100`, {
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        historyContent.innerHTML = ''; // Clear existing content

        if (data.history && data.history.length > 0) {
            // Sort history items by id in ascending order (oldest first)
            data.history.sort((a, b) => a.id - b.id);

            data.history.forEach((item) => {
                // Display user input
                displayMessage(item.input_text, true);

                // Display AI output
                displayMessage(item.output_text, false);

                // Display files (audio and images)
                if (item.files && item.files.length > 0) {
                    item.files.forEach(file => {
                        if (file.output_audio) {
                            displayAudioPlayer(file.output_audio);
                        }
                        if (file.output_image) {
                            displayImage(file.output_image);
                        }
                    });
                }
            });
        } else {
            historyContent.innerHTML = 'No messages in this chat';
        }
    } catch (error) {
        showError('Error fetching chat history: ' + error.message);
    }
}

// Display message in chat history
function displayMessage(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', isUser ? 'user-message' : 'ai-message');
    messageDiv.textContent = message;
    historyContent.appendChild(messageDiv);
}

// Display audio player
function displayAudioPlayer(audioUrl) {
    const audioContainer = document.createElement('div');
    audioContainer.classList.add('audio-container');

    const audio = document.createElement('audio');
    audio.controls = true;
    const fullAudioUrl = getMediaUrl(audioUrl);
    audio.src = fullAudioUrl;

    audio.onerror = function() {
        console.error('Error loading audio:', fullAudioUrl);
        showError(`Error loading audio: ${fullAudioUrl}`);
    };

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Audio';
    downloadButton.classList.add('download-button');
    downloadButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = fullAudioUrl;
        link.download = 'audio.wav';
        link.click();
    });

    audioContainer.appendChild(audio);
    audioContainer.appendChild(downloadButton);
    historyContent.appendChild(audioContainer);
}

// Display image
function displayImage(imageUrl) {
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('image-container');

    const img = document.createElement('img');
    const fullImageUrl = getMediaUrl(imageUrl);
    img.src = fullImageUrl;
    img.alt = 'Generated Image';
    img.classList.add('image-thumbnail');

    img.onerror = function() {
        console.error('Error loading image:', fullImageUrl);
        showError(`Error loading image: ${fullImageUrl}`);
    };

    imageContainer.appendChild(img);
    historyContent.appendChild(imageContainer);

    // Create fullscreen overlay
    const overlay = document.createElement('div');
    overlay.classList.add('fullscreen-overlay');
    const fullscreenImg = document.createElement('img');
    fullscreenImg.src = fullImageUrl;
    fullscreenImg.alt = 'Fullscreen Image';
    fullscreenImg.classList.add('fullscreen-image');
    overlay.appendChild(fullscreenImg);
    document.body.appendChild(overlay);

    // Add click event to show fullscreen
    img.addEventListener('click', () => {
        overlay.style.display = 'flex';
    });

    // Add click event to hide fullscreen
    overlay.addEventListener('click', () => {
        overlay.style.display = 'none';
    });

    const downloadButton = document.createElement('button');
    downloadButton.textContent = 'Download Image';
    downloadButton.classList.add('download-button');
    downloadButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent triggering the fullscreen view
        const link = document.createElement('a');
        link.href = fullImageUrl;
        link.download = 'image.jpg';
        link.click();
    });

    imageContainer.appendChild(downloadButton);
}

// Delete chat
async function deleteChat() {
    if (!currentChatCode) {
        showError('No chat selected');
        return;
    }

    if (confirm('Are you sure you want to delete this chat?')) {
        try {
            const response = await fetch(`/api/text/chat/?chat_code=${currentChatCode}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': getCookie('csrftoken')
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            window.close();
        } catch (error) {
            showError('Error deleting chat: ' + error.message);
        }
    }
}

// Helper functions
function getMediaUrl(path) {
    return path.startsWith('/media/') ? path : '/media/' + path;
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showError(message) {
    alert(message); // For simplicity, using alert for error messages in the history page
}

// Initialize the history page when it loads
window.addEventListener('load', initHistoryPage);