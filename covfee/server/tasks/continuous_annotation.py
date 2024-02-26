from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any, Dict, Optional

from flask import Blueprint
from flask import current_app as app
from flask import jsonify, request
from sqlalchemy import Column, DateTime, ForeignKey, select
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
                    name=annot["name"],
                    interface=annot["interface"],
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


# update an annotation (without the data)
@bp.route("/annotations/<annotid>", methods=["UPDATE"])
def update_annotation(annotid):
    annot = app.session.query(Annotation).get(int(annotid))
    if annot is None:
        return jsonify({"msg": "not found"}), 404

    updates = request.json
    for key, value in updates.items():
        if hasattr(annot, key):
            setattr(annot, key, value)

    app.session.commit()
    return jsonify_or_404(annot)


# # update the data of an annotation
# @bp.route("/annotations/<annotid>/data", methods=["UPDATE"])
# def submit_annotation_data(tid, annotid):
#     annot = app.session.query(Annotation).get(int(annotid))
#     annot.data = request.data
#     session.commit()
#     return "", 200


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
    task: Mapped[TaskInstance] = relationship()

    name: Mapped[str]
    interface: Mapped[Dict[str, Any]]  # json column
    # data: Mapped[Optional[bytes]]
    data_json: Mapped[Optional[Dict[str, Any]]]

    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.datetime.now)

    def to_dict(self):
        return super().to_dict()
