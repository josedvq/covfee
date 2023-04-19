import React, { useState } from 'react';
import {HitInstanceType} from '../types/hit'
import { fetcher, throwBadResponse } from '../utils';
import Constants from 'Constants'

export const useHitInstance = (data: HitInstanceType) => {
  const [hitData, setHitData] = useState(data);
    

  const update = (hit: HitInstanceType) => {
    const url = hit.api_url + '/edit?' + new URLSearchParams({
    })

    const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hit)
    }

    return fetcher(url, requestOptions)
        .then(throwBadResponse)
        .then(res => {
            setHitData(curr => ({
               ...curr,
               ...res 
            }))
        })
  }

  return {
    'hitInstance': hitData,
    update
  }
}

export function getHit(id: number) {
    const url = Constants.api_url + '/hits/' + id + '?' + new URLSearchParams({
        with_instances: '1',
        with_instance_nodes: '1'
    })

    fetcher(url)
        .then(throwBadResponse)
}

export function getHitInstance(id: string) {
    const url = Constants.api_url + '/instances/' + id + '?' + new URLSearchParams({
        with_nodes: '1'
    })

    return fetcher(url)
        .then(throwBadResponse)
}
