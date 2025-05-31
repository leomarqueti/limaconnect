
import type { SVGProps } from 'react';
import { Wrench } from 'lucide-react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <Wrench className="h-8 w-8 text-primary" {...props} />
  );
}