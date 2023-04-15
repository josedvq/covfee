from typing import Any, Dict
from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.orm import MappedAsDataclass
from sqlalchemy.types import JSON

engine = create_engine(
    # 'sqlite:///./test.db'
    'sqlite:///file:test?mode=memory&cache=shared&uri=true',
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# class Base(MappedAsDataclass, DeclarativeBase):
#     type_annotation_map = {
#         Dict[str, Any]: JSON
#     }