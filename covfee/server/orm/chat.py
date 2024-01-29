from __future__ import annotations
from typing import Any, Dict, List, TYPE_CHECKING, Optional
from typing_extensions import Annotated
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
    node_id: Mapped[Optional[int]] = mapped_column(ForeignKey("nodeinstances.id"))
    node: Mapped[Optional[NodeInstance]] = relationship(back_populates="chat")

    journey_id: Mapped[Optional[bytes]] = mapped_column(
        ForeignKey("journeyinstances.id")
    )
    journey: Mapped[Optional[JourneyInstance]] = relationship(back_populates="chat")

    # journey association (many-to-many)
    # used to store info associated to (chat, journey) like read status
    journey_associations: Mapped[List[ChatJourney]] = relationship(
        back_populates="chat"
    )

    # one chat -> many chat messages
    messages: Mapped[List[ChatMessage]] = relationship(back_populates="chat")

    read_by_admin_at: Mapped[Optional[datetime.datetime]] = mapped_column()
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )

    def __init__(self, journey_or_node: JourneyInstance | NodeInstance):
        from .node import NodeInstance
        from .journey import JourneyInstance

        super().init()
        if isinstance(journey_or_node, JourneyInstance):
            self.journey = journey_or_node
            self.journey_associations.append(
                ChatJourney(journey=journey_or_node, chat=self)
            )
        elif isinstance(journey_or_node, NodeInstance):
            self.node = journey_or_node
            self.journey_associations = [
                ChatJourney(journey=j, chat=self) for j in journey_or_node.journeys
            ]
        else:
            raise ValueError()

    def to_dict(self, exclude=None):
        chat_dict = super().to_dict()
        if exclude is None:
            exclude = []
        if "messages" not in exclude:
            chat_dict["messages"] = [message.to_dict() for message in self.messages]

        if "assocs" not in exclude:
            chat_dict["assocs"] = [
                assoc.to_dict() for assoc in self.journey_associations
            ]

        return chat_dict


class ChatJourney(Base):
    __tablename__ = "chat_journey"
    journeyinstance_id: Mapped[bytes] = mapped_column(
        ForeignKey("journeyinstances.id"), primary_key=True
    )
    chat_id: Mapped[int] = mapped_column(ForeignKey("chats.id"), primary_key=True)

    journey: Mapped[JourneyInstance] = relationship(back_populates="chat_associations")
    chat: Mapped[Chat] = relationship(back_populates="journey_associations")

    read_at: Mapped[Optional[datetime.datetime]] = mapped_column()


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)

    chat_id: Mapped[int] = mapped_column(ForeignKey("chats.id"))
    chat: Mapped[Chat] = relationship(back_populates="messages")

    message: Mapped[Annotated[str, 2048]]

    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)

    def __init__(self, message):
        super().init()
        self.message = message
