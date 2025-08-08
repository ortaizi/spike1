"""
Moodle Integration Configuration Settings
======================================

This module handles secure configuration for Moodle integration,
including authentication credentials and session management.
"""

import os
import logging
from dataclasses import dataclass
from typing import Optional
from dotenv import load_dotenv

# Load environment variables from .env.development
load_dotenv('/Users/ortaizi/Desktop/Spike/.env.development')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class MoodleCredentials:
    """Moodle authentication credentials."""
    username: str
    password: str
    base_url: str


@dataclass
class MoodleSessionConfig:
    """Moodle session configuration."""
    timeout: int = 3600000  # 1 hour in milliseconds
    retry_attempts: int = 3
    retry_delay: int = 5000  # 5 seconds in milliseconds
    request_delay: int = 2000  # 2 seconds in milliseconds
    user_agent: str = "Spike-Platform/1.0 (Moodle-Integration)"
    enable_ssl_verification: bool = True


class MoodleConfigManager:
    """Secure configuration manager for Moodle integration."""
    
    def __init__(self):
        self.credentials: Optional[MoodleCredentials] = None
        self.session_config = MoodleSessionConfig()
        self._load_environment_variables()
    
    def _load_environment_variables(self) -> None:
        """Load configuration from environment variables."""
        # Load session configuration
        self.session_config.timeout = int(os.getenv('MOODLE_SESSION_TIMEOUT', 3600000))
        self.session_config.retry_attempts = int(os.getenv('MOODLE_SESSION_RETRY_ATTEMPTS', 3))
        self.session_config.retry_delay = int(os.getenv('MOODLE_SESSION_RETRY_DELAY', 5000))
        self.session_config.request_delay = int(os.getenv('MOODLE_REQUEST_DELAY', 2000))
        self.session_config.user_agent = os.getenv('MOODLE_USER_AGENT', "Spike-Platform/1.0 (Moodle-Integration)")
        self.session_config.enable_ssl_verification = os.getenv('MOODLE_ENABLE_SSL_VERIFICATION', 'true').lower() == 'true'
        
        logger.info("Moodle session configuration loaded successfully")
    
    def set_credentials(self, username: str, password: str, base_url: str = "https://moodle.bgu.ac.il") -> None:
        """Set Moodle credentials."""
        self.credentials = MoodleCredentials(username=username, password=password, base_url=base_url)
        logger.info("Moodle credentials set successfully")
    
    def get_credentials(self) -> Optional[MoodleCredentials]:
        """Get current Moodle credentials."""
        return self.credentials
    
    def validate_credentials(self) -> bool:
        """Validate that credentials are set."""
        if not self.credentials:
            return False
        return bool(self.credentials.username and self.credentials.password)
    
    def get_session_config(self) -> MoodleSessionConfig:
        """Get session configuration."""
        return self.session_config
    
    def to_dict(self) -> dict:
        """Convert configuration to dictionary."""
        return {
            "credentials": {
                "username": self.credentials.username if self.credentials else None,
                "password": "***" if self.credentials else None,
                "base_url": self.credentials.base_url if self.credentials else None
            },
            "session_config": {
                "timeout": self.session_config.timeout,
                "retry_attempts": self.session_config.retry_attempts,
                "retry_delay": self.session_config.retry_delay,
                "request_delay": self.session_config.request_delay,
                "user_agent": self.session_config.user_agent,
                "enable_ssl_verification": self.session_config.enable_ssl_verification
            }
        }


# Global configuration manager instance
config_manager = MoodleConfigManager()


def get_config() -> MoodleConfigManager:
    """Get the global configuration manager instance."""
    return config_manager


def setup_credentials_from_env(env_prefix: str = "BGU") -> None:
    """Setup credentials from environment variables with given prefix."""
    username = os.getenv(f'{env_prefix}_MOODLE_USERNAME')
    password = os.getenv(f'{env_prefix}_MOODLE_PASSWORD')
    base_url = os.getenv(f'{env_prefix}_MOODLE_URL', "https://moodle.bgu.ac.il")
    
    if username and password:
        config_manager.set_credentials(username, password, base_url)
        logger.info(f"Moodle credentials loaded from environment with prefix: {env_prefix}")
    else:
        logger.warning(f"Missing {env_prefix}_MOODLE_USERNAME or {env_prefix}_MOODLE_PASSWORD") 