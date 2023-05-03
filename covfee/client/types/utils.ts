export type AllPropsRequired<Object> = {
    [Property in keyof Object]-?: Object[Property];
};