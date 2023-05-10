import { Store, Slice, configureStore, Action } from '@reduxjs/toolkit'
import React, { useState, useRef, useEffect } from 'react';
import { Client, Databases, ID } from 'appwrite';

export const useNodeState = <T>(slice: Slice) => {
    
    const databaseID = '6449485b98ce12929baa'
    const collectionID = '64494b97b32715160758'
    const [state, setState] = useState<T>(slice.getInitialState());

    const store: React.MutableRefObject<Store> = useRef(null)
    const client: React.MutableRefObject<Client> = useRef(null)
    const databases: React.MutableRefObject<Databases> = useRef(null)

    useEffect(() => {

        store.current = configureStore({
            reducer: {
              node: slice.reducer
            }
          })

        client.current = (new Client()).setEndpoint('http://localhost/v1')
            .setProject('64494291e60b2de15905');

        databases.current = new Databases(client.current);

        // update local state when store changes
        store.current.subscribe(() => {
            setState(store.current.getState())
        })

        // listen to appwrite documents
        client.current.subscribe(`databases.${databaseID}.collections.[${collectionID}].documents`, response => {
            console.log(response)
        })

        // const promise = databases.createDocument(
        //     '[DATABASE_ID]',
        //     '[COLLECTION_ID]',
        //     ID.unique(),
        //     {}
        // )
    }, [])

    const dispatch = (action: Action) => {
        // TODO: create new document in collection
        const promise = databases.current.createDocument(databaseID, collectionID, ID.unique(), {
            type: action.type,
            payload: JSON.stringify(action.payload)
        });

        promise.then(function (response) {
            console.log(response); // Success
        }, function (error) {
            console.log(error); // Failure
        });
    }
    
  
    return {
      state,
      dispatch
    }
  }