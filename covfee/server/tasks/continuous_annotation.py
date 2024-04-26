from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional

from flask import Blueprint, jsonify, request
from flask import current_app as app
from sqlalchemy import ForeignKey, select
from sqlalchemy.orm import Mapped, mapped_column, relationship

from covfee.server.orm import Base
from covfee.server.tasks.base import BaseCovfeeTask

if TYPE_CHECKING:
    from covfee.server.orm.task import TaskInstance


def jsonify_or_404(res, **kwargs):
    if res is None:
        return {"msg": "not found"}, 404
    else:
        return jsonify(res.to_dict(**kwargs))


class ContinuousAnnotationTask(BaseCovfeeTask):
    @classmethod
    def get_blueprint(cls):
        return bp

    def on_create(self):
        # we read the spec and add the provided annotations to the database
        spec = self.task.spec.spec
        for annot in spec["annotations"]:
            self.session.add(
                Annotation(
                    task_id=self.task.id,
                    category=annot["category"],
                    interface=annot["interface"],
                    participant=annot["participant"],
                )
            )


bp = Blueprint("ContinuousAnnotationTask", __name__)


@bp.route("/tasks/<tid>/annotations/all")
def fetch_all(tid):
    rows = (
        app.session.execute(select(Annotation).where(Annotation.task_id == int(tid)))
        .scalars()
        .all()
    )
    return jsonify([r.to_dict() for r in rows])


@bp.route("/annotations/<annotid>")
def fetch_one(annotid):
    res = app.session.query(Annotation).get(int(annotid))

    return jsonify_or_404(res)


# create a new annotation (without the data)
@bp.route("/annotations", methods=["POST"])
def submit_annotation():
    props = request.json
    annot = Annotation(**props)
    app.session.add(annot)
    app.session.commit()
    return jsonify_or_404(annot)


# update an annotation
@bp.route("/annotations/<annotid>", methods=["UPDATE"])
def update_annotation(annotid):
    annot = app.session.query(Annotation).get(int(annotid))
    if annot is None:
        return jsonify({"msg": "not found"}), 404

    updates = request.json
    for key, value in updates.items():
        if hasattr(annot, key):
            if key in ["created_at", "updated_at"]:
                continue
            setattr(annot, key, value)

    app.session.commit()
    return jsonify_or_404(annot)


# delete an annotation
@bp.route("/annotations/<annotid>", methods=["DELETE"])
def delete_annotation(annotid):
    annot = app.session.query(Annotation).get(int(annotid))
    if annot is None:
        return jsonify({"msg": "not found"}), 404
    app.session.delete(annot)
    app.session.commit()
    return "", 200


class Annotation(Base):
    """Stores annotations for covfee tasks"""

    __tablename__ = "ContinuousAnnotationTask.annotations"

    id: Mapped[int] = mapped_column(primary_key=True)

    # link to covfee node / task
    task_id: Mapped[int] = mapped_column(ForeignKey("nodeinstances.id"))
    task: Mapped[TaskInstance] = relationship("TaskInstance", backref="annotations")

    category: Mapped[str]
    participant: Mapped[str]
    interface: Mapped[Dict[str, Any]]  # json column
    data_json: Mapped[Optional[Dict[str, Any]]]

    created_at: Mapped[datetime.datetime] = mapped_column(default=datetime.datetime.now)
    updated_at: Mapped[datetime.datetime] = mapped_column(
        default=datetime.datetime.now, onupdate=datetime.datetime.now
    )

    def reset_data(self) -> None:
        self.data_json = None
