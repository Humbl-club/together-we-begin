import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, Crown, BarChart3, Calendar, Users, Trophy, Gift, Zap, MessageSquare, Cloud, Megaphone, Medal } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { useMobileFirst } from '../../hooks/useMobileFirst';

interface WidgetTemplate {
  widget_type: string;
  display_name: string;
  description: string;
  icon: string;
  category: string;
  default_size: string;
  is_pro_feature: boolean;
  preview_image?: string;
}

interface WidgetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onAddWidget: (type: string, title: string) => void;
}

const WIDGET_ICONS: Record<string, React.ReactNode> = {
  '📊': <BarChart3 className="w-6 h-6" />,
  '📅': <Calendar className="w-6 h-6" />,
  '💬': <Users className="w-6 h-6" />,
  '👥': <Users className="w-6 h-6" />,
  '🏆': <Trophy className="w-6 h-6" />,
  '🎁': <Gift className="w-6 h-6" />,
  '⚡': <Zap className="w-6 h-6" />,
  '📆': <Calendar className="w-6 h-6" />,
  '💌': <MessageSquare className="w-6 h-6" />,
  '🌤️': <Cloud className="w-6 h-6" />,
  '📢': <Megaphone className="w-6 h-6" />,
  '🏅': <Medal className="w-6 h-6" />
};

const CATEGORY_COLORS: Record<string, string> = {
  analytics: 'bg-blue-100 text-blue-800',
  social: 'bg-green-100 text-green-800',
  events: 'bg-purple-100 text-purple-800',
  wellness: 'bg-orange-100 text-orange-800',
  commerce: 'bg-indigo-100 text-indigo-800',
  communication: 'bg-pink-100 text-pink-800'
};

export const WidgetSelector: React.FC<WidgetSelectorProps> = ({
  isOpen,
  onClose,
  onAddWidget
}) => {
  const { isMobile } = useMobileFirst();
  const [widgets, setWidgets] = useState<WidgetTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customTitle, setCustomTitle] = useState('');
  const [selectedWidget, setSelectedWidget] = useState<WidgetTemplate | null>(null);

  useEffect(() => {
    loadWidgetTemplates();
  }, []);

  const loadWidgetTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('widget_templates')
        .select('*')
        .order('category', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) throw error;
      setWidgets(data || []);
    } catch (err) {
      console.error('Failed to load widget templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredWidgets = widgets.filter(widget => {
    const matchesSearch = widget.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         widget.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || widget.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(widgets.map(w => w.category))];

  const handleAddWidget = () => {
    if (!selectedWidget) return;
    
    const title = customTitle.trim() || selectedWidget.display_name;
    onAddWidget(selectedWidget.widget_type, title);
    
    // Reset form
    setSelectedWidget(null);
    setCustomTitle('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-4xl h-[80vh] ${isMobile ? 'w-full mx-4' : ''}`}>
        <DialogHeader>
          <DialogTitle>Add Widget to Dashboard</DialogTitle>
          <DialogDescription>
            Choose from our collection of widgets to customize your dashboard experience
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search widgets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className={`grid ${isMobile ? 'grid-cols-3' : 'grid-cols-7'} w-full`}>
                <TabsTrigger value="all">All</TabsTrigger>
                {categories.map(category => (
                  <TabsTrigger key={category} value={category} className="capitalize">
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Widget Grid */}
          <div className="flex-1 overflow-y-auto py-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
            ) : (
              <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'} gap-4`}>
                {filteredWidgets.map(widget => (
                  <Card
                    key={widget.widget_type}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedWidget?.widget_type === widget.widget_type
                        ? 'ring-2 ring-blue-500 bg-blue-50'
                        : 'hover:ring-1 hover:ring-gray-300'
                    }`}
                    onClick={() => setSelectedWidget(widget)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg shrink-0">
                          {WIDGET_ICONS[widget.icon] || <BarChart3 className="w-6 h-6" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-gray-900">{widget.display_name}</h3>
                            {widget.is_pro_feature && (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                <Crown className="w-3 h-3 mr-1" />
                                Pro
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                            {widget.description}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={CATEGORY_COLORS[widget.category] || 'bg-gray-100'}
                            >
                              {widget.category}
                            </Badge>
                            <Badge variant="outline" className="capitalize text-xs">
                              {widget.default_size}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {widget.preview_image && (
                        <div className="mt-3">
                          <img
                            src={widget.preview_image}
                            alt={`${widget.display_name} preview`}
                            className="w-full h-20 object-cover rounded border"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredWidgets.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">No widgets found</div>
                <p className="text-sm text-gray-600">
                  Try adjusting your search terms or category filter
                </p>
              </div>
            )}
          </div>

          {/* Selected Widget Configuration */}
          {selectedWidget && (
            <div className="border-t pt-4">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Widget Title</label>
                  <Input
                    placeholder={selectedWidget.display_name}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank to use default title
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {WIDGET_ICONS[selectedWidget.icon]}
                    <div>
                      <div className="font-medium">{selectedWidget.display_name}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {selectedWidget.category} • {selectedWidget.default_size}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddWidget}>
                      Add Widget
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};