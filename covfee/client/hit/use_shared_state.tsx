import { useState, useEffect } from 'react'

import { DeepstreamClient } from '@deepstream/client'
import {Record} from '@deepstream/client/dist/src/record/record'

export default function useSharedState(taskId: string) : [any, (arg0: any)=>void] {
  const [state, setState] = useState<any>(undefined);

  function setSharedState (state: any) {
    record.set(state)
  }

  useEffect(()=>{
    if (!record) return
    console.log(record.name)

    // record.subscribe((data) => {
    //   console.log(data)
    //   setState(data)
    // }, true)
    
    return () => {
      // record.discard()
    }
  }, [])

  return [
    state,
    setSharedState
  ]
}