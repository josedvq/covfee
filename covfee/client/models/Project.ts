import * as React from "react";
// import React, { useState } from 'react';
import Constants from "Constants";
import { fetcher, throwBadResponse } from "../utils";
import { ProjectType } from "types/project";
import { useHitInstances } from "./Hits";
import { MainSocket } from "../app_context";

export function useProject(data: ProjectType, socket: MainSocket = null) {
  const { hits, ...projectWithoutHits } = data;
  const [_project, _setProject] = React.useState(projectWithoutHits);
  const allHits = useHitInstances(hits, socket);

  const { setHits: _setHits } = allHits;

  return {
    project: { ..._project, hits: allHits.hits },
    ...allHits,
  };
}

export function getProject(id: number): Promise<ProjectType> {
  const url =
    Constants.api_url +
    "/projects/" +
    id +
    "?" +
    new URLSearchParams({
      with_hits: "1",
      with_hit_nodes: "1",
    });

  return fetcher(url).then(throwBadResponse);
}

export function getAllProjects() {
  const url =
    Constants.api_url +
    "/projects?" +
    new URLSearchParams({
      with_hits: "1",
    });

  return fetcher(url).then(throwBadResponse);
}
