import React, { useState, useEffect } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { toast } from '../ui/use-toast';
import { 
  Palette, 
  Type, 
  Save, 
  RotateCcw,
  Moon,
  Sun,
  Sparkles,
  Eye
} from 'lucide-react';
import { cn } from '../../lib/utils';

const THEME_PRESETS = [
  { 
    id: 'alo-minimal', 
    name: 'Alo Minimal', 
    description: 'Clean, zen-inspired design',
    colors: {
      primary: '#6B5B95',
      secondary: '#88B0D3',
      accent: '#FFB7C5',
      background: '#FAFAF8',
      surface: '#FFFFFF'
    }
  },
  { 
    id: 'vibrant', 
    name: 'Vibrant', 
    description: 'Bold and energetic colors',
    colors: {
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#45B7D1',
      background: '#F7FFF7',
      surface: '#FFFFFF'
    }
  },
  { 
    id: 'dark', 
    name: 'Dark Mode', 
    description: 'Elegant dark theme',
    colors: {
      primary: '#818CF8',
      secondary: '#F472B6',
      accent: '#34D399',
      background: '#0F172A',
      surface: '#1E293B'
    }
  },
  { 
    id: 'pastel', 
    name: 'Pastel', 
    description: 'Soft, gentle colors',
    colors: {
      primary: '#C3AED6',
      secondary: '#FFD3B6',
      accent: '#A8E6CF',
      background: '#FFF5F5',
      surface: '#FFFFFF'
    }
  }
];

const TYPOGRAPHY_PRESETS = [
  {
    id: 'alo-inspired',
    name: 'Alo Inspired',
    headingFont: 'Playfair Display',
    bodyFont: 'Source Sans Pro'
  },
  {
    id: 'modern',
    name: 'Modern',
    headingFont: 'Inter',
    bodyFont: 'Inter'
  },
  {
    id: 'classic',
    name: 'Classic',
    headingFont: 'Merriweather',
    bodyFont: 'Open Sans'
  },
  {
    id: 'playful',
    name: 'Playful',
    headingFont: 'Poppins',
    bodyFont: 'Nunito'
  },
  {
    id: 'bold',
    name: 'Bold',
    headingFont: 'Montserrat',
    bodyFont: 'Raleway'
  }
];

export const ThemeCustomization: React.FC = () => {
  const {
    currentOrganization,
    organizationTheme,
    organizationTypography,
    updateTheme,
    updateTypography,
    isAdmin
  } = useOrganization();

  const [activeTab, setActiveTab] = useState('colors');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Color states
  const [colors, setColors] = useState({
    primary_color: organizationTheme?.primary_color || '#8B5CF6',
    secondary_color: organizationTheme?.secondary_color || '#EC4899',
    accent_color: organizationTheme?.accent_color || '#10B981',
    background_color: organizationTheme?.background_color || '#FAFAFA',
    surface_color: organizationTheme?.surface_color || '#FFFFFF',
    text_primary: organizationTheme?.text_primary || '#111827',
    text_secondary: organizationTheme?.text_secondary || '#6B7280',
    text_muted: organizationTheme?.text_muted || '#9CA3AF',
    success_color: organizationTheme?.success_color || '#10B981',
    warning_color: organizationTheme?.warning_color || '#F59E0B',
    error_color: organizationTheme?.error_color || '#EF4444',
    info_color: organizationTheme?.info_color || '#3B82F6',
    border_color: organizationTheme?.border_color || '#E5E7EB',
    divider_color: organizationTheme?.divider_color || '#F3F4F6'
  });
  
  // Style states
  const [styles, setStyles] = useState({
    button_radius: organizationTheme?.button_radius || '0.5rem',
    button_padding: organizationTheme?.button_padding || '0.5rem 1rem',
    card_radius: organizationTheme?.card_radius || '0.75rem',
    card_shadow: organizationTheme?.card_shadow || '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    dark_mode_enabled: organizationTheme?.dark_mode_enabled || false,
    dark_mode_auto: organizationTheme?.dark_mode_auto || false
  });
  
  // Typography states
  const [typography, setTypography] = useState({
    font_preset: organizationTypography?.font_preset || 'alo-inspired',
    custom_heading_font: organizationTypography?.custom_heading_font || '',
    custom_body_font: organizationTypography?.custom_body_font || '',
    base_font_size: organizationTypography?.base_font_size || 16,
    heading_size_scale: organizationTypography?.heading_size_scale || 1.25,
    heading_letter_spacing: organizationTypography?.heading_letter_spacing || 'normal',
    line_height_style: organizationTypography?.line_height_style || 'normal',
    use_bold_headings: organizationTypography?.use_bold_headings || true
  });

  useEffect(() => {
    if (organizationTheme) {
      setColors(prev => ({
        ...prev,
        ...organizationTheme
      }));
      setStyles(prev => ({
        ...prev,
        button_radius: organizationTheme.button_radius,
        button_padding: organizationTheme.button_padding,
        card_radius: organizationTheme.card_radius,
        card_shadow: organizationTheme.card_shadow,
        dark_mode_enabled: organizationTheme.dark_mode_enabled,
        dark_mode_auto: organizationTheme.dark_mode_auto
      }));
    }
  }, [organizationTheme]);

  useEffect(() => {
    if (organizationTypography) {
      setTypography(prev => ({
        ...prev,
        ...organizationTypography
      }));
    }
  }, [organizationTypography]);

  const handleColorChange = (key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleStyleChange = (key: string, value: any) => {
    setStyles(prev => ({ ...prev, [key]: value }));
  };

  const handleTypographyChange = (key: string, value: any) => {
    setTypography(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    setColors(prev => ({
      ...prev,
      ...preset.colors,
      text_primary: preset.colors.background === '#0F172A' ? '#F1F5F9' : '#111827',
      text_secondary: preset.colors.background === '#0F172A' ? '#CBD5E1' : '#6B7280',
      text_muted: preset.colors.background === '#0F172A' ? '#94A3B8' : '#9CA3AF'
    }));
  };

  const applyTypographyPreset = (preset: typeof TYPOGRAPHY_PRESETS[0]) => {
    setTypography(prev => ({
      ...prev,
      font_preset: preset.id,
      custom_heading_font: preset.headingFont,
      custom_body_font: preset.bodyFont
    }));
  };

  const handleSave = async () => {
    if (!isAdmin) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can update theme settings.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await updateTheme({
        theme_preset: 'custom',
        ...colors,
        ...styles
      });
      
      await updateTypography(typography);
      
      toast({
        title: "Theme Updated",
        description: "Your organization's theme has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update theme settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (organizationTheme) {
      setColors({
        primary_color: organizationTheme.primary_color,
        secondary_color: organizationTheme.secondary_color,
        accent_color: organizationTheme.accent_color,
        background_color: organizationTheme.background_color,
        surface_color: organizationTheme.surface_color,
        text_primary: organizationTheme.text_primary,
        text_secondary: organizationTheme.text_secondary,
        text_muted: organizationTheme.text_muted,
        success_color: organizationTheme.success_color,
        warning_color: organizationTheme.warning_color,
        error_color: organizationTheme.error_color,
        info_color: organizationTheme.info_color,
        border_color: organizationTheme.border_color,
        divider_color: organizationTheme.divider_color
      });
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">You need administrator permissions to customize the theme.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme Customization
              </CardTitle>
              <CardDescription>
                Customize your organization's visual appearance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isPreviewMode ? 'Exit Preview' : 'Preview'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="styles">Styles</TabsTrigger>
        </TabsList>

        {/* Colors Tab */}
        <TabsContent value="colors" className="space-y-4">
          {/* Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Theme Presets</CardTitle>
              <CardDescription>Quick start with a pre-designed theme</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className="p-4 border rounded-lg hover:border-primary transition-colors text-left"
                  >
                    <div className="flex gap-1 mb-2">
                      {Object.values(preset.colors).slice(0, 5).map((color, i) => (
                        <div
                          key={i}
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Color Pickers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Colors</CardTitle>
              <CardDescription>Fine-tune individual colors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(colors).map(([key, value]) => (
                  <div key={key}>
                    <Label htmlFor={key} className="text-sm capitalize">
                      {key.replace(/_/g, ' ')}
                    </Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id={key}
                        type="color"
                        value={value}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="w-16 h-9 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        className="flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography Tab */}
        <TabsContent value="typography" className="space-y-4">
          {/* Font Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Typography Presets</CardTitle>
              <CardDescription>Choose a font combination</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {TYPOGRAPHY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => applyTypographyPreset(preset)}
                    className={cn(
                      "p-4 border rounded-lg hover:border-primary transition-colors text-left",
                      typography.font_preset === preset.id && "border-primary bg-primary/5"
                    )}
                  >
                    <p 
                      className="font-bold text-lg mb-1"
                      style={{ fontFamily: preset.headingFont }}
                    >
                      {preset.name}
                    </p>
                    <p 
                      className="text-sm text-muted-foreground"
                      style={{ fontFamily: preset.bodyFont }}
                    >
                      Heading: {preset.headingFont}<br/>
                      Body: {preset.bodyFont}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Typography Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Typography Settings</CardTitle>
              <CardDescription>Fine-tune text appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="base-font-size">Base Font Size</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Slider
                      id="base-font-size"
                      value={[typography.base_font_size]}
                      onValueChange={([value]) => handleTypographyChange('base_font_size', value)}
                      min={12}
                      max={20}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{typography.base_font_size}px</span>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="heading-scale">Heading Size Scale</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Slider
                      id="heading-scale"
                      value={[typography.heading_size_scale]}
                      onValueChange={([value]) => handleTypographyChange('heading_size_scale', value)}
                      min={1.1}
                      max={1.5}
                      step={0.05}
                      className="flex-1"
                    />
                    <span className="text-sm w-12">{typography.heading_size_scale.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="letter-spacing">Heading Letter Spacing</Label>
                  <Select
                    value={typography.heading_letter_spacing}
                    onValueChange={(value) => handleTypographyChange('heading_letter_spacing', value)}
                  >
                    <SelectTrigger id="letter-spacing">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tight">Tight</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="wide">Wide</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="line-height">Line Height</Label>
                  <Select
                    value={typography.line_height_style}
                    onValueChange={(value) => handleTypographyChange('line_height_style', value)}
                  >
                    <SelectTrigger id="line-height">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tight">Tight</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="relaxed">Relaxed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="bold-headings" className="flex items-center gap-2 cursor-pointer">
                  <Type className="h-4 w-4" />
                  Use Bold Headings
                </Label>
                <Switch
                  id="bold-headings"
                  checked={typography.use_bold_headings}
                  onCheckedChange={(checked) => handleTypographyChange('use_bold_headings', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Styles Tab */}
        <TabsContent value="styles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Component Styles</CardTitle>
              <CardDescription>Customize component appearance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="button-radius">Button Radius</Label>
                  <Input
                    id="button-radius"
                    type="text"
                    value={styles.button_radius}
                    onChange={(e) => handleStyleChange('button_radius', e.target.value)}
                    placeholder="0.5rem"
                  />
                </div>
                
                <div>
                  <Label htmlFor="button-padding">Button Padding</Label>
                  <Input
                    id="button-padding"
                    type="text"
                    value={styles.button_padding}
                    onChange={(e) => handleStyleChange('button_padding', e.target.value)}
                    placeholder="0.5rem 1rem"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="card-radius">Card Radius</Label>
                  <Input
                    id="card-radius"
                    type="text"
                    value={styles.card_radius}
                    onChange={(e) => handleStyleChange('card_radius', e.target.value)}
                    placeholder="0.75rem"
                  />
                </div>
                
                <div>
                  <Label htmlFor="card-shadow">Card Shadow</Label>
                  <Input
                    id="card-shadow"
                    type="text"
                    value={styles.card_shadow}
                    onChange={(e) => handleStyleChange('card_shadow', e.target.value)}
                    placeholder="0 1px 3px 0 rgba(0, 0, 0, 0.1)"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode" className="flex items-center gap-2 cursor-pointer">
                    <Moon className="h-4 w-4" />
                    Enable Dark Mode
                  </Label>
                  <Switch
                    id="dark-mode"
                    checked={styles.dark_mode_enabled}
                    onCheckedChange={(checked) => handleStyleChange('dark_mode_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="dark-mode-auto" className="flex items-center gap-2 cursor-pointer">
                    <Sun className="h-4 w-4" />
                    Auto Dark Mode (Follow System)
                  </Label>
                  <Switch
                    id="dark-mode-auto"
                    checked={styles.dark_mode_auto}
                    onCheckedChange={(checked) => handleStyleChange('dark_mode_auto', checked)}
                    disabled={!styles.dark_mode_enabled}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your changes will look</CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="p-6 rounded-lg border"
                style={{
                  backgroundColor: colors.background_color,
                  borderColor: colors.border_color
                }}
              >
                <div 
                  className="p-4 rounded mb-4"
                  style={{
                    backgroundColor: colors.surface_color,
                    borderRadius: styles.card_radius,
                    boxShadow: styles.card_shadow
                  }}
                >
                  <h2 
                    className="text-2xl font-bold mb-2"
                    style={{
                      color: colors.text_primary,
                      fontFamily: typography.custom_heading_font || 'inherit',
                      letterSpacing: typography.heading_letter_spacing === 'wide' ? '0.05em' : 
                                     typography.heading_letter_spacing === 'tight' ? '-0.02em' : 'normal'
                    }}
                  >
                    Sample Heading
                  </h2>
                  <p 
                    style={{
                      color: colors.text_secondary,
                      fontFamily: typography.custom_body_font || 'inherit',
                      fontSize: `${typography.base_font_size}px`,
                      lineHeight: typography.line_height_style === 'relaxed' ? 1.8 : 
                                  typography.line_height_style === 'tight' ? 1.2 : 1.5
                    }}
                  >
                    This is sample body text to preview your typography settings.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    className="px-4 py-2 text-white font-medium"
                    style={{
                      backgroundColor: colors.primary_color,
                      borderRadius: styles.button_radius,
                      padding: styles.button_padding
                    }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-4 py-2 text-white font-medium"
                    style={{
                      backgroundColor: colors.secondary_color,
                      borderRadius: styles.button_radius,
                      padding: styles.button_padding
                    }}
                  >
                    Secondary
                  </button>
                  <button
                    className="px-4 py-2 text-white font-medium"
                    style={{
                      backgroundColor: colors.accent_color,
                      borderRadius: styles.button_radius,
                      padding: styles.button_padding
                    }}
                  >
                    Accent
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};