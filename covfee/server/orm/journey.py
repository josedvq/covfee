from __future__ import annotations
import enum
import os
import datetime
import hmac
import secrets
import hashlib
from typing import List, Dict, Any, TYPE_CHECKING, Optional, Tuple
from typing_extensions import Annotated

# from ..db import Base
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship, Mapped, mapped_column
from sqlalchemy.ext.associationproxy import association_proxy, AssociationProxy
from flask import current_app as app

from .base import Base
from .chat import Chat
from .node import JourneyNode, JourneySpecNodeSpec

if TYPE_CHECKING:
    from .hit import HITSpec, HITInstance
    from .node import NodeSpec, NodeInstance


class JourneySpec(Base):
    __tablename__ = "journeyspecs"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[Optional[str]]

    # spec relationships
    # up
    hitspec_id: Mapped[int] = mapped_column(ForeignKey("hitspecs.id"))
    hitspec: Mapped[HITSpec] = relationship(back_populates="journeyspecs")

    # down
    nodespec_associations: Mapped[List[JourneySpecNodeSpec]] = relationship(
        back_populates="journeyspec", order_by=JourneySpecNodeSpec.order
    )
    nodespecs: AssociationProxy[List[NodeSpec]] = association_proxy(
        "nodespec_associations",
        "nodespec",
        creator=lambda obj: JourneySpecNodeSpec(nodespec=obj),
    )

    # instance relationships
    journeys: Mapped[List[JourneyInstance]] = relationship(
        back_populates="spec", cascade="all,delete"
    )

    def __init__(self, nodespecs: List[Tuple[NodeSpec, int]] = [], name: str = None):
        super().init()
        self.nodespec_associations = [
            JourneySpecNodeSpec(nodespec=n, player=p, order=i)
            for i, (n, p) in enumerate(nodespecs)
        ]
        self.name = name

    def instantiate(self):
        instance = JourneyInstance()
        self.journeys.append(instance)
        return instance

    def append(self, node: "NodeSpec"):
        self.nodespecs.append(node)

    def __repr__(self):
        pass

    def __str__(self):
        return str({id: self.id})


class JourneyInstanceStatus(enum.Enum):
    # task has been initialized.
    INIT = 0

    # start conditions full-filled. task has started.
    STARTED = 1

    # pause condition fullfilled. Waiting for resume conditions.
    DISABLED = 2

    # task/node has ran and is finalized.
    FINISHED = 3


class JourneyInstance(Base):
    """Represents an instance of a HIT, to be solved by one user"""

    __tablename__ = "journeyinstances"

    id: Mapped[bytes] = mapped_column(primary_key=True)

    # one JourneySpec -> many JourneyInstance
    journeyspec_id: Mapped[int] = mapped_column(ForeignKey("journeyspecs.id"))
    spec: Mapped[JourneySpec] = relationship(back_populates="journeys")

    # one HitInstance -> many JourneyInstance
    hit_id: Mapped[bytes] = mapped_column(ForeignKey("hitinstances.id"))
    hit: Mapped[HITInstance] = relationship(back_populates="journeys")

    # chat relationship
    chat: Mapped[Chat] = relationship(back_populates="journey", cascade="all,delete")

    # down
    node_associations: Mapped[List[JourneyNode]] = relationship(
        back_populates="journey", order_by=JourneyNode.order
    )
    nodes: AssociationProxy[List[NodeInstance]] = association_proxy(
        "node_associations",
        "node",
        creator=lambda obj: JourneyNode(node=obj),
    )

    interface: Mapped[Dict[str, Any]] = mapped_column()

    # submitted = Mapped[bool]

    # status
    # one NodeInstance -> many JourneyInstance
    curr_node_index: Mapped[Optional[int]]
    curr_node_id: Mapped[int] = mapped_column(
        ForeignKey("nodeinstances.id"), nullable=True
    )
    num_connections: Mapped[int] = mapped_column(default=0)
    curr_node: Mapped[NodeInstance] = relationship(back_populates="curr_journeys")

    # status code
    status: Mapped[JourneyInstanceStatus] = mapped_column(
        default=JourneyInstanceStatus.INIT
    )
    aux: Mapped[Dict[str, Any]]  # json state associated to the journey

    instance_counter = 0

    disabled: Mapped[bool] = mapped_column(default=False)

    config: Mapped[Dict[str, Any]]

    # dates
    # submitted: Mapped[datetime.datetime] = mapped_column(nullable=True)
    created: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )

    @staticmethod
    def get_id():
        if os.environ.get("COVFEE_ENV") == "dev":
            # return predictable id in dev mode
            # so that URLs don't change on every run
            id = hashlib.sha256(
                (str(JourneyInstance.instance_counter).encode())
            ).digest()
            JourneyInstance.instance_counter += 1
        else:
            id = secrets.token_bytes(32)
        return id

    def __init__(self):
        super().init()
        self.id = JourneyInstance.get_id()
        self.preview_id = hashlib.sha256((self.id + "preview".encode())).digest()
        self.submitted = False
        self.interface = {}
        self.aux = {}
        self.config = {}
        self.chat = Chat()

    def get_api_url(self):
        return f'{app.config["API_URL"]}/instances/{self.id.hex():s}'

    def get_url(self):
        return f'{app.config["APP_URL"]}/hits/{self.id.hex():s}'

    def set_curr_node(self, node):
        self.curr_node = node
        if node is not None:
            node.check_n()

    def set_curr_node_index(self, index):
        self.curr_node_index = index
        if index is not None:
            self.nodes[index].check_n()

    def get_completion_code(self):
        return self.config.get(
            "completionCode",
            hashlib.sha256((self.id.hex() + app.config["COVFEE_SECRET_KEY"]).encode())
            .digest()
            .hex()[:12],
        )

    def get_completion_info(self):
        completion = {
            "completionCode": self.get_completion_code(),
            "redirectName": self.config.get("redirectName", None),
            "redirectUrl": self.config.get("redirectUrl", None),
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

    def to_dict(self, with_nodes=False, with_response_info=False):
        instance_dict = super().to_dict()
        spec_dict = self.spec.to_dict()

        # merge hit and instance dicts
        instance_dict = {
            **spec_dict,
            **instance_dict,
            "token": self.get_hmac(),
            "online": self.curr_node is not None,
            "chat_id": self.chat.id,
        }

        if with_nodes:
            nodes = [n.to_dict() for n in self.nodes]
            for i, n in enumerate(nodes):
                n["index"] = i
                n["journey_id"] = self.id.hex()
            instance_dict["nodes"] = nodes

        else:
            instance_dict["nodes"] = [n.id for n in self.nodes]

        if self.status == JourneyInstanceStatus.FINISHED:
            instance_dict["completionInfo"] = self.get_completion_info()

        return instance_dict

    def make_results_dict(self):
        return {"nodes": [node.id for node in self.nodes]}
