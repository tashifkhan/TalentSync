import base64
import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.core.settings import get_settings

settings = get_settings()


def _get_key() -> bytes:
    """
    Retrieve the encryption key from settings.
    Ensures a valid 32-byte key is used for AES-256.
    """
    key_str = settings.ENCRYPTION_KEY
    if not key_str:
        raise ValueError(
            "ENCRYPTION_KEY must be set in configuration for encryption operations."
        )

    # We'll use SHA-256 to ensure we always have exactly 32 bytes,
    # regardless of what the user put in the env var (short password, long phrase, hex, etc.)
    return hashlib.sha256(key_str.encode("utf-8")).digest()


def encrypt_api_key(plaintext: str) -> str:
    """
    Encrypts an API key using AES-256-GCM.
    Returns a URL-safe base64 encoded string containing nonce + ciphertext + tag.
    """
    if not plaintext:
        return ""

    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    # encrypt returns ciphertext + tag
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)

    return base64.urlsafe_b64encode(nonce + ciphertext).decode("utf-8")


def decrypt_api_key(encrypted: str) -> str:
    """
    Decrypts an encrypted API key.
    Expects a URL-safe base64 encoded string containing nonce + ciphertext + tag.
    """
    if not encrypted:
        return ""

    key = _get_key()
    aesgcm = AESGCM(key)

    try:
        data = base64.urlsafe_b64decode(encrypted)
        if len(data) < 12:
            raise ValueError("Invalid encrypted data length")

        nonce = data[:12]
        ciphertext = data[12:]
        plaintext = aesgcm.decrypt(nonce, ciphertext, None)
        return plaintext.decode("utf-8")
    except Exception as e:
        raise ValueError("Failed to decrypt API key") from e
