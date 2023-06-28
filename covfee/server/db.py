from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

engine = create_engine(
    # 'sqlite:///./test.db'
    "sqlite:///file:test?mode=memory&cache=shared&uri=true",
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
