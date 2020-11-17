import { Client } from "knex";
import { TableTypes } from "./__types";

export type Watcher<T extends keyof TableTypes = never> = {
  table: T;
  columns: Array<keyof TableTypes[T]>;
  afterUpdate?: (
    newElem: TableTypes[T],
    oldElem: TableTypes[T]
  ) => Promise<void>;
};

type NotificationData = {
  [key in keyof TableTypes]?: TableUpdatedData<key>;
};

type TableUpdatedData<T extends keyof TableTypes> = {
  channel: string;
  length: number;
  processId: number;
  payload: {
    table: T;
    column: keyof TableTypes[T];
    old: TableTypes[T];
    new: TableTypes[T];
  };
  name: string;
};

export function installWatchers(watchers: Watcher[]) {
  let listening = false;
  return async (conn: Client, done: (err: any, conn: Client) => void) => {
    if (listening) {
      done(null, conn);
      return;
    }
    listening = true;

    await install(conn, watchers);
    done(null, conn);
  };
}

async function install(conn: Client, watchers: Watcher[]) {
  await upsertTrigger(conn, watchers);
  await subscribe(conn, watchers);
}

async function upsertTrigger(conn: Client, config: Watcher[]) {
  return new Promise((resolve, reject) => {
    const query = /* sql */ `
      CREATE OR REPLACE FUNCTION notify() 
      RETURNS trigger AS $$
      DECLARE
        table_name text;
        column_name text;
        payload text;
      BEGIN
        table_name := TG_ARGV[0];
        column_name := TG_ARGV[1];
        payload := ''
                || '{'
                || '"table":"' || table_name || '",'
                || '"column":"' || column_name || '",'
                || '"old":"'|| row_to_json(OLD) || '",'
                || '"new":"' || row_to_json(NEW) || '",'
                || '}';

        PERFORM pg_notify('db_changed', payload);
        RETURN NULL;
      END;
      $$
      LANGUAGE plpgsql;

      drop trigger if exists petition_updated_trigger on petition;
      CREATE TRIGGER petition_updated_trigger AFTER UPDATE of "name" ON petition
      FOR EACH ROW EXECUTE PROCEDURE notify("petition", "name");
  `;

    conn.query(query, (err: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function subscribe(conn: Client, config: Watcher[]) {
  return new Promise((resolve, reject) => {
    conn.query("LISTEN db_changed", (err: any) => {
      if (err) {
        reject(err);
      } else {
        conn.on("notification", (data: NotificationData) => {
          console.log("CHANGED!!!", `${JSON.stringify(data)}`);
        });
        conn.on("end", () => {
          throw new Error("END");
        });
        conn.on("error", (err: any) => {
          throw err;
        });
        resolve();
      }
    });
  });
}
