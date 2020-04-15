declare module "livereload" {
  export interface Server {
    watch(path: string | string[]);
  }

  export interface ServerOpts {
    exts: string[];
  }

  export function createServer(opts: ServerOpts): Server;
}
