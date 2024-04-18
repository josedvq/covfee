from __future__ import annotations

import json
from pprint import pformat
from typing import TYPE_CHECKING, List

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.orm import Mapped, mapped_column, relationship

# from ..db import Base
from .base import Base

if TYPE_CHECKING:
    from .hit import HITSpec


class Project(Base):
    __tablename__ = "projects"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]

    # one project -> many HitSpec
    hitspecs: Mapped[List[HITSpec]] = relationship(
        back_populates="project", cascade="all,delete"
    )

    def __init__(
        self, name="Sample", email="example@example.com", hitspecs: List[HITSpec] = []
    ):
        super().init()
        self.name = name
        self.email = email
        self.hitspecs = hitspecs

    def get_dataframe(self):
        rows = list()
        for hit in self.hitspecs:
            for instance in hit.instances:
                for journey in instance.journeys:
                    rows.append(
                        {
                            "hit_name": hit.name,
                            "hit_id": instance.id.hex(),
                            "journey_name": (
                                journey.spec.name
                                if journey.spec.name is not None
                                else "unnamed"
                            ),
                            "journey_id": journey.id,
                            "url": journey.get_url(),
                            "completion_code": journey.get_completion_code(),
                        }
                    )
        df = pd.DataFrame(
            rows,
            columns=["hit_name", "id", "url", "completion_code"],
        )

        return df

    @staticmethod
    def by_name(session, name: str):
        return (
            session.execute(select(Project).where(Project.name == name))
            .scalars()
            .first()
        )

    @staticmethod
    def from_json(fpath: str):
        """
        Loads a project into ORM objects from a project json file.
        """
        with open(fpath, "r") as f:
            proj_dict = json.load(f)

        return Project(**proj_dict)

    def stream_download(self, z, base_path, submitted_only=True):
        for hit in self.hitspecs:
            for instance in hit.instances:
                yield from instance.stream_download(z, base_path)

    def to_dict(self, with_hits=True, with_hitspecs=True, with_hit_nodes=False):
        project_dict = super().to_dict()
        if with_hitspecs:
            project_dict["hitSpecs"] = [hit.to_dict() for hit in self.hitspecs]
        if with_hits:
            hit_instances = [h for hitspec in self.hitspecs for h in hitspec.instances]
            project_dict["hits"] = [
                hit.to_dict(
                    with_nodes=with_hit_nodes,
                )
                for hit in hit_instances
            ]
        return project_dict

    def __repr__(self):
        pass

    def __str__(self):
        return pformat({"id": self.id, "name": self.name})
