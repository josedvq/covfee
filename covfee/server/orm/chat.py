from typing import Annotated, Any, Dict, List, TYPE_CHECKING, Optional
import enum
import datetime

from sqlalchemy import Table, Column, ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

from .base import Base
from . import utils

if TYPE_CHECKING:
    from .node import NodeInstance
    from .journey import JourneyInstance

class Chat(Base):
    __tablename__ = "chats"
    id: Mapped[int] = mapped_column(primary_key=True)

    # chat can be attached to a node or to a Journey 
    node_id: Mapped[Optional[int]] = mapped_column(ForeignKey("node.id"))
    node: Mapped[Optional[NodeInstance]] = relationship(back_populates="chat")

    journey_id: Mapped[Optional[int]] = mapped_column(ForeignKey("journey.id"))
    journey: Mapped[Optional[JourneyInstance]] = relationship(back_populates="chat")

    # one chat -> many chat messages
    messages: Mapped[List[ChatMessage]] = relationship(back_populates="chat")

    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )

    def __init__():
        super().__init__()
        pass

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    
    chat_id: Mapped[int] = mapped_column(ForeignKey("chat.id"))
    chat: Mapped[Chat] = relationship(back_populates="messages")

    message: Mapped[Annotated[str, 2048]]

    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )

    def __init__(self):
        super().__init__()
