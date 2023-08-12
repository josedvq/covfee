from flask import (
    request,
    jsonify,
    make_response,
    Response,
    stream_with_context,
    current_app as app,
)
import zipstream

from .api import api
from .auth import admin_required
from .utils import jsonify_or_404
from ..orm import Project


# return all projects
@api.route("/projects")
@admin_required
def projects():
    """Lists all the projects currently in covfee

    Returns:
        [type]: list of project objects
    """
    with_hits = request.args.get("with_hits", False)
    with_hit_nodes = request.args.get("with_hit_nodes", False)
    res = app.session.query(Project).all()
    if res is None:
        return jsonify([])
    else:
        return jsonify(
            [p.to_dict(with_hits=with_hits, with_hit_nodes=with_hit_nodes) for p in res]
        )


# return one project
@api.route("/projects/<pid>")
@admin_required
def project(pid):
    """Returns a project object

    Args:
        pid (str): project ID
    """
    with_hits = request.args.get("with_hits", False)
    with_hit_nodes = request.args.get("with_hit_nodes", False)
    res = app.session.query(Project).get(pid)
    return jsonify_or_404(res, with_hits=with_hits, with_hit_nodes=with_hit_nodes)


@api.route("/projects/<pid>/csv")
@admin_required
def project_csv(pid):
    """Creates a CSV file with links and completion codes for HITs
    This file can be used in human intelligence marketplaces or to directly send the
    links in it to study participants.

    Args:
        pid ([str]): ID of the project

    Returns:
        [type]: CSV file with a hit instance per line
    """
    project = app.session.query(Project).get(pid)
    if project is None:
        return {"msg": "not found"}, 404
    else:
        df = project.get_dataframe()
        res = make_response(df.to_csv())
        res.headers["Content-Disposition"] = "attachment; filename=export.csv"
        res.headers["Content-Type"] = "text/csv"
        return res


@api.route("/projects/<pid>/download")
@admin_required
def project_download(pid):
    """Generates a downloadable with all the responses in a project.
    It gathers the responses for all hit instances in the project
    This endpoint migh be slow for large projects.

    Args:
        pid (str): project ID

    Returns:
        [type]: stream response with a compressed archive. 204 if the project has no responses
    """
    is_csv = bool(request.args.get("csv", False))

    project = app.session.query(Project).get(bytes.fromhex(pid))
    if project is None:
        return {"msg": "not found"}, 404

    def generator():
        z = zipstream.ZipFile(mode="w", compression=zipstream.ZIP_DEFLATED)
        for chunk in project.stream_download(z, "./", csv=is_csv):
            yield chunk
        yield from z

    response = Response(stream_with_context(generator()), mimetype="application/zip")
    response.headers["Content-Disposition"] = "attachment; filename={}".format(
        "results.zip"
    )
    return response
