import openai

# Set OpenAI API key directly (Not recommended for production)
openai.api_key = "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"  # Replace with your actual API key

try:
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",  # Use GPT-3.5 to check access
        messages=[{"role": "system", "content": "Say hello"}]
    )
    print("✅ API is working:", response.choices[0].message.content)
except openai.AuthenticationError:
    print("❌ Invalid API Key!")
except openai.OpenAIError as e:
    print(f"❌ OpenAI API Error: {str(e)}")
except Exception as e:
    print(f"❌ General Error: {str(e)}")
