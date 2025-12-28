import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Category } from '@shared/schema';
import { useIsMobile } from '@/hooks/use-mobile';

interface CategorySidebarProps {
  categories: Category[];
  selectedCategoryId: string | undefined;
  onSelectCategory: (categoryId: string) => void;
  isLoading: boolean;
}

export default function CategorySidebar({
  categories,
  selectedCategoryId,
  onSelectCategory,
  isLoading
}: CategorySidebarProps) {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="border-b p-2 overflow-auto">
        <div className="flex space-x-2 pb-1 overflow-x-auto">
          <Button
            variant={!selectedCategoryId ? "default" : "outline"}
            className="whitespace-nowrap"
            onClick={() => onSelectCategory("")}
          >
            Tümünü Göster
          </Button>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            categories.map((category) => (
              <Button
                key={category.category_id}
                variant={selectedCategoryId === category.category_id ? "default" : "outline"}
                className="whitespace-nowrap"
                onClick={() => onSelectCategory(category.category_id)}
              >
                {category.category_name}
              </Button>
            ))
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="w-56 border-r h-full">
      <ScrollArea className="h-full py-2">
        <div className="space-y-1 px-2">
          <Button
            variant={!selectedCategoryId ? "default" : "ghost"}
            className="w-full justify-start"
            onClick={() => onSelectCategory("")}
          >
            Tümünü Göster
          </Button>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            categories.map((category) => (
              <Button
                key={category.category_id}
                variant={selectedCategoryId === category.category_id ? "default" : "ghost"}
                className="w-full justify-start font-normal"
                onClick={() => onSelectCategory(category.category_id)}
              >
                {category.category_name}
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}