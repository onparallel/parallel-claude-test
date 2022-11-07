import { Badge } from "@chakra-ui/react";

export function DowJonesHints({ hints }: { hints: string[] }) {
  return (
    <>
      {hints.map((item, i) => {
        if (item.includes("PEP")) {
          return (
            <Badge colorScheme="green" key={i}>
              {item}
            </Badge>
          );
        }

        if (item.includes("SAN")) {
          return (
            <Badge colorScheme="red" key={i}>
              {item}
            </Badge>
          );
        }

        return <Badge key={i}>{item}</Badge>;
      })}
    </>
  );
}
