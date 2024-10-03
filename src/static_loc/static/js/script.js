// script.js
// Global variables
let currentChatCode = localStorage.getItem('currentChatCode');
let isRecording = false;
let mediaRecorder;
let audioChunks = [];

// DOM elements
const chatHistory = document.getElementById('chatHistory');
const userInput = document.getElementById('userInput');
const submitButton = document.getElementById('submitButton');
const micButton = document.getElementById('micButton');
const uploadButton = document.getElementById('uploadButton');
const audioUpload = document.getElementById('audioUpload');
const imageCheckbox = document.getElementById('imageCheckbox');
const historyList = document.getElementById('historyList');
const newChatButton = document.getElementById('newChatButton');
const loader = document.getElementById('loader');
const errorPopup = document.getElementById('errorPopup');
const errorMessage = document.getElementById('errorMessage');

// Initialize the chat interface
async function initChat() {
    submitButton.addEventListener('click', handleSubmit);
    micButton.addEventListener('click', toggleRecording);
    uploadButton.addEventListener('click', () => audioUpload.click());
    audioUpload.addEventListener('change', handleAudioUpload);
    newChatButton.addEventListener('click', startNewChat);

    if (!currentChatCode) {
        await createNewChat();
    }

    await fetchChatHistory();
    await updateHistoryList();
}
// Create a new chat
async function createNewChat() {
    try {
        const response = await fetch('/api/text/chat/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify({ title: "New chat" })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        currentChatCode = data.code;
        localStorage.setItem('currentChatCode', currentChatCode);
    } catch (error) {
        showError('Error creating new chat: ' + error.message);
    }
}

// Handle form submission
async function handleSubmit() {
    const text = userInput.value.trim();
    const generateImage = imageCheckbox.checked;

    if (text) {
        await sendMessage(text, null, generateImage);
        userInput.value = '';
    }
}

// Send message to the API
async function sendMessage(text, audioBlob, generateImage) {
    showLoader();

    const formData = new FormData();
    formData.append('input_type', audioBlob ? 'audio' : 'text');
    formData.append('generate_image', generateImage);

    if (audioBlob) {
        formData.append('audio', audioBlob, 'audio.wav');
    } else {
        formData.append('input_content', text);
    }

    formData.append('chat_code', currentChatCode);

    try {
        const response = await fetch('/api/text/chat/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Display the new message
        displayMessage(text, true);
        displayMessage(data.output_text, false);

        // Display any new audio or image files
        if (data.files) {
            data.files.forEach(file => {
                if (file.output_audio) {
                    displayAudioPlayer(file.output_audio);
                }
                if (file.output_image) {
                    displayImage(file.output_image);
                }
            });
        }

        // Scroll to the bottom of the chat history
        chatHistory.scrollTop = chatHistory.scrollHeight;

        await updateHistoryList();

    } catch (error) {
        showError('Error sending message: ' + error.message);
    } finally {
        hideLoader();
    }
}

// Delete a chat
async function deleteChat(chatCode) {
    try {
        const response = await fetch(`/api/text/chat/?chat_code=${chatCode}`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        await updateHistoryList();
    } catch (error) {
        showError('Error deleting chat: ' + error.message);
    }
}

// Load and display chat history
async function fetchChatHistory() {
    if (!currentChatCode) {
        chatHistory.innerHTML = '';
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

        chatHistory.innerHTML = ''; // Clear existing chat history

        if (data.history && data.history.length > 0) {
            // Sort history items by id in ascending order (oldest first)
            data.history.sort((a, b) => a.id - b.id);

            data.history.forEach((item) => {
                // Display messages in chat history (oldest first)
                displayMessage(item.input_text, true);
                displayMessage(item.output_text, false);

                // Display audio and image files if present
                if (item.files) {
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
        }

        // Scroll to the bottom of the chat history
        chatHistory.scrollTop = chatHistory.scrollHeight;
    } catch (error) {
        showError('Error fetching chat history. "Fix:" Try creating a new chat: ' + error.message);
    }
}

// Update history list
async function updateHistoryList() {
    try {
        const response = await fetch('/api/text/querychat/list_chats/', {
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const chats = await response.json();

        historyList.innerHTML = ''; // Clear existing history list

        if (chats && chats.length > 0) {
            // Sort chats by updated_at field in descending order (most recent first)
            const sortedChats = chats.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

            sortedChats.forEach((chat) => {
                const li = document.createElement('li');
                
                // Create a span for the chat title
                const titleSpan = document.createElement('span');
                titleSpan.textContent = chat.title || 'Untitled Chat';
                titleSpan.classList.add('chat-title');
                
                // Create a span for the last update time
                const timeSpan = document.createElement('span');
                const updateTime = new Date(chat.updated_at);
                timeSpan.textContent = updateTime.toLocaleString(); // Format date as per local settings
                timeSpan.classList.add('chat-time');

                // Append both spans to the list item
                li.appendChild(titleSpan);
                li.appendChild(timeSpan);

                li.addEventListener('click', () => {
                    openChatHistory(chat.code);
                });
                historyList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'No chat history available';
            historyList.appendChild(li);
        }
    } catch (error) {
        showError('Error updating history list: ' + error.message);
    }
}
// Open chat history in a new window
function openChatHistory(chatCode) {
    const historyWindow = window.open('history.html', '_blank');
    historyWindow.onload = () => {
        historyWindow.postMessage({ chatCode: chatCode }, '*');
    };
}

// Start a new chat session
async function startNewChat() {
    currentChatCode = null;
    localStorage.removeItem('currentChatCode');
    chatHistory.innerHTML = '';
    await createNewChat();
    await fetchChatHistory();
    await updateHistoryList();
}







// Toggle audio recording
function toggleRecording() {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

// Start audio recording
function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                sendMessage(null, audioBlob, imageCheckbox.checked);
                audioChunks = [];
            };
            mediaRecorder.start();
            isRecording = true;
            micButton.textContent = '⏹️';
        })
        .catch(error => showError('Error accessing microphone: ' + error.message));
}

// Stop audio recording
function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
    micButton.textContent = '🎤';
}

// Handle audio file upload
function handleAudioUpload(event) {
    const file = event.target.files[0];
    if (file) {
        sendMessage(null, file, imageCheckbox.checked);
    }
    event.target.value = ''; // Clear the input after upload
}

// Display message in chat history
function displayMessage(message, isUser) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', isUser ? 'user-message' : 'ai-message');
    messageDiv.textContent = message;
    chatHistory.appendChild(messageDiv);
}

function getMediaUrl(path) {
    let url;
    if (path.startsWith('/media/')) {
        url = path;
    } else {
        url = '/media/' + path;
    }
    console.log('Constructed media URL:', url);
    return url;
}

// Updated display audio player function with error handling
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
    downloadButton.textContent = 'Download';
    downloadButton.classList.add('download-button');
    downloadButton.addEventListener('click', () => {
        const link = document.createElement('a');
        link.href = fullAudioUrl;
        link.download = 'audio.wav';
        link.click();
    });

    audioContainer.appendChild(audio);
    audioContainer.appendChild(downloadButton);
    chatHistory.appendChild(audioContainer);
}

// Updated display image function
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
    chatHistory.appendChild(imageContainer);

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
    downloadButton.textContent = 'Download';
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
// Show loading animation
function showLoader() {
    loader.style.display = 'block';
}

// Hide loading animation
function hideLoader() {
    loader.style.display = 'none';
}

// Display error messages
function showError(message) {
    errorMessage.textContent = message;
    errorPopup.style.display = 'block';

    const closeButton = errorPopup.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        errorPopup.style.display = 'none';
    });
}

// Get CSRF token from cookies
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

// Initialize the chat interface when the page loads
window.addEventListener('load', initChat);
