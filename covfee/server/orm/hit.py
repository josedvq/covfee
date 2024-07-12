from __future__ import annotations
from io import BytesIO
import json
import os
import hmac
import binascii
import hashlib
import datetime
import secrets
from typing import List, TYPE_CHECKING, Optional, ClassVar
from hashlib import sha256
from pprint import pformat

from flask import current_app as app

from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column

# from ..db import Base
# from .project import Project
from .base import Base
from .journey import JourneySpec, JourneyInstance
from .project import Project
from .node import JourneyNode, NodeInstance, NodeSpec
from .utils import NoIndentJSONEncoder


class HITSpec(Base):
    __tablename__ = "hitspecs"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]

    # An optional id that the study administrator can attach to this HIT
    # making it identifiable through multiple launches of "covfee make"
    # and thus being able to add more hits/journeys without destroying
    # the database. It's a string as it is intended to be human-readable
    global_unique_id: Mapped[Optional[str]] = mapped_column(unique=True)

    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"))
    # project_id = Column(Integer, ForeignKey("projects.name"))
    project: Mapped[Project] = relationship(back_populates="hitspecs")

    nodespecs: Mapped[List[NodeSpec]] = relationship(
        back_populates="hitspec", cascade="all,delete"
    )

    # spec relationship
    journeyspecs: Mapped[List[JourneySpec]] = relationship(
        back_populates="hitspec", cascade="all,delete"
    )

    # instance relationship
    instances: Mapped[List[HITInstance]] = relationship(
        back_populates="spec", cascade="all,delete"
    )

    def __init__(self, name=None, journeyspecs: List[JourneySpec] = []):
        super().init()
        # TODO: remove name column?
        if name is None:
            name = binascii.b2a_hex(os.urandom(8)).decode("utf-8")
        self.name = name
        self.append_journeyspecs(journeyspecs)

    def append_journeyspecs(self, journeyspecs: List[JourneySpec]):
        self.journeyspecs += journeyspecs
        print(
            f"HIT - Appended {len(journeyspecs)} of {len(self.journeyspecs)} journeyspecs"
        )
        new_nodespecs = [n for js in journeyspecs for n in js.nodespecs]
        self.nodespecs += new_nodespecs
        print(
            f"HIT: - Appended {len(new_nodespecs)} of {len(self.nodespecs)} nodespecs"
        )

    def make_journey(self):
        journeyspec = JourneySpec()
        self.journeyspecs.append(journeyspec)
        return journeyspec

    def instantiate(self, n=1):
        for _ in range(n):
            instance = HITInstance(
                journeyspecs=self.journeyspecs,
            )
            self.instances.append(instance)

    def get_api_url(self):
        return f'{app.config["API_URL"]}/hits/{self.id}'

    def get_generator_url(self):
        """URL to the generator endpoint, which will instantiate the HIT and redirect the user to the new instance
        For use in linking from crowdsourcing websites (eg. Prolific)
        """
        return f'{app.config["API_URL"]}/hits/{self.id}/instances/add_and_redirect'

    def to_dict(self):
        hit_dict = super().to_dict()
        hit_dict["api_url"] = self.get_api_url()
        hit_dict["generator_url"] = self.get_generator_url()

        hit_dict["project"] = self.project.to_dict(with_hits=False, with_hitspecs=False)
        del hit_dict["project_id"]

        return hit_dict

    def __repr__(self):
        pass

    def __str__(self):
        return pformat(
            {"id": self.id, "name": self.name, "project_id": self.project_id}
        )


class HITInstance(Base):
    """Represents an instance of a HIT, to be solved by one or multiple users through their
    respective journeys
    - one HIT instance maps to one URL that can be sent to a participant to access and solve the HIT.
    - a HIT instance is specified by the abstract HIT it is an instance of.
    - a HIT instance is linked to a list of tasks (instantiated task specifications),
    which hold the responses for the HIT
    """

    __tablename__ = "hitinstances"

    id: Mapped[bytes] = mapped_column(primary_key=True)

    # spec relationship
    hitspec_id: Mapped[int] = mapped_column(ForeignKey("hitspecs.id"))
    spec: Mapped[HITSpec] = relationship(back_populates="instances")

    # instance relationships
    journeys: Mapped[List[JourneyInstance]] = relationship(
        back_populates="hit", cascade="all, delete"
    )
    nodes: Mapped[List[NodeInstance]] = relationship(
        back_populates="hit", cascade="all, delete"
    )

    # other
    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )

    instance_counter: ClassVar[int] = 0

    def __init__(self, journeyspecs: List[JourneySpec] = []):
        super().init()
        self.id = HITInstance.generate_new_id()
        self.preview_id = sha256((self.id + "preview".encode())).digest()
        self.submitted = False

        # instantiate every node only once
        self.instantiate_new_journeys(journeyspecs)

    def instantiate_new_journeys(self, journeyspecs: List[JourneySpec]):
        # instantiate every node only once
        nodespec_to_nodeinstance = dict()
        for journeyspec in journeyspecs:
            journey = journeyspec.instantiate()
            journey.hit_id = self.id

            for j, nodespec_assoc in enumerate(journeyspec.nodespec_associations):
                nodespec = nodespec_assoc.nodespec
                if nodespec._unique_id in nodespec_to_nodeinstance:
                    node_instance = nodespec_to_nodeinstance[nodespec._unique_id]
                else:
                    node_instance = nodespec.instantiate()
                    nodespec_to_nodeinstance[nodespec._unique_id] = node_instance

                journey.node_associations.append(
                    JourneyNode(
                        node=node_instance, player=nodespec_assoc.player, order=j
                    )
                )
            self.journeys.append(journey)
        new_nodes = list(nodespec_to_nodeinstance.values())
        self.nodes = self.nodes + new_nodes

        # call node.reset when the graph is ready
        # ie. when all the links are set in the ORM
        for node in new_nodes:
            node.reset()

    @staticmethod
    def generate_new_id():
        if os.environ.get("COVFEE_ENV") == "dev":
            # return predictable id in dev mode
            # so that ids don't change on every run
            # Note, in a previous implementation, the id was a function of the associated
            # len(HITSpec.journeyspecs). Unclear why.
            id = hashlib.sha256((str(HITInstance.instance_counter).encode())).digest()
            HITInstance.instance_counter += 1
        else:
            id = secrets.token_bytes(32)
        return id

    def get_api_url(self):
        return f'{app.config["API_URL"]}/instances/{self.id.hex():s}'

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
        instance_dict = super().to_dict()
        spec_dict = self.spec.to_dict()

        instance_dict["token"] = self.get_hmac()

        # merge hit and instance dicts
        instance_dict = {**spec_dict, **instance_dict}
        instance_dict["api_url"] = self.get_api_url()

        if with_nodes:
            # get the nodes
            nodes = set([n for j in self.journeys for n in j.nodes])
            instance_dict["nodes"] = [n.to_dict() for n in nodes]

            # get the journeys
            instance_dict["journeys"] = [j.to_dict() for j in self.journeys]

        return instance_dict

    def make_results_dict(self):
        return {
            "hit_id": self.id.hex(),
            "global_unique_id": self.spec.global_unique_id,
            "nodes": {node.id: node.make_results_dict() for node in self.nodes},
            "journeys": [journey.make_results_dict() for journey in self.journeys],
        }

    def stream_download(self, z, base_path):
        results_dict = self.make_results_dict()
        stream = BytesIO()

        stream.write(
            json.dumps(results_dict, indent=4, cls=NoIndentJSONEncoder).encode()
        )
        stream.seek(0)
        z.write_iter(
            os.path.join(
                base_path,
                self.id.hex() + ".json",
            ),
            stream,
        )

        yield from z.flush()

    def update(self, d):
        for key, value in d.items():
            setattr(self, key, value)
