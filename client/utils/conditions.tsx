interface IfProps {
  condition: any;
  children: any;
}

export const If = ({ condition, children }: IfProps) => (
  <>{condition ? children : null}</>
);
