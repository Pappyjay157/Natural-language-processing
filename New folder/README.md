# Ayobot – AI-Powered Chatbot with NLP

**Ayobot** is a conversational chatbot built using Python and Natural Language Processing (NLP) techniques. Designed to simulate human-like interactions, Ayobot can handle user queries and provide appropriate responses, making it suitable for applications like customer support, virtual assistants, and educational tools.

## 🔧 Features

- **Natural Language Understanding**: Processes and interprets user inputs to generate meaningful responses.
- **Interactive Chat Interface**: Engages users in real-time conversations through a user-friendly interface.
- **Customizable Responses**: Easily adaptable to different domains by modifying the response patterns.
- **Lightweight and Efficient**: Minimal dependencies ensure quick deployment and execution.

## 📁 Project Structure

├── app.py # Main application script to run the chatbot
├── simple_chatbot.py # Core logic for processing user inputs and generating responses
├── chatbot.db # SQLite database for storing conversation data
├── templates/
│ └── index.html # HTML template for the chat interface
├── static/
│ ├── style.css # CSS styles for the chat interface
│ └── script.js # JavaScript for handling user interactions
└── README.md # Project documentation

## 🚀 Getting Started

### Prerequisites

- Python 3.x
- Flask

### Installation

```bash
git clone https://github.com/Pappyjay157/Natural-language-processing.git
cd Natural-language-processing
pip install flask
python app.py
Then go to http://127.0.0.1:5000/ in your browser.

🧠 How It Works
Ayobot uses simple NLP to match user inputs to predefined responses. It stores conversations in SQLite and serves a real-time chat UI using Flask.

🤝 Contributing
Contributions are welcome! Fork the repo, make your changes, and open a pull request.

📄 License
This project is licensed under the MIT License.
