from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker


def get_engine(in_memory=False, db_path=None, echo=False):
    if in_memory:
        print(f"Creating in-memory engine")
        return create_engine(
            "sqlite:///file:test?mode=memory&cache=shared&uri=true",
            connect_args={"check_same_thread": False},
            echo=echo,
        )
    else:
        assert db_path is not None
        print(f"Creating file system engine at {db_path}")
        return create_engine(f"sqlite:///{db_path}")


def get_session_local(engine=None, **kwargs):
    engine = get_engine(**kwargs) if engine is None else engine
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)
