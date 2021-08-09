declare module "shallow-equal" {
  export function shallowEqualArrays(arr1: any[], arr2: any[]);
  export function shallowEqualObjects(obj1: Record<string, any>, obj2: Record<string, any>);
}
