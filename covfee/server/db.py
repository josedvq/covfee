from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import declarative_base, sessionmaker

engine = create_engine(
    # 'sqlite:///./test.db'
    'sqlite:///file:test?mode=memory&cache=shared&uri=true'
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()