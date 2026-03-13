import os

class Config:
    DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://localhost/flatmate_finder")

class TestConfig(Config):
    DATABASE_URL = "postgresql://localhost/flatmate_finder_test"