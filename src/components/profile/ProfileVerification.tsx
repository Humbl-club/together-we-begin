import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ImageUpload } from '@/components/image/ImageUpload'
import { CheckCircle, Shield, Upload, User, Mail, Phone } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface VerificationStep {
  id: string
  title: string
  description: string
  completed: boolean
  required: boolean
  icon: typeof CheckCircle
}

interface ProfileVerificationProps {
  userId: string
  currentVerificationLevel: 'unverified' | 'basic' | 'verified' | 'premium'
  onVerificationUpdate: (level: string) => void
}

export const ProfileVerification = ({
  userId,
  currentVerificationLevel,
  onVerificationUpdate
}: ProfileVerificationProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const verificationSteps: VerificationStep[] = [
    {
      id: 'profile_photo',
      title: 'Profile Photo',
      description: 'Upload a clear photo of yourself',
      completed: currentVerificationLevel !== 'unverified',
      required: true,
      icon: User
    },
    {
      id: 'email_verified',
      title: 'Email Verification',
      description: 'Verify your email address',
      completed: true, // Assuming email is verified through auth
      required: true,
      icon: Mail
    },
    {
      id: 'bio_complete',
      title: 'Complete Bio',
      description: 'Add a thoughtful bio to your profile',
      completed: currentVerificationLevel === 'verified' || currentVerificationLevel === 'premium',
      required: false,
      icon: User
    }
  ]

  const handlePhotoUpload = async (file: File) => {
    setIsUploading(true)
    try {
      // Upload to avatars bucket
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update profile with new avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId)

      if (updateError) throw updateError

      toast({
        title: "Profile photo uploaded",
        description: "Your verification level has been updated."
      })

      // Update verification level
      onVerificationUpdate('basic')
      
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile photo.",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'premium':
        return (
          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <Shield className="h-3 w-3 mr-1" />
            Premium Verified
          </Badge>
        )
      case 'verified':
        return (
          <Badge className="bg-blue-500 text-white">
            <CheckCircle className="h-3 w-3 mr-1" />
            Verified
          </Badge>
        )
      case 'basic':
        return (
          <Badge variant="secondary">
            <CheckCircle className="h-3 w-3 mr-1" />
            Basic
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            Unverified
          </Badge>
        )
    }
  }

  const completedSteps = verificationSteps.filter(step => step.completed).length
  const totalSteps = verificationSteps.length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Profile Verification
          </CardTitle>
          {getVerificationBadge(currentVerificationLevel)}
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {completedSteps} of {totalSteps} steps completed
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {verificationSteps.map((step) => {
          const Icon = step.icon
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                step.completed 
                  ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                  : 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'
              }`}
            >
              <div className={`p-2 rounded-full ${
                step.completed 
                  ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
              }`}>
                {step.completed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{step.title}</h4>
                  {step.required && (
                    <Badge variant="outline" className="text-xs">Required</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                
                {step.id === 'profile_photo' && !step.completed && (
                  <div className="mt-2">
                    <Button 
                      size="sm" 
                      disabled={isUploading} 
                      onClick={() => {
                        const input = document.createElement('input')
                        input.type = 'file'
                        input.accept = 'image/*'
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0]
                          if (file) handlePhotoUpload(file)
                        }
                        input.click()
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        
        <div className="pt-4 border-t">
          <h4 className="font-medium text-sm mb-2">Verification Benefits</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Increased trust from community members</li>
            <li>• Access to exclusive events and features</li>
            <li>• Priority in group activities</li>
            <li>• Enhanced profile visibility</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}