
import Image from 'next/image';
import type { PartOrService } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, CheckCircle } from 'lucide-react';

interface PartServiceCardProps {
  item: PartOrService;
  onSelect: (item: PartOrService) => void;
  isSelected: boolean;
  showPrice?: boolean;
}

export function PartServiceCard({ item, onSelect, isSelected, showPrice = false }: PartServiceCardProps) {
  return (
    <Card className={`overflow-hidden transition-all duration-200 ease-in-out hover:shadow-xl ${isSelected ? 'ring-2 ring-primary shadow-lg' : 'shadow-md'}`}>
      <CardHeader className="p-0">
        <div className="aspect-square relative w-full">
          <Image
            src={item.imageUrl}
            alt={item.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={item.aiHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-md font-headline mb-1 truncate" title={item.name}>{item.name}</CardTitle>
        {showPrice && <p className="text-sm font-semibold text-primary">R$ {item.price.toFixed(2)}</p>}
        <p className="text-xs text-muted-foreground capitalize">{item.type === 'part' ? 'Peça' : 'Serviço'}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
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
