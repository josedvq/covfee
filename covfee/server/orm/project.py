from __future__ import annotations
import os
import json
from pprint import pformat
from typing import TYPE_CHECKING, List

import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import relationship, Mapped, mapped_column

# from ..db import Base
from .base import Base
import covfee.launcher as launcher

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
        super().__init__()
        self.name = name
        self.email = email
        self.hitspecs = hitspecs

        # to keep track of info at launch time
        self._conflicts = False
        self._filename = None

    def get_dataframe(self):
        list_of_instances = list()
        for hit in self.hitspecs:
            for instance in hit.instances:
                list_of_instances.append(
                    {
                        "hit_name": hit.name,
                        "id": instance.id.hex(),
                        "url": instance.get_url(),
                        "preview_url": instance.get_preview_url(),
                        "completion_code": instance.get_completion_code(),
                    }
                )
        df = pd.DataFrame(
            list_of_instances,
            columns=["hit_name", "id", "url", "preview_url", "completion_code"],
        )

        return df

    @staticmethod
    def from_name(session, name: str):
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

    def stream_download(self, z, base_path, submitted_only=True, csv=False):
        for hit in self.hitspecs:
            for instance in hit.instances:
                if submitted_only and not instance.submitted:
                    continue
                yield from instance.stream_download(
                    z, os.path.join(base_path, instance.id.hex()), csv=csv
                )

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
