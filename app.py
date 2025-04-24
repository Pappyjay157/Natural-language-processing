from fastapi import FastAPI, WebSocket, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, pipeline
import uvicorn
import logging
from typing import Any, Dict
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

# Initialize FastAPI app
app = FastAPI()

# Mount static files (CSS, JS)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load Jinja2 Templates
templates = Jinja2Templates(directory="templates")

# Load a Text Generation Model
model_id = "t5-base"  # Using T5 for text generation
tokenizer = AutoTokenizer.from_pretrained(model_id)
model = AutoModelForSeq2SeqLM.from_pretrained(model_id)
generator = pipeline("text2text-generation", model=model, tokenizer=tokenizer)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Predefined responses for common intents
greetings = ["hi", "hello", "hey"]
farewells = ["bye", "goodbye", "see you"]
greeting_responses = ["Hello! How can I assist you with programming today?", "Hi there! What do you need help with?"]
farewell_responses = ["Goodbye! Feel free to ask if you have more questions.", "See you later! Happy coding!"]
out_of_scope_response = "I'm here to help with programming questions. Is there something specific you need assistance with?"

# Setup SQLAlchemy
DATABASE_URL = "sqlite:///./chatbot.db"  # Use SQLite for simplicity, you can use PostgreSQL or MySQL if needed
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Define the Conversation model
Base = declarative_base()

class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_input = Column(Text, index=True)
    bot_response = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)

# Create the database tables if they don't exist
Base.metadata.create_all(bind=engine)

# Maintain conversation history
conversation_history = []

# Serve Frontend
@app.get("/")
async def serve_frontend(request: Request) -> Any:
    return templates.TemplateResponse("index.html", {"request": request})

# WebSocket for real-time chat
connected_clients = set()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    connected_clients.add(websocket)
    logger.info(f"WebSocket connected: {websocket.client}")

    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received: {data}")

            if not data.strip():
                continue

            response = chat_with_model(data)

            if response:
                await websocket.send_text(response)
                logger.info(f"Sent: {response}")

    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
    finally:
        connected_clients.remove(websocket)
        logger.info(f"WebSocket disconnected: {websocket.client}")

# Function to Generate AI Response
def chat_with_model(user_input: str) -> str:
    """Generate a response using the model with prompt tuning and intent recognition."""
    try:
        # Check for greetings and farewells
        if user_input.lower() in greetings:
            return greeting_responses[0]  # Return a predefined greeting response
        if user_input.lower() in farewells:
            return farewell_responses[0]  # Return a predefined farewell response

        # Add user input to conversation history
        conversation_history.append(f"User: {user_input}")

        # Limit conversation history to the last few messages
        recent_history = " ".join(conversation_history[-3:])

        # Design a prompt to guide the model's response
        prompt = f"Based on the conversation: {recent_history}, provide a helpful response to the user's last input."
        response = generator(prompt, max_length=150, num_return_sequences=1)

        # Post-process the response
        generated_text = response[0]['generated_text']

        # Check if the response is out of scope
        if "I'm here to help with programming questions" in generated_text:
            return out_of_scope_response

        # Add the response to conversation history
        conversation_history.append(f"Bot: {generated_text}")

        # Store conversation in the database
        store_conversation(user_input, generated_text)

        return generated_text
    except Exception as e:
        logger.error(f"Error generating response: {e}")
        return f"Error: {str(e)}"

# Function to store conversations in the database
def store_conversation(user_input: str, bot_response: str) -> None:
    """Store conversation in the SQL database."""
    db = SessionLocal()
    try:
        conversation = Conversation(user_input=user_input, bot_response=bot_response)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
        logger.info(f"Stored conversation: {conversation.id}")
    except Exception as e:
        logger.error(f"Error storing conversation: {e}")
        db.rollback()
    finally:
        db.close()

# API Route for Text-Based Chat (Optional)
@app.post("/chat")
async def chat_endpoint(request: Request) -> JSONResponse:
    """Handles chat requests from frontend."""
    try:
        request_data: Dict[str, Any] = await request.json()
        user_input = request_data.get("message", "").strip()

        if not user_input:
            return JSONResponse(content={"response": "Please enter a message."}, status_code=400)

        response_text = chat_with_model(user_input)
        return JSONResponse(content={"response": response_text})

    except Exception as e:
        logger.error(f"Chat Error: {e}")
        return JSONResponse(content={"response": "Oops! Something went wrong. Try again later."}, status_code=500)

# Run FastAPI App
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
