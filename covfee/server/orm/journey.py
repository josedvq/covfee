from __future__ import annotations

import datetime
import enum
import hashlib
import hmac
import os
import secrets
from typing import TYPE_CHECKING, Any, Dict, List, Optional, Tuple

from flask import current_app as app
# from ..db import Base
from sqlalchemy import ForeignKey
from sqlalchemy.ext.associationproxy import AssociationProxy, association_proxy
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .chat import Chat, ChatJourney
from .node import JourneyNode, JourneySpecNodeSpec

if TYPE_CHECKING:
    from .hit import HITInstance, HITSpec
    from .node import NodeInstance, NodeSpec


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
        back_populates="journeyspec",
        order_by=JourneySpecNodeSpec.order,
        cascade="all,delete",
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
    INIT = 0

    RUNNING = 1

    DISABLED = 2

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

    # primary chat associated to this journey
    chat: Mapped[Chat] = relationship(back_populates="journey", cascade="all,delete")
    # journey association (many-to-many)
    # used to store info associated to (chat, journey) like read status
    chat_associations: Mapped[List[ChatJourney]] = relationship(
        back_populates="journey", cascade="all,delete"
    )

    # down
    node_associations: Mapped[List[JourneyNode]] = relationship(
        back_populates="journey", order_by=JourneyNode.order, cascade="all,delete"
    )
    nodes: AssociationProxy[List[NodeInstance]] = association_proxy(
        "node_associations",
        "node",
        creator=lambda obj: JourneyNode(node=obj),
    )

    interface: Mapped[Dict[str, Any]] = mapped_column()

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
    dt_first_join: Mapped[datetime.datetime] = mapped_column(nullable=True)
    dt_submitted: Mapped[datetime.datetime] = mapped_column(nullable=True)
    dt_created: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    dt_updated: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )

    

    def __init__(self):
        super().init()
        self.id = self.make_random_id()
        self.preview_id = hashlib.sha256((self.id + "preview".encode())).digest()
        self.interface = {}
        self.aux = {}
        self.config = {}
        self.chat = Chat(self)

    def get_url(self):
        return f'{app.config["APP_URL"]}/journeys/{self.id.hex():s}'
    
    def set_status(self, to_status: JourneyInstanceStatus):
        if (
            self.status == JourneyInstanceStatus.FINISHED or self.status == to_status
        ):
            return
        
        self.status = to_status


    def set_curr_node(self, node):
        self.curr_node = node


    def get_completion_code(self):
        return self.config.get(
            "completion_code",
            hashlib.sha256((self.id.hex() + app.config["COVFEE_SECRET_KEY"]).encode())
            .digest()
            .hex()[:12],
        )

    def get_completion_info(self):
        completion = {
            "completion_code": self.get_completion_code(),
            "redirect_name": self.config.get("redirect_name", None),
            "redirect_url": self.config.get("redirect_url", None),
        }
        return completion

    def get_hmac(self):
        h = hmac.new(
            app.config["COVFEE_SECRET_KEY"].encode("utf-8"), self.id, hashlib.sha256
        )
        return h.hexdigest()

    def submit(self):
        # TODO: check that all required tasks have been completed
        # TODO: implement two modes:
        #  - submit only if all required tasks have been completed
        #  - submit even if some required tasks have not been completed. Leave these with null response.
        # for now we just submit without checks

        self.status = JourneyInstanceStatus.FINISHED
        self.dt_submitted = datetime.datetime.now()
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
            instance_dict["completion_info"] = self.get_completion_info()

        return instance_dict

    def make_results_dict(self):
        return {"nodes": [node.id for node in self.nodes]}
    
    def make_status_payload(self):
        payload = {
            "journey_id": self.id.hex(),
            "hit_id": self.hit_id.hex(),
            "num_connections": self.num_connections,
            "status": self.status,
            "dt_submitted": str(self.dt_submitted),
        }

        if self.status == JourneyInstanceStatus.FINISHED:
            payload["completion_info"] = self.get_completion_info()

        return payload
