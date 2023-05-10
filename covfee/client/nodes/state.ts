import { Store, Slice, configureStore, Action } from '@reduxjs/toolkit'
import React, { useState, useRef, useEffect } from 'react';
import {io} from 'socket.io-client'

export const useNodeState = <T>(slice: Slice) => {

    const socket = io();

    socket.on("hello", (arg) => {
      console.log(arg); // world
    });
    
    const [state, setState] = useState<T>(slice.getInitialState());

    useEffect(() => {

    }, [])

    const dispatch = (action: Action) => {
       
    }
    
  
    return {
      state,
      dispatch
    }
  }