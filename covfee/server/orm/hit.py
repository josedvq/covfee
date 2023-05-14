from __future__ import annotations
import os
import hmac
import binascii
import hashlib
import datetime
from typing import List, TYPE_CHECKING
from hashlib import sha256

from flask import current_app as app
from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, Mapped, mapped_column

# from ..db import Base
# from .project import Project
from .base import Base
from .journey import JourneySpec, JourneyInstance
from .project import Project
from .node import NodeInstance


class HITSpec(Base):
    __tablename__ = "hitspecs"
    __table_args__ = (UniqueConstraint("project_id", "name"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]

    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    # project_id = Column(Integer, ForeignKey("projects.name"))
    project: Mapped["Project"] = relationship(back_populates="hitspecs")

    # spec relationship
    journeyspecs: Mapped[List["JourneySpec"]] = relationship(back_populates="hitspec")

    # instance relationship
    instances: Mapped[List["HITInstance"]] = relationship(back_populates="spec")

    def __init__(self, name=None, journeyspecs: List["JourneySpec"] = []):
        super().__init__()
        # TODO: remove name column?
        if name is None:
            name = binascii.b2a_hex(os.urandom(8)).decode("utf-8")
        self.name = name
        self.journeyspecs = journeyspecs

    def make_journey(self):
        journeyspec = JourneySpec()
        self.journeyspecs.append(journeyspec)
        return journeyspec

    def instantiate(self, n=1):
        for _ in range(n):
            instance = HITInstance(
                # (id, index)
                id=sha256(f"{self.id}_{len(self.journeyspecs)}".encode()).digest(),
                journeyspecs=self.journeyspecs,
            )
            self.instances.append(instance)

    def launch(self, num_instances=1):
        if self.project is None:
            self.project = Project()
        self.project.launch(num_instances)

    def get_api_url(self):
        return f'{app.config["API_URL"]}/hits/{self.id}'

    def get_generator_url(self):
        """URL to the generator endpoint, which will instantiate the HIT and redirect the user to the new instance
        For use in linking from crowdsourcing websites (eg. Prolific)
        """
        return f'{app.config["API_URL"]}/hits/{self.id}/instances/add_and_redirect'

    def to_dict(self, with_instances=False, with_instance_nodes=False):
        hit_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        hit_dict["api_url"] = self.get_api_url()
        hit_dict["generator_url"] = self.get_generator_url()

        if with_instances:
            hit_dict["instances"] = [
                instance.to_dict(with_nodes=with_instance_nodes)
                for instance in self.instances
            ]

        hit_dict["project"] = self.project.to_dict(with_hits=False)
        del hit_dict["project_id"]

        return hit_dict

    def __repr__(self):
        pass


class HITInstance(Base):
    """Represents an instance of a HIT, to be solved by one user
    - one HIT instance maps to one URL that can be sent to a participant to access and solve the HIT.
    - a HIT instance is specified by the abstract HIT it is an instance of.
    - a HIT instance is linked to a list of tasks (instantiated task specifications),
    which hold the responses for the HIT
    """

    __tablename__ = "hitinstances"

    id: Mapped[bytes] = mapped_column(primary_key=True)

    # spec relationship
    hitspec_id: Mapped[int] = mapped_column(ForeignKey("hitspecs.id"))
    spec: Mapped["HITSpec"] = relationship(back_populates="instances")

    # instance relationships
    journeys: Mapped[List["JourneyInstance"]] = relationship(
        back_populates="hit", cascade="all, delete"
    )

    # other
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )

    def __init__(self, id: bytes, journeyspecs: List["JourneySpec"] = []):
        super().__init__()
        self.id = id
        self.preview_id = sha256((id + "preview".encode())).digest()
        self.submitted = False

        # instantiate every node only once
        nodespec_to_nodeinstance = dict()
        for i, journeyspec in enumerate(journeyspecs):
            journey = journeyspec.instantiate()
            journey.hit_id = self.id

            for nodespec in journeyspec.nodespecs:
                if nodespec._unique_id in nodespec_to_nodeinstance:
                    node_instance = nodespec_to_nodeinstance[nodespec._unique_id]
                else:
                    node_instance = nodespec.instantiate()
                    nodespec_to_nodeinstance[nodespec._unique_id] = node_instance

                journey.nodes.append(node_instance)
            self.journeys.append(journey)

    def get_api_url(self):
        return f'{app.config["API_URL"]}/instances/{self.id.hex():s}'

    def get_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.id.hex():s}'

    def get_preview_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.preview_id.hex():s}?preview=1'

    def get_completion_info(self):
        completion = {
            "completionCode": self.hit.config.get(
                "completionCode",
                sha256((self.id.hex() + app.config["COVFEE_SECRET_KEY"]).encode())
                .digest()
                .hex()[:12],
            ),
            "redirectName": self.hit.config.get("redirectName", None),
            "redirectUrl": self.hit.config.get("redirectUrl", None),
        }
        return completion

    def get_hmac(self):
        h = hmac.new(
            app.config["COVFEE_SECRET_KEY"].encode("utf-8"), self.id, hashlib.sha256
        )
        return h.hexdigest()

    def submit(self):
        if any(
            [
                (task.spec.required and not task.has_valid_response())
                for task in self.tasks
            ]
        ):
            # cant submit if at least one required task has no valid submissions
            return False, "Some required tasks have no valid responses."
        else:
            self.submitted = True
            self.submitted_at = datetime.datetime.now()
            return True, None

    def to_dict(self, with_nodes=False):
        instance_dict = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        spec_dict = self.spec.to_dict()

        instance_dict["id"] = instance_dict["id"].hex()
        instance_dict["token"] = self.get_hmac()

        # merge hit and instance dicts
        instance_dict = {**spec_dict, **instance_dict}

        if with_nodes:
            # get the nodes
            nodes = set([n for j in self.journeys for n in j.nodes])
            instance_dict["nodes"] = [n.to_dict() for n in nodes]

            # get the journeys
            instance_dict["journeys"] = [j.to_dict() for j in self.journeys]

        # if with_tasks:
        # prerequisite_tasks = [task for task in self.tasks if task.spec.prerequisite]
        # prerequisites_completed = all([task.has_valid_response() for task in prerequisite_tasks])
        # instance_dict['prerequisites_completed'] = prerequisites_completed
        # if prerequisites_completed:
        #     instance_dict['tasks'] = [task.to_dict() for task in self.tasks]
        # else:
        #     instance_dict['tasks'] = [task.to_dict() for task in prerequisite_tasks]

        return instance_dict

    def stream_download(self, z, base_path, csv=False):
        for i, task in enumerate(self.tasks):
            yield from task.stream_download(z, base_path, i, csv)
