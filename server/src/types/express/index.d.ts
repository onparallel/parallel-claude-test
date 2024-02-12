interface GraphQLOperation {
  name: string;
  variables: Record<string, any>;
}
declare namespace Express {
  export interface Request {
    graphQLOperations?: GraphQLOperation[];
    context: import("../../context").ApiContext;
    requestId?: string;
  }
}
