from app.core.settings import get_settings

settings = get_settings()

# Backward compatibility
google_api_key = settings.GOOGLE_API_KEY
