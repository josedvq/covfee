import * as React from 'react'
import {UserContextMethods, UserState} from './user'

export type UserContextProps = UserContextMethods & UserState

const userContext = React.createContext<UserContextProps>({
    logged: false,
    roles: [],
    login: () => Promise.resolve({}),
    loginWithGoogle: () => Promise.resolve({}),
    logout: () => Promise.resolve()
}); // Create a context object

export default userContext
