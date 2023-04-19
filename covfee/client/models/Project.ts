import * as React from 'react'
// import React, { useState } from 'react';
import Constants from 'Constants'
import { fetcher, throwBadResponse } from '../utils'
import { ProjectType } from 'types/project';

export function useProject(data: ProjectType) {
    const [project, setProject] = React.useState(data);
  
    return {
        project,
        setProject
    }
}

export function getProject(id: number) {
    const url = Constants.api_url + '/projects/' + id + '?' + new URLSearchParams({
        with_hits: '1',
        with_instances: '1',
        with_instance_nodes: '1'
    })

    return fetcher(url)
        .then(throwBadResponse)
}

export function getAllProjects() {
    const url = Constants.api_url + '/projects?' + new URLSearchParams({
        with_hits: '1'
    })

    return fetcher(url)
        .then(throwBadResponse)
}