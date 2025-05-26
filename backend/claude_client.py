from dotenv import load_dotenv
from anthropic import Anthropic
import os

load_dotenv()

# Initialize Claude client
client_ant = Anthropic(
    api_key=os.getenv("CLAUDE_API_KEY")
)

def test_claude_connection():
    """Test if Claude API is working"""
    try:
        response = client_ant.messages.create(
            model="claude-3-haiku-20240307",  # Updated to match main file
            max_tokens=50,
            messages=[{"role": "user", "content": "Hello, respond with 'API working!'"}]
        )
        return True, response.content[0].text
    except Exception as e:
        return False, str(e)