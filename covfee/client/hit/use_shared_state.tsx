import { useState, useEffect } from 'react'


export default function useSharedState(taskId: string) : [any, (arg0: any)=>void] {
  const [state, setState] = useState<any>(undefined);

  function setSharedState (state: any) {
    record.set(state)
  }

  useEffect(()=>{
    if (!record) return

    // record.subscribe((data) => {
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