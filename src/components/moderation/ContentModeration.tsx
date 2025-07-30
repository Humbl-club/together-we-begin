import { useState } from 'react'
import { Filter } from 'bad-words'
import { AlertTriangle, Flag, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Initialize content filter
const filter = new Filter()

// Add custom inappropriate words for women's community
filter.addWords('creep', 'pervert', 'harassment')

export const useContentModeration = () => {
  const checkContent = (content: string) => {
    const hasInappropriateContent = filter.isProfane(content)
    const cleanContent = filter.clean(content)
    const suspiciousPatterns = [
      /(\d{10,})/g, // Phone numbers
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, // Email addresses
      /(https?:\/\/[^\s]+)/g, // URLs
    ]
    
    const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(content))
    
    return {
      isClean: !hasInappropriateContent && !hasSuspiciousContent,
      cleanContent,
      flags: {
        profanity: hasInappropriateContent,
        suspiciousContent: hasSuspiciousContent
      }
    }
  }

  return { checkContent }
}

interface ReportModalProps {
  isOpen: boolean
  onClose: () => void
  contentId: string
  contentType: 'post' | 'comment' | 'profile'
  onReport: (reason: string, details: string) => void
}

export const ReportModal = ({ isOpen, onClose, contentId, contentType, onReport }: ReportModalProps) => {
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const reasons = [
    'Harassment or bullying',
    'Inappropriate content',
    'Spam or misleading',
    'Privacy violation',
    'Safety concern',
    'Other'
  ]

  const handleSubmit = async () => {
    if (!reason) {
      toast({
        title: "Please select a reason",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Submit report to database
      const { error } = await supabase
        .from('content_reports')
        .insert({
          reporter_id: user.id,
          reported_content_type: contentType,
          reported_content_id: contentId,
          reason,
          description: details || null
        })

      if (error) throw error

      onReport(reason, details)
      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe."
      })
      onClose()
    } catch (error) {
      console.error('Failed to submit report:', error)
      toast({
        title: "Failed to submit report",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5" />
              Report Content
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Reason for reporting:</label>
            <div className="space-y-2">
              {reasons.map((r) => (
                <label key={r} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    id={`reason-${r.replace(/\s+/g, '-').toLowerCase()}`}
                    name="report-reason"
                    type="radio"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="radio"
                  />
                  <span className="text-sm">{r}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Additional details (optional):</label>
            <Textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Please provide any additional context..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface ContentWarningProps {
  flags: { profanity: boolean; suspiciousContent: boolean }
  onProceed: () => void
  onEdit: () => void
}

export const ContentWarning = ({ flags, onProceed, onEdit }: ContentWarningProps) => {
  return (
    <Alert className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="mb-3">
          Your content has been flagged for review:
          <div className="mt-2 flex gap-2 flex-wrap">
            {flags.profanity && (
              <Badge variant="destructive" className="text-xs">
                Inappropriate language
              </Badge>
            )}
            {flags.suspiciousContent && (
              <Badge variant="destructive" className="text-xs">
                Suspicious content detected
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            Edit Content
          </Button>
          <Button size="sm" onClick={onProceed}>
            Proceed Anyway
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

interface SafetyBadgeProps {
  level: 'safe' | 'warning' | 'flagged'
  className?: string
}

export const SafetyBadge = ({ level, className }: SafetyBadgeProps) => {
  const config = {
    safe: {
      icon: Shield,
      text: 'Verified Safe',
      variant: 'default' as const,
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    },
    warning: {
      icon: AlertTriangle,
      text: 'Needs Review',
      variant: 'secondary' as const,
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    },
    flagged: {
      icon: Flag,
      text: 'Flagged',
      variant: 'destructive' as const,
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
  }

  const { icon: Icon, text, className: levelClassName } = config[level]

  return (
    <Badge className={`${levelClassName} ${className}`}>
      <Icon className="h-3 w-3 mr-1" />
      {text}
    </Badge>
  )
}