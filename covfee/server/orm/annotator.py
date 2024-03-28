
from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


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
    journey_instance_id: Mapped[int] = mapped_column(ForeignKey("journeyinstances.id"))
    # The journey instance the annotator is working on
    journey_instance: Mapped["JourneyInstance"] = relationship(back_populates="annotator")


    def __repr__(self) -> str:
        journey_instance_id = self.journey_instance_id.hex() if self.journey_instance_id else "None"
        return f"Annotator(id={self.id}, prolific_id={self.prolific_id}, journey_instance_id={journey_instance_id})"