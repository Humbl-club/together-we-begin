import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, X, Filter, Hash, User, Calendar, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SearchableItem {
  id: string
  type: 'post' | 'user' | 'event' | 'challenge'
  title: string
  content?: string
  author?: {
    name: string
    avatar?: string
  }
  tags?: string[]
  location?: string
  date?: string
  metadata?: Record<string, any>
}

interface AdvancedSearchProps {
  items: SearchableItem[]
  onResultSelect: (item: SearchableItem) => void
  placeholder?: string
  className?: string
  showFilters?: boolean
}

const searchOptions = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'content', weight: 0.3 },
    { name: 'author.name', weight: 0.4 },
    { name: 'tags', weight: 0.6 },
    { name: 'location', weight: 0.2 }
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2
}

export const AdvancedSearch = ({
  items,
  onResultSelect,
  placeholder = "Search posts, users, events...",
  className,
  showFilters = true
}: AdvancedSearchProps) => {
  const [query, setQuery] = useState('')
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const fuse = useMemo(() => new Fuse(items, searchOptions), [items])

  const filteredItems = useMemo(() => {
    let results = items
    
    if (selectedFilters.length > 0) {
      results = results.filter(item => selectedFilters.includes(item.type))
    }
    
    if (query.trim()) {
      const fuseResults = fuse.search(query)
      results = fuseResults.map(result => result.item)
    }
    
    return results.slice(0, 10) // Limit results
  }, [query, selectedFilters, items, fuse])

  const toggleFilter = (filter: string) => {
    setSelectedFilters(prev => 
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    )
  }

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'user': return <User className="h-4 w-4" />
      case 'event': return <Calendar className="h-4 w-4" />
      case 'challenge': return <Hash className="h-4 w-4" />
      default: return <Hash className="h-4 w-4" />
    }
  }

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'user': return 'tag-social'
      case 'event': return 'tag-event'
      case 'challenge': return 'tag-challenge'
      default: return 'bg-muted text-foreground'
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          id="advanced-search"
          name="search"
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-4"
          autoComplete="off"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {['post', 'user', 'event', 'challenge'].map((filter) => (
            <Button
              key={filter}
              variant={selectedFilters.includes(filter) ? "default" : "outline"}
              size="sm"
              onClick={() => toggleFilter(filter)}
              className="capitalize"
            >
              {getItemIcon(filter)}
              <span className="ml-1">{filter}s</span>
            </Button>
          ))}
          {selectedFilters.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFilters([])}
              className="text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {isOpen && (query || selectedFilters.length > 0) && (
        <Card className="absolute z-50 w-full mt-2 max-h-80 overflow-y-auto">
          {filteredItems.length > 0 ? (
            <div className="p-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    onResultSelect(item)
                    setIsOpen(false)
                  }}
                  className="flex items-start gap-3 p-3 hover:bg-muted rounded-md cursor-pointer transition-colors"
                >
                  {item.author?.avatar && (
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={item.author.avatar} />
                      <AvatarFallback>
                        {item.author.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn("text-xs", getItemTypeColor(item.type))}>
                        {getItemIcon(item.type)}
                        <span className="ml-1 capitalize">{item.type}</span>
                      </Badge>
                      {item.location && (
                        <div className="flex items-center text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1" />
                          {item.location}
                        </div>
                      )}
                    </div>
                    <h4 className="font-medium text-sm truncate">{item.title}</h4>
                    {item.content && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {item.content.replace(/<[^>]*>/g, '').slice(0, 100)}...
                      </p>
                    )}
                    {item.author && (
                      <p className="text-xs text-muted-foreground mt-1">
                        by {item.author.name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No results found</p>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}