document.addEventListener("DOMContentLoaded", function () {
    applySavedTheme();
    connectWebSocket();

    // Attach event listeners
    document.getElementById("themeToggle").addEventListener("click", toggleTheme);
    document.getElementById("userInput").addEventListener("keypress", handleKeyPress);

    // 🎤 Attach mic button
    const micBtn = document.createElement("button");
    micBtn.id = "micButton";
    micBtn.innerHTML = "🎤";
    micBtn.setAttribute("aria-label", "Start Voice Input");
    document.querySelector(".input-container").appendChild(micBtn);
    micBtn.addEventListener("click", startVoiceInput);
});

// ✅ WebSocket Connection
let socket;
let isReconnecting = false;

function connectWebSocket() {
    socket = new WebSocket("ws://127.0.0.1:8000/ws");

    socket.onopen = function () {
        console.log("✅ WebSocket Connected");
        isReconnecting = false;
    };

    socket.onmessage = function (event) {
        addBotMessage(event.data);
    };

    socket.onerror = function (error) {
        console.error("❌ WebSocket Error:", error);
    };

    socket.onclose = function (event) {
        console.warn(`⚠ WebSocket Closed (${event.code}). Reconnecting...`);
        if (!isReconnecting) {
            isReconnecting = true;
            setTimeout(connectWebSocket, 3000);
        }
    };
}

// ✅ Send Message
function sendMessage() {
    const userInputField = document.getElementById("userInput");
    const userInput = userInputField.value.trim();
    if (!userInput) return;

    const chatContainer = document.getElementById("chatContainer");

    const userMsg = document.createElement("p");
    userMsg.classList.add("chat-message", "user-message");
    userMsg.innerHTML = `<b>You:</b> ${userInput}`;
    chatContainer.appendChild(userMsg);
    scrollToBottom();

    userInputField.value = "";

    const botMsgContainer = document.createElement("p");
    botMsgContainer.classList.add("chat-message", "bot-message");
    botMsgContainer.innerHTML = `<b>AyoBot:</b> <span class='typing-effect'></span>`;
    chatContainer.appendChild(botMsgContainer);

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(userInput);
    } else {
        console.error("❌ WebSocket not connected.");
        botMsgContainer.innerHTML = `<b>AyoBot:</b> 😞 Oops! Something went wrong.`;
    }

    scrollToBottom();
}

// ✅ Bot Reply Typing Effect
function addBotMessage(message) {
    const chatContainer = document.getElementById("chatContainer");

    const botMsgContainer = document.createElement("p");
    botMsgContainer.classList.add("chat-message", "bot-message");
    botMsgContainer.innerHTML = `<b>AyoBot:</b> <span class='typing-effect'></span>`;
    chatContainer.appendChild(botMsgContainer);

    const typingSpan = botMsgContainer.querySelector(".typing-effect");
    let i = 0;

    function typeWriter() {
        if (i < message.length) {
            typingSpan.innerHTML += message.charAt(i);
            i++;
            setTimeout(typeWriter, 30);
        } else {
            typingSpan.style.borderRight = "none";
        }
    }

    setTimeout(typeWriter, 300);
    setTimeout(scrollToBottom, message.length * 30 + 300);
}

// ✅ Handle Enter Key
function handleKeyPress(event) {
    if (event.key === "Enter") {
        sendMessage();
        event.preventDefault();
    }
}

// ✅ Scroll to Bottom
function scrollToBottom() {
    const chatContainer = document.getElementById("chatContainer");
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ✅ Theme Management
function toggleTheme() {
    document.body.classList.toggle("light-mode");
    const isLight = document.body.classList.contains("light-mode");
    localStorage.setItem("theme", isLight ? "light" : "dark");
    updateThemeStyles(isLight);
}

function applySavedTheme() {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        updateThemeStyles(true);
    }
}

function updateThemeStyles(isLightMode) {
    const chatContainer = document.getElementById("chatContainer");
    const userInput = document.getElementById("userInput");

    if (isLightMode) {
        chatContainer.style.backgroundColor = "#f0f0f0";
        userInput.style.backgroundColor = "#e0e0e0";
    } else {
        chatContainer.style.backgroundColor = "";
        userInput.style.backgroundColor = "";
    }
}

// ✅ 🎤 Voice Input with Web Speech API
function startVoiceInput() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
        alert("Voice input is not supported in this browser.");
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();

    recognition.onstart = function () {
        document.getElementById("micButton").innerText = "🎙️";
    };

    recognition.onresult = function (event) {
        const transcript = event.results[0][0].transcript;
        document.getElementById("userInput").value = transcript;
        sendMessage();
    };

    recognition.onerror = function (event) {
        console.error("Speech Recognition Error:", event.error);
        alert("Speech recognition error: " + event.error);
    };

    recognition.onend = function () {
        document.getElementById("micButton").innerText = "🎤";
    };
}
// ✅ Voice Recognition Setup with Debug Logs
let recognition;

if ('webkitSpeechRecognition' in window) {
    console.log("✅ Web Speech API supported. Initializing...");
    alert("✅ Web Speech API supported. Initializing...");

    recognition = new webkitSpeechRecognition(); // Chrome-only
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
        console.log("🎙️ Voice recognition started. Speak now.");
        alert("🎙️ Listening... Speak now!");
        document.getElementById("micButton").textContent = "🎙️";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        console.log("📢 Transcript captured:", transcript);
        alert("📢 Heard: " + transcript);
        document.getElementById("userInput").value = transcript;
        sendMessage();
    };

    recognition.onerror = (event) => {
        console.error("❌ Speech recognition error:", event.error);
        alert("❌ Error during recognition: " + event.error);
    };

    recognition.onend = () => {
        console.log("🛑 Voice recognition ended.");
        alert("🛑 Voice recognition stopped.");
        document.getElementById("micButton").textContent = "🎤";
    };
} else {
    console.error("❌ Web Speech API not supported in this browser.");
    alert("❌ Web Speech API not supported in your browser.");
}

// ✅ Mic Button Event
document.getElementById("micButton").addEventListener("click", () => {
    console.log("🎤 Mic button clicked.");
    alert("🎤 Mic button clicked.");
    if (recognition) {
        recognition.start();
    } else {
        alert("❌ Recognition object not available.");
    }
});

