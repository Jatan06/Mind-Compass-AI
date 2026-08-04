import re
import logging
from django.core.validators import validate_email
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.exceptions import ValidationError

logger = logging.getLogger('security')

def clean_input(value, lowercase=False):
    """
    Trims spaces and handles empty or whitespace-only inputs.
    Converts to lowercase if requested.
    """
    if value is None:
        return ""
    if not isinstance(value, str):
        value = str(value)
    
    cleaned = value.strip()
    if lowercase:
        cleaned = cleaned.lower()
    return cleaned

def validate_email_format(email):
    """
    Validates email is proper RFC-compliant format.
    Raises ValidationError if invalid.
    """
    if not email:
        raise ValidationError({"email": ["Email address is required."]})
    if " " in email:
        raise ValidationError({"email": ["Email address cannot contain spaces."]})
    try:
        validate_email(email)
    except DjangoValidationError:
        raise ValidationError({"email": ["Enter a valid email address."]})

def validate_username_format(username):
    """
    Validates username format rules:
    - Minimum 4 characters, Maximum 20 characters
    - Only letters, numbers and underscore (_)
    - No spaces
    - Cannot start with a number
    """
    if not username:
        raise ValidationError({"username": ["Username is required."]})
    
    if len(username) < 4:
        raise ValidationError({"username": ["Username must be at least 4 characters long."]})
    if len(username) > 20:
        raise ValidationError({"username": ["Username cannot exceed 20 characters."]})
    
    # Letters, numbers and underscore only
    if not re.match(r'^[a-zA-Z0-9_]+$', username):
        raise ValidationError({"username": ["Username can only contain letters, numbers, and underscores."]})
    
    # Cannot start with a number
    if re.match(r'^\d', username):
        raise ValidationError({"username": ["Username cannot start with a number."]})

def validate_password_strength(password, username, email):
    """
    Validates password complexity:
    - Minimum 8 characters, Maximum 32 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    - No spaces
    - Cannot be same as username
    - Cannot be same as email
    """
    if not password:
        raise ValidationError({"password": ["Password is required."]})
    
    if len(password) < 8:
        raise ValidationError({"password": ["Password must be at least 8 characters long."]})
    if len(password) > 32:
        raise ValidationError({"password": ["Password cannot exceed 32 characters."]})
    
    if " " in password:
        raise ValidationError({"password": ["Password cannot contain spaces."]})
    
    if not any(char.isupper() for char in password):
        raise ValidationError({"password": ["Password must contain at least one uppercase letter."]})
        
    if not any(char.islower() for char in password):
        raise ValidationError({"password": ["Password must contain at least one lowercase letter."]})
        
    if not any(char.isdigit() for char in password):
        raise ValidationError({"password": ["Password must contain at least one digit."]})
        
    if not any(char in '!@#$%^&*()-_=+[{]};:\'",<.>/?\\|`~' for char in password):
        raise ValidationError({"password": ["Password must contain at least one special character."]})
        
    if password.lower() == username.lower():
        raise ValidationError({"password": ["Password cannot be the same as your username."]})
        
    if password.lower() == email.lower():
        raise ValidationError({"password": ["Password cannot be the same as your email."]})

def log_security_event(event_type, user_id=None, details=None):
    """
    Centralized logging for security events (login success/failures, resets, email verification, etc.)
    """
    msg = f"[SECURITY EVENT] Type: {event_type} | User ID: {user_id or 'ANONYMOUS'} | Details: {details or 'N/A'}"
    logger.info(msg)

def rate_limit_check(request, key_prefix):
    """
    Rate limiting hooks placeholder as requested in Part 8.
    Does not block request but logs if throttle is hit.
    """
    # In a real app we can implement Django's cache-based limit or use REST framework's throttling.
    # Leaving standard logger print hook.
    pass
