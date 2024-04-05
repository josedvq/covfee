from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
import datetime
from .base import Base
from typing import Optional


class Annotator(Base):
    """
    Links an annotator to a single journey instance
    """

    __tablename__ = "annotators"

    # A unique identifier for the annotator row
    id: Mapped[int] = mapped_column(primary_key=True)
    # A user id provided by the Prolific academic platform
    prolific_id: Mapped[str] = mapped_column(unique=True)
    # A reference to the journey instance the annotator is working on
    journey_instance_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("journeyinstances.id")
    )
    # The journey instance the annotator is working on
    journey_instance: Mapped[Optional["JourneyInstance"]] = relationship(
        "JourneyInstance",
        back_populates="annotator",
        foreign_keys=[journey_instance_id],
    )
    # The time the annotator row was created, expected to be the time the annotator was first linked
    # to a journey instance.
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)

    def __repr__(self) -> str:
        journey_instance_id = (
            self.journey_instance_id.hex() if self.journey_instance_id else "?"
        )
        expired_journey_instance_id = (
            self.expired_journey_instance_id.hex()
            if self.expired_journey_instance_id
            else "?"
        )
        created_at = self.created_at.isoformat() if self.created_at else "?"
        return f"Annotator(id={self.id}, prolific_id={self.prolific_id}, journey_instance_id={journey_instance_id}, created_at={created_at}, expired_journey_instance_id={expired_journey_instance_id})"
