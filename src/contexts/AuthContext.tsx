import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { CONFIG } from '../config'
import type { AuthUser } from '../types'
import SetupModal from '../components/SetupModal'

interface AuthContextType {
  user: AuthUser | null
  session: Session | null
  loading: boolean
  showSetupModal: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
  updateProfile: (updates: { name: string; fraction: string }) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [isFetchingProfile, setIsFetchingProfile] = useState(false)
  const [showSetupModal, setShowSetupModal] = useState(false)

  const fetchUserProfile = async (userId: string) => {
    console.log('fetchUserProfile: Starting fetch for userId:', userId);
    setIsFetchingProfile(true)
    try {
      // First, get the current user's email
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const userEmail = authUser?.email;
      
      if (!userEmail) {
        console.error('fetchUserProfile: No email found in auth user');
        return null;
      }
      
      console.log('fetchUserProfile: User email:', userEmail);
      
      // Try to find user by ID first
      let { data, error } = await supabase
        .from('users')
        .select('name, fraction, is_admin')
        .eq('id', userId)
        .single()
      
      console.log('fetchUserProfile: Query by ID result:', { data, error });
      
      if (error && error.code === 'PGRST116') {
        // User not found by ID, try to find by email
        console.log('fetchUserProfile: User not found by ID, trying by email...');
        const { data: emailData, error: emailError } = await supabase
          .from('users')
          .select('name, fraction, is_admin')
          .eq('email', userEmail)
          .single()
        
        console.log('fetchUserProfile: Query by email result:', { emailData, emailError });
        
        if (emailData) {
          // User exists with different ID, update the ID to match
          console.log('fetchUserProfile: User found by email, updating ID...');
          const { error: updateError } = await supabase
            .from('users')
            .update({ id: userId })
            .eq('email', userEmail)
          
          if (updateError) {
            console.error('Error updating user ID:', updateError);
            return null;
          }
          
          console.log('fetchUserProfile: Successfully updated user ID');
          return emailData;
        } else if (emailError && emailError.code === 'PGRST116') {
          // User doesn't exist at all, create new profile
          console.log('fetchUserProfile: User not found by email either, creating profile...');
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: userEmail,
              fraction: CONFIG.DEFAULT_FRACTION,
              is_admin: false,
              name: null, // Initially name is null
            })
            .select('name, fraction, is_admin')
            .single();
          
          if (createError) {
            console.error('Error creating user profile:', createError);
            return null;
          }
          
          console.log('fetchUserProfile: Successfully created user profile:', newUser);
          return newUser;
        } else {
          console.error('Error querying by email:', emailError);
          return null;
        }
      } else if (error) {
        console.error("Error fetching user profile:", error)
        return null
      }
      
      console.log('fetchUserProfile: Successfully fetched profile:', data);
      return data
    } catch (error) {
      console.error("Unexpected error fetching profile:", error)
      return null
    } finally {
      setIsFetchingProfile(false)
    }
  }

  const handleSession = useCallback(async () => {
    console.log('handleSession: Starting session check');
    const { data: { session }, error } = await supabase.auth.getSession()
    
    console.log('handleSession: Session check result:', { 
      hasSession: !!session, 
      userEmail: session?.user?.email,
      error 
    });
    
    if (error) {
      console.error("Error in getSession:", error)
      setUser(null)
      setLoading(false)
      return
    }

    if (session?.user?.email) {
      console.log('handleSession: Session found, fetching profile for:', session.user.email);
      const profile = await fetchUserProfile(session.user.id)
      console.log('handleSession: Profile fetch result:', profile);
      
      if (profile) {
        const fullUser: AuthUser = {
          id: session.user.id,
          email: session.user.email,
          app_metadata: session.user.app_metadata,
          user_metadata: session.user.user_metadata,
          aud: session.user.aud,
          created_at: session.user.created_at,
          updated_at: session.user.updated_at || session.user.created_at,
          ...profile
        }
        console.log('handleSession: Setting user to:', fullUser);
        setUser(fullUser)
        if (!profile.name || !profile.fraction || profile.fraction === 'N/A') {
          setShowSetupModal(true)
        }
      } else {
        // Could not fetch profile, treat as logged out
        console.log('handleSession: No profile found, setting user to null');
        setUser(null)
      }
    } else {
      console.log('handleSession: No session or user email, setting user to null');
      setUser(null)
    }
    console.log('handleSession: Setting loading to false');
    setLoading(false)
  }, [])

  useEffect(() => {
    setLoading(true)
    handleSession()
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state change:', event, session?.user?.email)
        if (event === 'SIGNED_IN') {
          setLoading(true)
          // Fetch the session immediately after sign in
          handleSession()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        } else if (event === 'USER_UPDATED') {
          handleSession()
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [handleSession])

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setLoading(false) // If sign-in fails, stop loading.
      throw error
    }
    // onAuthStateChange will handle the rest - don't set loading to false here
  }

  const signOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setUser(null)
    setLoading(false)
  }

  const updatePassword = async (newPassword: string) => {
    if (!user) return { error: new Error('No user logged in') }

    console.log('AuthContext: Starting password update...')
    setIsUpdatingPassword(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      console.error('Password update error:', error)
      setIsUpdatingPassword(false)
      return { error }
    }

    console.log('AuthContext: Password updated successfully')
    setTimeout(() => setIsUpdatingPassword(false), 1000)

    return { error: null }
  }

  const updateProfile = async (updates: { name: string; fraction: string }) => {
    if (!user) return { error: new Error('No user to update') }
    
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) {
      console.error('Error updating profile:', error)
      return { error }
    }

    // Refresh user state
    setUser(prevUser => {
      if (!prevUser) return null
      return { ...prevUser, ...updates }
    })

    setShowSetupModal(false)
    return { error: null }
  }

  const value = {
    user,
    session,
    loading,
    showSetupModal,
    signIn,
    signOut,
    updatePassword,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showSetupModal && user && (
        <SetupModal
          user={user}
          onSubmit={updateProfile}
          onClose={() => setShowSetupModal(false)}
        />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 