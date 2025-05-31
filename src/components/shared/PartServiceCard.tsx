
import Image from 'next/image';
import type { PartOrService } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, CheckCircle, Package, Wrench } from 'lucide-react'; // Added Package and Wrench
import { Badge } from '@/components/ui/badge'; // Added Badge

interface PartServiceCardProps {
  item: PartOrService;
  onSelect: (item: PartOrService) => void;
  isSelected: boolean;
  showPrice?: boolean;
}

export function PartServiceCard({ item, onSelect, isSelected, showPrice = true }: PartServiceCardProps) {
  return (
    <Card className={`overflow-hidden transition-all duration-200 ease-in-out hover:shadow-xl flex flex-col h-full ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'}`}>
      <CardHeader className="p-0">
        <div className="aspect-square relative w-full">
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            data-ai-hint={item.aiHint}
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
        </div>
      </CardHeader>
      <CardContent className="p-3 flex-grow">
        <CardTitle className="text-sm font-semibold mb-1 leading-tight" title={item.name}>
          {item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name}
        </CardTitle>
        {showPrice && <p className="text-xs font-bold text-primary mb-1">R$ {item.price.toFixed(2)}</p>}
        <Badge variant={item.type === 'part' ? "secondary" : "outline"} className="text-xs">
          {item.type === 'part' ? <Package className="h-3 w-3 mr-1" /> : <Wrench className="h-3 w-3 mr-1" />}
          {item.type === 'part' ? 'Peça' : 'Serviço'}
        </Badge>
      </CardContent>
      <CardFooter className="p-3 pt-0 mt-auto">
        <Button
          variant={isSelected ? "secondary" : "default"}
          size="sm"
          className="w-full"
          onClick={() => onSelect(item)}
          aria-label={isSelected ? `Remover ${item.name}` : `Adicionar ${item.name}`}
        >
          {isSelected ? <CheckCircle className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
          {isSelected ? 'Selecionado' : 'Adicionar'}
        </Button>
      </CardFooter>
    </Card>
  );
}

    