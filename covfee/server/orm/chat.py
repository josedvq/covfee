from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, List, Optional

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing_extensions import Annotated

from .base import Base

if TYPE_CHECKING:
    from .journey import JourneyInstance
    from .node import NodeInstance


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
        back_populates="chat", cascade="all,delete"
    )

    # one chat -> many chat messages
    messages: Mapped[List[ChatMessage]] = relationship(
        back_populates="chat", cascade="all,delete"
    )

    read_by_admin_at: Mapped[Optional[datetime.datetime]] = mapped_column()
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )

    def __init__(self, journey_or_node: JourneyInstance | NodeInstance):
        from .journey import JourneyInstance
        from .node import NodeInstance

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

        if "last_read" not in exclude:
            chat_dict["last_read"] = {
                assoc.journeyinstance_id.hex(): str(assoc.read_at)
                for assoc in self.journey_associations
            }

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

    def make_chat_update_payload(self):
        return {
            "id": self.chat_id,
            "messages": [self.to_dict()],
            "last_read": {
                assoc.journeyinstance_id.hex(): str(assoc.read_at)
                for assoc in self.chat.journey_associations
            },
            "read_by_admin_at": str(self.chat.read_by_admin_at),
        }
        
